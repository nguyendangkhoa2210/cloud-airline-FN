-- ============================================================================
-- MIGRATION: rate_limits (chống brute-force) + audit_log (lịch sử thao tác admin)
-- Chạy SAU database_mysql.sql và migration_seat_holds.sql.
-- ============================================================================
USE cloud_airline_db;

CREATE TABLE IF NOT EXISTS rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,           -- 'login' | 'register' | 'lookup_booking' | 'cancel_guest' ...
    identifier VARCHAR(191) NOT NULL,      -- thường là địa chỉ IP (đôi khi ghép thêm email)
    attempt_count INT NOT NULL DEFAULT 1,
    first_attempt_at DATETIME NOT NULL,
    locked_until DATETIME NULL,
    UNIQUE KEY uniq_action_identifier (action, identifier)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NULL,
    admin_name VARCHAR(100) NULL,
    action VARCHAR(100) NOT NULL,          -- 'change_flight_status' | 'admin_cancel_booking' ...
    target VARCHAR(100) NULL,              -- vd: mã chuyến bay / mã vé bị tác động
    details TEXT NULL,
    ip_address VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
