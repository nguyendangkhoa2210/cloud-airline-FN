<?php
/**
 * GET /php_mysql_export/api/admin_bookings.php
 * Trả về TOÀN BỘ vé trong hệ thống (không lọc theo user) — chỉ admin mới gọi được.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';
require_admin();

$stmt = $pdo->query('
    SELECT b.*, fo.flight_number AS outbound_number, fr.flight_number AS return_number
    FROM bookings b
    JOIN flights fo ON fo.id = b.outbound_flight_id
    LEFT JOIN flights fr ON fr.id = b.return_flight_id
    ORDER BY b.created_at DESC
');
$bookings = $stmt->fetchAll();

$stmtPassengers = $pdo->prepare('SELECT full_name, seat_number FROM booking_passengers WHERE booking_id = ?');

$result = [];
foreach ($bookings as $b) {
    $stmtPassengers->execute([$b['id']]);
    $passengers = $stmtPassengers->fetchAll();

    $names = array_map(fn($p) => $p['full_name'], $passengers);
    $seats = array_map(fn($p) => $p['seat_number'], $passengers);

    $flightLabel = $b['return_number']
        ? "{$b['outbound_number']} (đi) / {$b['return_number']} (về)"
        : $b['outbound_number'];

    $result[] = [
        'id' => $b['booking_code'],
        'passengerName' => count($names) > 1 ? "{$names[0]} +" . (count($names) - 1) : ($names[0] ?? ''),
        'flightNumber' => $flightLabel,
        'cabinClass' => $b['cabin_class'],
        'seat' => implode(', ', $seats),
        'totalPrice' => (float)$b['total_price'],
        'status' => $b['status'],
    ];
}

json_response(['success' => true, 'bookings' => $result]);