<?php
/**
 * GET /php_mysql_export/api/booked_seats.php?flight_id=1
 * Trả về danh sách ghế đã được đặt cho một chuyến bay cụ thể.
 * Dùng để đồng bộ sơ đồ ghế với dữ liệu thật trong SQL Server.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

$flightId = isset($_GET['flight_id']) ? (int)$_GET['flight_id'] : 0;

if (!$flightId) {
    json_response(['success' => false, 'message' => 'Thiếu tham số flight_id!'], 400);
}

// Lấy tất cả số ghế đã đặt cho chuyến bay này (chỉ những booking còn Confirmed)
$stmt = $pdo->prepare('
    SELECT bp.seat_number
    FROM booking_passengers bp
    JOIN bookings b ON b.id = bp.booking_id
    WHERE b.outbound_flight_id = ?
      AND b.status = \'Confirmed\'
');
$stmt->execute([$flightId]);
$rows = $stmt->fetchAll();

$bookedSeats = array_column($rows, 'seat_number');

json_response(['success' => true, 'bookedSeats' => $bookedSeats]);
