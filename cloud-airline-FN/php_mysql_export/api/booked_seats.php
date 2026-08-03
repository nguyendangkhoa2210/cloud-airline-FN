<?php

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

const TOTAL_SEATS_SKYBOSS = 8;   
const TOTAL_SEATS_ECONOMY = 24;  

$flightId = isset($_GET['flight_id']) ? (int)$_GET['flight_id'] : 0;

if (!$flightId) {
    json_response(['success' => false, 'message' => 'Thiếu tham số flight_id!'], 400);
}

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


try {
    $pdo->exec('DELETE FROM seat_holds WHERE expires_at < NOW()');

    $stmtHolds = $pdo->prepare('SELECT seat_number FROM seat_holds WHERE flight_id = ? AND hold_token != ?');
    $stmtHolds->execute([$flightId, session_id()]);
    $heldByOthers = array_column($stmtHolds->fetchAll(), 'seat_number');

    $bookedSeats = array_values(array_unique(array_merge($bookedSeats, $heldByOthers)));
} catch (PDOException $e) {
    if ($e->getCode() !== '42S02') {
        throw $e; // Lỗi khác (không phải "bảng không tồn tại") thì vẫn cần biết để sửa
    }
    // 42S02 = bảng chưa tồn tại -> bỏ qua, dùng $bookedSeats gốc (chỉ có ghế Confirmed)
}


$bookedSkyBoss = 0;
$bookedEconomy = 0;
foreach ($bookedSeats as $seat) {

    $col = (int) substr($seat, 1);
    if ($col >= 1 && $col <= 2) {
        $bookedSkyBoss++;
    } elseif ($col >= 3 && $col <= 8) {
        $bookedEconomy++;
    }
}

$seatsLeft = [
    'skyboss' => max(0, TOTAL_SEATS_SKYBOSS - $bookedSkyBoss),
    // Eco và Promo dùng chung pool ghế phổ thông -> cùng 1 giá trị
    'eco' => max(0, TOTAL_SEATS_ECONOMY - $bookedEconomy),
    'promo' => max(0, TOTAL_SEATS_ECONOMY - $bookedEconomy),
];

json_response(['success' => true, 'bookedSeats' => $bookedSeats, 'seatsLeft' => $seatsLeft]);