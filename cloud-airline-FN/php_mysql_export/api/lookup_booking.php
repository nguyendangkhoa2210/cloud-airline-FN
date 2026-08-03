<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

$body = get_json_body();
csrf_verify($body);

$bookingCode = trim($body['bookingCode'] ?? '');
$fullName = trim($body['fullName'] ?? '');

if ($bookingCode === '' || $fullName === '') {
    json_response(['success' => false, 'message' => 'Vui lòng nhập đầy đủ Mã đặt chỗ và Họ tên hành khách!'], 400);
}

// Chống dò họ tên bằng brute-force (mã vé dạng CH-xxxxxx chỉ có 6 chữ số, không
// quá khó đoán/liệt kê tuần tự) — khoá theo IP sau 5 lần tra sai trong 60 giây.
$rateId = get_client_ip();
check_rate_limit($pdo, 'lookup_booking', $rateId, 5, 60, 300);

$stmt = $pdo->prepare('
    SELECT b.*, fo.flight_number AS outbound_number, fo.origin AS outbound_origin,
           fo.destination AS outbound_destination, fo.departure_time AS outbound_dep_time,
           fo.arrival_time AS outbound_arr_time, fo.status AS outbound_status,
           fr.flight_number AS return_number, fr.origin AS return_origin,
           fr.destination AS return_destination, fr.departure_time AS return_dep_time,
           fr.arrival_time AS return_arr_time
    FROM bookings b
    JOIN flights fo ON fo.id = b.outbound_flight_id
    LEFT JOIN flights fr ON fr.id = b.return_flight_id
    WHERE b.booking_code = ?
');
$stmt->execute([$bookingCode]);
$booking = $stmt->fetch();

$errorResponse = ['success' => false, 'message' => 'Không tìm thấy vé khớp với Mã đặt chỗ và Họ tên đã nhập!'];

if (!$booking) {
    register_failed_attempt($pdo, 'lookup_booking', $rateId, 5, 60);
    json_response($errorResponse, 404);
}

$stmtPassengers = $pdo->prepare('SELECT full_name, passport_number, seat_number, nationality, age FROM booking_passengers WHERE booking_id = ?');
$stmtPassengers->execute([$booking['id']]);
$passengers = $stmtPassengers->fetchAll();

// So khớp họ tên với BẤT KỲ hành khách nào trong vé (không phân biệt hoa/thường).
// Dùng mb_strtolower nếu có extension mbstring (XAMPP mặc định có sẵn); nếu môi
// trường nào đó thiếu extension này thì fallback về strtolower thường để tránh
// crash 500 — chỉ hơi kém chính xác với ký tự có dấu tiếng Việt viết hoa.
$normalize = function ($s) {
    $s = trim(preg_replace('/\s+/', ' ', (string) $s));
    return function_exists('mb_strtolower') ? mb_strtolower($s, 'UTF-8') : strtolower($s);
};
$matched = false;
foreach ($passengers as $p) {
    if ($normalize($p['full_name']) === $normalize($fullName)) {
        $matched = true;
        break;
    }
}

if (!$matched) {
    register_failed_attempt($pdo, 'lookup_booking', $rateId, 5, 60);
    json_response($errorResponse, 404);
}
clear_rate_limit($pdo, 'lookup_booking', $rateId);

$stmtAddons = $pdo->prepare('SELECT name, price FROM booking_addons WHERE booking_id = ?');
$stmtAddons->execute([$booking['id']]);
$addons = $stmtAddons->fetchAll();

json_response([
    'success' => true,
    'booking' => [
        'id' => $booking['booking_code'],
        'status' => $booking['status'],
        'tripType' => $booking['trip_type'],
        'cabinClass' => $booking['cabin_class'],
        'totalPrice' => (float)$booking['total_price'],
        'departureDate' => (string)$booking['departure_date'],
        'returnDate' => $booking['return_date'] !== null ? (string)$booking['return_date'] : null,
        'canCancel' => $booking['status'] === 'Confirmed' && $booking['user_id'] === null,
        'outbound' => [
            'flightNumber' => $booking['outbound_number'],
            'origin' => $booking['outbound_origin'],
            'destination' => $booking['outbound_destination'],
            'departureTime' => $booking['outbound_dep_time'],
            'arrivalTime' => $booking['outbound_arr_time'],
            'status' => $booking['outbound_status'],
        ],
        'return' => $booking['return_number'] ? [
            'flightNumber' => $booking['return_number'],
            'origin' => $booking['return_origin'],
            'destination' => $booking['return_destination'],
            'departureTime' => $booking['return_dep_time'],
            'arrivalTime' => $booking['return_arr_time'],
        ] : null,
        'passengers' => array_map(fn($p) => [
            'fullName' => $p['full_name'],
            'seatNumber' => $p['seat_number'],
            'nationality' => $p['nationality'],
        ], $passengers),
        'addons' => array_map(fn($a) => ['name' => $a['name'], 'price' => (float)$a['price']], $addons),
    ],
]);
