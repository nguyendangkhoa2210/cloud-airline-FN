# Cloud Airline ✈️

Website đặt vé máy bay — đồ án cuối kỳ môn **Công Nghệ Phần Mềm**.

- **Frontend**: HTML / CSS / JavaScript thuần — không cần Node.js, không cần
  build step. Mở thẳng bằng Apache là chạy được.
- **Backend**: PHP (PDO, driver `mysql`) kết nối **MySQL** — quản lý CSDL bằng
  phpMyAdmin (đi kèm XAMPP) hoặc bất kỳ MySQL client nào.

> Lưu ý: dự án này **không dùng** React/Vite/TypeScript/Gemini API. Nếu bạn
> thấy các file như `package.json`, `tsconfig.json`, `vite.config.ts` trong
> thư mục — đó là khung dựng sẵn còn sót lại từ AI Studio và **có thể xoá an
> toàn**, không ảnh hưởng gì tới website. File `.gitignore` thì giữ lại nhé.

## Cấu trúc thư mục

```
index.html                 Trang chính (mọi luồng: đăng nhập, tìm vé, đặt vé, admin, CloudBot...)
assets/
  app.js                   Toàn bộ logic giao diện + gọi API
  style.css                Toàn bộ style
php_mysql_export/
  config.php               Kết nối PDO tới MySQL + cấu hình bảo mật (session, error handler, CSRF)
  logs/                    Log runtime tự sinh (email giả lập, lỗi PHP) — không commit lên Git
  api/
    database_mysql.sql         Schema gốc + dữ liệu mẫu — CHẠY ĐẦU TIÊN
    migration_seat_holds.sql   Thêm bảng giữ ghế tạm thời — chạy THỨ HAI
    migration_security.sql     Thêm bảng rate-limit + audit log — chạy THỨ BA
    migration_more_flights.sql Thêm nhiều chuyến bay/khung giờ/tuyến mới — chạy THỨ TƯ
    test_api.sh                 Script kiểm thử API tự động (xem mục "Kiểm thử")
    *.php                        Các endpoint (xem bảng bên dưới)
```

## Cài đặt (XAMPP + phpMyAdmin)

1. Bật **Apache** và **MySQL** trong XAMPP Control Panel.
2. Copy toàn bộ project vào `C:\xampp\htdocs\cloud-airline` (hoặc thư mục bất kỳ trong `htdocs`).
3. Mở `http://localhost/phpmyadmin/`, tạo database mới tên `cloud_airline_db`.
4. Vào tab **SQL**, chạy lần lượt **theo đúng thứ tự** 4 file trong `php_mysql_export/api/`:
   1. `database_mysql.sql` (bắt buộc, tạo toàn bộ bảng + dữ liệu mẫu)
   2. `migration_seat_holds.sql` (bắt buộc cho tính năng giữ ghế tạm thời)
   3. `migration_security.sql` (bắt buộc cho rate-limit + audit log)
   4. `migration_more_flights.sql` (nên chạy — thêm ~18 chuyến bay/khung giờ/tuyến mới: Paris, Tokyo)
5. Truy cập `http://localhost/cloud-airline/index.html`.

Nếu chưa kết nối được MySQL (thiếu extension, sai mật khẩu...), web vẫn chạy
được bình thường bằng dữ liệu mẫu có sẵn trong `assets/app.js` (chế độ
offline/demo) — sẽ có cảnh báo nhỏ trong Console (F12) báo cho bạn biết, còn
các tính năng cần server thật (đặt vé, đăng nhập...) sẽ không hoạt động cho
tới khi kết nối được CSDL.

### Tài khoản mẫu (đã có sẵn trong `database_mysql.sql`)

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@cloudairline.com` | `Admin@123` |
| Hội viên thường | `test@user.com` | (đã hash sẵn, xem ghi chú bên dưới) |

> Mật khẩu tài khoản `test@user.com` đã hash bằng `password_hash()` sẵn trong
> seed data, không có bản plaintext lưu lại. Nếu cần một tài khoản hội viên để
> test, cách nhanh nhất là **đăng ký tài khoản mới** qua giao diện web
> (`register.php` tự hash đúng chuẩn bcrypt).

## Danh sách API (`php_mysql_export/api/`)

| File | Method | Cần đăng nhập? | Mô tả |
|---|---|---|---|
| `flights.php` | GET | Không | Danh sách chuyến bay + giá + số ghế còn |
| `booked_seats.php` | GET | Không | Ghế đã đặt + đang bị giữ tạm của 1 chuyến |
| `session.php` | GET | Không | Trạng thái đăng nhập + cấp CSRF token |
| `register.php` | POST | Không | Đăng ký tài khoản (hash bcrypt, validate email, rate-limit) |
| `login.php` | POST | Không | Đăng nhập (rate-limit 5 lần/60s) |
| `logout.php` | POST | Không | Đăng xuất |
| `book.php` | POST | Không (guest OK) | Đặt vé — **giá tính lại 100% ở server**, chống trùng ghế |
| `change_booking.php` | POST | Có | Đổi chuyến/ngày bay theo chính sách Promo/Eco/SkyBoss, chống trùng ghế ở chuyến mới |
| `hold_seat.php` / `release_seat.php` | POST | Không | Giữ/nhả ghế tạm thời (5 phút) lúc đang chọn ghế |
| `my_bookings.php` | GET | Có | Danh sách vé của tài khoản đang đăng nhập |
| `cancel_booking.php` | POST | Có | Hủy vé (chủ vé hoặc admin) |
| `cancel_booking_guest.php` | POST | Không | Hủy vé khách lẻ (xác minh bằng Passport, rate-limit) |
| `lookup_booking.php` | POST | Không | Tra cứu chi tiết vé bằng Mã đặt chỗ + Họ tên (chỉ xem, rate-limit) |
| `chatbot.php` | POST | Không | CloudBot trả lời khách — AI thật (nếu có API key) hoặc bộ trả lời thông minh đọc dữ liệu thật (rate-limit) |
| `admin_bookings.php` / `admin_flight_status.php` | GET / POST | Admin | Quản trị vé + trạng thái chuyến bay |
| `admin_audit_log.php` | GET | Admin | Lịch sử thao tác quản trị |

## Các cơ chế bảo mật đã áp dụng

- **Mật khẩu**: hash bằng `password_hash()` (bcrypt), không bao giờ lưu plaintext.
- **Giá vé tính 100% ở server** (`book.php`, `change_booking.php`) — client gửi giá gì cũng bị bỏ qua, tự SELECT giá thật từ DB rồi tính lại toàn bộ hóa đơn (vé + phụ thu ghế + addon theo whitelist).
- **Chống trùng ghế (double-booking)** — kiểm tra đúng từng số ghế cụ thể, cả lúc đặt mới lẫn lúc đổi vé, không chỉ đếm tổng số lượng còn trống.
- **Giữ ghế tạm thời (seat hold)** — 5 phút, tránh 2 khách chọn trùng ghế trong lúc điền form.
- **CSRF token** — bắt buộc ở mọi request làm thay đổi dữ liệu, cấp qua `session.php`. Nếu token hết hạn giữa chừng, frontend (`apiPost()` trong `app.js`) **tự động lấy token mới và gửi lại 1 lần** — người dùng không bị văng ra ngoài hay mất dữ liệu đang điền dở.
- **Session sống 2 giờ** (`gc_maxlifetime`) — đủ dài cho toàn bộ luồng đặt vé nhiều bước mà không bị hết phiên giữa chừng. Riêng đồng hồ giữ chỗ 30 phút trong lúc đặt vé chỉ hủy giao dịch đang dở, KHÔNG đăng xuất tài khoản.
- **Rate limiting** — chống brute-force ở `login.php`, `register.php`, `lookup_booking.php`, `cancel_booking_guest.php`, `chatbot.php` (khóa tạm sau nhiều lần thao tác liên tiếp).
- **Session cookie**: `HttpOnly` + `SameSite=Lax` (+ `Secure` tự bật khi chạy HTTPS thật).
- **Chống XSS lưu trữ**: mọi dữ liệu từ DB (họ tên hành khách...) được escape trước khi chèn vào HTML.
- **Không lộ lỗi PHP thô**: `display_errors` tắt, lỗi chưa bắt được luôn trả về JSON gọn gàng, chi tiết ghi vào `php_mysql_export/logs/php_error_log.txt`.
- **Audit log**: mọi lần Admin đổi trạng thái chuyến bay / hủy vé thay khách đều được ghi lại (xem trong màn Admin).
- **Validate email server-side**: không chỉ dựa vào `type="email"` phía client.

## CloudBot — Trợ lý ảo AI

Nút chat nổi ở góc màn hình (`chatbot.php`) hoạt động theo 2 chế độ, **tự động
chọn, không cần cấu hình gì thêm để chạy được**:

1. **Mặc định (không cần API key)**: bộ trả lời thông minh viết bằng PHP, đọc
   thẳng dữ liệu THẬT trong Database để trả lời — nhận diện được câu hỏi kiểu
   "vé của tôi có mấy cái", "có chuyến bay đi Tokyo không", "CA301 bay giờ
   nào"... Không tốn phí, không cần internet ngoài, chạy được ngay khi nộp bài.
2. **(Tùy chọn) AI thật**: nếu bạn lấy API key tại
   [console.anthropic.com](https://console.anthropic.com/) và điền vào hằng số
   `ANTHROPIC_API_KEY` trong `config.php`, CloudBot sẽ gọi Claude để trả lời tự
   nhiên như AI thật, vẫn được "nạp" đúng dữ liệu chuyến bay/vé thật của hệ
   thống để không bịa thông tin. Nếu gọi API lỗi (hết quota, mất mạng...),
   CloudBot tự động rơi về chế độ 1 mà khách không thấy lỗi kỹ thuật nào.

Có rate-limit (20 tin nhắn / 5 phút / IP) để chống spam và bảo vệ quota API
nếu bạn có cấu hình key thật.

## Kiểm thử

Chạy `bash php_mysql_export/api/test_api.sh` (sửa biến `BASE_URL` đầu file cho
đúng đường dẫn project) để tự động kiểm tra: CSRF, giá server-side, chống
double-booking, tra cứu vé, rate-limit login. Script in ra `PASS`/`FAIL` cho
từng bước — dùng để demo "có kiểm thử" khi báo cáo đồ án.
