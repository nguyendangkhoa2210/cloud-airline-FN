<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

$body = get_json_body();
csrf_verify($body);
$flightId = (int)($body['flightId'] ?? 0);
$seatNumber = trim($body['seatNumber'] ?? '');

if (!$flightId || $seatNumber === '') {
    json_response(['success' => false, 'message' => 'Thiếu flightId hoặc seatNumber!'], 400);
}

try {
    $stmt = $pdo->prepare('DELETE FROM seat_holds WHERE flight_id = ? AND seat_number = ? AND hold_token = ?');
    $stmt->execute([$flightId, $seatNumber, session_id()]);
} catch (PDOException $e) {
    // Bảng chưa tồn tại (chưa chạy migration) -> bỏ qua, không có gì để nhả cả
    if ($e->getCode() !== '42S02') {
        json_response(['success' => false, 'message' => 'Lỗi hệ thống khi nhả ghế: ' . $e->getMessage()], 500);
    }
}

json_response(['success' => true]);
