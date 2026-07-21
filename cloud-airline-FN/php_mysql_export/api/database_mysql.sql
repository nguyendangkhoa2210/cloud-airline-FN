CREATE DATABASE IF NOT EXISTS cloud_airline_db
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE cloud_airline_db;

-- Xóa bảng nếu đã tồn tại (theo thứ tự khóa ngoại từ con đến cha)
DROP TABLE IF EXISTS booking_addons;
DROP TABLE IF EXISTS booking_passengers;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS flights;
DROP TABLE IF EXISTS users;

-- 1. USERS
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. FLIGHTS
CREATE TABLE flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_number VARCHAR(20) NOT NULL UNIQUE,
    origin VARCHAR(50) NOT NULL,
    destination VARCHAR(50) NOT NULL,
    departure_time VARCHAR(20) NOT NULL,
    arrival_time VARCHAR(20) NOT NULL,
    duration VARCHAR(20) NOT NULL,
    price_skyboss DECIMAL(10,2) NOT NULL,
    price_eco DECIMAL(10,2) NOT NULL,
    price_promo DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Delayed', 'Cancelled')),
    aircraft VARCHAR(100) NOT NULL,
    baggage VARCHAR(100) NOT NULL,
    emissions VARCHAR(100) NOT NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. BOOKINGS
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(20) NOT NULL UNIQUE,
    user_id INT NULL,
    trip_type VARCHAR(20) NOT NULL DEFAULT 'OneWay' CHECK (trip_type IN ('OneWay', 'RoundTrip')),
    outbound_flight_id INT NOT NULL,
    return_flight_id INT NULL,
    departure_date DATE NOT NULL,
    return_date DATE NULL,
    cabin_class VARCHAR(20) NOT NULL CHECK (cabin_class IN ('Promo', 'Eco', 'SkyBoss')),
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (outbound_flight_id) REFERENCES flights(id),
    FOREIGN KEY (return_flight_id) REFERENCES flights(id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. BOOKING_PASSENGERS
CREATE TABLE booking_passengers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    passport_number VARCHAR(30) NOT NULL,
    nationality VARCHAR(50) DEFAULT 'Việt Nam',
    age INT NULL,
    email VARCHAR(100) NULL,
    seat_number VARCHAR(10) NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. BOOKING_ADDONS
CREATE TABLE booking_addons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO users (email, password, full_name, role) VALUES
('admin@cloudairline.com', '$2b$10$Ao7xpJ0e04LP7nRPlzL9su1.jmdiJX7StcnkD1r1Tq6g3iywzlGyC', 'Quản Trị Viên Hệ Thống', 'admin'),
('test@user.com', '$2b$10$n8z4XWotU84SVBiHo1pNz.Y7XOPhrhce78rc4Vd.hQBO68LDnbw52', 'Nguyễn Đăng Khoa', 'user');

INSERT INTO flights (flight_number, origin, destination, departure_time, arrival_time, duration, price_skyboss, price_eco, price_promo, status, aircraft, baggage, emissions) VALUES
('CA203', 'New York (JFK)', 'Da Nang (DAD)', '10:00 AM', '9:00 PM (+1)', '18h 00m', 5400.00, 1850.00, 1200.00, 'Scheduled', 'Airbus A350-900 XWB', '30kg free checked + 7kg carry-on', '-15% CO2 reduction certified'),
('CA101', 'New York (JFK)', 'London (LHR)', '10:00 AM', '9:00 PM', '7h 00m', 2500.00, 950.00, 550.00, 'Scheduled', 'Boeing 787-9 Dreamliner', '25kg free checked + 7kg carry-on', '-20% CO2 reduction certified'),
('CA105', 'New York (JFK)', 'London (LHR)', '4:00 PM', '3:00 AM (+1)', '7h 00m', 3200.00, 1100.00, 650.00, 'Scheduled', 'Boeing 787-9 Dreamliner', '25kg free checked + 7kg carry-on', '-20% CO2 reduction certified'),
('CA209', 'Da Nang (DAD)', 'New York (JFK)', '09:15 AM', '03:45 PM', '18h 30m', 5100.00, 1750.00, 1100.00, 'Scheduled', 'Airbus A350-900 XWB', '30kg free checked + 7kg carry-on', '-15% CO2 reduction certified'),
('CA102', 'London (LHR)', 'New York (JFK)', '11:30 AM', '2:15 PM', '7h 45m', 2600.00, 980.00, 580.00, 'Scheduled', 'Boeing 787-9 Dreamliner', '25kg free checked + 7kg carry-on', '-20% CO2 reduction certified');

INSERT INTO bookings (booking_code, user_id, trip_type, outbound_flight_id, return_flight_id, departure_date, return_date, cabin_class, total_price, status) VALUES
('CH-849204', 2, 'OneWay', 2, NULL, '2026-09-15', NULL, 'SkyBoss', 5045.00, 'Confirmed');

INSERT INTO booking_passengers (booking_id, full_name, passport_number, nationality, age, email, seat_number) VALUES
(1, 'NGUYEN DANG KHOA', 'B12345678', 'Việt Nam', 21, 'nguyendangkhoa28lhk@gmail.com', 'A1'),
(1, 'TRAN THI B', 'B87654321', 'Việt Nam', 24, 'tranthib@gmail.com', 'A2');

INSERT INTO booking_addons (booking_id, name, price) VALUES
(1, 'Extra Cabin Luggage', 35.00),
(1, 'Elite Travel Safeguard', 25.00);
