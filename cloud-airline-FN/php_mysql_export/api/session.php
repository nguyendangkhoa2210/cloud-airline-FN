<?php

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

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