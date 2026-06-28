<?php
/**
 * POST /php_mysql_export/api/cancel_booking_guest.php
 * Body JSON: { "bookingId": "CH-123456", "passportId": "B12345678" }
 *
 * Hủy vé dành cho KHÁCH LẺ chưa đăng nhập (booking.user_id = NULL). Vì không có
 * session để xác định "ai là chủ vé" như cancel_booking.php, ở đây phải xác minh
 * bằng 1 thông tin bí mật đã có sẵn trong vé: số CMND/Passport của MỘT trong các
 * hành khách trên vé đó (đã thu thập từ bước "Nhập thông tin vé" lúc đặt).
 *
 * LƯU Ý BẢO MẬT:
 * - Chỉ áp dụng cho vé có user_id IS NULL. Vé đã gắn với 1 tài khoản hội viên thì
 *   PHẢI hủy qua cancel_booking.php (yêu cầu đăng nhập đúng tài khoản đó) — tránh
 *   trường hợp ai biết số passport của hội viên cũng hủy được vé của họ.
 * - Không phân biệt rõ lỗi "không tìm thấy vé" và "sai passport" trong message trả
 *   về, để tránh kẻ xấu dò mã vé hợp lệ bằng cách thử nhiều passport khác nhau
 *   (cùng nguyên tắc như login.php gộp chung lỗi sai email/sai mật khẩu).
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

$body = get_json_body();
$bookingCode = trim($body['bookingId'] ?? '');
$passportId = trim($body['passportId'] ?? '');

if ($bookingCode === '' || $passportId === '') {
    json_response(['success' => false, 'message' => 'Vui lòng nhập đầy đủ Mã vé và Số CMND/Passport!'], 400);
}

$stmt = $pdo->prepare('SELECT * FROM bookings WHERE booking_code = ?');
$stmt->execute([$bookingCode]);
$booking = $stmt->fetch();

// Gộp chung thông báo lỗi cho cả 2 trường hợp "không tìm thấy vé" và "vé này có
// chủ tài khoản, không phải vé khách lẻ" — tránh lộ thông tin vé nào tồn tại.
if (!$booking || $booking['user_id'] !== null) {
    json_response(['success' => false, 'message' => 'Mã vé hoặc số CMND/Passport không đúng, hoặc vé này thuộc về một tài khoản hội viên (vui lòng đăng nhập để hủy).'], 404);
}

// Xác minh passport khớp với MỘT hành khách bất kỳ trong vé (không cần đúng người
// đầu tiên, vì người đặt vé hộ người khác vẫn nên hủy được nếu biết passport của
// 1 trong số hành khách đã đăng ký).
$stmtPassenger = $pdo->prepare('SELECT id FROM booking_passengers WHERE booking_id = ? AND passport_number = ?');
$stmtPassenger->execute([$booking['id'], $passportId]);
$matchedPassenger = $stmtPassenger->fetch();

if (!$matchedPassenger) {
    json_response(['success' => false, 'message' => 'Mã vé hoặc số CMND/Passport không đúng, hoặc vé này thuộc về một tài khoản hội viên (vui lòng đăng nhập để hủy).'], 404);
}

if ($booking['status'] === 'Cancelled') {
    json_response(['success' => false, 'message' => 'Vé này đã được hủy trước đó!'], 409);
}

$stmt = $pdo->prepare("UPDATE bookings SET status = 'Cancelled' WHERE id = ?");
$stmt->execute([$booking['id']]);

json_response(['success' => true, 'message' => 'Hủy vé thành công!']);
