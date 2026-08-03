<?php
/**
 * GET /php_mysql_export/api/flights.php
 * Trả về toàn bộ danh sách chuyến bay, CỘNG THÊM số vé còn lại theo từng hạng
 * (seatsLeft) — đáp ứng yêu cầu đề bài: "hệ thống sẽ liệt kê ra danh sách các
 * chuyến bay... cùng với giá vé tương ứng với từng loại vé và số lượng vé còn".
 *
 * QUY ƯỚC SỐ GHẾ (khớp đúng sơ đồ ghế cố định 4 hàng x 8 cột trong renderSeatsScreen()
 * của frontend — xem cùng quy ước trong booked_seats.php và book.php):
 * - Cột 1-2 (8 ghế)  = hạng SkyBoss (Thương Gia)
 * - Cột 3-8 (24 ghế) = hạng Eco + Promo dùng CHUNG (Phổ Thông)
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

const TOTAL_SEATS_SKYBOSS = 8;
const TOTAL_SEATS_ECONOMY = 24;

$stmt = $pdo->query('SELECT * FROM flights ORDER BY id ASC');
$rows = $stmt->fetchAll();

// Lấy TOÀN BỘ ghế đã đặt (Confirmed) của TẤT CẢ chuyến bay trong 1 query duy nhất,
// group theo outbound_flight_id — tránh phải query riêng cho từng chuyến (N+1 query).
$stmtBooked = $pdo->query('
    SELECT b.outbound_flight_id, bp.seat_number
    FROM booking_passengers bp
    JOIN bookings b ON b.id = bp.booking_id
    WHERE b.status = \'Confirmed\'
');
$bookedRows = $stmtBooked->fetchAll();

// Đếm số ghế đã đặt theo từng chuyến bay, tách riêng khu SkyBoss và khu Phổ Thông
$bookedCountByFlight = []; // [flight_id => ['skyboss' => n, 'economy' => n]]
foreach ($bookedRows as $row) {
    $fid = (int) $row['outbound_flight_id'];
    if (!isset($bookedCountByFlight[$fid])) {
        $bookedCountByFlight[$fid] = ['skyboss' => 0, 'economy' => 0];
    }
    $col = (int) substr($row['seat_number'], 1);
    if ($col >= 1 && $col <= 2) {
        $bookedCountByFlight[$fid]['skyboss']++;
    } elseif ($col >= 3 && $col <= 8) {
        $bookedCountByFlight[$fid]['economy']++;
    }
}

$flights = array_map(function ($r) use ($bookedCountByFlight) {
    $fid = (int) $r['id'];
    $booked = $bookedCountByFlight[$fid] ?? ['skyboss' => 0, 'economy' => 0];

    $seatsLeftSkyBoss = max(0, TOTAL_SEATS_SKYBOSS - $booked['skyboss']);
    $seatsLeftEconomy = max(0, TOTAL_SEATS_ECONOMY - $booked['economy']);

    return [
        'id' => $fid,
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
        // Eco và Promo dùng chung pool ghế phổ thông -> cùng 1 giá trị
        'seatsLeftSkyBoss' => $seatsLeftSkyBoss,
        'seatsLeftEco' => $seatsLeftEconomy,
        'seatsLeftPromo' => $seatsLeftEconomy,
    ];
}, $rows);

json_response(['success' => true, 'flights' => $flights]);