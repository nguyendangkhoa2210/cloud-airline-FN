
USE cloud_airline_db;

INSERT INTO flights (flight_number, origin, destination, departure_time, arrival_time, duration, price_skyboss, price_eco, price_promo, status, aircraft, baggage, emissions) VALUES
-- Thêm khung giờ cho tuyến JFK <-> LHR (đã có CA101, CA105, CA102)
('CA103', 'New York (JFK)', 'London (LHR)', '7:30 PM', '6:30 AM (+1)', '7h 00m', 2800.00, 1000.00, 600.00, 'Scheduled', 'Boeing 787-9 Dreamliner', '25kg free checked + 7kg carry-on', '-20% CO2 reduction certified'),
('CA107', 'New York (JFK)', 'London (LHR)', '6:00 AM', '5:00 PM', '7h 00m', 2400.00, 900.00, 500.00, 'Scheduled', 'Boeing 787-9 Dreamliner', '25kg free checked + 7kg carry-on', '-20% CO2 reduction certified'),
('CA104', 'London (LHR)', 'New York (JFK)', '8:00 PM', '11:00 PM', '7h 45m', 2700.00, 1000.00, 600.00, 'Scheduled', 'Boeing 787-9 Dreamliner', '25kg free checked + 7kg carry-on', '-20% CO2 reduction certified'),
('CA108', 'London (LHR)', 'New York (JFK)', '6:45 AM', '9:30 AM', '7h 45m', 2450.00, 920.00, 520.00, 'Scheduled', 'Boeing 787-9 Dreamliner', '25kg free checked + 7kg carry-on', '-20% CO2 reduction certified'),

-- Thêm khung giờ cho tuyến JFK <-> DAD (đã có CA203, CA209)
('CA205', 'New York (JFK)', 'Da Nang (DAD)', '11:45 PM', '10:45 PM (+2)', '18h 30m', 5600.00, 1950.00, 1300.00, 'Scheduled', 'Airbus A350-900 XWB', '30kg free checked + 7kg carry-on', '-15% CO2 reduction certified'),
('CA207', 'New York (JFK)', 'Da Nang (DAD)', '2:30 PM', '1:30 PM (+1)', '17h 45m', 5250.00, 1800.00, 1150.00, 'Scheduled', 'Airbus A350-900 XWB', '30kg free checked + 7kg carry-on', '-15% CO2 reduction certified'),
('CA211', 'Da Nang (DAD)', 'New York (JFK)', '11:00 PM', '5:30 AM (+1)', '18h 15m', 5300.00, 1800.00, 1150.00, 'Scheduled', 'Airbus A350-900 XWB', '30kg free checked + 7kg carry-on', '-15% CO2 reduction certified'),
('CA213', 'Da Nang (DAD)', 'New York (JFK)', '7:00 AM', '1:30 PM', '18h 15m', 4950.00, 1700.00, 1050.00, 'Scheduled', 'Airbus A350-900 XWB', '30kg free checked + 7kg carry-on', '-15% CO2 reduction certified'),

-- Tuyến MỚI: New York (JFK) <-> Paris (CDG)
('CA301', 'New York (JFK)', 'Paris (CDG)', '8:00 AM', '9:15 PM', '7h 15m', 2650.00, 1000.00, 600.00, 'Scheduled', 'Boeing 787-9 Dreamliner', '25kg free checked + 7kg carry-on', '-20% CO2 reduction certified'),
('CA303', 'New York (JFK)', 'Paris (CDG)', '9:30 PM', '10:45 AM (+1)', '7h 15m', 2450.00, 930.00, 560.00, 'Scheduled', 'Boeing 787-9 Dreamliner', '25kg free checked + 7kg carry-on', '-20% CO2 reduction certified'),
('CA302', 'Paris (CDG)', 'New York (JFK)', '11:00 AM', '1:45 PM', '7h 45m', 2700.00, 1020.00, 610.00, 'Scheduled', 'Boeing 787-9 Dreamliner', '25kg free checked + 7kg carry-on', '-20% CO2 reduction certified'),
('CA304', 'Paris (CDG)', 'New York (JFK)', '6:15 PM', '9:00 PM', '7h 45m', 2500.00, 950.00, 570.00, 'Scheduled', 'Boeing 787-9 Dreamliner', '25kg free checked + 7kg carry-on', '-20% CO2 reduction certified'),

-- Tuyến MỚI: New York (JFK) <-> Tokyo (HND)
('CA401', 'New York (JFK)', 'Tokyo (HND)', '12:30 PM', '4:15 PM (+1)', '14h 45m', 5900.00, 2100.00, 1400.00, 'Scheduled', 'Airbus A350-900 XWB', '30kg free checked + 7kg carry-on', '-15% CO2 reduction certified'),
('CA403', 'New York (JFK)', 'Tokyo (HND)', '11:00 PM', '2:45 AM (+2)', '14h 45m', 5600.00, 1980.00, 1300.00, 'Scheduled', 'Airbus A350-900 XWB', '30kg free checked + 7kg carry-on', '-15% CO2 reduction certified'),
('CA402', 'Tokyo (HND)', 'New York (JFK)', '5:30 PM', '3:15 PM', '12h 45m', 5750.00, 2050.00, 1350.00, 'Scheduled', 'Airbus A350-900 XWB', '30kg free checked + 7kg carry-on', '-15% CO2 reduction certified'),
('CA404', 'Tokyo (HND)', 'New York (JFK)', '10:15 AM', '8:00 AM', '12h 45m', 5500.00, 1930.00, 1250.00, 'Scheduled', 'Airbus A350-900 XWB', '30kg free checked + 7kg carry-on', '-15% CO2 reduction certified'),

-- Tuyến MỚI: Da Nang (DAD) <-> London (LHR) — kết nối thêm ngoài trục JFK
('CA501', 'Da Nang (DAD)', 'London (LHR)', '1:00 AM', '7:30 AM (+1)', '16h 30m', 5800.00, 2050.00, 1350.00, 'Scheduled', 'Airbus A350-900 XWB', '30kg free checked + 7kg carry-on', '-15% CO2 reduction certified'),
('CA502', 'London (LHR)', 'Da Nang (DAD)', '10:00 PM', '6:30 PM (+1)', '16h 30m', 5850.00, 2080.00, 1370.00, 'Scheduled', 'Airbus A350-900 XWB', '30kg free checked + 7kg carry-on', '-15% CO2 reduction certified');
