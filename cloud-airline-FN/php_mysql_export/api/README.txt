CẨM NANG HƯỚNG DẪN TRIỂN KHAI DỰ ÁN CUỐI KỲ MÔN CÔNG NGHỆ PHẦN MỀM
HỆ THỐNG ĐẶT VÉ MÁY BAY "CLOUD AIRLINE" (PHP - MySQL)

1. CÁC CÔNG CỤ CẦN THIẾT:
- XAMPP hoặc WampServer (để chạy PHP, MySQL và Apache server local).
- Một trình soạn thảo mã nguồn như VS Code.
- Website này, giúp bạn xem giao diện tuyệt đẹp và trực quan hóa toàn bộ quy trình.

2. CÁC BƯỚC THIẾT LẬP CƠ SỞ DỮ LIỆU:
- Mở bảng điểu khiển XAMPP Control Panel, khởi động (Start) Module "Apache" và "MySQL".
- Truy cập vào: http://localhost/phpmyadmin/ trên trình duyệt.
- Create a new Database named "cloud_airline_db".
- Chọn tab "SQL", sao chép toàn bộ nội dung của file `database.sql` dán vào và nhấn "Go" (Chạy) để tạo bảng và nạp dữ liệu mẫu tự động.

3. TRIỂN KHAI MÃ NGUỒN PHP:
- Tạo một thư mục có tên `cloud_airline` trong thư mục htdocs của XAMPP (Thường là C:\xampp\htdocs\cloud_airline).
- Sao chép toàn bộ mã nguồn PHP được đính kèm trực tiếp tại tab "Dự án PHP-MySQL" trên trang web React này của chúng tôi.
- Mở trình duyệt và truy cập: http://localhost/cloud_airline/index.php để chạy hệ thống!

4. TÀI KHOẢN ĐĂNG NHẬP MẪU:
- Tài khoản quản trị (Admin Dashboard):
  + Email: admin@prestige.com
  + Mật khẩu: admin123 (đã mã hóa bcrypt trong Cơ sở dữ liệu)
- Tài khoản người dùng thường:
  + Email: test@user.com
  + Mật khẩu: user123 (đã mã hóa bcrypt trong Cơ sở dữ liệu)

Hệ thống đặt vé được tối ưu hóa theo quy chuẩn Công Nghệ Phần Mềm với cấu trúc Modular, bảo mật mật khẩu bằng Password Hash, phòng chống SQL Injection thông qua PDO Prepared Statement làm chuẩn mực chấm điểm cao cho bài nộp của bạn!
