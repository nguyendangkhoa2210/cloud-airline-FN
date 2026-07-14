<?php
/**
 * POST /php_mysql_export/api/logout.php
 * Hủy toàn bộ session hiện tại và xóa sạch cookie chứa dấu vết đăng nhập.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

// 1. Xóa toàn bộ biến trong mảng session
$_SESSION = [];

// 2. Ép trình duyệt xóa cookie của session cũ để chống rò rỉ
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// 3. Phá hủy session trên server
session_destroy();

json_response(['success' => true]);