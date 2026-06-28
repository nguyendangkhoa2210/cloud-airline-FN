<?php
/**
 * GET /php_mysql_export/api/booked_seats.php?flight_id=1
 * Trả về danh sách ghế đã được đặt cho một chuyến bay cụ thể, CỘNG THÊM số vé
 * còn lại theo từng hạng (seatsLeft) — đáp ứng yêu cầu đề bài: "liệt kê chuyến
 * bay cùng số lượng vé còn" và "nếu không còn đủ vé thì thông báo cho người dùng".
 *
 * QUY ƯỚC SỐ GHẾ (khớp đúng sơ đồ ghế cố định 4 hàng x 8 cột trong renderSeatsScreen()):
 * - Hàng 1-2 (cột 1-2) = 8 ghế, dành riêng cho hạng SkyBoss (Thương Gia)
 * - Hàng 3-8 (cột 3-8) = 24 ghế, dùng CHUNG cho Eco và Promo (Phổ Thông)
 *   -> vì 2 hạng này không có sơ đồ ghế tách biệt, "số vé phổ thông còn lại"
 *      được tính chung 1 con số duy nhất để KHÔNG bao giờ lệch với ghế thật.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

const TOTAL_SEATS_SKYBOSS = 8;   // 4 hàng (A-D) x 2 cột (hàng 1-2)
const TOTAL_SEATS_ECONOMY = 24;  // 4 hàng (A-D) x 6 cột (hàng 3-8), dùng chung Eco+Promo

$flightId = isset($_GET['flight_id']) ? (int)$_GET['flight_id'] : 0;

if (!$flightId) {
    json_response(['success' => false, 'message' => 'Thiếu tham số flight_id!'], 400);
}

// Lấy tất cả số ghế đã đặt cho chuyến bay này (chỉ những booking còn Confirmed)
$stmt = $pdo->prepare('
    SELECT bp.seat_number
    FROM booking_passengers bp
    JOIN bookings b ON b.id = bp.booking_id
    WHERE b.outbound_flight_id = ?
      AND b.status = \'Confirmed\'
');
$stmt->execute([$flightId]);
$rows = $stmt->fetchAll();

$bookedSeats = array_column($rows, 'seat_number');

// Đếm ghế đã đặt thuộc khu Thương Gia (hàng 1-2: cột số sau chữ cái là 1 hoặc 2)
// và khu Phổ Thông (hàng 3-8: cột số từ 3 đến 8) — dựa theo đúng quy tắc cột
// đã dùng trong renderSeatsScreen() (isVipRow = col <= 2).
$bookedSkyBoss = 0;
$bookedEconomy = 0;
foreach ($bookedSeats as $seat) {
    // seat_number dạng "A1", "C7"... -> lấy phần số (cột) sau ký tự hàng đầu tiên
    $col = (int) substr($seat, 1);
    if ($col >= 1 && $col <= 2) {
        $bookedSkyBoss++;
    } elseif ($col >= 3 && $col <= 8) {
        $bookedEconomy++;
    }
}

$seatsLeft = [
    'skyboss' => max(0, TOTAL_SEATS_SKYBOSS - $bookedSkyBoss),
    // Eco và Promo dùng chung pool ghế phổ thông -> cùng 1 giá trị
    'eco' => max(0, TOTAL_SEATS_ECONOMY - $bookedEconomy),
    'promo' => max(0, TOTAL_SEATS_ECONOMY - $bookedEconomy),
];

json_response(['success' => true, 'bookedSeats' => $bookedSeats, 'seatsLeft' => $seatsLeft]);
