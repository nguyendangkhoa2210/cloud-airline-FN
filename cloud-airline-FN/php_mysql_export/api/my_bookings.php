<?php
/**
 * GET /php_mysql_export/api/my_bookings.php
 * Trả về danh sách vé của đúng người đang đăng nhập (theo session), mới nhất lên trước.
 * Cấu trúc JSON khớp với object booking mà assets/app.js đang dùng (bookingsDb).
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';
require_login();

$stmt = $pdo->prepare('
    SELECT b.*, fo.flight_number AS outbound_number, fo.origin AS outbound_origin,
           fo.destination AS outbound_destination, fr.flight_number AS return_number
    FROM bookings b
    JOIN flights fo ON fo.id = b.outbound_flight_id
    LEFT JOIN flights fr ON fr.id = b.return_flight_id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
');
$stmt->execute([$_SESSION['user_id']]);
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
        'passengerNames' => $names,
        'flightNumber' => $flightLabel,
        'outboundFlightId' => (int)$b['outbound_flight_id'],
        'origin' => $b['outbound_origin'],
        'destination' => $b['outbound_destination'],
        'tripType' => $b['trip_type'],
        'cabinClass' => $b['cabin_class'],
        'seat' => implode(', ', $seats),
        'totalPrice' => (float)$b['total_price'],
        'date' => (string)$b['departure_date'],
        'returnDate' => $b['return_date'] !== null ? (string)$b['return_date'] : null,
        'status' => $b['status'],
    ];
}

json_response(['success' => true, 'bookings' => $result]);