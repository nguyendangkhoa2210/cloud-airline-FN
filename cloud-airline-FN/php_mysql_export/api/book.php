<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

$body = get_json_body();
csrf_verify($body);

$outboundFlightId = (int)($body['outboundFlightId'] ?? 0);
$returnFlightId = !empty($body['returnFlightId']) ? (int)$body['returnFlightId'] : null;
$tripType = ($body['tripType'] ?? 'OneWay') === 'RoundTrip' ? 'RoundTrip' : 'OneWay';
$cabinClass = in_array($body['cabinClass'] ?? '', ['Promo', 'Eco', 'SkyBoss'], true) ? $body['cabinClass'] : 'Eco';
$departureDate = $body['departureDate'] ?? null;
$returnDate = $tripType === 'RoundTrip' ? ($body['returnDate'] ?? null) : null;
$passengers = is_array($body['passengers'] ?? null) ? $body['passengers'] : [];
$addons = is_array($body['addons'] ?? null) ? $body['addons'] : [];


foreach ($passengers as $p) {
    $emailVal = trim($p['email'] ?? '');
    if ($emailVal !== '' && !filter_var($emailVal, FILTER_VALIDATE_EMAIL)) {
        json_response(['success' => false, 'message' => "Email \"{$emailVal}\" không đúng định dạng!"], 400);
    }
}

const ADDON_PRICES = [
    'Extra Cabin Luggage'    => 35,
    'Gourmet Dining Combo'   => 15,
    'Elite Travel Safeguard' => 25,
];

if (!$outboundFlightId || !$departureDate || empty($passengers)) {
    json_response(['success' => false, 'message' => 'Thiếu dữ liệu đặt vé (chuyến bay/ngày bay/hành khách)!'], 400);
}

// Cho phép đặt vé cả khi chưa đăng nhập (khách lẻ) — lúc đó user_id để NULL
$userId = $_SESSION['user_id'] ?? null;
$bookingCode = 'CH-' . random_int(100000, 999999);

const TOTAL_SEATS_SKYBOSS = 8;
const TOTAL_SEATS_ECONOMY = 24;



try {
    $pdo->beginTransaction();


    $priceColumn = ['Promo' => 'price_promo', 'Eco' => 'price_eco', 'SkyBoss' => 'price_skyboss'][$cabinClass];

    $stmtFlight = $pdo->prepare("SELECT id, {$priceColumn} AS fare, status FROM flights WHERE id = ?");
    $stmtFlight->execute([$outboundFlightId]);
    $outboundFlight = $stmtFlight->fetch();

    if (!$outboundFlight || $outboundFlight['status'] === 'Cancelled') {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Chuyến bay không tồn tại hoặc đã bị hủy!'], 400);
    }

    $returnFare = 0.0;
    if ($tripType === 'RoundTrip' && $returnFlightId) {
        $stmtReturnFlight = $pdo->prepare("SELECT id, {$priceColumn} AS fare, status FROM flights WHERE id = ?");
        $stmtReturnFlight->execute([$returnFlightId]);
        $returnFlight = $stmtReturnFlight->fetch();

        if (!$returnFlight || $returnFlight['status'] === 'Cancelled') {
            $pdo->rollBack();
            json_response(['success' => false, 'message' => 'Chuyến bay khứ hồi không tồn tại hoặc đã bị hủy!'], 400);
        }
        $returnFare = (float) $returnFlight['fare'];
    }

    $passengerCount = count($passengers);

    $seatSurcharge = 0.0;
    foreach ($passengers as $p) {
        $seatNumber = (string)($p['seatNumber'] ?? '');
        if ($seatNumber === '') {
            continue;
        }
        $col = (int) substr($seatNumber, 1);
        $seatSurcharge += ($col >= 1 && $col <= 2) ? 45 : 15;
    }

    // --------------------------------------------------------------------
    // BƯỚC 0.2: TÍNH TIỀN TIỆN ÍCH (ADDONS) THEO BẢNG GIÁ CHỐT CỨNG,
    // BỎ QUA GIÁ CLIENT GỬI LÊN, CHỈ CHẤP NHẬN TÊN CÓ TRONG WHITELIST.
    // --------------------------------------------------------------------
    $addonTotal = 0.0;
    $verifiedAddons = [];
    foreach ($addons as $a) {
        $name = $a['name'] ?? '';
        if (isset(ADDON_PRICES[$name])) {
            $price = ADDON_PRICES[$name];
            $addonTotal += $price;
            $verifiedAddons[] = ['name' => $name, 'price' => $price];
        }
    }
    $addons = $verifiedAddons; // Ghi đè lại addons bằng bản đã xác thực giá

    // --------------------------------------------------------------------
    // TỔNG HÓA ĐƠN THẬT SỰ = (giá vé x số hành khách x số chặng) + phụ thu ghế + tiện ích
    // --------------------------------------------------------------------
    $baseFare = (float) $outboundFlight['fare'] + $returnFare;
    $totalPrice = ($baseFare * $passengerCount) + $seatSurcharge + $addonTotal;

    // Đếm số ghế đã Confirmed cho chuyến bay này, lấy luôn để kiểm tra đủ vé
    $stmtBookedSeats = $pdo->prepare('
        SELECT bp.seat_number
        FROM booking_passengers bp
        JOIN bookings b ON b.id = bp.booking_id
        WHERE b.outbound_flight_id = ?
          AND b.status = \'Confirmed\'
        FOR UPDATE
    ');
    $stmtBookedSeats->execute([$outboundFlightId]);
    $bookedSeatNumbers = array_column($stmtBookedSeats->fetchAll(), 'seat_number');

    $bookedSkyBoss = 0;
    $bookedEconomy = 0;
    foreach ($bookedSeatNumbers as $seat) {
        $col = (int) substr($seat, 1);
        if ($col >= 1 && $col <= 2) {
            $bookedSkyBoss++;
        } elseif ($col >= 3 && $col <= 8) {
            $bookedEconomy++;
        }
    }

    $seatsLeftForClass = ($cabinClass === 'SkyBoss')
        ? (TOTAL_SEATS_SKYBOSS - $bookedSkyBoss)
        : (TOTAL_SEATS_ECONOMY - $bookedEconomy);

    $requestedCount = count($passengers);

    if ($seatsLeftForClass < $requestedCount) {
        $pdo->rollBack();
        json_response([
            'success' => false,
            'message' => "Không còn đủ vé hạng đã chọn! Chỉ còn {$seatsLeftForClass} vé trống, bạn yêu cầu {$requestedCount} vé.",
        ], 409);
    }

    $requestedSeatNumbers = array_map(fn($p) => trim($p['seatNumber'] ?? ''), $passengers);

    foreach ($requestedSeatNumbers as $seatNum) {
        if ($seatNum === '') {
            continue; // Sẽ bị gán "NoSeat" ở bước insert, không cần kiểm tra trùng
        }
        if (in_array($seatNum, $bookedSeatNumbers, true)) {
            $pdo->rollBack();
            json_response(['success' => false, 'message' => "Ghế {$seatNum} vừa được hành khách khác đặt mất, vui lòng quay lại chọn ghế khác!"], 409);
        }
    }
    $duplicatesInRequest = array_diff_assoc($requestedSeatNumbers, array_unique($requestedSeatNumbers));
    if (!empty($duplicatesInRequest)) {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Không thể gán 2 hành khách cùng một số ghế trong cùng 1 lượt đặt!'], 400);
    }

    // 1. Insert Booking
    // Bản MySQL: bỏ "OUTPUT INSERTED.id", lấy id bằng lastInsertId() sau khi execute()
    $stmt = $pdo->prepare('
        INSERT INTO bookings
            (booking_code, user_id, trip_type, outbound_flight_id, return_flight_id, departure_date, return_date, cabin_class, total_price, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, \'Confirmed\')
    ');
    $stmt->execute([$bookingCode, $userId, $tripType, $outboundFlightId, $returnFlightId, $departureDate, $returnDate, $cabinClass, $totalPrice]);
    $bookingId = (int)$pdo->lastInsertId();

    // 2. Insert Hành Khách
    $stmtPassenger = $pdo->prepare('
        INSERT INTO booking_passengers (booking_id, full_name, passport_number, nationality, age, email, seat_number)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');
    foreach ($passengers as $p) {
        // Xử lý triệt để kiểu dữ liệu INT hoặc NULL cho age
        $age = (isset($p['age']) && $p['age'] !== '') ? (int)$p['age'] : null;

        // Đảm bảo seat_number không bị rỗng theo ràng buộc NOT NULL của DB
        $seatNumber = !empty($p['seatNumber']) ? $p['seatNumber'] : 'NoSeat';

        $stmtPassenger->execute([
            $bookingId,
            $p['fullName'] ?? '',
            $p['passportId'] ?? '',
            !empty($p['nationality']) ? $p['nationality'] : 'Việt Nam',
            $age,
            !empty($p['email']) ? $p['email'] : null, // Nếu trống thì lưu NULL thay vì chuỗi rỗng
            $seatNumber
        ]);
    }

    // 3. Insert Tiện Ích (Addons)
    if (!empty($addons)) {
        $stmtAddon = $pdo->prepare('INSERT INTO booking_addons (booking_id, name, price) VALUES (?, ?, ?)');
        foreach ($addons as $a) {
            $stmtAddon->execute([$bookingId, $a['name'] ?? '', (float)($a['price'] ?? 0)]);
        }
    }

    $pdo->commit();

    write_confirmation_email_log($bookingCode, $passengers, $totalPrice);

    json_response(['success' => true, 'bookingCode' => $bookingCode, 'bookingId' => $bookingId]);
} catch (Exception $e) {
    $pdo->rollBack();
    // In chi tiết lỗi của MySQL ra để dễ debug
    json_response(['success' => false, 'message' => 'Không thể lưu vé: ' . $e->getMessage()], 500);
}