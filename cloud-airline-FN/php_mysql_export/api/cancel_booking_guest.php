<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

$body = get_json_body();
csrf_verify($body);

$bookingCode = trim($body['bookingId'] ?? '');
$passportId = trim($body['passportId'] ?? '');

if ($bookingCode === '' || $passportId === '') {
    json_response(['success' => false, 'message' => 'Vui lòng nhập đầy đủ Mã vé và Số CMND/Passport!'], 400);
}

// Chống dò số passport bằng brute-force, cùng nguyên tắc như login.php
$rateId = get_client_ip();
check_rate_limit($pdo, 'cancel_guest', $rateId, 5, 60, 300);

$stmt = $pdo->prepare('SELECT * FROM bookings WHERE booking_code = ?');
$stmt->execute([$bookingCode]);
$booking = $stmt->fetch();

// Gộp chung thông báo lỗi cho cả 2 trường hợp "không tìm thấy vé" và "vé này có
// chủ tài khoản, không phải vé khách lẻ" — tránh lộ thông tin vé nào tồn tại.
if (!$booking || $booking['user_id'] !== null) {
    register_failed_attempt($pdo, 'cancel_guest', $rateId, 5, 60);
    json_response(['success' => false, 'message' => 'Mã vé hoặc số CMND/Passport không đúng, hoặc vé này thuộc về một tài khoản hội viên (vui lòng đăng nhập để hủy).'], 404);
}

// Xác minh passport khớp với MỘT hành khách bất kỳ trong vé (không cần đúng người
// đầu tiên, vì người đặt vé hộ người khác vẫn nên hủy được nếu biết passport của
// 1 trong số hành khách đã đăng ký).
$stmtPassenger = $pdo->prepare('SELECT id FROM booking_passengers WHERE booking_id = ? AND passport_number = ?');
$stmtPassenger->execute([$booking['id'], $passportId]);
$matchedPassenger = $stmtPassenger->fetch();

if (!$matchedPassenger) {
    register_failed_attempt($pdo, 'cancel_guest', $rateId, 5, 60);
    json_response(['success' => false, 'message' => 'Mã vé hoặc số CMND/Passport không đúng, hoặc vé này thuộc về một tài khoản hội viên (vui lòng đăng nhập để hủy).'], 404);
}
clear_rate_limit($pdo, 'cancel_guest', $rateId);

if ($booking['status'] === 'Cancelled') {
    json_response(['success' => false, 'message' => 'Vé này đã được hủy trước đó!'], 409);
}

$stmt = $pdo->prepare("UPDATE bookings SET status = 'Cancelled' WHERE id = ?");
$stmt->execute([$booking['id']]);

json_response(['success' => true, 'message' => 'Hủy vé thành công!']);
