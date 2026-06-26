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

try {
    $pdo->beginTransaction();

    // 1. Insert Booking
    $stmt = $pdo->prepare('
        INSERT INTO bookings
            (booking_code, user_id, trip_type, outbound_flight_id, return_flight_id, departure_date, return_date, cabin_class, total_price, status)
        OUTPUT INSERTED.id
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, \'Confirmed\')
    ');
    $stmt->execute([$bookingCode, $userId, $tripType, $outboundFlightId, $returnFlightId, $departureDate, $returnDate, $cabinClass, $totalPrice]);
    $bookingId = (int)$stmt->fetchColumn();

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
            $p['nationality'] ?? N'Việt Nam', // Đồng bộ NVARCHAR
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
    // In chi tiết lỗi của SQL Server ra để dễ debug
    json_response(['success' => false, 'message' => 'Không thể lưu vé: ' . $e->getMessage()], 500);
}