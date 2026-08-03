set -e
BASE_URL="http://localhost/cloud-airline-FN/php_mysql_export/api"
COOKIE_JAR=$(mktemp)
PASS=0
FAIL=0

pass() { echo "✅ PASS: $1"; PASS=$((PASS+1)); }
fail() { echo "🔴 FAIL: $1"; FAIL=$((FAIL+1)); }

get_field() { php -r 'echo json_decode(file_get_contents("php://stdin"),true)["'"$1"'"] ?? "";'; }

echo "== Lấy CSRF token =="
TOKEN=$(curl -s -c "$COOKIE_JAR" "$BASE_URL/session.php" | get_field csrfToken)
[ -n "$TOKEN" ] && pass "Lấy được CSRF token" || fail "Không lấy được CSRF token"

echo "== Test 1: book.php từ chối khi KHÔNG có CSRF token =="
RESP=$(curl -s "$BASE_URL/book.php" -H "Content-Type: application/json" \
  -d '{"tripType":"OneWay","outboundFlightId":2,"cabinClass":"Eco","departureDate":"2026-09-15","passengers":[{"fullName":"X","passportId":"P1","seatNumber":"A1"}],"addons":[]}')
echo "$RESP" | grep -q '"success":false' && pass "book.php chặn request thiếu CSRF" || fail "book.php KHÔNG chặn thiếu CSRF!"

echo "== Test 2: Đặt vé hợp lệ + cố tình gửi giá giả =="
RESP=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/book.php" -H "Content-Type: application/json" -H "X-CSRF-Token: $TOKEN" \
  -d '{"tripType":"OneWay","outboundFlightId":2,"cabinClass":"Eco","departureDate":"2026-09-15","totalPrice":1,"passengers":[{"fullName":"Auto Test","passportId":"AT001","seatNumber":"B9"}],"addons":[]}')
CODE=$(echo "$RESP" | get_field bookingCode)
if [ -n "$CODE" ]; then pass "Đặt vé thành công, mã: $CODE"; else fail "Đặt vé thất bại: $RESP"; fi

echo "== Test 3: Đặt trùng ghế B9 (vừa đặt ở Test 2) -> phải bị từ chối =="
RESP=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/book.php" -H "Content-Type: application/json" -H "X-CSRF-Token: $TOKEN" \
  -d '{"tripType":"OneWay","outboundFlightId":2,"cabinClass":"Eco","departureDate":"2026-09-15","passengers":[{"fullName":"Ke Trom","passportId":"AT002","seatNumber":"B9"}],"addons":[]}')
echo "$RESP" | grep -q '"success":false' && pass "Chặn double-booking ghế B9" || fail "KHÔNG chặn double-booking!"

echo "== Test 4: Tra cứu vé (PNR lookup) đúng họ tên =="
RESP=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/lookup_booking.php" -H "Content-Type: application/json" -H "X-CSRF-Token: $TOKEN" \
  -d "{\"bookingCode\":\"$CODE\",\"fullName\":\"auto test\"}")
echo "$RESP" | grep -q '"success":true' && pass "Tra cứu vé đúng thông tin" || fail "Tra cứu vé lỗi: $RESP"

echo "== Test 5: Rate limit — sai mật khẩu 6 lần liên tiếp -> lần 6 phải bị khoá =="
for i in 1 2 3 4 5 6; do
  RESP=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/login.php" -H "Content-Type: application/json" -H "X-CSRF-Token: $TOKEN" \
    -d '{"email":"khong-ton-tai@test.com","password":"sai"}')
done
echo "$RESP" | grep -qi "quá nhiều\|khoá\|khóa\|429" && pass "Rate limit login hoạt động (khoá sau 5 lần)" || fail "Rate limit KHÔNG hoạt động: $RESP"

echo
echo "============================================"
echo "KẾT QUẢ: $PASS PASS / $FAIL FAIL"
echo "============================================"
rm -f "$COOKIE_JAR"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
