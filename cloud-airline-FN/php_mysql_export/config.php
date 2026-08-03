<?php
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


if (session_status() === PHP_SESSION_NONE) {

    ini_set('session.gc_maxlifetime', 7200);


    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_set_cookie_params([
        'lifetime' => 7200,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => $isHttps,
    ]);
    session_start();
}


$host = '127.0.0.1';         
$db   = 'cloud_airline_db'; 
$user = 'root';              
$pass = '';                  


define('ANTHROPIC_API_KEY', '');

try {
 
    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";

   
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
   
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Không kết nối được Database: ' . $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
