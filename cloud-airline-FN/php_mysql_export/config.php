<?php
// ============================================================================
// CLOUD AIRLINE — Kết nối Database (SQL Server)
// File này được include ở ĐẦU mọi file API khác, nên KHÔNG được echo/print gì ra ở đây,
// nếu không JSON trả về cho frontend sẽ bị dính thêm text rác và JS không parse được.
// ============================================================================

// Bật session cho toàn bộ project (login.php, session.php, _helpers.php đều cần $_SESSION)
// Phải gọi TRƯỚC khi có bất kỳ output nào, và chỉ gọi nếu chưa có session nào đang chạy.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$host = '.\DKHOA';           // Tên SQL Server instance của bạn
$db   = 'cloud_airline_db';  // Tên database
$user = 'sa';                // Tài khoản đăng nhập SQL Server
$pass = '123';                // Mật khẩu (đảm bảo đúng với SSMS)

try {
    // DSN chuẩn cho driver sqlsrv (PHP PDO)
    $dsn = "sqlsrv:Server=$host;Database=$db;TrustServerCertificate=true";

    // Biến $pdo này được dùng lại ở MỌI file API (flights.php, login.php, book.php, ...)
    // Nếu đổi tên biến này, phải sửa lại toàn bộ các file kia.
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Để PDO trả về tên cột dạng chuỗi (mặc định của sqlsrv driver), tránh lỗi truy cập theo index số
    $pdo->setAttribute(PDO::ATTR_CASE, PDO::CASE_NATURAL);
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