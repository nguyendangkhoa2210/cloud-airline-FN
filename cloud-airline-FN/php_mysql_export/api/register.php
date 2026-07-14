<?php
/**
 * POST /php_mysql_export/api/register.php
 * Body JSON: { "email": "...", "password": "...", "fullName": "..." }
 * Tạo tài khoản khách hàng mới (role luôn là 'user' — không ai tự đăng ký làm admin được).
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

$body = get_json_body();
$email = trim($body['email'] ?? '');
$password = (string)($body['password'] ?? '');
$fullName = trim($body['fullName'] ?? '');

if ($email === '' || $password === '' || $fullName === '') {
    json_response(['success' => false, 'message' => 'Vui lòng điền đầy đủ Email, Họ tên và Mật khẩu!'], 400);
}

// Kiểm tra email đã tồn tại chưa (Prepared Statement -> chống SQL Injection)
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    json_response(['success' => false, 'message' => 'Email này đã tồn tại trong hệ thống!'], 409);
}

// Mật khẩu LUÔN được mã hoá bcrypt trước khi lưu — không bao giờ lưu plain text
$hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare("INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, 'user')");
$stmt->execute([$email, $hash, $fullName]);

json_response(['success' => true, 'message' => 'Đăng ký thành công!']);