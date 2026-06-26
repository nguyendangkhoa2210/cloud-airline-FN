<?php
/**
 * GET /php_mysql_export/api/session.php
 * Kiểm tra session hiện tại còn đăng nhập hay không (dùng khi người dùng tải lại trang).
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

if (empty($_SESSION['user_id'])) {
    json_response(['success' => true, 'loggedIn' => false]);
}

json_response([
    'success' => true,
    'loggedIn' => true,
    'user' => [
        'id' => (int)$_SESSION['user_id'],
        'fullName' => $_SESSION['full_name'],
        'role' => $_SESSION['role'],
    ],
]);