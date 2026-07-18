<?php
/**
 * POST /php_mysql_export/api/hold_seat.php
 * Body JSON: { "flightId": 1, "seatNumber": "A1" }
 *
 * Khóa tạm 1 ghế trong 5 phút cho phiên (session) hiện tại, để tránh trường hợp
 * 2 khách khác nhau cùng chọn 1 ghế trong lúc đang điền form/chờ thanh toán.
 * Đây CHỈ là khóa mềm ở tầng UX — vòng chốt cuối cùng (chống double-booking thật
 * sự) vẫn nằm ở book.php với transaction + FOR UPDATE khi ghi vào bảng bookings.
 *
 * Không yêu cầu đăng nhập (khách vãng lai cũng cần giữ ghế được).
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

const HOLD_DURATION_SECONDS = 300; // 5 phút

$body = get_json_body();
csrf_verify($body);
$flightId = (int)($body['flightId'] ?? 0);
$seatNumber = trim($body['seatNumber'] ?? '');

if (!$flightId || $seatNumber === '') {
    json_response(['success' => false, 'message' => 'Thiếu flightId hoặc seatNumber!'], 400);
}

// Token định danh "ai đang giữ ghế" = session hiện tại (đủ dùng cho cả khách vãng lai
// lẫn hội viên đã đăng nhập, không cần cơ chế token riêng phức tạp hơn).
$holdToken = session_id();
$expiresAt = date('Y-m-d H:i:s', time() + HOLD_DURATION_SECONDS);

try {
    $pdo->beginTransaction();

    // 1) Ghế đã có người đặt (Confirmed) thật sự trong DB rồi -> không cho giữ nữa
    $stmtBooked = $pdo->prepare('
        SELECT bp.id
        FROM booking_passengers bp
        JOIN bookings b ON b.id = bp.booking_id
        WHERE b.outbound_flight_id = ? AND bp.seat_number = ? AND b.status = "Confirmed"
        LIMIT 1
    ');
    $stmtBooked->execute([$flightId, $seatNumber]);
    if ($stmtBooked->fetch()) {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Ghế này đã có hành khách khác đặt!'], 409);
    }

    // 2) Kiểm tra xem ghế có đang bị người KHÁC giữ (và chưa hết hạn) hay không
    $stmtHold = $pdo->prepare('SELECT * FROM seat_holds WHERE flight_id = ? AND seat_number = ? FOR UPDATE');
    $stmtHold->execute([$flightId, $seatNumber]);
    $existingHold = $stmtHold->fetch();

    if ($existingHold && $existingHold['hold_token'] !== $holdToken && strtotime($existingHold['expires_at']) > time()) {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Ghế này đang được một hành khách khác giữ chỗ, vui lòng chọn ghế khác!'], 409);
    }

    // 3) Còn trống (hoặc đã hết hạn, hoặc chính mình đang giữ) -> ghi/refresh lượt giữ ghế
    if ($existingHold) {
        $stmt = $pdo->prepare('UPDATE seat_holds SET hold_token = ?, expires_at = ? WHERE id = ?');
        $stmt->execute([$holdToken, $expiresAt, $existingHold['id']]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO seat_holds (flight_id, seat_number, hold_token, expires_at) VALUES (?, ?, ?, ?)');
        $stmt->execute([$flightId, $seatNumber, $holdToken, $expiresAt]);
    }

    $pdo->commit();
    json_response(['success' => true, 'message' => 'Đã giữ ghế tạm thời trong 5 phút.', 'expiresAt' => $expiresAt]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    // Bảng seat_holds chưa được tạo (quên chạy migration_seat_holds.sql) -> KHÔNG
    // chặn khách chọn ghế, chỉ coi như tính năng "giữ ghế tạm" đang tắt. Điểm chặn
    // trùng ghế THẬT SỰ vẫn còn nguyên ở book.php (transaction + FOR UPDATE), nên
    // an toàn dù thiếu bảng này.
    if ($e->getCode() === '42S02') {
        json_response([
            'success' => true,
            'message' => 'Đã chọn ghế (lưu ý: chưa chạy migration_seat_holds.sql nên tính năng giữ ghế tạm đang tắt).',
            'expiresAt' => null,
        ]);
    }
    json_response(['success' => false, 'message' => 'Lỗi hệ thống khi giữ ghế: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(['success' => false, 'message' => 'Lỗi hệ thống khi giữ ghế: ' . $e->getMessage()], 500);
}
