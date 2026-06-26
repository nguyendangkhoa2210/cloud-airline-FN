<?php
/**
 * POST /php_mysql_export/api/cancel_booking.php
 * Body JSON: { "bookingId": "CH-123456" }   (đây là booking_code hiển thị cho khách)
 * Chỉ chủ vé hoặc admin mới được hủy — kiểm tra ngay trên server, không tin client.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';
require_login();

$body = get_json_body();
$bookingCode = trim($body['bookingId'] ?? '');

if ($bookingCode === '') {
    json_response(['success' => false, 'message' => 'Thiếu mã vé!'], 400);
}

$stmt = $pdo->prepare('SELECT * FROM bookings WHERE booking_code = ?');
$stmt->execute([$bookingCode]);
$booking = $stmt->fetch();

if (!$booking) {
    json_response(['success' => false, 'message' => 'Không tìm thấy vé!'], 404);
}

$isOwner = $booking['user_id'] !== null && (int)$booking['user_id'] === (int)$_SESSION['user_id'];
$isAdmin = ($_SESSION['role'] ?? '') === 'admin';

if (!$isOwner && !$isAdmin) {
    json_response(['success' => false, 'message' => 'Bạn không có quyền hủy vé này!'], 403);
}

$stmt = $pdo->prepare("UPDATE bookings SET status = 'Cancelled' WHERE id = ?");
$stmt->execute([$booking['id']]);

json_response(['success' => true]);