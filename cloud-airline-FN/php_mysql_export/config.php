<?php
// ============================================================================
// CLOUD AIRLINE — Kết nối Database (MySQL)
// Bản dùng để TEST TRÊN MÁY LOCAL (XAMPP) trước khi đưa lên hosting.
// File này được include ở ĐẦU mọi file API khác, nên KHÔNG được echo/print gì ra ở đây,
// nếu không JSON trả về cho frontend sẽ bị dính thêm text rác và JS không parse được.
// ============================================================================

// --- KHÔNG lộ lỗi PHP thô (stack trace, đường dẫn file trên server...) ra ngoài ---
// display_errors=Off để trình duyệt/khách hàng không bao giờ thấy lỗi kỹ thuật thật;
// log_errors=On để LỖI VẪN ĐƯỢC GHI LẠI (xem trong php_error_log.txt) phục vụ debug.
// set_exception_handler bắt MỌI lỗi chưa được try/catch xử lý, trả về đúng 1 JSON gọn
// gàng thay vì để PHP tự in ra "Fatal error: ... in /home/.../book.php on line 42".
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/php_error_log.txt');
error_reporting(E_ALL);

set_exception_handler(function (Throwable $e) {
    error_log('[Uncaught] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode([
        'success' => false,
        'message' => 'Hệ thống gặp sự cố, vui lòng thử lại sau!',
    ], JSON_UNESCAPED_UNICODE);
    exit;
});

set_error_handler(function ($severity, $message, $file, $line) {
    // error_reporting() trả về 0 khi lỗi bị "@" ẩn đi -> tôn trọng, không escalate
    if (!(error_reporting() & $severity)) {
        return false;
    }
    // Chỉ nâng WARNING/ERROR thành exception để chặn kịp thời; bỏ qua DEPRECATED/NOTICE
    // (PHP 8.3 có khá nhiều deprecation notice vô hại, không nên làm gãy cả request)
    if (in_array($severity, [E_WARNING, E_USER_WARNING, E_ERROR, E_USER_ERROR], true)) {
        throw new ErrorException($message, 0, $severity, $file, $line);
    }
    error_log("[$severity] $message @ $file:$line");
    return true;
});

// Bật session cho toàn bộ project (login.php, session.php, _helpers.php đều cần $_SESSION)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// --- Thông tin kết nối MySQL trên XAMPP (mặc định) ---
$host = '127.0.0.1';         // XAMPP MySQL luôn chạy ở localhost
$db   = 'cloud_airline_db';  // Tên database (đã tạo bằng database_mysql.sql)
$user = 'root';               // XAMPP MySQL mặc định user là 'root'
$pass = '';                   // XAMPP MySQL mặc định KHÔNG có mật khẩu

try {
    // DSN chuẩn cho driver mysql (PHP PDO) — khác hẳn cú pháp sqlsrv cũ
    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";

    // Biến $pdo này được dùng lại ở MỌI file API (flights.php, login.php, book.php, ...)
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Không dùng echo text thường — trả JSON để frontend (fetch + JSON.parse) đọc được lỗi
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Không kết nối được Database: ' . $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
