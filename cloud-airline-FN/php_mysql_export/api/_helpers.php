<?php
/**
 * Các hàm dùng chung cho toàn bộ API trong thư mục này.
 * Không dùng framework gì cả — viết tay gọn nhẹ để dễ giải thích trong báo cáo đồ án.
 */

// Trả về JSON cho frontend rồi dừng script luôn (mọi endpoint đều dùng hàm này để trả lời)
function json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Đọc body JSON mà frontend gửi lên qua fetch() (POST application/json)
function get_json_body() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// Chặn truy cập nếu chưa đăng nhập (kiểm tra session — KHÔNG tin dữ liệu từ phía client)
function require_login() {
    if (empty($_SESSION['user_id'])) {
        json_response(['success' => false, 'message' => 'Bạn cần đăng nhập trước!'], 401);
    }
}

// Chặn truy cập nếu không phải admin — dùng cho các API quản trị (cập nhật chuyến bay, xem mọi vé...)
function require_admin() {
    require_login();
    if (($_SESSION['role'] ?? '') !== 'admin') {
        json_response(['success' => false, 'message' => 'Chỉ quản trị viên mới được thực hiện hành động này!'], 403);
    }
}