-- ============================================================================
-- MIGRATION: Thêm bảng seat_holds (khóa ghế tạm thời khi đang chọn ghế/thanh toán)
-- Chạy file này SAU khi đã chạy database_mysql.sql (không cần chạy lại toàn bộ schema).
-- Mục đích: tránh 2 khách cùng chọn 1 ghế trong lúc đang điền form / chờ thanh toán,
-- trước khi booking thật sự được ghi vào bảng "bookings".
-- ============================================================================
USE cloud_airline_db;

CREATE TABLE IF NOT EXISTS seat_holds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    hold_token VARCHAR(128) NOT NULL,   -- session_id() của người đang giữ ghế
    expires_at DATETIME NOT NULL,       -- hết hạn giữ ghế (mặc định 5 phút kể từ lúc chọn)
    UNIQUE KEY uniq_flight_seat (flight_id, seat_number),
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
