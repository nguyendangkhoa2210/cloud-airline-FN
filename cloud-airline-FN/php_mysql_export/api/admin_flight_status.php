<?php
/**
 * POST /php_mysql_export/api/admin_flight_status.php
 * Body JSON: { "flightId": 1, "status": "Delayed" }
 * Chỉ admin (xác thực qua session, KHÔNG qua dữ liệu client gửi lên) mới được đổi trạng thái.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';
require_admin();

$body = get_json_body();
$flightId = (int)($body['flightId'] ?? 0);
$status = $body['status'] ?? '';

if (!$flightId || !in_array($status, ['Scheduled', 'Delayed', 'Cancelled'], true)) {
    json_response(['success' => false, 'message' => 'Dữ liệu không hợp lệ!'], 400);
}

$stmt = $pdo->prepare('UPDATE flights SET status = ? WHERE id = ?');
$stmt->execute([$status, $flightId]);

json_response(['success' => true]);