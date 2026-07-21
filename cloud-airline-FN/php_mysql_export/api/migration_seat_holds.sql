
USE cloud_airline_db;

CREATE TABLE IF NOT EXISTS seat_holds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    hold_token VARCHAR(128) NOT NULL,  
    expires_at DATETIME NOT NULL, 
    UNIQUE KEY uniq_flight_seat (flight_id, seat_number),
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
