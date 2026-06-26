<?php
/**
 * POST /php_mysql_export/api/login.php
 * Body JSON: { "email": "...", "password": "..." }
 * Xác thực bằng password_verify() (so khớp với hash bcrypt trong CSDL), tạo session khi thành công.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

$body = get_json_body();
$email = trim($body['email'] ?? '');
$password = (string)($body['password'] ?? '');

if ($email === '' || $password === '') {
    json_response(['success' => false, 'message' => 'Vui lòng điền Email và Mật khẩu!'], 400);
}

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    json_response(['success' => false, 'message' => 'Email hoặc mật khẩu không đúng!'], 401);
}
session_regenerate_id(true);
// Lưu trạng thái đăng nhập vào session phía server — đây là nguồn xác thực DUY NHẤT được tin
// tưởng cho các API sau này (require_login / require_admin), không tin bất kỳ gì từ client gửi lên.
$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['role'] = $user['role'];
$_SESSION['full_name'] = $user['full_name'];

json_response([
    'success' => true,
    'user' => [
        'id' => (int)$user['id'],
        'email' => $user['email'],
        'fullName' => $user['full_name'],
        'role' => $user['role'],
    ],
]);