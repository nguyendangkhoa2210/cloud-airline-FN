<?php
/**
 * GET /php_mysql_export/api/session.php
 * Kiểm tra session hiện tại còn đăng nhập hay không (dùng khi người dùng tải lại trang).
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

// Luôn cấp CSRF token (kể cả khách chưa đăng nhập) — frontend gọi session.php
// ngay lúc tải trang để lấy token này, rồi đính kèm lại ở mọi request POST làm
// thay đổi dữ liệu (đặt vé, hủy vé, đổi trạng thái chuyến...).
$csrfToken = csrf_get_or_create_token();

if (empty($_SESSION['user_id'])) {
    json_response(['success' => true, 'loggedIn' => false, 'csrfToken' => $csrfToken]);
}

json_response([
    'success' => true,
    'loggedIn' => true,
    'csrfToken' => $csrfToken,
    'user' => [
        'id' => (int)$_SESSION['user_id'],
        'fullName' => $_SESSION['full_name'],
        'role' => $_SESSION['role'],
    ],
]);