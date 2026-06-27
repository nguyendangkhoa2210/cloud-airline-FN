<?php
// ============================================================================
// CLOUD AIRLINE — Kết nối Database (MySQL)
// Bản dùng để TEST TRÊN MÁY LOCAL (XAMPP) trước khi đưa lên hosting.
// File này được include ở ĐẦU mọi file API khác, nên KHÔNG được echo/print gì ra ở đây,
// nếu không JSON trả về cho frontend sẽ bị dính thêm text rác và JS không parse được.
// ============================================================================

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
