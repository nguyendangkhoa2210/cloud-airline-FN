<?php
/**
 * Các hàm dùng chung cho toàn bộ API trong thư mục này.
 * Không dùng framework gì cả — viết tay gọn nhẹ để dễ giải thích trong báo cáo đồ án.
 */

// Trả về JSON cho frontend rồi dừng script luôn (mọi endpoint đều dùng hàm này để trả lời)
function json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Đọc body JSON mà frontend gửi lên qua fetch() (POST application/json)
function get_json_body() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// Chặn truy cập nếu chưa đăng nhập (kiểm tra session — KHÔNG tin dữ liệu từ phía client)
function require_login() {
    if (empty($_SESSION['user_id'])) {
        json_response(['success' => false, 'message' => 'Bạn cần đăng nhập trước!'], 401);
    }
}

// Chặn truy cập nếu không phải admin — dùng cho các API quản trị (cập nhật chuyến bay, xem mọi vé...)
function require_admin() {
    require_login();
    if (($_SESSION['role'] ?? '') !== 'admin') {
        json_response(['success' => false, 'message' => 'Chỉ quản trị viên mới được thực hiện hành động này!'], 403);
    }
}

// ============================================================================
// RATE LIMITING (chống brute-force) — dùng chung cho login, register, tra cứu
// vé khách lẻ, hủy vé khách lẻ. Đếm theo (action + identifier) trong bảng
// rate_limits; identifier thường là địa chỉ IP (đôi khi ghép thêm email).
// Gọi ở ĐẦU mỗi endpoint cần bảo vệ — nếu đang bị khoá, hàm tự json_response()
// và dừng script luôn (giống require_login/require_admin).
// ============================================================================
function get_client_ip() {
    return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function check_rate_limit(PDO $pdo, string $action, string $identifier, int $maxAttempts = 5, int $lockoutSeconds = 60, int $windowSeconds = 300) {
    $now = time();
    $stmt = $pdo->prepare('SELECT * FROM rate_limits WHERE action = ? AND identifier = ?');
    $stmt->execute([$action, $identifier]);
    $row = $stmt->fetch();

    if ($row) {
        // Đang trong thời gian khoá -> chặn luôn, kèm số giây còn lại
        if ($row['locked_until'] !== null && strtotime($row['locked_until']) > $now) {
            $remaining = strtotime($row['locked_until']) - $now;
            json_response([
                'success' => false,
                'message' => "Bạn thao tác quá nhiều lần, vui lòng thử lại sau {$remaining} giây!",
            ], 429);
        }

        // Hết cửa sổ theo dõi cũ (vd sau 5 phút không thử lại) -> reset đếm từ đầu
        if (strtotime($row['first_attempt_at']) < $now - $windowSeconds) {
            $pdo->prepare('UPDATE rate_limits SET attempt_count = 1, first_attempt_at = NOW(), locked_until = NULL WHERE id = ?')
                ->execute([$row['id']]);
            return;
        }
    }
}

// Gọi hàm này SAU KHI xác nhận 1 lượt thử THẤT BẠI (sai mật khẩu, không tìm thấy vé...)
// để tăng bộ đếm; nếu vượt ngưỡng thì tự khoá luôn.
function register_failed_attempt(PDO $pdo, string $action, string $identifier, int $maxAttempts = 5, int $lockoutSeconds = 60) {
    $stmt = $pdo->prepare('SELECT * FROM rate_limits WHERE action = ? AND identifier = ?');
    $stmt->execute([$action, $identifier]);
    $row = $stmt->fetch();

    if (!$row) {
        $pdo->prepare('INSERT INTO rate_limits (action, identifier, attempt_count, first_attempt_at) VALUES (?, ?, 1, NOW())')
            ->execute([$action, $identifier]);
        return;
    }

    $newCount = (int)$row['attempt_count'] + 1;
    $lockedUntil = $newCount >= $maxAttempts ? date('Y-m-d H:i:s', time() + $lockoutSeconds) : null;

    $pdo->prepare('UPDATE rate_limits SET attempt_count = ?, locked_until = ? WHERE id = ?')
        ->execute([$newCount, $lockedUntil, $row['id']]);
}

// Gọi khi 1 lượt thử THÀNH CÔNG để xoá bộ đếm (đăng nhập đúng thì không cần nhớ các lần sai trước đó nữa)
function clear_rate_limit(PDO $pdo, string $action, string $identifier) {
    $pdo->prepare('DELETE FROM rate_limits WHERE action = ? AND identifier = ?')->execute([$action, $identifier]);
}

// ============================================================================
// CSRF PROTECTION (double-submit token) — mọi request POST làm thay đổi dữ liệu
// (đặt vé, hủy vé, đổi trạng thái chuyến...) đều phải gửi kèm đúng token đã cấp.
// Token được cấp qua session.php (session_start() đã bật sẵn ở config.php), lưu
// trong session server-side, và frontend phải đính kèm lại trong header
// 'X-CSRF-Token' hoặc field 'csrfToken' trong body JSON.
// ============================================================================
function csrf_get_or_create_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_verify($body) {
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($body['csrfToken'] ?? '');
    $expected = $_SESSION['csrf_token'] ?? '';

    if ($expected === '' || $sent === '' || !hash_equals($expected, (string)$sent)) {
        json_response(['success' => false, 'message' => 'Phiên làm việc không hợp lệ hoặc đã hết hạn, vui lòng tải lại trang!'], 403);
    }
}

// ============================================================================
// VALIDATE EMAIL PHÍA SERVER — không được tin type="email" ở client, vì client
// có thể bị bypass hoàn toàn khi gọi thẳng API bằng curl/Postman.
// ============================================================================
function validate_email_or_fail(string $email) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(['success' => false, 'message' => 'Địa chỉ email không đúng định dạng!'], 400);
    }
}

// ============================================================================
// AUDIT LOG — ghi lại thao tác quản trị (đổi trạng thái chuyến bay, hủy vé...)
// để phục vụ demo phần giám sát hệ thống. Không bao giờ throw lỗi ra ngoài dù
// insert thất bại — audit log là phụ trợ, không được làm hỏng luồng chính.
// ============================================================================
function write_audit_log(PDO $pdo, string $action, ?string $target = null, ?string $details = null) {
    try {
        $stmt = $pdo->prepare('INSERT INTO audit_log (admin_id, admin_name, action, target, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $_SESSION['user_id'] ?? null,
            $_SESSION['full_name'] ?? null,
            $action,
            $target,
            $details,
            get_client_ip(),
        ]);
    } catch (Exception $e) {
        // Bỏ qua lỗi audit log — không để tính năng phụ làm gãy luồng nghiệp vụ chính
    }
}
// ============================================================================
// GIẢ LẬP GỬI EMAIL XÁC NHẬN ĐẶT VÉ — đồ án không có SMTP server thật, nên ghi
// nội dung "email" ra file logs/email_confirmations.txt thay vì gửi thật. Vẫn
// thể hiện đúng luồng nghiệp vụ để demo/báo cáo; dễ dàng thay bằng mail() hoặc
// PHPMailer thật sau này nếu deploy lên hosting có SMTP.
// ============================================================================
function write_confirmation_email_log(string $bookingCode, array $passengers, float $totalPrice) {
    try {
        $logDir = __DIR__ . '/../logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        $recipients = array_filter(array_map(fn($p) => $p['email'] ?? '', $passengers));
        $names = array_map(fn($p) => $p['fullName'] ?? '', $passengers);

        $entry = sprintf(
            "[%s] Gửi email xác nhận đặt vé %s tới: %s\n  Hành khách: %s\n  Tổng tiền: $%s\n----------------------------------------\n",
            date('Y-m-d H:i:s'),
            $bookingCode,
            $recipients ? implode(', ', $recipients) : '(không có email)',
            implode(', ', $names),
            number_format($totalPrice, 2)
        );

        file_put_contents($logDir . '/email_confirmations.txt', $entry, FILE_APPEND | LOCK_EX);
    } catch (Exception $e) {
        // Không để lỗi ghi log làm hỏng luồng đặt vé chính
    }
}
