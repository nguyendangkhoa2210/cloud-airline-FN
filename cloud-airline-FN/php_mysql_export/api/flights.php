<?php
/**
 * GET /php_mysql_export/api/flights.php
 * Trả về toàn bộ danh sách chuyến bay. Cấu trúc JSON khớp 1:1 với object chuyến bay
 * mà assets/app.js đang dùng (MOCK_FLIGHTS) nên không cần đổi gì ở phần hiển thị.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

$stmt = $pdo->query('SELECT * FROM flights ORDER BY id ASC');
$rows = $stmt->fetchAll();

$flights = array_map(function ($r) {
    return [
        'id' => (int)$r['id'],
        'flightNumber' => $r['flight_number'],
        'origin' => $r['origin'],
        'destination' => $r['destination'],
        'departureTime' => $r['departure_time'],
        'arrivalTime' => $r['arrival_time'],
        'duration' => $r['duration'],
        'priceSkyBoss' => (float)$r['price_skyboss'],
        'priceEco' => (float)$r['price_eco'],
        'pricePromo' => (float)$r['price_promo'],
        'status' => $r['status'],
        'aircraft' => $r['aircraft'],
        'baggage' => $r['baggage'],
        'emissions' => $r['emissions'],
    ];
}, $rows);

json_response(['success' => true, 'flights' => $flights]);