<?php
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
