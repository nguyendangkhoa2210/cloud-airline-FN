<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';
require_login();

$body = get_json_body();
csrf_verify($body);

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

// Ghi audit log nếu ADMIN hủy vé của người khác (không ghi khi khách tự hủy vé của mình)
if ($isAdmin && !$isOwner) {
    write_audit_log($pdo, 'admin_cancel_booking', $bookingCode, "Admin hủy vé của user_id={$booking['user_id']}");
}

json_response(['success' => true]);