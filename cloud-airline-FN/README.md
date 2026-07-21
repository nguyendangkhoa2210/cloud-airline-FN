\# Cloud Airline ✈️



Website đặt vé máy bay — đồ án cuối kỳ môn \*\*Công Nghệ Phần Mềm\*\*.



\- \*\*Frontend\*\*: HTML / CSS / JavaScript thuần — không cần Node.js, không cần

&#x20; build step. Mở thẳng bằng Apache là chạy được.

\- \*\*Backend\*\*: PHP (PDO) kết nối \*\*SQL Server\*\* — quản lý CSDL bằng SQL Server

&#x20; Management Studio (SSMS).



> Lưu ý: dự án này \*\*không dùng\*\* React/Vite/TypeScript/Gemini API. Nếu bạn

> thấy các file như `package.json`, `tsconfig.json`, `vite.config.ts` trong

> thư mục — đó là khung dựng sẵn còn sót lại từ AI Studio và \*\*có thể xoá an

> toàn\*\*, không ảnh hưởng gì tới website.



\## Cấu trúc thư mục



```

index.html                 Trang chính (mọi luồng: đăng nhập, tìm vé, đặt vé, admin...)

assets/

&#x20; app.js                   Toàn bộ logic giao diện + gọi API

&#x20; style.css                Toàn bộ style

php\_mysql\_export/

&#x20; config.php               Kết nối PDO tới SQL Server

&#x20; database.sql             Schema + dữ liệu mẫu (chạy trong SSMS)

&#x20; README.txt               Hướng dẫn cài đặt backend ĐẦY ĐỦ (đọc file này!)

&#x20; api/                     Các endpoint PHP (đăng nhập, đặt vé, hủy vé, admin...)

```



\## Chạy thử nhanh



1\. Làm theo \*\*`php\_mysql\_export/README.txt`\*\* để tạo CSDL trong SSMS, bật SQL

&#x20;  Server Authentication, cài driver `pdo\_sqlsrv` cho PHP, và copy toàn bộ

&#x20;  project vào `C:\\xampp\\htdocs\\`.

2\. Mở XAMPP Control Panel, Start \*\*Apache\*\* (không cần MySQL — CSDL là SQL

&#x20;  Server cài riêng).

3\. Truy cập `http://localhost/<tên-thư-mục-project>/index.html`.



Nếu chưa kết nối được SQL Server (thiếu driver, sai mật khẩu...), web vẫn

chạy được bình thường bằng dữ liệu mẫu có sẵn trong `assets/app.js` — sẽ có

cảnh báo nhỏ trong Console (F12) báo cho bạn biết khi việc này xảy ra.

