<?php
/**
 * GET /php_mysql_export/api/admin_audit_log.php
 * Chỉ admin mới xem được — trả về 50 thao tác quản trị gần nhất
 * (đổi trạng thái chuyến bay, admin hủy vé thay khách...).
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';
require_admin();

$stmt = $pdo->query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50');
$rows = $stmt->fetchAll();

json_response([
    'success' => true,
    'logs' => array_map(fn($r) => [
        'adminName' => $r['admin_name'] ?? 'Hệ thống',
        'action' => $r['action'],
        'target' => $r['target'],
        'details' => $r['details'],
        'ipAddress' => $r['ip_address'],
        'createdAt' => $r['created_at'],
    ], $rows),
]);
