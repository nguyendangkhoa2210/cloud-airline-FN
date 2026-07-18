<?php
/**
 * POST /php_mysql_export/api/change_booking.php
 * Body JSON: {
 *   bookingId: "CH-123456",             // booking_code
 *   newOutboundFlightId: 3,
 *   newDepartureDate: "2026-10-01",
 *   newReturnFlightId: null,            // chỉ cần nếu vé khứ hồi
 *   newReturnDate: null
 * }
 *
 * CHÍNH SÁCH ĐỔI VÉ (đồng bộ với bảng FARE_TIERS ở frontend/app.js):
 *   - Promo:   KHÔNG được đổi vé.
 *   - Eco:     Được đổi, thu phụ phí đổi vé cố định $50.
 *   - SkyBoss: Được đổi miễn phí.
 *
 * Chỉ chủ vé (đã đăng nhập, đúng user_id) hoặc admin mới được đổi — vé khách lẻ
 * (đặt không qua tài khoản) hiện CHƯA hỗ trợ tự đổi vé qua kênh này, cần liên hệ
 * hỗ trợ (giữ đơn giản, tránh mở thêm 1 kênh xác minh danh tính rủi ro).
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';
require_login();

const CHANGE_FEE_ECO = 50.0;

$body = get_json_body();
csrf_verify($body);

$bookingCode = trim($body['bookingId'] ?? '');
$newOutboundFlightId = (int)($body['newOutboundFlightId'] ?? 0);
$newDepartureDate = trim($body['newDepartureDate'] ?? '');
$newReturnFlightId = !empty($body['newReturnFlightId']) ? (int)$body['newReturnFlightId'] : null;
$newReturnDate = $body['newReturnDate'] ?? null;

if ($bookingCode === '' || !$newOutboundFlightId || $newDepartureDate === '') {
    json_response(['success' => false, 'message' => 'Thiếu thông tin chuyến bay/ngày bay mới!'], 400);
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT * FROM bookings WHERE booking_code = ? FOR UPDATE');
    $stmt->execute([$bookingCode]);
    $booking = $stmt->fetch();

    if (!$booking) {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Không tìm thấy vé!'], 404);
    }

    $isOwner = $booking['user_id'] !== null && (int)$booking['user_id'] === (int)$_SESSION['user_id'];
    $isAdmin = ($_SESSION['role'] ?? '') === 'admin';
    if (!$isOwner && !$isAdmin) {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Bạn không có quyền đổi vé này!'], 403);
    }

    if ($booking['status'] !== 'Confirmed') {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Chỉ có thể đổi vé đang ở trạng thái Confirmed!'], 409);
    }

    // --------------------------------------------------------------------
    // CHÍNH SÁCH THEO HẠNG VÉ — Promo không cho đổi, Eco thu phí, SkyBoss free
    // --------------------------------------------------------------------
    $cabinClass = $booking['cabin_class'];
    if ($cabinClass === 'Promo') {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Vé hạng Promo (Tiết Kiệm) không được phép đổi vé theo chính sách!'], 403);
    }
    $changeFee = $cabinClass === 'Eco' ? CHANGE_FEE_ECO : 0.0;

    // --------------------------------------------------------------------
    // CHUYẾN BAY MỚI phải TỒN TẠI, chưa bị hủy, và ĐÚNG CÙNG TUYẾN (origin/destination)
    // với chuyến cũ — tránh trường hợp "đổi vé" thực chất là đặt vé tuyến khác giá rẻ hơn 0đ.
    // --------------------------------------------------------------------
    $priceColumn = ['Promo' => 'price_promo', 'Eco' => 'price_eco', 'SkyBoss' => 'price_skyboss'][$cabinClass];

    $stmtOldOutbound = $pdo->prepare('SELECT origin, destination FROM flights WHERE id = ?');
    $stmtOldOutbound->execute([$booking['outbound_flight_id']]);
    $oldOutbound = $stmtOldOutbound->fetch();

    $stmtNewOutbound = $pdo->prepare("SELECT id, origin, destination, {$priceColumn} AS fare, status FROM flights WHERE id = ?");
    $stmtNewOutbound->execute([$newOutboundFlightId]);
    $newOutbound = $stmtNewOutbound->fetch();

    if (!$newOutbound || $newOutbound['status'] === 'Cancelled') {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Chuyến bay mới không tồn tại hoặc đã bị hủy!'], 400);
    }
    if (!$oldOutbound || $newOutbound['origin'] !== $oldOutbound['origin'] || $newOutbound['destination'] !== $oldOutbound['destination']) {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Chỉ được đổi sang chuyến bay khác giờ/ngày trên CÙNG một tuyến bay!'], 400);
    }

    $newReturnFare = 0.0;
    if ($booking['trip_type'] === 'RoundTrip' && $newReturnFlightId) {
        $stmtNewReturn = $pdo->prepare("SELECT id, {$priceColumn} AS fare, status FROM flights WHERE id = ?");
        $stmtNewReturn->execute([$newReturnFlightId]);
        $newReturn = $stmtNewReturn->fetch();
        if (!$newReturn || $newReturn['status'] === 'Cancelled') {
            $pdo->rollBack();
            json_response(['success' => false, 'message' => 'Chuyến bay khứ hồi mới không tồn tại hoặc đã bị hủy!'], 400);
        }
        $newReturnFare = (float) $newReturn['fare'];
    } else {
        $newReturnFlightId = $booking['trip_type'] === 'RoundTrip' ? $booking['return_flight_id'] : null;
        if ($newReturnFlightId) {
            $stmtReturnFare = $pdo->prepare("SELECT {$priceColumn} AS fare FROM flights WHERE id = ?");
            $stmtReturnFare->execute([$newReturnFlightId]);
            $newReturnFare = (float) ($stmtReturnFare->fetchColumn() ?: 0);
        }
    }

    // --------------------------------------------------------------------
    // TÍNH LẠI TỔNG TIỀN: giá vé mới theo số hành khách hiện có + giữ nguyên
    // phụ thu ghế/tiện ích cũ (không đổi ghế ở bước này) + phí đổi vé (nếu có)
    // --------------------------------------------------------------------
    $stmtPassengerCount = $pdo->prepare('SELECT COUNT(*) FROM booking_passengers WHERE booking_id = ?');
    $stmtPassengerCount->execute([$booking['id']]);
    $passengerCount = (int) $stmtPassengerCount->fetchColumn();

    // --------------------------------------------------------------------
    // KIỂM TRA GHẾ CỤ THỂ TRÊN CHUYẾN BAY MỚI — vé giữ nguyên số ghế cũ, nhưng
    // ghế đó có thể ĐÃ CÓ NGƯỜI KHÁC đặt trên chuyến MỚI này rồi (khác booking).
    // Đây là lỗi cùng loại với double-booking đã vá ở book.php, chỉ khác chỗ
    // xảy ra (đổi vé thay vì đặt vé mới) — nếu không chặn, 2 vé có thể cùng
    // ghế trên CÙNG 1 chuyến sau khi đổi.
    // --------------------------------------------------------------------
    if ($newOutboundFlightId !== (int)$booking['outbound_flight_id']) {
        $stmtMySeats = $pdo->prepare('SELECT seat_number FROM booking_passengers WHERE booking_id = ?');
        $stmtMySeats->execute([$booking['id']]);
        $mySeats = array_column($stmtMySeats->fetchAll(), 'seat_number');

        if (!empty($mySeats)) {
            $placeholders = implode(',', array_fill(0, count($mySeats), '?'));
            $stmtConflict = $pdo->prepare("
                SELECT bp.seat_number
                FROM booking_passengers bp
                JOIN bookings b2 ON b2.id = bp.booking_id
                WHERE b2.outbound_flight_id = ? AND b2.status = 'Confirmed' AND b2.id != ?
                  AND bp.seat_number IN ($placeholders)
            ");
            $stmtConflict->execute(array_merge([$newOutboundFlightId, $booking['id']], $mySeats));
            $conflictSeats = array_column($stmtConflict->fetchAll(), 'seat_number');

            if (!empty($conflictSeats)) {
                $pdo->rollBack();
                json_response([
                    'success' => false,
                    'message' => 'Ghế ' . implode(', ', $conflictSeats) . ' trên chuyến bay mới đã có hành khách khác đặt — vui lòng liên hệ hỗ trợ để đổi sang ghế khác!',
                ], 409);
            }
        }
    }

    $oldBaseFare = (float) $booking['total_price']; // tổng cũ đã bao gồm mọi phụ phí trước đó
    $stmtOldOutboundFare = $pdo->prepare("SELECT {$priceColumn} AS fare FROM flights WHERE id = ?");
    $stmtOldOutboundFare->execute([$booking['outbound_flight_id']]);
    $oldOutboundFare = (float) ($stmtOldOutboundFare->fetchColumn() ?: 0);
    $oldReturnFare = 0.0;
    if ($booking['return_flight_id']) {
        $stmtOldReturnFare = $pdo->prepare("SELECT {$priceColumn} AS fare FROM flights WHERE id = ?");
        $stmtOldReturnFare->execute([$booking['return_flight_id']]);
        $oldReturnFare = (float) ($stmtOldReturnFare->fetchColumn() ?: 0);
    }

    // Phần "phụ thu ghế + tiện ích" = tổng cũ - (giá vé cũ x số khách) -> giữ nguyên phần này
    $extrasFromOldTotal = $oldBaseFare - (($oldOutboundFare + $oldReturnFare) * $passengerCount);
    $newTotalPrice = (($newOutbound['fare'] + $newReturnFare) * $passengerCount) + max(0, $extrasFromOldTotal) + $changeFee;

    $stmtUpdate = $pdo->prepare('
        UPDATE bookings
        SET outbound_flight_id = ?, return_flight_id = ?, departure_date = ?, return_date = ?, total_price = ?
        WHERE id = ?
    ');
    $stmtUpdate->execute([
        $newOutboundFlightId,
        $newReturnFlightId,
        $newDepartureDate,
        $newReturnDate,
        $newTotalPrice,
        $booking['id'],
    ]);

    write_audit_log(
        $pdo,
        'change_booking',
        $bookingCode,
        "Đổi từ flight_id={$booking['outbound_flight_id']} sang {$newOutboundFlightId}, phí đổi vé: \${$changeFee}"
    );

    $pdo->commit();
    json_response([
        'success' => true,
        'message' => $changeFee > 0 ? "Đổi vé thành công! Đã thu phụ phí đổi vé \${$changeFee}." : 'Đổi vé thành công (miễn phí theo hạng SkyBoss)!',
        'newTotalPrice' => $newTotalPrice,
        'changeFee' => $changeFee,
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(['success' => false, 'message' => 'Lỗi hệ thống khi đổi vé: ' . $e->getMessage()], 500);
}
