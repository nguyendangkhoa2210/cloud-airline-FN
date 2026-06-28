<?php
/**
 * POST /php_mysql_export/api/book.php
 * Body JSON: {
 *   outboundFlightId, returnFlightId (null nếu Một chiều), tripType, cabinClass,
 *   departureDate, returnDate, totalPrice,
 *   passengers: [{ fullName, passportId, nationality, age, email, seatNumber }, ...],
 *   addons: [{ name, price }, ...]
 * }
 * Ghi 1 booking + N hành khách + N tiện ích trong 1 TRANSACTION — nếu bất kỳ bước nào lỗi,
 * toàn bộ được rollback để không bao giờ phát sinh vé "nửa vời" trong CSDL.
 *
 * LƯU Ý PHIÊN BẢN MYSQL:
 * SQL Server dùng "OUTPUT INSERTED.id" để lấy id vừa insert ngay trong câu INSERT.
 * MySQL KHÔNG có cú pháp này — phải INSERT xong rồi gọi $pdo->lastInsertId() riêng.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

$body = get_json_body();

$outboundFlightId = (int)($body['outboundFlightId'] ?? 0);
$returnFlightId = !empty($body['returnFlightId']) ? (int)$body['returnFlightId'] : null;
$tripType = ($body['tripType'] ?? 'OneWay') === 'RoundTrip' ? 'RoundTrip' : 'OneWay';
$cabinClass = in_array($body['cabinClass'] ?? '', ['Promo', 'Eco', 'SkyBoss'], true) ? $body['cabinClass'] : 'Eco';
$departureDate = $body['departureDate'] ?? null;
$returnDate = $tripType === 'RoundTrip' ? ($body['returnDate'] ?? null) : null;
$totalPrice = (float)($body['totalPrice'] ?? 0);
$passengers = is_array($body['passengers'] ?? null) ? $body['passengers'] : [];
$addons = is_array($body['addons'] ?? null) ? $body['addons'] : [];

if (!$outboundFlightId || !$departureDate || empty($passengers)) {
    json_response(['success' => false, 'message' => 'Thiếu dữ liệu đặt vé (chuyến bay/ngày bay/hành khách)!'], 400);
}

// Cho phép đặt vé cả khi chưa đăng nhập (khách lẻ) — lúc đó user_id để NULL
$userId = $_SESSION['user_id'] ?? null;
$bookingCode = 'CH-' . random_int(100000, 999999);

// ============================================================================
// KIỂM TRA ĐỦ VÉ THEO HẠNG (yêu cầu đề bài: "Nếu không còn đủ vé thì hệ thống
// sẽ thông báo cho người dùng"). Quy ước số ghế khớp với sơ đồ ghế cố định
// 4 hàng (A-D) x 8 cột trong renderSeatsScreen() của frontend:
// - Cột 1-2 (8 ghế)  = hạng SkyBoss (Thương Gia)
// - Cột 3-8 (24 ghế) = hạng Eco + Promo dùng CHUNG (Phổ Thông), vì 2 hạng này
//   không có sơ đồ ghế tách biệt trong giao diện.
// ============================================================================
const TOTAL_SEATS_SKYBOSS = 8;
const TOTAL_SEATS_ECONOMY = 24;

// Đặt TRONG transaction (xem bước kiểm tra ở dưới, sau beginTransaction) để
// đảm bảo không có 2 giao dịch nào cùng "đếm thấy còn vé" rồi cùng insert đè
// lên nhau — MySQL InnoDB sẽ tự khóa các dòng đọc được bên trong transaction.

try {
    $pdo->beginTransaction();

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
    json_response(['success' => true, 'bookingCode' => $bookingCode, 'bookingId' => $bookingId]);
} catch (Exception $e) {
    $pdo->rollBack();
    // In chi tiết lỗi của MySQL ra để dễ debug
    json_response(['success' => false, 'message' => 'Không thể lưu vé: ' . $e->getMessage()], 500);
}
