<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/_helpers.php';

$body = get_json_body();
csrf_verify($body);

$message = trim($body['message'] ?? '');
$history = is_array($body['history'] ?? null) ? $body['history'] : [];

if ($message === '') {
    json_response(['success' => false, 'message' => 'Vui lòng nhập câu hỏi!'], 400);
}
if (mb_strlen($message) > 500) {
    json_response(['success' => false, 'message' => 'Câu hỏi quá dài, vui lòng rút gọn lại!'], 400);
}

$rateId = get_client_ip();
check_rate_limit($pdo, 'chatbot', $rateId, 20, 120, 300);
register_failed_attempt($pdo, 'chatbot', $rateId, 20, 120);

function gather_live_context(PDO $pdo): array {
    $flights = $pdo->query('
        SELECT flight_number, origin, destination, departure_time, arrival_time,
               price_promo, price_eco, price_skyboss, status
        FROM flights ORDER BY origin, departure_time
    ')->fetchAll();

    $myBookings = [];
    if (!empty($_SESSION['user_id'])) {
        $stmt = $pdo->prepare('
            SELECT b.booking_code, b.status, b.departure_date, b.cabin_class, b.total_price,
                   fo.flight_number, fo.origin, fo.destination
            FROM bookings b
            JOIN flights fo ON fo.id = b.outbound_flight_id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
            LIMIT 10
        ');
        $stmt->execute([$_SESSION['user_id']]);
        $myBookings = $stmt->fetchAll();
    }

    return ['flights' => $flights, 'myBookings' => $myBookings];
}

$context = gather_live_context($pdo);

// ============================================================================
// CHẾ ĐỘ 1: AI THẬT (Claude API) — chỉ chạy nếu đã cấu hình key
// ============================================================================
if (ANTHROPIC_API_KEY !== '') {
    $reply = call_claude_api($message, $history, $context);
    if ($reply !== null) {
        json_response(['success' => true, 'reply' => $reply, 'source' => 'ai']);
    }
    // Nếu gọi API lỗi (mất mạng, hết quota, key sai...) -> ÂM THẦM rơi xuống
    // chế độ fallback bên dưới, khách không thấy lỗi kỹ thuật nào cả.
}

// ============================================================================
// CHẾ ĐỘ 2: FALLBACK THÔNG MINH THEO DỮ LIỆU THẬT (không cần API ngoài)
// ============================================================================
json_response(['success' => true, 'reply' => generate_smart_fallback_reply($message, $context), 'source' => 'fallback']);


// ============================================================================
// HÀM GỌI CLAUDE API — trả về null nếu lỗi bất kỳ (để code gọi tự fallback)
// ============================================================================
function call_claude_api(string $message, array $history, array $context): ?string {
    // XAMPP mặc định BẬT SẴN extension curl, nhưng phòng trường hợp môi trường
    // nào đó tắt đi — kiểm tra trước để không bị Fatal Error "undefined function".
    if (!function_exists('curl_init')) {
        error_log('[chatbot] Extension curl chưa được bật trong PHP — không gọi được Claude API.');
        return null;
    }

    try {
        $flightsSummary = implode("\n", array_map(function ($f) {
            return "- {$f['flight_number']}: {$f['origin']} → {$f['destination']}, khởi hành {$f['departure_time']}, "
                . "giá Promo \${$f['price_promo']} / Eco \${$f['price_eco']} / SkyBoss \${$f['price_skyboss']}, trạng thái {$f['status']}";
        }, $context['flights']));

        $myBookingsSummary = empty($context['myBookings'])
            ? "(Khách chưa đăng nhập hoặc chưa có vé nào)"
            : implode("\n", array_map(function ($b) {
                return "- Mã {$b['booking_code']}: {$b['flight_number']} ({$b['origin']} → {$b['destination']}), "
                    . "ngày {$b['departure_date']}, hạng {$b['cabin_class']}, trạng thái {$b['status']}, tổng \${$b['total_price']}";
            }, $context['myBookings']));

        $systemPrompt = <<<PROMPT
Bạn là CloudBot, trợ lý ảo chăm sóc khách hàng của hãng hàng không Cloud Airline.
Trả lời NGẮN GỌN (tối đa 3-4 câu), thân thiện, bằng tiếng Việt, dùng emoji vừa phải.
Chỉ trả lời dựa trên thông tin dưới đây — KHÔNG bịa thêm chuyến bay/giá vé không có trong danh sách.
Nếu không chắc, hãy đề nghị khách dùng chức năng "Tra cứu vé" hoặc liên hệ CSKH.

CHÍNH SÁCH:
- 3 hạng vé: Promo (rẻ nhất, không đổi/hủy), Eco (đổi vé mất phí $50, hủy được), SkyBoss (đổi miễn phí, ưu tiên mọi thứ).
- Hành lý: Promo 7kg xách tay; Eco 23kg ký gửi; SkyBoss 32kg ký gửi.
- Chọn ghế: hàng 1-2 là VIP phụ thu $45, còn lại phụ thu $15.
- CloudMiles: chương trình tích dặm thành viên, đăng ký miễn phí.

DANH SÁCH CHUYẾN BAY HIỆN CÓ:
{$flightsSummary}

VÉ CỦA KHÁCH ĐANG CHAT (nếu đã đăng nhập):
{$myBookingsSummary}
PROMPT;

        $messages = [];
        foreach (array_slice($history, -6) as $h) {
            $role = ($h['sender'] ?? '') === 'user' ? 'user' : 'assistant';
            if (!empty($h['text'])) {
                $messages[] = ['role' => $role, 'content' => (string) $h['text']];
            }
        }
        $messages[] = ['role' => 'user', 'content' => $message];

        $ch = curl_init('https://api.anthropic.com/v1/messages');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'x-api-key: ' . ANTHROPIC_API_KEY,
                'anthropic-version: 2023-06-01',
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'model' => 'claude-3-5-haiku-20241022',
                'max_tokens' => 300,
                'system' => $systemPrompt,
                'messages' => $messages,
            ]),
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || $httpCode !== 200) {
            error_log("[chatbot] Claude API lỗi (HTTP $httpCode): " . substr((string)$response, 0, 300));
            return null;
        }

        $data = json_decode($response, true);
        $text = $data['content'][0]['text'] ?? null;
        return $text !== null ? trim($text) : null;
    } catch (Exception $e) {
        error_log('[chatbot] Exception khi gọi Claude API: ' . $e->getMessage());
        return null;
    }
}

// ============================================================================
// BỘ TRẢ LỜI FALLBACK THÔNG MINH — nhận diện được câu hỏi liên quan tới DỮ
// LIỆU THẬT (chuyến bay, vé của khách) trước khi rơi về trả lời theo từ khoá.
// ============================================================================
function generate_smart_fallback_reply(string $message, array $context): string {
    $text = mb_strtolower($message, 'UTF-8');

    // --- 1) Hỏi về VÉ CỦA CHÍNH MÌNH ---
    if (preg_match('/(vé|ve) của (tôi|toi|mình|minh)|chuyến bay của (tôi|toi)|tôi đã đặt|toi da dat/u', $text)) {
        if (empty($_SESSION['user_id'])) {
            return 'Bạn cần đăng nhập để mình xem được vé nhé! Nếu đặt vé khách lẻ (không tài khoản), bạn dùng mục "Tra cứu vé" ở màn đăng nhập (nhập Mã đặt chỗ + Họ tên) là xem được ngay 📋';
        }
        if (empty($context['myBookings'])) {
            return 'Mình kiểm tra rồi, bạn hiện chưa có vé nào trong hệ thống cả. Đặt chuyến đầu tiên ngay tại mục "Đặt Vé Bay" nhé! ✈️';
        }
        $lines = array_map(function ($b) {
            $statusVN = $b['status'] === 'Cancelled' ? 'Đã hủy' : 'Đang giữ chỗ';
            return "• {$b['flight_number']} ({$b['origin']} → {$b['destination']}) ngày {$b['departure_date']}, hạng {$b['cabin_class']}, {$statusVN}, mã {$b['booking_code']}";
        }, array_slice($context['myBookings'], 0, 5));
        return "Bạn đang có " . count($context['myBookings']) . " vé trong hệ thống:\n" . implode("\n", $lines) . "\n\nXem đầy đủ chi tiết tại Sảnh Chung nhé!";
    }

    // --- 2) Hỏi tra cứu 1 MÃ CHUYẾN BAY cụ thể (VD: "CA101 còn chỗ không") ---
    if (preg_match('/\b(CA\d{3})\b/i', $message, $m)) {
        $code = strtoupper($m[1]);
        foreach ($context['flights'] as $f) {
            if ($f['flight_number'] === $code) {
                $statusVN = $f['status'] === 'Scheduled' ? 'đang vận hành bình thường' : ($f['status'] === 'Delayed' ? 'đang bị hoãn' : 'đã bị hủy');
                return "Chuyến {$code}: {$f['origin']} → {$f['destination']}, khởi hành {$f['departure_time']}, hiện {$statusVN}. Giá từ \${$f['price_promo']} (Promo) tới \${$f['price_skyboss']} (SkyBoss).";
            }
        }
        return "Mình không tìm thấy chuyến bay mã {$code} trong hệ thống. Bạn kiểm tra lại mã chuyến hoặc xem toàn bộ lịch bay ở mục \"Đặt Vé Bay\" nhé!";
    }

    // --- 3) Hỏi có CHUYẾN BAY ĐI 1 THÀNH PHỐ nào đó không ---
    $cities = ['new york' => 'New York', 'jfk' => 'New York', 'đà nẵng' => 'Da Nang', 'da nang' => 'Da Nang', 'dad' => 'Da Nang',
               'london' => 'London', 'lhr' => 'London', 'paris' => 'Paris', 'cdg' => 'Paris', 'tokyo' => 'Tokyo', 'hnd' => 'Tokyo'];
    if (preg_match('/(đi|toi?|đến|den)\s+([a-zàáạảãâầấậẩẫăằắặẳẵ\s]+)|chuyến bay.*(đi|đến)/ui', $text)) {
        foreach ($cities as $keyword => $cityName) {
            if (mb_strpos($text, $keyword) !== false) {
                $matches = array_filter($context['flights'], fn($f) => mb_strpos($f['destination'], $cityName) !== false && $f['status'] !== 'Cancelled');
                if (empty($matches)) {
                    return "Hiện Cloud Airline chưa có chuyến bay thẳng tới {$cityName}. Bạn xem toàn bộ tuyến đang khai thác ở mục \"Đặt Vé Bay\" nhé!";
                }
                $lines = array_map(fn($f) => "• {$f['flight_number']} từ {$f['origin']}, khởi hành {$f['departure_time']}, giá từ \${$f['price_promo']}", array_slice($matches, 0, 4));
                return "Cloud Airline có " . count($matches) . " chuyến bay tới {$cityName}:\n" . implode("\n", $lines);
            }
        }
    }

    // --- 4) Trả lời theo từ khoá chính sách chung (mở rộng hơn bản cũ) ---
    $RULES = [
        [['hành lý', 'ky gui', 'xách tay', 'baggage'], 'Về hành lý: Promo chỉ có xách tay 7kg, Eco miễn cước 23kg ký gửi, SkyBoss miễn cước 32kg. Bạn có thể mua thêm hành lý ở bước "Tiện Ích" khi đặt vé nha!'],
        [['hủy', 'huỷ', 'hoàn vé', 'hoàn tiền'], 'Bạn có thể hủy vé trực tiếp tại Sảnh Chung → mục "Danh Sách Vé Đã Đặt", bấm "Hủy chuyến bay". Vé Eco/SkyBoss được hoàn tiền vào ví sandbox ngay lập tức. Vé Promo hiện không hỗ trợ hủy/hoàn.'],
        [['đổi vé', 'đổi chuyến', 'doi ve', 'đổi ngày', 'đổi lịch'], 'Hạng SkyBoss được đổi chuyến miễn phí, hạng Eco áp dụng phụ phí đổi vé $50, hạng Promo hiện chưa hỗ trợ đổi chuyến. Bạn đổi vé tại Sảnh Chung → nút "Đổi vé" trên vé đã đặt.'],
        [['ghế', 'seat', 'chỗ ngồi'], 'Bạn chọn ghế trực quan ngay trong sơ đồ máy bay ở bước "Chọn Ghế" khi đặt vé. Hàng 1-2 là khu VIP (phụ thu $45); ghế thường phụ thu $15.'],
        [['giá', 'gia ve', 'bao nhiêu tiền', 'tiền vé'], 'Giá vé thay đổi theo hạng (Promo/Eco/SkyBoss) và theo từng chuyến — bạn so sánh đầy đủ giá & quyền lợi ngay trong trang kết quả tìm chuyến bay, hoặc hỏi mình "có chuyến bay đi [thành phố] không" để xem giá cụ thể!'],
        [['thanh toán', 'payment', 'trả tiền', 'thẻ'], 'Cloud Airline hỗ trợ thanh toán bằng thẻ Visa/Mastercard/Amex ngay trên website (môi trường sandbox demo cho mục đích học tập).'],
        [['check-in', 'checkin', 'làm thủ tục'], 'Bạn có thể làm thủ tục trực tuyến (mở trước 24h), tại kiosk sân bay, hoặc tại quầy truyền thống (mở 2-3h trước giờ bay).'],
        [['cloudmiles', 'dặm', 'tích điểm', 'thành viên'], 'CloudMiles là chương trình khách hàng thân thiết — tích dặm mỗi khi bay để đổi vé thưởng, nâng hạng và nhiều ưu đãi độc quyền. Đăng ký miễn phí ngay khi tạo tài khoản!'],
        [['admin', 'quản trị'], 'Mình chỉ hỗ trợ thông tin cho hành khách thôi nha — bạn vui lòng liên hệ bộ phận kỹ thuật nếu cần quyền quản trị hệ thống 😊'],
        [['cảm ơn', 'thanks', 'thank you'], 'Không có gì đâu, rất vui được hỗ trợ bạn! Cần gì thêm cứ nhắn mình nhé 💙'],
        [['chào', 'hello', 'hi ', 'xin chào'], 'Chào bạn! Mình có thể giúp gì về chuyến bay, hành lý, hoàn/đổi vé, chọn ghế hoặc chương trình CloudMiles không? Bạn cũng có thể hỏi mình "vé của tôi" hoặc "có chuyến bay đi Tokyo không" nữa đó!'],
    ];

    foreach ($RULES as [$keywords, $reply]) {
        foreach ($keywords as $k) {
            if (mb_strpos($text, $k) !== false) {
                return $reply;
            }
        }
    }

    return 'Cảm ơn câu hỏi của bạn! Mình có thể trả lời về: hành lý, hủy/đổi vé, chọn ghế, thanh toán, CloudMiles, hoặc tra cứu trực tiếp "vé của tôi" / "có chuyến bay đi [thành phố] không" / mã chuyến (VD: CA101). Bạn thử hỏi lại theo hướng đó xem sao nhé! 🙏';
}
