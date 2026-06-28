// Cloud Airline - System Core Software Client-Side Engine (Vanilla JavaScript)

// Mock flight data
const MOCK_FLIGHTS = [
  {
    id: 1,
    flightNumber: 'CA203',
    origin: 'New York (JFK)',
    destination: 'Da Nang (DAD)',
    departureTime: '10:00 AM',
    arrivalTime: '9:00 PM (+1)',
    duration: '18h 00m',
    priceSkyBoss: 5400,
    priceEco: 1850,
    pricePromo: 1200,
    status: 'Scheduled',
    aircraft: 'Airbus A350-900 XWB',
    baggage: '30kg free checked + 7kg carry-on',
    emissions: '-15% CO2 reduction certified',
    seatsLeftSkyBoss: 8,
    seatsLeftEco: 24,
    seatsLeftPromo: 24
  },
  {
    id: 2,
    flightNumber: 'CA101',
    origin: 'New York (JFK)',
    destination: 'London (LHR)',
    departureTime: '10:00 AM',
    arrivalTime: '9:00 PM',
    duration: '7h 00m',
    priceSkyBoss: 2500,
    priceEco: 950,
    pricePromo: 550,
    status: 'Scheduled',
    aircraft: 'Boeing 787-9 Dreamliner',
    baggage: '25kg free checked + 7kg carry-on',
    emissions: '-20% CO2 reduction certified',
    seatsLeftSkyBoss: 8,
    seatsLeftEco: 24,
    seatsLeftPromo: 24
  },
  {
    id: 3,
    flightNumber: 'CA105',
    origin: 'New York (JFK)',
    destination: 'London (LHR)',
    departureTime: '4:00 PM',
    arrivalTime: '3:00 AM (+1)',
    duration: '7h 00m',
    priceSkyBoss: 3200,
    priceEco: 1100,
    pricePromo: 650,
    status: 'Scheduled',
    aircraft: 'Boeing 787-9 Dreamliner',
    baggage: '25kg free checked + 7kg carry-on',
    emissions: '-20% CO2 reduction certified',
    seatsLeftSkyBoss: 8,
    seatsLeftEco: 24,
    seatsLeftPromo: 24
  },
  {
    id: 4,
    flightNumber: 'CA209',
    origin: 'Da Nang (DAD)',
    destination: 'New York (JFK)',
    departureTime: '09:15 AM',
    arrivalTime: '03:45 PM',
    duration: '18h 30m',
    priceSkyBoss: 5100,
    priceEco: 1750,
    pricePromo: 1100,
    status: 'Scheduled',
    aircraft: 'Airbus A350-900 XWB',
    baggage: '30kg free checked + 7kg carry-on',
    emissions: '-15% CO2 reduction certified',
    seatsLeftSkyBoss: 8,
    seatsLeftEco: 24,
    seatsLeftPromo: 24
  },
  {
    id: 5,
    flightNumber: 'CA102',
    origin: 'London (LHR)',
    destination: 'New York (JFK)',
    departureTime: '11:30 AM',
    arrivalTime: '2:15 PM',
    duration: '7h 45m',
    priceSkyBoss: 2600,
    priceEco: 980,
    pricePromo: 580,
    status: 'Scheduled',
    aircraft: 'Boeing 787-9 Dreamliner',
    baggage: '25kg free checked + 7kg carry-on',
    emissions: '-20% CO2 reduction certified',
    seatsLeftSkyBoss: 8,
    seatsLeftEco: 24,
    seatsLeftPromo: 24
  }
];

// Bảng so sánh hạng vé — hiển thị ngay trong danh sách kết quả tìm kiếm (renderFlightSelection)
// để khách so sánh quyền lợi từng hạng trước khi chọn, giống các trang bán vé máy bay thực tế.
const FARE_TIERS = [
  {
    key: 'Promo',
    label: 'Tiết Kiệm',
    priceField: 'pricePromo',
    seatsLeftField: 'seatsLeftPromo',
    accent: 'slate',
    perks: [
      { ok: false, text: 'Hoàn/đổi vé' },
      { ok: false, text: 'Chọn ghế trước' },
      { ok: true,  text: 'Hành lý xách tay 7kg' },
      { ok: false, text: 'Hành lý ký gửi' }
    ]
  },
  {
    key: 'Eco',
    label: 'Phổ Thông',
    priceField: 'priceEco',
    seatsLeftField: 'seatsLeftEco',
    accent: 'emerald',
    perks: [
      { ok: true,  text: 'Đổi vé (phụ phí)' },
      { ok: true,  text: 'Chọn ghế trước' },
      { ok: true,  text: 'Hành lý xách tay 7kg' },
      { ok: true,  text: 'Ký gửi 23kg' }
    ]
  },
  {
    key: 'SkyBoss',
    label: 'Thương Gia',
    priceField: 'priceSkyBoss',
    seatsLeftField: 'seatsLeftSkyBoss',
    accent: 'amber',
    perks: [
      { ok: true, text: 'Hoàn/đổi vé miễn phí' },
      { ok: true, text: 'Chọn ghế VIP miễn phí' },
      { ok: true, text: 'Phòng chờ thương gia' },
      { ok: true, text: 'Ký gửi 32kg' }
    ]
  }
];

// ============================================================================
// TÊN HIỂN THỊ HẠNG VÉ — dùng chung cho TOÀN BỘ ứng dụng (trang khách hàng:
// đặt vé / chọn ghế / vé điện tử... và trang Admin) để tên hạng vé luôn đồng
// bộ ở mọi nơi, không bị hiển thị mã thô (SkyBoss/Eco/Promo) ra giao diện.
// Mã trong DB/CSDL giữ nguyên (SkyBoss/Eco/Promo) — chỉ đổi tên LÚC HIỂN THỊ.
// ============================================================================
const CABIN_CLASS_LABELS = {
  SkyBoss: 'Thương Gia (Business)',
  Eco: 'Phổ Thông (Economy)',
  Promo: 'Tiết Kiệm (Saver)'
};

// Trả về tên hiển thị đầy đủ kèm tiếng Anh, ví dụ: "Phổ Thông (Economy)"
// Nếu gặp mã lạ không có trong bảng trên, trả về chính mã đó để không bao giờ hiển thị rỗng/undefined.
function getCabinLabel(cabinClass) {
  return CABIN_CLASS_LABELS[cabinClass] || cabinClass || '';
}
window.getCabinLabel = getCabinLabel;

// Bản rút gọn KHÔNG kèm tiếng Anh — dùng cho các chỗ không gian hẹp (badge, toast ngắn...)
// ví dụ: "Phổ Thông" thay vì "Phổ Thông (Economy)"
function getCabinLabelShort(cabinClass) {
  return getCabinLabel(cabinClass).replace(/\s*\([^)]*\)\s*$/, '');
}
window.getCabinLabelShort = getCabinLabelShort;

// ============================================================================
// MEGA MENU — điều hướng tổng quan kiểu các hãng hàng không lớn
// (Khám Phá / Mua Vé / Dịch Vụ Bổ Trợ / Hành Trình / Trải Nghiệm Bay / CloudMiles / Trợ Giúp)
// Mỗi link trỏ tới 1 "slug" trong INFO_CONTENT bên dưới — đảm bảo bấm vào luôn có nội dung,
// không có mục nào trống. "Trợ Giúp" là ngoại lệ duy nhất: mở thẳng khung chat CloudBot.
// ============================================================================
const MEGA_MENU = [
  {
    key: 'explore', label: 'Khám Phá', icon: 'compass',
    sections: [
      { title: 'Ưu Đãi', links: [
        { slug: 'promo-monthly', label: 'Ưu đãi tháng này' },
        { slug: 'promo-cloudmiles', label: 'Ưu đãi thành viên CloudMiles' },
        { slug: 'promo-senior', label: 'Ưu đãi người cao tuổi' },
        { slug: 'promo-disability', label: 'Ưu đãi người khuyết tật' },
        { slug: 'route-hn-hcm', label: 'Vé máy bay Hà Nội ➔ TP.HCM' },
        { slug: 'route-hcm-hn', label: 'Vé máy bay TP.HCM ➔ Hà Nội' },
        { slug: 'route-hcm-dad', label: 'Vé máy bay TP.HCM ➔ Đà Nẵng' },
        { slug: 'route-dad-hcm', label: 'Vé máy bay Đà Nẵng ➔ TP.HCM' }
      ]},
      { title: 'Lịch Bay & Mạng Đường Bay', links: [
        { slug: 'route-network', label: 'Mạng đường bay Cloud Airline' }
      ]}
    ]
  },
  {
    key: 'buy', label: 'Mua Vé', icon: 'ticket',
    sections: [
      { title: 'Hướng Dẫn Mua Vé & Thanh Toán', links: [
        { slug: 'guide-book-online', label: 'Hướng dẫn đặt vé máy bay online' },
        { slug: 'payment-methods', label: 'Các hình thức thanh toán' },
        { slug: 'vat-invoice', label: 'Xuất hóa đơn VAT điện tử' }
      ]},
      { title: 'Mua Vé & Quản Lý Đặt Chỗ', links: [
        { slug: 'buy-ticket', label: 'Mua vé', cta: { label: 'Đặt vé ngay', action: 'search' } },
        { slug: 'manage-booking', label: 'Quản lý đặt chỗ', cta: { label: 'Vào Sảnh chung', action: 'lobby' } },
        { slug: 'checkin-general', label: 'Làm thủ tục' },
        { slug: 'refund-cancel', label: 'Tự nguyện hoàn / đổi vé & hủy đặt chỗ' },
        { slug: 'change-flight', label: 'Tự đổi chuyến bay' }
      ]},
      { title: 'Điều Kiện Giá', links: [
        { slug: 'fare-conditions', label: 'Điều kiện giá vé' }
      ]}
    ]
  },
  {
    key: 'services', label: 'Dịch Vụ Bổ Trợ', icon: 'package-plus',
    sections: [
      { title: '', links: [
        { slug: 'extra-baggage-service', label: 'Mua thêm hành lý ký gửi' },
        { slug: 'seat-select-service', label: 'Chọn trước chỗ ngồi' },
        { slug: 'upgrade-cabin', label: 'Nâng hạng vé' },
        { slug: 'cloud-sofa', label: 'Cloud Sofa — mua thêm ghế trống' },
        { slug: 'all-services', label: 'Tất cả các dịch vụ bổ trợ' }
      ]}
    ]
  },
  {
    key: 'journey', label: 'Hành Trình', icon: 'luggage',
    sections: [
      { title: 'Hành Lý', links: [
        { slug: 'baggage-lookup', label: 'Tra cứu thông tin hành lý' },
        { slug: 'baggage-carryon', label: 'Hành lý xách tay' },
        { slug: 'baggage-free-checked', label: 'Hành lý ký gửi miễn cước' },
        { slug: 'extra-baggage-service', label: 'Mua thêm hành lý ký gửi' },
        { slug: 'baggage-special', label: 'Hành lý đặc biệt' },
        { slug: 'baggage-restricted', label: 'Hành lý hạn chế vận chuyển' },
        { slug: 'baggage-issue', label: 'Gặp vấn đề với hành lý' }
      ]},
      { title: 'Làm Thủ Tục', links: [
        { slug: 'checkin-online', label: 'Làm thủ tục trực tuyến' },
        { slug: 'checkin-kiosk', label: 'Làm thủ tục tại kiosk' },
        { slug: 'checkin-airport', label: 'Làm thủ tục tại sân bay' }
      ]}
    ]
  },
  {
    key: 'experience', label: 'Trải Nghiệm Bay', icon: 'armchair',
    sections: [
      { title: '', links: [
        { slug: 'cabin-skyboss', label: 'Hạng Thương Gia' },
        { slug: 'cabin-eco-plus', label: 'Hạng Phổ Thông' },
        { slug: 'cabin-eco', label: 'Hạng Tiết Kiệm ' },
        { slug: 'inflight-entertainment', label: 'Giải trí trên chuyến bay' },
        { slug: 'inflight-wifi', label: 'Kết nối Internet trên chuyến bay' }
      ]}
    ]
  },
  {
    key: 'cloudmiles', label: 'CloudMiles', icon: 'crown',
    sections: [
      { title: '', links: [
        { slug: 'cloudmiles-intro', label: 'Giới thiệu chương trình' },
        { slug: 'cloudmiles-tiers', label: 'Quyền lợi và tiêu chí xét hạng' },
        { slug: 'cloudmiles-account', label: 'Đăng ký và quản lý tài khoản' },
        { slug: 'cloudmiles-family', label: 'Tài khoản gia đình' },
        { slug: 'cloudmiles-news', label: 'Tin tức khuyến mãi' }
      ]},
      { title: 'Tích Lũy Dặm', links: [
        { slug: 'miles-flights', label: 'Trên các chuyến bay' },
        { slug: 'miles-bank', label: 'Chi tiêu thẻ ngân hàng' },
        { slug: 'miles-partners', label: 'Trên các đối tác khác' },
        { slug: 'miles-request', label: 'Yêu cầu cộng dặm' },
        { slug: 'miles-redeem', label: 'Tiêu và tích điểm' }
      ]}
    ]
  }
  // Mục thứ 7 "Trợ Giúp" không nằm trong danh sách này vì nó mở thẳng khung
  // chat CloudBot (xem nút riêng trong updateMegaNavBar / index.html).
];

// Nội dung đầy đủ cho từng "slug" ở trên — hiển thị trong info-modal khi bấm vào 1 mục menu.
const INFO_CONTENT = {
  'promo-monthly': { title: 'Ưu Đãi Tháng Này', body: 'Mỗi tháng Cloud Airline mở bán một loạt vé Eco & Promo giá tốt cho các đường bay nội địa và quốc tế. Săn vé vào đầu tháng để có giá tốt nhất — số lượng ghế khuyến mãi có hạn theo từng chuyến.' },
  'promo-cloudmiles': { title: 'Ưu Đãi Thành Viên CloudMiles', body: 'Hội viên CloudMiles được giảm thêm 5-15% phí dịch vụ bổ trợ (hành lý, chọn ghế, nâng hạng) tùy theo hạng thẻ Bronze/Silver/Gold/Platinum, cùng quyền ưu tiên đặt vé khuyến mãi sớm hơn 24 giờ so với khách thường.' },
  'promo-senior': { title: 'Ưu Đãi Người Cao Tuổi', body: 'Hành khách từ 60 tuổi trở lên được giảm 15% giá vé cơ bản trên hầu hết các chuyến bay nội địa, áp dụng khi xuất trình CCCD/hộ chiếu tại quầy làm thủ tục. Không áp dụng đồng thời với các chương trình giảm giá khác.' },
  'promo-disability': { title: 'Ưu Đãi Người Khuyết Tật', body: 'Cloud Airline giảm 20% giá vé cơ bản cho hành khách khuyết tật và miễn phí 1 người đi kèm hỗ trợ trên một số chặng bay nội địa. Vui lòng liên hệ CSKH trước 48 giờ để được hỗ trợ thủ tục và sắp xếp ghế phù hợp.' },
  'route-hn-hcm': { title: 'Vé Máy Bay Hà Nội ➔ TP.HCM', body: 'Chặng bay nội địa phổ biến nhất của Cloud Airline, khai thác nhiều chuyến mỗi ngày. Giá vé Promo thường khởi điểm thấp, đặt sớm 2-4 tuần trước ngày khởi hành để có mức giá tốt nhất.' },
  'route-hcm-hn': { title: 'Vé Máy Bay TP.HCM ➔ Hà Nội', body: 'Khai thác nhiều chuyến mỗi ngày, phù hợp cả khách công vụ và du lịch. Hành khách Hạng Thương Gia được làm thủ tục tại quầy riêng và ưu tiên qua an ninh.' },
  'route-hcm-dad': { title: 'Vé Máy Bay TP.HCM ➔ Đà Nẵng', body: 'Chặng bay ngắn, thời gian bay khoảng 1 giờ 20 phút. Đà Nẵng là điểm đến nghỉ dưỡng được tìm kiếm nhiều nhất trên hệ thống Cloud Airline vào mùa hè.' },
  'route-dad-hcm': { title: 'Vé Máy Bay Đà Nẵng ➔ TP.HCM', body: 'Chiều bay ngược lại của tuyến TP.HCM - Đà Nẵng, khai thác đều các ngày trong tuần với nhiều khung giờ để khách lựa chọn.' },
  'route-network': { title: 'Mạng Đường Bay Cloud Airline', body: 'Hiện tại hệ thống demo khai thác các chặng: New York (JFK) ⇄ London (LHR), New York (JFK) ⇄ Đà Nẵng (DAD). Mạng đường bay sẽ tiếp tục mở rộng khi tích hợp cơ sở dữ liệu MySQL ở giai đoạn sau của đồ án.' },

  'guide-book-online': { title: 'Hướng Dẫn Đặt Vé Máy Bay Online', body: 'Chỉ với 4 bước: (1) Chọn lộ trình và số hành khách ở trang Đặt vé bay, (2) So sánh và chọn hạng vé phù hợp, (3) Điền thông tin hành khách và chọn ghế, (4) Thanh toán để hoàn tất. Vé điện tử sẽ hiển thị ngay sau khi thanh toán thành công.' },
  'payment-methods': { title: 'Các Hình Thức Thanh Toán', body: 'Cloud Airline hỗ trợ thanh toán bằng thẻ Visa, Mastercard, American Express ngay trên website (môi trường demo/sandbox cho mục đích học tập). Ở bản triển khai thực tế có thể bổ sung thêm ví điện tử và chuyển khoản ngân hàng.' },
  'vat-invoice': { title: 'Xuất Hóa Đơn VAT Điện Tử', body: 'Sau khi thanh toán thành công, hành khách/doanh nghiệp có thể yêu cầu xuất hóa đơn giá trị gia tăng điện tử trong vòng 7 ngày kể từ ngày bay bằng cách liên hệ CSKH kèm mã đặt vé.' },
  'buy-ticket': { title: 'Mua Vé', body: 'Tìm chuyến bay theo lộ trình, so sánh hạng vé Promo/Eco/SkyBoss ngay trong kết quả tìm kiếm rồi chọn vé phù hợp nhất với nhu cầu và ngân sách của bạn.' },
  'manage-booking': { title: 'Quản Lý Đặt Chỗ', body: 'Toàn bộ vé đã đặt được lưu tại Sảnh chung — nơi bạn có thể xem chi tiết hành trình, tra cứu số ghế và huỷ vé trực tuyến chỉ với một lần bấm.' },
  'checkin-general': { title: 'Làm Thủ Tục', body: 'Cloud Airline hỗ trợ 3 hình thức làm thủ tục: trực tuyến (mở trước giờ bay 24h), tại kiosk tự phục vụ ở sân bay, hoặc tại quầy thủ tục truyền thống. Xem chi tiết từng hình thức ở mục "Hành Trình → Làm Thủ Tục".' },
  'refund-cancel': { title: 'Hoàn / Đổi Vé & Hủy Đặt Chỗ', body: 'Vé Eco & SkyBoss có thể hoàn/đổi với mức phí tùy hạng vé; vé Promo thường không hỗ trợ hoàn tiền. Bạn có thể huỷ vé trực tiếp tại Sảnh chung, hệ thống sẽ hoàn tiền vào ví sandbox ngay lập tức.' },
  'change-flight': { title: 'Tự Đổi Chuyến Bay', body: 'Hành khách Hạng SkyBoss được đổi chuyến miễn phí 1 lần trước giờ khởi hành. Hạng Eco áp dụng phụ phí đổi vé theo biểu giá. Hạng Promo không hỗ trợ đổi chuyến.' },
  'fare-conditions': { title: 'Điều Kiện Giá Vé', body: 'Mỗi hạng vé có điều kiện riêng về hoàn/đổi, hành lý và chọn ghế — xem chi tiết so sánh đầy đủ ngay trong bảng 3 cột Promo/Eco/SkyBoss tại trang kết quả tìm kiếm chuyến bay.' },

  'extra-baggage-service': { title: 'Mua Thêm Hành Lý Ký Gửi', body: 'Mua thêm 15kg hành lý ký gửi với giá $35/kiện ngay tại bước "Tiện Ích" trong luồng đặt vé — đặt trước online luôn rẻ hơn mua trực tiếp tại sân bay.' },
  'seat-select-service': { title: 'Chọn Trước Chỗ Ngồi', body: 'Chủ động chọn vị trí ghế yêu thích (gần lối đi, cạnh cửa sổ, hàng VIP phía trước) ngay trong sơ đồ ghế trực quan của Cloud Airline khi đặt vé, với mức phụ thu chỉ từ $15.' },
  'upgrade-cabin': { title: 'Nâng Hạng Vé', body: 'Nếu còn chỗ trống, hành khách Eco có thể yêu cầu nâng hạng lên SkyBoss tại sân bay với mức phí chênh lệch ưu đãi — liên hệ quầy CSKH trước giờ khởi hành ít nhất 2 giờ.' },
  'cloud-sofa': { title: 'Cloud Sofa — Mua Thêm Ghế Trống', body: 'Muốn có thêm không gian riêng tư? Cloud Sofa cho phép bạn mua luôn ghế trống bên cạnh (nếu còn) để thoải mái nằm nghỉ trên các chuyến bay đường dài.' },
  'all-services': { title: 'Tất Cả Các Dịch Vụ Bổ Trợ', body: 'Tổng hợp toàn bộ tiện ích: hành lý thêm, chọn ghế, nâng hạng, Cloud Sofa, bảo hiểm du lịch và thực đơn cao cấp — tất cả đều có thể thêm trực tiếp trong bước "Tiện Ích" khi đặt vé.' },

  'baggage-lookup': { title: 'Tra Cứu Thông Tin Hành Lý', body: 'Hạn mức hành lý được hiển thị ngay trên từng thẻ kết quả chuyến bay (mục hành lý ký gửi) và trong bảng so sánh hạng vé — không cần tra cứu ở trang riêng.' },
  'baggage-carryon': { title: 'Hành Lý Xách Tay', body: 'Mỗi hành khách được mang 1 kiện xách tay tối đa 7kg, kích thước không vượt 56×36×23cm, cộng thêm 1 túi vật dụng cá nhân nhỏ (túi xách, laptop).' },
  'baggage-free-checked': { title: 'Hành Lý Ký Gửi Miễn Cước', body: 'Hạng Promo: chỉ có hành lý xách tay. Hạng Eco: miễn cước 23kg. Hạng SkyBoss: miễn cước 32kg — chi tiết đầy đủ trong bảng so sánh hạng vé khi tìm chuyến bay.' },
  'baggage-special': { title: 'Hành Lý Đặc Biệt', body: 'Dụng cụ thể thao (golf, lặn biển), nhạc cụ cỡ lớn hoặc xe lăn được vận chuyển theo quy định riêng — vui lòng thông báo cho Cloud Airline ít nhất 24 giờ trước giờ khởi hành.' },
  'baggage-restricted': { title: 'Hành Lý Hạn Chế Vận Chuyển', body: 'Chất lỏng quá 100ml trong hành lý xách tay, pin lithium dự phòng dung lượng lớn, vật dụng sắc nhọn và hàng nguy hiểm đều bị hạn chế hoặc cấm vận chuyển theo quy định an toàn hàng không.' },
  'baggage-issue': { title: 'Gặp Vấn Đề Với Hành Lý', body: 'Hành lý bị thất lạc, hư hỏng hoặc giao trễ? Hãy liên hệ ngay quầy Hành lý tại sân bay đến trong vòng 7 ngày, hoặc nhấn nút CloudBot ở góc màn hình để được hướng dẫn nhanh.' },
  'checkin-online': { title: 'Làm Thủ Tục Trực Tuyến', body: 'Mở từ 24 giờ đến 90 phút trước giờ khởi hành. Hành khách chỉ cần xác nhận thông tin và tải thẻ lên máy bay điện tử — không cần in vé, tiết kiệm thời gian tại sân bay.' },
  'checkin-kiosk': { title: 'Làm Thủ Tục Tại Kiosk', body: 'Các kiosk tự phục vụ tại sân bay cho phép in thẻ lên máy bay và thẻ hành lý chỉ trong vài phút, mở từ 3 giờ trước giờ khởi hành cho chuyến bay nội địa.' },
  'checkin-airport': { title: 'Làm Thủ Tục Tại Sân Bay', body: 'Quầy thủ tục truyền thống mở 2-3 giờ trước giờ khởi hành (tùy chặng bay) và đóng trước giờ khởi hành 40-60 phút. Hành khách Hạng SkyBoss được phục vụ tại quầy ưu tiên riêng.' },

  'cabin-skyboss': { title: 'Hạng Thương Gia (SkyBoss)', body: 'Ghế rộng, ngả sâu, ưu tiên làm thủ tục & lên máy bay, phòng chờ thương gia, miễn cước 32kg hành lý, thực đơn cao cấp và được hoàn/đổi vé linh hoạt miễn phí.' },
  'cabin-eco-plus': { title: 'Hạng Phổ Thông Đặc Biệt', body: 'Phiên bản nâng cấp của Eco với khoang ghế hàng đầu (VIP), nhiều khoảng để chân hơn và được ưu tiên chọn chỗ ngồi miễn phí — phù hợp khách muốn thêm thoải mái với chi phí hợp lý.' },
  'cabin-eco': { title: 'Hạng Phổ Thông (Eco)', body: 'Hạng vé tiêu chuẩn với mức giá hợp lý nhất, miễn cước 23kg hành lý ký gửi, có thể đổi vé khi phát sinh phụ phí — lựa chọn phổ biến nhất của hành khách Cloud Airline.' },
  'inflight-entertainment': { title: 'Giải Trí Trên Chuyến Bay', body: 'Hệ thống màn hình giải trí cá nhân (trên các chặng đường dài) với phim, nhạc và trò chơi đa dạng, hoặc kết nối qua ứng dụng Cloud Airline ngay trên điện thoại của bạn.' },
  'inflight-wifi': { title: 'Kết Nối Internet Trên Chuyến Bay', body: 'Wi-Fi trên không khả dụng trên các chặng bay đường dài, hành khách SkyBoss được miễn phí sử dụng; hành khách Eco/Promo có thể mua thêm gói truy cập theo giờ.' },

  'cloudmiles-intro': { title: 'Giới Thiệu CloudMiles', body: 'CloudMiles là chương trình khách hàng thân thiết của Cloud Airline — tích lũy dặm bay mỗi khi di chuyển hoặc chi tiêu qua đối tác, đổi lấy vé thưởng, nâng hạng và nhiều ưu đãi độc quyền.' },
  'cloudmiles-tiers': { title: 'Quyền Lợi & Tiêu Chí Xét Hạng', body: 'CloudMiles có 4 hạng thẻ: Bronze (mặc định), Silver (từ 15.000 dặm/năm), Gold (từ 40.000 dặm/năm) và Platinum (từ 80.000 dặm/năm) — hạng càng cao, ưu đãi hành lý, phòng chờ và ưu tiên càng lớn.' },
  'cloudmiles-account': { title: 'Đăng Ký & Quản Lý Tài Khoản', body: 'Đăng ký tài khoản CloudMiles miễn phí ngay tại màn hình Đăng Ký Thành Viên — mỗi vé đặt thành công sẽ tự động cộng dặm vào tài khoản của bạn.' },
  'cloudmiles-family': { title: 'Tài Khoản Gia Đình', body: 'Liên kết tối đa 5 tài khoản CloudMiles của người thân để gộp chung dặm bay, giúp cả gia đình đổi vé thưởng nhanh hơn.' },
  'cloudmiles-news': { title: 'Tin Tức Khuyến Mãi CloudMiles', body: 'Cập nhật các chương trình nhân đôi/nhân ba dặm bay, ưu đãi đổi quà giới hạn theo mùa dành riêng cho hội viên CloudMiles.' },
  'miles-flights': { title: 'Tích Dặm Trên Các Chuyến Bay', body: 'Mỗi $1 chi tiêu cho vé Cloud Airline tương ứng với 1 dặm CloudMiles (Eco/Promo) hoặc 1.5 dặm (SkyBoss), tự động cộng vào tài khoản sau khi hoàn thành chuyến bay.' },
  'miles-bank': { title: 'Tích Dặm Qua Chi Tiêu Thẻ Ngân Hàng', body: 'Liên kết thẻ tín dụng đồng thương hiệu với CloudMiles để tích dặm trên mọi giao dịch chi tiêu hàng ngày, không chỉ riêng vé máy bay.' },
  'miles-partners': { title: 'Tích Dặm Trên Các Đối Tác Khác', body: 'Tích lũy thêm dặm khi đặt phòng khách sạn, thuê xe hoặc mua sắm tại hệ thống đối tác liên kết của Cloud Airline.' },
  'miles-request': { title: 'Yêu Cầu Cộng Dặm', body: 'Quên cập nhật số thẻ CloudMiles khi đặt vé? Gửi yêu cầu cộng dặm bổ sung trong vòng 6 tháng kể từ ngày bay kèm mã đặt vé qua CloudBot hoặc CSKH.' },
  'miles-redeem': { title: 'Tiêu Và Tích Dặm', body: 'Dùng dặm CloudMiles để đổi vé thưởng, nâng hạng ghế hoặc mua dịch vụ bổ trợ — số dặm cần thiết hiển thị ngay khi bạn chọn hình thức đổi tại trang quản lý tài khoản.' }
};

// PHP Files Content for Template Code Exporter
const PHP_FILES = {
  'database.sql': {
    desc: 'Cấu trúc Cơ sở dữ liệu MySQL thiết lập bảng Users, Flights, Bookings và Addons.',
    code: `-- Tạo cơ sở dữ liệu Cloud Airline
CREATE DATABASE IF NOT EXISTS cloud_airline_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cloud_airline_db;

-- 1. Bảng lưu thông tin tài khoản (Khách hàng & Quản trị viên)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Bảng lưu danh sách các chuyến bay
CREATE TABLE IF NOT EXISTS flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_number VARCHAR(20) NOT NULL UNIQUE,
    origin VARCHAR(50) NOT NULL,
    destination VARCHAR(50) NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    price_skyboss DECIMAL(10,2) NOT NULL,
    price_eco DECIMAL(10,2) NOT NULL,
    price_promo DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Scheduled'
) ENGINE=InnoDB;

-- 3. Bảng lưu danh sách đặt vé (Bookings)
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    flight_number VARCHAR(20) NOT NULL,
    class VARCHAR(20) NOT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    passport_number VARCHAR(30) NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Card',
    status VARCHAR(20) DEFAULT 'Confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;`
  },
  'config.php': {
    desc: 'Kết nối cơ sở dữ liệu MySQL bảo mật sử dụng thư viện PDO của PHP.',
    code: `<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'cloud_airline_db');

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    die("Lỗi kết nối CSDL: " . $e->getMessage());
}
?>`
  },
  'login.php': {
    desc: 'Đăng nhập vào hệ thống và xác thực mật khẩu an toàn sử dụng password_verify.',
    code: `<?php
require_once 'config.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email']);
    $password = trim($_POST['password']);

    if (!empty($email) && !empty($password)) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['full_name'];
            $_SESSION['user_role'] = $user['role'];
            header("Location: index.php");
            exit;
        }
    }
}
?>`
  },
  'index.php': {
    desc: 'Màn hình tìm kiếm vé máy bay (Home Search) kết xuất dữ liệu sân bay.',
    code: `<?php require_once 'config.php'; ?>
<div class="search-panel">
    <h2>Đặt chuyến bay mơ ước cùng Cloud Airline</h2>
    <form action="select_flight.php" method="GET">
        <label>Khởi hành:</label>
        <select name="origin">
            <option value="New York (JFK)">New York (JFK)</option>
        </select>
        <button type="submit">Tìm Kiếm</button>
    </form>
</div>`
  }
};

// ============================================================================
// KẾT NỐI BACKEND (PHP + SQL Server) — xem chi tiết trong php_mysql_export/
// Mọi hàm gọi API đều có try/catch: nếu chưa cài driver SQL Server / chưa
// chạy XAMPP, web vẫn dùng được bình thường nhờ dữ liệu mẫu (chế độ offline).
// ============================================================================
const API_BASE = 'php_mysql_export/api';
let isBackendOnline = false; // true sau khi gọi API thành công ít nhất 1 lần

// Vẽ badge nhỏ trên nav báo đang ở chế độ Online (đã nối SQL Server) hay Offline (dữ liệu mẫu)
function updateBackendStatusBadge() {
  const badge = document.getElementById('backend-status-badge');
  const dot = document.getElementById('backend-status-dot');
  const text = document.getElementById('backend-status-text');
  if (!badge || !dot || !text) return;

  if (isBackendOnline) {
    badge.className = 'hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] font-bold transition-all bg-emerald-50 border border-emerald-200 text-emerald-600';
    dot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse';
    text.textContent = 'SQL: Đã kết nối';
  } else {
    badge.className = 'hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] font-bold transition-all bg-red-50 border border-red-200 text-red-500';
    dot.className = 'w-1.5 h-1.5 rounded-full bg-red-500';
    text.textContent = 'SQL: Offline (dữ liệu mẫu)';
  }
}

// Global Application States
let flightsDb = [...MOCK_FLIGHTS]; // sẽ được thay bằng dữ liệu thật từ SQL Server nếu kết nối được

// Danh sách tài khoản tạm trong bộ nhớ — CHỈ dùng khi không kết nối được SQL Server
// (chế độ demo offline). Khi backend hoạt động, đăng ký/đăng nhập đi qua API thật.
let usersAccounts = [
  { email: 'khach_vip@gmail.com', fullname: 'Nguyễn Đăng Khoa', password: '123456' },
  { email: 'user@cloud.com', fullname: 'Hồng Phúc', password: 'user123' }
];

let bookingsDb = [
  {
    id: 'CH-849204',
    passengerName: 'Nguyễn Đăng Khoa',
    flightNumber: 'CA101',
    cabinClass: 'SkyBoss',
    seat: 'A1',
    totalPrice: 245,
    date: '2026-09-15',
    status: 'Confirmed'
  },
  {
    id: 'CH-492015',
    passengerName: 'Nguyễn Đăng Khoa',
    flightNumber: 'CA203',
    cabinClass: 'Eco',
    seat: 'B4',
    totalPrice: 180,
    date: '2026-09-20',
    status: 'Confirmed'
  }
];

// Tải danh sách chuyến bay thật từ SQL Server. Gọi 1 lần khi mở app; nếu đang
// đứng ở 1 màn hình cần dữ liệu chuyến bay thì vẽ lại ngay sau khi tải xong.
async function loadFlightsFromServer() {
  try {
    const res = await fetch(`${API_BASE}/flights.php`);
    const data = await res.json();
    if (data.success && Array.isArray(data.flights) && data.flights.length > 0) {
      flightsDb = data.flights;
      isBackendOnline = true;
      console.log(`✅ Đã tải ${flightsDb.length} chuyến bay từ SQL Server.`);
    } else {
      throw new Error('API trả về dữ liệu rỗng hoặc không hợp lệ');
    }
  } catch (err) {
    console.warn('⚠️ Không kết nối được SQL Server — dùng dữ liệu mẫu (MOCK_FLIGHTS). Lý do:', err.message);
    flightsDb = [...MOCK_FLIGHTS];
  }

  updateBackendStatusBadge();

  // Vẽ lại nếu người dùng đang đứng ở 1 màn hình cần dữ liệu chuyến bay
  if (['lobby', 'search', 'select_flight', 'admin'].includes(activeScreen)) {
    navigateTo(activeScreen);
  }
}

// Tải danh sách vé CỦA RIÊNG người dùng đang đăng nhập (gọi sau khi đăng nhập thành công)
async function loadMyBookingsFromServer() {
  try {
    const res = await fetch(`${API_BASE}/my_bookings.php`);
    const data = await res.json();
    if (data.success && Array.isArray(data.bookings)) {
      bookingsDb = data.bookings;
      isBackendOnline = true;
    } else {
      throw new Error('API trả về dữ liệu không hợp lệ');
    }
  } catch (err) {
    // QUAN TRỌNG: để rỗng, KHÔNG giữ lại bookingsDb cũ — tránh hiện nhầm vé của tài khoản khác
    bookingsDb = [];
    console.warn('⚠️ Không tải được vé từ SQL Server. Lý do:', err.message);
    triggerToast('⚠️ Không tải được danh sách vé từ SQL Server — kiểm tra lại kết nối backend.');
  }
  if (activeScreen === 'lobby') renderLobbyScreen();
}

// Tải TOÀN BỘ vé trong hệ thống (chỉ admin) — gọi khi vào Bảng điều khiển Admin
async function loadAdminBookingsFromServer() {
  try {
    const res = await fetch(`${API_BASE}/admin_bookings.php`);
    const data = await res.json();
    if (data.success && Array.isArray(data.bookings)) {
      bookingsDb = data.bookings;
      isBackendOnline = true;
    } else {
      throw new Error('API trả về dữ liệu không hợp lệ');
    }
  } catch (err) {
    bookingsDb = [];
    console.warn('⚠️ Không tải được danh sách vé admin từ SQL Server. Lý do:', err.message);
    triggerToast('⚠️ Không tải được danh sách vé từ SQL Server — kiểm tra lại kết nối backend.');
  }
  if (activeScreen === 'admin') renderAdminDashboard();
}

let activeScreen = 'auth'; // 'auth' | 'lobby' | 'search' | 'select_flight' | 'passenger' | 'seats' | 'extras' | 'checkout' | 'success' | 'admin' | 'php_project'

// Các màn hình thuộc luồng "đặt vé máy bay" — chỉ những màn này mới hiện
// đồng hồ đếm giờ giữ ghế (Time Left). Sảnh chung, Admin, PHP source... không cần.
const BOOKING_FLOW_SCREENS = ['search', 'select_flight', 'passenger', 'seats', 'extras', 'checkout'];
let isLoggedIn = false;
let highContrast = false;
let userFullName = '';
let userRole = 'user';
let adminUnlocked = false; // Chỉ true khi đăng nhập admin qua phím tắt nội bộ
let phpUnlocked = false; // Hidden by default, only reveal when shortcut is pressed

// Trả về một bản ghi hành khách trống — dùng khi tăng số lượng hành khách
function createBlankPassenger() {
  return { fullName: '', passportId: '', nationality: 'Việt Nam', age: '', email: '' };
}

// Trả về 1 currentBooking hoàn toàn mới (sạch) — dùng khi đăng nhập/đăng xuất hoặc bắt đầu
// đặt vé mới, để KHÔNG để sót dữ liệu của tài khoản/lượt đặt vé trước đó trong bộ nhớ.
function createFreshBooking() {
  return {
    origin: 'New York (JFK)',
    destination: 'London (LHR)',
    departureDate: '2026-09-15',
    tripType: 'OneWay',
    returnDate: '2026-09-20',
    selectingReturnLeg: false,
    cabinClass: 'Eco',
    selectedFlight: null,
    returnFlight: null,
    passengerCount: 1,
    passengers: [createBlankPassenger()],
    activePassengerIndex: 0,
    selectedSeats: [],
    selectedAddons: [],
    cardInfo: { number: '4111 2222 3333 4444', expiry: '10 / 29', cvv: '781' }
  };
}

// Booking session data
let currentBooking = createFreshBooking();

// Timer logic
let sessionTimeLeft = 600; // 10 minutes in seconds
let timerId = null;

// ============================================================================
// ĐỒNG BỘ ĐỒNG HỒ GIỮ CHỖ 30 PHÚT QUA localStorage
// Lý do dùng "deadline" (mốc thời gian tuyệt đối Date.now() + 30 phút) thay vì
// chỉ lưu "số giây còn lại": nếu lưu số giây, mỗi lần F5 lại reset gần như y
// nguyên giá trị cũ (vì code chỉ đọc 1 lần lúc load) và các tab khác sẽ không
// biết giờ đã trôi tới đâu. Lưu deadline thì bất kỳ tab/màn hình nào (Passenger
// -> Seats -> Checkout) cũng tự tính lại "còn bao nhiêu giây" bằng cách lấy
// deadline - thời điểm hiện tại, nên luôn khớp nhau tuyệt đối.
// ============================================================================
const BOOKING_DEADLINE_KEY = 'cloudAirline_bookingDeadline';

// Audio context chime fallback
function playChime(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else { // standard click/beep
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {
    console.log('Audio contextual note bypass');
  }
}

// Dialog Toast triggers
function triggerToast(text) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-notice flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#172b4c]/95 border border-[#2af598]/40 shadow-2xl text-xs font-semibold text-white pointer-events-auto transition-all';
  toast.innerHTML = `
    <span class="text-[#2af598] font-bold">✨ INFO:</span>
    <span class="tracking-wide">${text}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

// Navigation screen control dispatcher
function navigateTo(screenId) {
  playChime('click');
  activeScreen = screenId;
  updateBackendStatusBadge();
  
  // Hide all screen contents
  const screens = [
    'screen-auth', 'screen-lobby', 'screen-search', 'screen-select-flight', 
    'screen-passenger', 'screen-seats', 'screen-extras', 
    'screen-checkout', 'screen-success', 'screen-error', 'screen-guest-cancel', 'screen-admin', 'screen-php'
  ];
  
  screens.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.add('hidden');
  });

  // Display targeted screen container
  const targetEl = document.getElementById(`screen-${screenId.replace('_', '-')}`);
  if (targetEl) targetEl.classList.remove('hidden');

  // Update navbar visual links
  updateNavbar();

  // Cập nhật ngay trạng thái đồng hồ Time Left (không cần chờ interval 1s tiếp theo)
  // Không check isLoggedIn — đồng hồ giữ chỗ áp dụng cho cả khách lẻ chưa đăng nhập.
  const timerBadge = document.getElementById('timer-badge');
  if (timerBadge) {
    timerBadge.classList.toggle('hidden', !BOOKING_FLOW_SCREENS.includes(screenId));
  }

  // Draw appropriate state parameters
  if (screenId === 'lobby') renderLobbyScreen();
  if (screenId === 'search') renderSearchScreen();
  if (screenId === 'select_flight') renderFlightSelection();
  if (screenId === 'passenger') renderPassengerScreen();
  if (screenId === 'seats') renderSeatsScreen();
  if (screenId === 'extras') renderExtrasScreen();
  if (screenId === 'checkout') renderCheckoutScreen();
  if (screenId === 'admin') renderAdminDashboard();
  if (screenId === 'php_project') renderPhpTabs();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderLobbyScreen() {
  const lobbyName = document.getElementById('lobby-user-name');
  if (lobbyName) lobbyName.textContent = userFullName;

  // 1. Map flights schedules on lobby
  const schedulesTbody = document.getElementById('lobby-schedules-table-body');
  if (schedulesTbody) {
    schedulesTbody.innerHTML = flightsDb.map(f => {
      // Bug cũ: code dùng "f.basePrice" nhưng object chuyến bay không có field này
      // (chỉ có priceEco / priceSkyBoss / pricePromo) -> gây ra $undefined và $NaN.
      const ecoPrice = f.priceEco.toLocaleString();
      const skyPrice = f.priceSkyBoss.toLocaleString();
      return `
        <tr class="hover:bg-slate-50 border-b border-slate-100 transition-all text-xs text-slate-800">
          <td class="py-3 px-3 font-extrabold text-slate-900 font-mono flex items-center gap-1.5">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-sky-500"></span>${f.flightNumber}
          </td>
          <td class="py-3 px-3 font-semibold">${f.origin}</td>
          <td class="py-3 px-3 font-semibold">${f.destination}</td>
          <td class="py-3 px-3 text-[11px] text-slate-500 font-mono font-bold">${f.departureDate || '2026-09-15'} • ${f.departureTime || '08:00'}</td>
          <td class="py-3 px-3 text-emerald-600 font-extrabold font-mono text-sm shadow-sm">$${ecoPrice}</td>
          <td class="py-3 px-3 text-right text-sky-700 font-extrabold font-mono text-sm">$${skyPrice}</td>
        </tr>
      `;
    }).join('');
  }

  // 2. Map global airport live radar
  const liveContainer = document.getElementById('lobby-live-flights-container');
  if (liveContainer) {
    const statuses = [
      { badge: '✈️ ĐANG BAY', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', desc: 'Đang hành trình thuận lợi trên không phận kiểm soát.' },
      { badge: '🕒 ĐANG LÀM THỦ TỤC', color: 'bg-amber-50 text-amber-700 border-amber-100', desc: 'Chuẩn bị mở cửa khởi hành, thủ tục hành lý hoàn tất.' },
      { badge: '✅ ĐÃ HẠ CÁNH', color: 'bg-sky-50 text-sky-700 border-sky-100', desc: 'Hạ cánh an toàn tại phi trường ga đến.' },
      { badge: '⚠️ CHẬM CHUYẾN', color: 'bg-rose-50 text-rose-700 border-rose-100', desc: 'Trễ giờ lịch trình nhẹ do lưu lượng bão nhiệt đới.' }
    ];
    liveContainer.innerHTML = flightsDb.map((f, idx) => {
      let stObj = statuses[idx % statuses.length];
      let percent = "50%";
      if (idx % statuses.length === 0) percent = "65%";
      if (idx % statuses.length === 1) percent = "10%";
      if (idx % statuses.length === 2) percent = "100%";
      if (idx % statuses.length === 3) percent = "0%";

      if (f.status === 'Delayed' || f.status === 'DELAYED') {
        stObj = statuses[3];
        percent = "0%";
      }
      if (f.status === 'Cancelled' || f.status === 'CANCELLED') {
        stObj = { badge: '❌ ĐÃ HỦY CHUYẾN', color: 'bg-rose-100 text-rose-850 border-rose-200', desc: 'Chuyến bay đã dừng hoạt động vì lý do kỹ thuật.' };
        percent = "0%";
      }
      
      const isCancelled = f.status === 'Cancelled' || f.status === 'CANCELLED';

      return `
        <div class="bg-white border border-slate-100 rounded-[1.5rem] p-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full ${idx % 2 === 0 && !isCancelled ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}"></span>
              <span class="text-xs font-black text-slate-800 font-mono tracking-wider">${f.flightNumber}</span>
            </div>
            <span class="px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${stObj.color} font-sans uppercase tracking-wider">${stObj.badge}</span>
          </div>
          
          <div class="flex justify-between items-center my-4">
            <div>
              <strong class="block text-base text-slate-900 font-display font-black">${f.origin.split(' ')[0]}</strong>
              <span class="text-[10px] text-slate-500 font-mono font-bold">DEP: ${f.departureTime || '08:00 AM'}</span>
            </div>
            
            <div class="flex-grow mx-4 relative flex flex-col items-center">
              <div class="w-full h-1 bg-slate-100 rounded-full absolute top-[10px]">
                <div class="h-full bg-emerald-500 rounded-full" style="width: ${percent}"></div>
              </div>
              <div class="absolute -top-1.5 transition-all" style="left: ${percent}; transform: translateX(-50%);">
                <i data-lucide="plane" class="w-5 h-5 text-emerald-600 rotate-90 drop-shadow-md"></i>
              </div>
              <span class="text-[8px] text-slate-400 font-mono block mt-5">${isCancelled ? 'HỦY LỘ TRÌNH' : 'Tiến trình: ' + percent}</span>
            </div>
            
            <div class="text-right">
              <strong class="block text-base text-slate-900 font-display font-black">${f.destination.split(' ')[0]}</strong>
              <span class="text-[10px] text-slate-500 font-mono font-bold">ARR: 11:30 AM</span>
            </div>
          </div>
          
          <div class="text-[11px] text-slate-600 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 font-sans leading-relaxed">
            <span class="text-emerald-500 font-bold">💡</span>
            <span>${stObj.desc}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // 3. Render personal tickets & cancellation controls
  const historyList = document.getElementById('lobby-history-list');
  const countBadge = document.getElementById('lobby-history-count');
  if (historyList) {
    if (bookingsDb.length === 0) {
      historyList.innerHTML = `
        <div class="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-3xl bg-slate-50">
          <i data-lucide="ticket" class="w-8 h-8 text-slate-400 mb-3"></i>
          <p class="text-xs text-slate-500 font-semibold font-sans">Bạn chưa có vé máy bay đặt mua trực tuyến nào.</p>
          <button onclick="navigateTo('search')" class="mt-4 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-[#2af598] text-slate-900 font-extrabold text-[11px] rounded-xl hover:shadow-[0_4px_15px_rgba(16,185,129,0.2)] transition-all uppercase tracking-wider font-sans cursor-pointer">
            ĐẶT VÉ NGAY
          </button>
        </div>
      `;
      if (countBadge) countBadge.textContent = "0 vé";
    } else {
      let activeCount = bookingsDb.filter(b => b.status !== 'Cancelled').length;
      if (countBadge) countBadge.textContent = `${activeCount} vé hoạt động`;

      historyList.innerHTML = bookingsDb.map(b => {
        const isCancelled = b.status === 'Cancelled';
        const statusBadge = isCancelled 
          ? `<span class="px-2.5 py-1 rounded-xl text-[9px] bg-red-50 text-red-700 border border-red-100 font-extrabold uppercase font-sans tracking-wide">Đã hủy</span>` 
          : `<span class="px-2.5 py-1 rounded-xl text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold uppercase font-sans tracking-wide">CONFIRMED</span>`;
        
        return `
          <div class="bg-white border-2 ${isCancelled ? 'border-dashed border-slate-200 opacity-60' : 'border-slate-100 hover:border-emerald-500/30'} p-5 rounded-3xl transition-all duration-300 relative flex flex-col justify-between hover:shadow-md">
            <div>
              <div class="flex justify-between items-center mb-3">
                <span class="text-[10px] text-slate-500 font-black font-mono tracking-wider">VÉ: ${b.id}</span>
                ${statusBadge}
              </div>
              <div class="space-y-1.5 text-xs text-slate-700 text-left">
                <div class="flex justify-between">
                  <span class="text-slate-500">✈️ Chuyến:</span>
                  <strong class="text-slate-900 font-mono font-bold">${b.flightNumber} (${getCabinLabelShort(b.cabinClass || 'Eco')})</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">👤 Hành khách:</span>
                  <strong class="text-slate-900 font-bold">${b.passengerName}</strong>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-500">💺 Số ghế:</span>
                  <strong class="text-slate-900 font-mono font-extrabold text-xs px-2 py-0.5 bg-sky-50 rounded text-sky-700">${b.seat || 'K3'}</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">📅 Khởi hành:</span>
                  <strong class="text-slate-900 font-mono font-bold">${b.date || '2026-09-15'}</strong>
                </div>
                <div class="flex justify-between mt-3 pt-2.5 border-t border-slate-100">
                  <span class="text-slate-900 font-extrabold">Tổng hóa đơn:</span>
                  <strong class="text-emerald-600 font-black font-mono text-sm">$${b.totalPrice}</strong>
                </div>
              </div>
            </div>
            
            ${!isCancelled ? `
              <div class="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <button onclick="cancelBookingTicket('${b.id}')" class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 border border-red-100 rounded-xl transition-all text-xs font-bold font-sans flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  <span>Hủy chuyến bay</span>
                </button>
              </div>
            ` : `
              <div class="mt-4 pt-4 border-t border-slate-100 text-[10px] text-red-500 font-black uppercase text-right tracking-wider">
                Đã hoàn trả thanh toán sandbox
              </div>
            `}
          </div>
        `;
      }).reverse().join('');
    }
  }

  // Re-render lucide vector badges
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Global modal builder logic
window.showConfirmDialog = function(title, message, onConfirm) {
  const modal = document.getElementById('confirm-modal');
  const titleEl = document.getElementById('confirm-modal-title');
  const messageEl = document.getElementById('confirm-modal-message');
  const btnCancel = document.getElementById('confirm-modal-cancel');
  const btnApprove = document.getElementById('confirm-modal-approve');
  
  if (!modal || !titleEl || !messageEl || !btnCancel || !btnApprove) {
    if (confirm(message.replace(/<[^>]*>/g, ''))) {
      onConfirm();
    }
    return;
  }
  
  titleEl.textContent = title;
  messageEl.innerHTML = message;
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  
  const handleCancel = () => {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    cleanup();
  };
  
  const handleApprove = () => {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    onConfirm();
    cleanup();
  };
  
  const cleanup = () => {
    btnCancel.removeEventListener('click', handleCancel);
    btnApprove.removeEventListener('click', handleApprove);
  };
  
  btnCancel.addEventListener('click', handleCancel);
  btnApprove.addEventListener('click', handleApprove);
};

// Global cancellation trigger actions
window.cancelBookingTicket = function(bookingId) {
  const b = bookingsDb.find(item => item.id === bookingId);
  if (b) {
    showConfirmDialog(
      "XÁC NHẬN HỦY CHUYẾN BAY",
      `Bạn có thực sự chắc chắn muốn hủy đặt vé máy bay <strong>${b.flightNumber}</strong> trị giá <strong class="text-red-650">$${b.totalPrice}</strong> cho hành khách <strong>${b.passengerName}</strong>?<br><br><span class="text-xs text-slate-500">Sau khi xác nhận, ghế số <strong>${b.seat}</strong> sẽ lập tức được giải phóng trên hệ thống radar.</span>`,
      async function() {
        triggerToast('⏳ Đang xử lý hủy vé...');

        // Gọi SQL Server hủy vé TRƯỚC — chỉ cập nhật giao diện SAU KHI server xác nhận
        // thành công. Tránh tình trạng giao diện báo "đã hủy" nhưng CSDL thật chưa đổi
        // (lỗi cũ: lần đăng nhập sau sẽ tải lại dữ liệu thật và "lội ngược" về Confirmed).
        try {
          const res = await fetch(`${API_BASE}/cancel_booking.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId })
          });
          const data = await res.json();

          if (!data.success) {
            triggerToast(`❌ Không thể hủy vé: ${data.message || 'SQL Server từ chối yêu cầu.'}`);
            return;
          }
          isBackendOnline = true;
        } catch (err) {
          triggerToast('❌ Không kết nối được SQL Server — vé KHÔNG được hủy. Vui lòng kiểm tra lại XAMPP/driver rồi thử lại!');
          console.warn('⚠️ Không đồng bộ được việc hủy vé với SQL Server. Lý do:', err.message);
          return;
        }

        // Tới đây nghĩa là SQL Server đã xác nhận hủy thành công — giờ mới cập nhật giao diện
        b.status = 'Cancelled';
        triggerToast(`✅ Vé ${bookingId} đã được hủy & hoàn tiền thành công!`);
        playChime('success');
        renderLobbyScreen();
        if (activeScreen === 'admin') {
          renderAdminDashboard();
        }
      }
    );
  }
};

// Nhãn số hiệu chuyến bay — hiện cả chuyến đi & chuyến về nếu là vé Khứ hồi
function getFlightNumbersLabel() {
  if (!currentBooking.selectedFlight) return 'CA101';
  if (currentBooking.tripType === 'RoundTrip' && currentBooking.returnFlight) {
    return `${currentBooking.selectedFlight.flightNumber} (đi) / ${currentBooking.returnFlight.flightNumber} (về)`;
  }
  return currentBooking.selectedFlight.flightNumber;
}

// Nhãn lộ trình — mũi tên 2 chiều (⇄) khi Khứ hồi, 1 chiều (➔) khi Một chiều
function getRouteLabel() {
  const originCity = currentBooking.origin.split(' ')[0];
  const destCity = currentBooking.destination.split(' ')[0];
  const arrow = currentBooking.tripType === 'RoundTrip' ? '⇄' : '➔';
  return `${originCity} ${arrow} ${destCity}`;
}

function renderPassengerScreen() {
  const routeEl = document.getElementById('passenger-summary-route');
  if (routeEl) {
    routeEl.textContent = getRouteLabel();
  }
  const dateEl = document.getElementById('passenger-summary-date');
  if (dateEl) {
    dateEl.textContent = currentBooking.tripType === 'RoundTrip'
      ? `${currentBooking.departureDate} → ${currentBooking.returnDate}`
      : currentBooking.departureDate;
  }
  const flightEl = document.getElementById('passenger-summary-flight');
  if (flightEl) {
    flightEl.textContent = getFlightNumbersLabel();
  }
  const cabinEl = document.getElementById('passenger-summary-cabin');
  if (cabinEl) {
    cabinEl.textContent = getCabinLabel(currentBooking.cabinClass);
  }
  const qtyEl = document.getElementById('passenger-summary-qty');
  if (qtyEl) {
    qtyEl.textContent = `${currentBooking.passengerCount} hành khách`;
  }
  const priceEl = document.getElementById('passenger-summary-price');
  if (priceEl) {
    priceEl.textContent = `$${calculateTotalBill().toLocaleString()}`;
  }

  // Đặt vé cho nhiều người -> cần 1 tab + 1 bộ thông tin cho mỗi hành khách
  renderPassengerTabs();
  loadActivePassengerToForm();
}

// Đọc giá trị đang nhập trên form và lưu vào hành khách đang được chỉnh (theo tab)
function saveActivePassengerFromForm() {
  const p = currentBooking.passengers[currentBooking.activePassengerIndex];
  if (!p) return;
  p.fullName = document.getElementById('passenger-fullname').value.trim();
  p.passportId = document.getElementById('passenger-passport').value.trim();
  p.nationality = document.getElementById('passenger-nationality').value;
  p.age = document.getElementById('passenger-age').value;
  p.email = document.getElementById('passenger-email').value.trim();
}

// Đổ dữ liệu của hành khách đang active lên các input trong form
function loadActivePassengerToForm() {
  const p = currentBooking.passengers[currentBooking.activePassengerIndex] || createBlankPassenger();
  const elFullname = document.getElementById('passenger-fullname');
  const elPassport = document.getElementById('passenger-passport');
  const elNationality = document.getElementById('passenger-nationality');
  const elAge = document.getElementById('passenger-age');
  const elEmail = document.getElementById('passenger-email');
  if (elFullname) elFullname.value = p.fullName;
  if (elPassport) elPassport.value = p.passportId;
  if (elNationality) elNationality.value = p.nationality || 'Việt Nam';
  if (elAge) elAge.value = p.age;
  if (elEmail) elEmail.value = p.email;
}

// Chuyển qua tab hành khách khác: lưu form hiện tại trước, rồi tải dữ liệu hành khách mới lên
function switchPassengerTab(index) {
  saveActivePassengerFromForm();
  currentBooking.activePassengerIndex = index;
  loadActivePassengerToForm();
  renderPassengerTabs();
}
window.switchPassengerTab = switchPassengerTab;

// Vẽ dãy tab "Khách 1 / 2 / 3..." phía trên form — chỉ hiện khi đặt > 1 vé,
// nếu chỉ đặt 1 vé thì giữ nhãn tĩnh "Hành Khách 1" cho gọn.
function renderPassengerTabs() {
  const tabsContainer = document.getElementById('passenger-tabs');
  const singleLabel = document.getElementById('passenger-single-label');
  if (!tabsContainer) return;

  if (currentBooking.passengers.length <= 1) {
    tabsContainer.innerHTML = '';
    tabsContainer.classList.add('hidden');
    if (singleLabel) singleLabel.classList.remove('hidden');
    return;
  }

  if (singleLabel) singleLabel.classList.add('hidden');
  tabsContainer.classList.remove('hidden');
  tabsContainer.innerHTML = currentBooking.passengers.map((p, idx) => {
    const isActive = idx === currentBooking.activePassengerIndex;
    const isFilled = p.fullName && p.passportId;
    return `
      <button type="button" onclick="switchPassengerTab(${idx})" class="px-3.5 py-2 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
        isActive
          ? 'bg-emerald-500 text-white shadow-md'
          : isFilled
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
      }">
        ${isFilled ? '<i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>' : ''}
        <span>Khách ${idx + 1}</span>
      </button>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderExtrasScreen() {
  // Reset all interactive extras card visuals to unchecked first
  ['luggage', 'meal', 'insurance'].forEach(type => {
    const checkbox = document.getElementById(`addon-${type}`);
    if (checkbox) checkbox.checked = false;
    
    // Find matching card button
    const btn = document.getElementById(`btn-addon-${type}-trigger`);
    if (btn) btn.textContent = 'Thêm vào vé';
    
    // Toggle class
    if (checkbox) {
      const card = checkbox.closest('.extras-interactive-card');
      if (card) card.classList.remove('selected-addon');
    }
  });

  currentBooking.selectedAddons = [];
  updateExtrasFloatingRibbon();
}

function toggleExtrasCard(type) {
  const checkbox = document.getElementById(`addon-${type}`);
  if (!checkbox) return;
  
  checkbox.checked = !checkbox.checked;
  
  const card = checkbox.closest('.extras-interactive-card');
  const btn = document.getElementById(`btn-addon-${type}-trigger`);
  
  if (checkbox.checked) {
    if (card) card.classList.add('selected-addon');
    if (btn) btn.textContent = 'Bỏ chọn';
  } else {
    if (card) card.classList.remove('selected-addon');
    if (btn) btn.textContent = 'Thêm vào vé';
  }

  // Update backend currentBooking.selectedAddons array list directly
  currentBooking.selectedAddons = [];
  const luggageAddon = document.getElementById('addon-luggage');
  const mealAddon = document.getElementById('addon-meal');
  const insuranceAddon = document.getElementById('addon-insurance');

  if (luggageAddon && luggageAddon.checked) {
    currentBooking.selectedAddons.push({ name: 'Extra Cabin Luggage', price: 35 });
  }
  if (mealAddon && mealAddon.checked) {
    currentBooking.selectedAddons.push({ name: 'Gourmet Dining Combo', price: 15 });
  }
  if (insuranceAddon && insuranceAddon.checked) {
    currentBooking.selectedAddons.push({ name: 'Elite Travel Safeguard', price: 25 });
  }

  updateExtrasFloatingRibbon();
  if (typeof playChime === 'function') {
    playChime('click');
  }
}
window.toggleExtrasCard = toggleExtrasCard;

function updateExtrasFloatingRibbon() {
  const badge = document.getElementById('extras-floating-flight-badge');
  if (badge) {
    badge.textContent = `${currentBooking.origin.split(' ')[0].toUpperCase()}-${currentBooking.destination.split(' ')[0].toUpperCase()}`;
  }
  const count = document.getElementById('extras-floating-addons-count');
  if (count) {
    count.textContent = currentBooking.selectedAddons.length > 0
      ? currentBooking.selectedAddons.map(ad => ad.name.replace('Extra ', '').replace('Gourmet ', '').replace('Elite ', '')).join(', ')
      : 'Chưa chọn';
  }
  const total = document.getElementById('extras-floating-grand-total');
  if (total) {
    total.textContent = `$${calculateTotalBill().toLocaleString()}`;
  }
}

// Initialize layout elements
function initializeApp() {
  lucide.createIcons();
  // CHỈ khôi phục đồng hồ nếu trước đó ĐÃ CÓ deadline thật trong localStorage
  // (tức người dùng vừa F5 lại trang giữa lúc đang đặt vé). Tuyệt đối KHÔNG tự
  // tạo deadline mới ở đây — vì lúc mới mở app/chưa đăng nhập thì chưa có gì để
  // "tạm đặt vé" cả, nên chưa nên đếm giờ giữ chỗ.
  const savedDeadline = Number(localStorage.getItem(BOOKING_DEADLINE_KEY));
  if (savedDeadline && savedDeadline > Date.now()) {
    startCountdown(true);
  }
  setupActionListeners();
  renderMegaNavBar();
  loadFlightsFromServer(); // chạy nền — không cần chờ vẫn cho hiện màn đăng nhập ngay
  
  // Default launch
  navigateTo('auth');
}

// Timer management
// Tham số `resume`: true = đọc deadline cũ từ localStorage nếu còn hợp lệ (dùng khi mới load trang/F5
//                    giữa lúc đang đặt vé); false (mặc định) = LUÔN tạo deadline mới +30 phút
//                    (dùng khi vừa "tạm đặt vé" — chọn xong chuyến bay cần đặt).
function startCountdown(resume = false) {
  if (timerId) clearInterval(timerId);

  const THIRTY_MINUTES_MS = 30 * 60 * 1000;
  let needNewDeadline = true;

  if (resume) {
    // Thử khôi phục deadline đã lưu trước đó (ví dụ người dùng vừa F5 lại trang
    // giữa bước Chọn Ghế). Nếu deadline cũ đã trôi qua hoặc không hợp lệ, coi như
    // không có gì để khôi phục — sẽ cấp deadline mới ở dưới.
    const saved = Number(localStorage.getItem(BOOKING_DEADLINE_KEY));
    if (saved && saved > Date.now()) {
      needNewDeadline = false;
    }
  }

  if (needNewDeadline) {
    localStorage.setItem(BOOKING_DEADLINE_KEY, String(Date.now() + THIRTY_MINUTES_MS));
  }

  const timerBadgeValue = document.getElementById('timer-badge-value');
  const timerBadge = document.getElementById('timer-badge');

  // QUAN TRỌNG: đọc lại deadline từ localStorage NGAY TRONG MỖI TICK (không lưu deadline
  // vào 1 biến cục bộ rồi dùng lại qua closure). Đây là điểm then chốt để đồng bộ thật
  // giữa nhiều tab/màn hình: nếu tab khác (vd. vừa đặt vé xong, gọi startCountdown() cấp
  // deadline mới) ghi đè localStorage, thì NGAY TICK KẾ TIẾP (trong vòng 1 giây) tab này
  // cũng tự động đọc ra deadline mới giống nhau — không cần đợi reload trang.
  timerId = setInterval(() => {
    // LƯU Ý: không check isLoggedIn ở đây — theo đề bài, "Người đặt vé" KHÔNG bắt
    // buộc phải đăng nhập (book.php cho phép user_id NULL), nên đồng hồ giữ chỗ
    // phải áp dụng cho cả khách lẻ chưa đăng nhập, chỉ cần đang ở luồng đặt vé.
    if (!BOOKING_FLOW_SCREENS.includes(activeScreen)) {
      if (timerBadge) timerBadge.classList.add('hidden');
      return;
    }

    if (timerBadge) timerBadge.classList.remove('hidden');

    const deadline = Number(localStorage.getItem(BOOKING_DEADLINE_KEY));
    sessionTimeLeft = deadline ? Math.max(0, Math.round((deadline - Date.now()) / 1000)) : 0;

    if (sessionTimeLeft <= 0) {
      clearInterval(timerId);
      localStorage.removeItem(BOOKING_DEADLINE_KEY);
      handleBookingSessionExpired();
      return;
    }

    const min = Math.floor(sessionTimeLeft / 60);
    const sec = sessionTimeLeft % 60;
    const padSec = sec < 10 ? '0' + sec : sec;
    
    if (timerBadgeValue) {
      timerBadgeValue.textContent = `${min}:${padSec}`;
    }

    // Update circular dynamic displays
    document.querySelectorAll('.circular-timer-value').forEach(el => {
      el.textContent = `${min}:${padSec}`;
    });

    // Update SVGs circular stroke-dashoffset: circumference ~402
    const dashOffset = 402 - (sessionTimeLeft / 1800) * 402;
    document.querySelectorAll('.circular-timer-progress').forEach(el => {
      el.style.strokeDashoffset = dashOffset;
    });

    // High warning under 2 minutes
    if (sessionTimeLeft < 120) {
      if (timerBadge) {
        timerBadge.classList.remove('bg-orange-500/10', 'border-orange-500/30', 'text-orange-400');
        timerBadge.classList.add('bg-red-500/20', 'border-red-500/40', 'text-red-400', 'animate-pulse');
      }
    } else {
      if (timerBadge) {
        timerBadge.classList.remove('bg-red-500/20', 'border-red-500/40', 'text-red-400', 'animate-pulse');
        timerBadge.classList.add('bg-orange-500/10', 'border-orange-500/30', 'text-orange-400');
      }
    }
  }, 1000);
}

// Khi hết 30 phút giữ chỗ giữa lúc đang trong luồng đặt vé (search -> ... -> checkout):
// hủy giao dịch đang đặt dở, đăng xuất an toàn, rồi điều hướng tới screen-error (tương
// đương "error.html") để thông báo rõ ràng lý do, thay vì chỉ hiện toast rồi về màn login.
function handleBookingSessionExpired() {
  currentBooking = createFreshBooking(); // Hủy sạch dữ liệu giữ ghế/hành khách đang đặt dở

  // Chỉ đăng xuất nếu người dùng THỰC SỰ đang có phiên đăng nhập — vì giờ đồng
  // hồ giữ chỗ áp dụng cho cả khách lẻ chưa đăng nhập (theo đề bài), không nên
  // gọi logout.php một cách vô nghĩa hoặc đổi trạng thái UI khi chẳng có gì để
  // đăng xuất cả.
  if (isLoggedIn) {
    fetch(`${API_BASE}/logout.php`, { method: 'POST' }).catch(() => {});
    isLoggedIn = false;
    userFullName = '';
    userRole = 'user';
  }

  navigateTo('error');
}
window.handleBookingSessionExpired = handleBookingSessionExpired;

// Setup Event and UI triggers
function setupActionListeners() {
  // High Contrast action clicker
  const btnContrast = document.getElementById('btn-contrast-toggle');
  if (btnContrast) {
    btnContrast.addEventListener('click', () => {
      highContrast = !highContrast;
      const htmlBody = document.body;
      const appWrapper = document.getElementById('app-wrapper');
      
      if (highContrast) {
        htmlBody.classList.add('high-contrast-mode');
        appWrapper.classList.add('high-contrast-mode');
        btnContrast.classList.remove('bg-white/5', 'border-white/10', 'text-white');
        btnContrast.classList.add('bg-white', 'text-black', 'border-white', 'font-black');
        btnContrast.querySelector('span').textContent = 'BẬT TƯƠNG PHẢN';
        triggerToast('🌗 Đã kích hoạt Chế độ Tương Phản Cao!');
      } else {
        htmlBody.classList.remove('high-contrast-mode');
        appWrapper.classList.remove('high-contrast-mode');
        btnContrast.classList.add('bg-white/5', 'border-white/10', 'text-white');
        btnContrast.classList.remove('bg-white', 'text-black', 'border-white', 'font-black');
        btnContrast.querySelector('span').textContent = 'TƯƠNG PHẢN';
        triggerToast('🌗 Đã quay lại Giao diện Premium thường.');
      }
      playChime('click');
    });
  }

  // Switch tabs inside Auth Screen (Login vs SignUp)
  window.currentAuthTab = 'login';
  window.switchLoginTab = function(type) {
    window.currentAuthTab = type;
    const loginTabBtn = document.getElementById('loginTab');
    const signupTabBtn = document.getElementById('signupTab');
    const submitText = document.getElementById('submitText');
    const formHeaderTitle = document.querySelector('#formHeader h1');
    const formHeaderDesc = document.querySelector('#formHeader p');
    
    const fieldFullname = document.getElementById('field-fullname');
    const fieldConfirmPassword = document.getElementById('field-confirm-password');

    if (type === 'login') {
      if (loginTabBtn) {
        loginTabBtn.className = "flex-1 pb-3 text-xs font-mono font-bold tracking-wider text-center border-b-2 border-emerald-400 text-emerald-400";
      }
      if (signupTabBtn) {
        signupTabBtn.className = "flex-1 pb-3 text-xs font-mono font-bold tracking-wider text-center text-[#bacbbc] hover:text-[#d0ffdc]";
      }
      if (submitText) submitText.textContent = "TIẾP TỤC ĐĂNG NHẬP";
      if (formHeaderTitle) formHeaderTitle.textContent = "Chào Mừng Trở Lại";
      if (formHeaderDesc) formHeaderDesc.textContent = "Đăng nhập để đặt và quản lý thông tin chuyến bay trực tuyến.";
      if (fieldFullname) fieldFullname.classList.add('hidden');
      if (fieldConfirmPassword) fieldConfirmPassword.classList.add('hidden');
    } else {
      if (signupTabBtn) {
        signupTabBtn.className = "flex-1 pb-3 text-xs font-mono font-bold tracking-wider text-center border-b-2 border-emerald-400 text-emerald-400";
      }
      if (loginTabBtn) {
        loginTabBtn.className = "flex-1 pb-3 text-xs font-mono font-bold tracking-wider text-center text-[#bacbbc] hover:text-[#d0ffdc]";
      }
      if (submitText) submitText.textContent = "ĐĂNG KÝ THÀNH VIÊN MỚI";
      if (formHeaderTitle) formHeaderTitle.textContent = "Gia Nhập Giới Thượng Lưu";
      if (formHeaderDesc) formHeaderDesc.textContent = "Đăng ký thành viên Cloud Airline để tận hưởng ưu đãi bay hạng nhất.";
      if (fieldFullname) fieldFullname.classList.remove('hidden');
      if (fieldConfirmPassword) fieldConfirmPassword.classList.remove('hidden');
    }
  };

  // Auth logins panel submit
  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;
      const nameField = document.getElementById('auth-name').value.trim();
      
      // ========================= ĐĂNG KÝ =========================
      if (window.currentAuthTab === 'signup') {
        const confirmPassword = document.getElementById('auth-confirm-password').value;
        if (!email || !password || !nameField) {
          triggerToast('⚠️ Vui lòng điền đầy đủ email, họ tên & mật khẩu!');
          return;
        }
        if (password !== confirmPassword) {
          triggerToast('⚠️ Xác nhận mật khẩu đăng ký không khớp!');
          return;
        }

        try {
          const res = await fetch(`${API_BASE}/register.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName: nameField })
          });
          const data = await res.json();
          isBackendOnline = true;
          if (!data.success) {
            triggerToast(`⚠️ ${data.message || 'Đăng ký thất bại!'}`);
            return;
          }
        } catch (err) {
          // Không kết nối được SQL Server -> lưu tạm trong bộ nhớ (chế độ demo offline)
          const exists = usersAccounts.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (exists) {
            triggerToast('⚠️ Email này đã tồn tại trong danh sách tạm!');
            return;
          }
          usersAccounts.push({ email, fullname: nameField, password });
          triggerToast('⚠️ (Offline) Chưa kết nối được SQL Server — tài khoản chỉ lưu tạm trong phiên này.');
        }

        triggerToast('🎉 Đăng ký tài khoản thành công! Hãy đăng nhập ngay.');
        window.switchLoginTab('login');
        document.getElementById('auth-email').value = email;
        document.getElementById('auth-password').value = password;
        return;
      }

      // ========================= ĐĂNG NHẬP =========================
      if (!email || !password) {
        triggerToast('⚠️ Vui lòng điền tài khoản & mật khẩu!');
        return;
      }

      // Form đăng nhập này CHỈ dành cho khách hàng — không còn "cửa sau" gõ
      // email "admin" để có quyền quản trị. Muốn vào trang Admin, nhân viên
      // phải dùng tổ hợp phím tắt nội bộ (xem phần xử lý keydown bên dưới).

      try {
        const res = await fetch(`${API_BASE}/login.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        isBackendOnline = true;

        if (!data.success) {
          triggerToast(`❌ ${data.message || 'Sai email hoặc mật khẩu!'}`);
          return;
        }

        // Tài khoản admin PHẢI vào qua phím tắt riêng — chặn ngay cả khi gõ đúng
        // mật khẩu admin vào form khách, để giữ đúng nguyên tắc tách biệt 2 cổng.
        if (data.user.role === 'admin') {
          triggerToast('🔒 Tài khoản quản trị viên vui lòng dùng cổng đăng nhập riêng!');
          fetch(`${API_BASE}/logout.php`, { method: 'POST' }).catch(() => {});
          return;
        }

        isLoggedIn = true;
        userRole = 'user';
        userFullName = data.user.fullName;
        bookingsDb = [];                       // Dọn sạch dữ liệu của lượt đăng nhập trước (nếu có)
        currentBooking = createFreshBooking();  // Tránh lẫn thông tin đặt vé của tài khoản trước
        triggerToast(`👋 Chào mừng Hội viên: ${userFullName}!`);
        await loadMyBookingsFromServer();
        navigateTo('lobby');
        // KHÔNG gọi startCountdown() ở đây — đồng hồ 30 phút theo đề bài chỉ tính
        // từ lúc TẠM ĐẶT VÉ (chọn xong chuyến bay), không phải từ lúc đăng nhập.
        // Xem selectBookingFlight() / selectReturnFlight() là nơi thật sự cấp deadline.
      } catch (err) {
        // Không kết nối được SQL Server -> thử khớp với danh sách tài khoản tạm trong bộ nhớ
        const userRecord = usersAccounts.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (userRecord && userRecord.password === password) {
          isLoggedIn = true;
          userRole = 'user';
          userFullName = userRecord.fullname;
          bookingsDb = []; // Chế độ offline: không có CSDL thật nên không có vé nào để hiện cả
          currentBooking = createFreshBooking();
          triggerToast(`👋 (Offline) Chào mừng Hội viên: ${userFullName}! Lưu ý: chưa kết nối SQL Server nên KHÔNG có dữ liệu vé thật.`);
          navigateTo('lobby');
          // Không startCountdown() ở đây — lý do tương tự nhánh login thật phía trên.
        } else {
          triggerToast('⚠️ Không kết nối được SQL Server và không khớp tài khoản tạm.');
        }
      }
    });
  }

  // Lưu ý: KHÔNG còn nút "đăng nhập nhanh Admin" trên giao diện khách hàng nữa.
  // Quản trị viên chỉ vào được trang Admin bằng phím tắt nội bộ (xem keydown listener).

  // User standard fast sign-in
  const btnBypassUser = document.getElementById('btn-bypass-user');
  if (btnBypassUser) {
    btnBypassUser.addEventListener('click', () => {
      isLoggedIn = true;
      userRole = 'user';
      userFullName = 'Nguyễn Đăng Khoa';
      triggerToast('🎉 Đăng nhập nhanh Hội Viên thành công!');
      navigateTo('lobby');
      // Không startCountdown() ở đây — đồng hồ chỉ bắt đầu khi tạm đặt vé.
    });
  }

  // Search Submit button
  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      currentBooking.origin = document.getElementById('search-origin').value;
      currentBooking.destination = document.getElementById('search-destination').value;
      currentBooking.departureDate = document.getElementById('search-date').value;

      if (currentBooking.origin === currentBooking.destination) {
        triggerToast('⚠️ Điểm khởi hành và điểm đến không thể trùng nhau!');
        return;
      }

      // Khứ hồi: đọc thêm ngày về và kiểm tra ngày về phải sau ngày đi
      if (currentBooking.tripType === 'RoundTrip') {
        const returnDateValue = document.getElementById('search-return-date').value;
        if (!returnDateValue || returnDateValue < currentBooking.departureDate) {
          triggerToast('⚠️ Ngày về phải sau ngày khởi hành!');
          return;
        }
        currentBooking.returnDate = returnDateValue;
      }

      // Mỗi lần tìm kiếm mới coi như đặt lại lựa chọn chuyến bay trước đó
      currentBooking.selectedFlight = null;
      currentBooking.returnFlight = null;
      currentBooking.selectingReturnLeg = false;

      // Đồng bộ số lượng hành khách đã chọn ở form tìm kiếm vào mảng passengers
      // (giữ lại thông tin đã nhập trước đó nếu có, chỉ thêm/bớt phần dư)
      const newCount = searchPassengerCountDraft;
      while (currentBooking.passengers.length < newCount) currentBooking.passengers.push(createBlankPassenger());
      currentBooking.passengers.length = newCount;
      currentBooking.passengerCount = newCount;
      currentBooking.activePassengerIndex = 0;

      triggerToast('🔍 Định vị danh sách chuyến bay tối ưu...');
      navigateTo('select_flight');
    });
  }

  // Passenger Info Submit button
  const passengerForm = document.getElementById('passenger-form');
  if (passengerForm) {
    passengerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Lưu dữ liệu vừa nhập vào đúng hành khách đang mở tab
      saveActivePassengerFromForm();

      // Phải điền đủ Họ tên & Hộ chiếu cho TẤT CẢ hành khách trong đoàn mới được tiếp tục
      const missingIndex = currentBooking.passengers.findIndex(p => !p.fullName || !p.passportId);
      if (missingIndex !== -1) {
        switchPassengerTab(missingIndex);
        triggerToast(`⚠️ Vui lòng điền đủ Họ tên & Hộ chiếu cho Hành khách ${missingIndex + 1}!`);
        return;
      }

      triggerToast('🗺️ Khởi tạo sơ đồ chọn chỗ ngồi chuyên biệt...');
      navigateTo('seats');
    });
  }

  const btnSubmitPassengerDetails = document.getElementById('btn-submit-passenger-details');
  if (btnSubmitPassengerDetails) {
    btnSubmitPassengerDetails.addEventListener('click', () => {
      if (passengerForm) {
        passengerForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
  }

  // Seats confirm continue button
  const btnConfirmSeats = document.getElementById('btn-confirm-seats');
  if (btnConfirmSeats) {
    btnConfirmSeats.addEventListener('click', () => {
      if (currentBooking.selectedSeats.length !== currentBooking.passengerCount) {
        triggerToast(`⚠️ Vui lòng chọn đủ ${currentBooking.passengerCount} ghế cho ${currentBooking.passengerCount} hành khách!`);
        return;
      }
      navigateTo('extras');
    });
  }

  // Extras confirm continue button
  const btnConfirmExtras = document.getElementById('btn-confirm-extras');
  if (btnConfirmExtras) {
    btnConfirmExtras.addEventListener('click', () => {
      // Collect selected add-ons
      currentBooking.selectedAddons = [];
      const luggageAddon = document.getElementById('addon-luggage');
      const mealAddon = document.getElementById('addon-meal');
      const insuranceAddon = document.getElementById('addon-insurance');

      if (luggageAddon && luggageAddon.checked) {
        currentBooking.selectedAddons.push({ name: 'Extra Cabin Luggage', price: 35 });
      }
      if (mealAddon && mealAddon.checked) {
        currentBooking.selectedAddons.push({ name: 'Gourmet Dining Combo', price: 15 });
      }
      if (insuranceAddon && insuranceAddon.checked) {
        currentBooking.selectedAddons.push({ name: 'Elite Travel Safeguard', price: 25 });
      }

      navigateTo('checkout');
    });
  }

  // Sandbox payment execute purchase button
  const btnCompleteCheckout = document.getElementById('btn-complete-checkout');
  if (btnCompleteCheckout) {
    btnCompleteCheckout.addEventListener('click', async () => {
      const cardNum = document.getElementById('input-card-number').value.trim();
      const cardCvv = document.getElementById('input-card-cvv').value.trim();
      
      if (cardNum.length < 8 || cardCvv.length < 3) {
        triggerToast('⚠️ Thông tin thẻ ngân hàng Sandbox không đúng định dạng!');
        return;
      }

      triggerToast('💳 Đang xử lý cổng thanh toán Sandbox...');
      btnCompleteCheckout.disabled = true; // chặn bấm nhiều lần khi đang chờ server trả lời

      const allPassengerNames = currentBooking.passengers.map(p => p.fullName || userFullName);
      let totalPrice = calculateTotalBill();
      let bookingCode = null;

      try {
        const res = await fetch(`${API_BASE}/book.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outboundFlightId: currentBooking.selectedFlight.id,
            returnFlightId: currentBooking.returnFlight ? currentBooking.returnFlight.id : null,
            tripType: currentBooking.tripType,
            cabinClass: currentBooking.cabinClass,
            departureDate: currentBooking.departureDate,
            returnDate: currentBooking.tripType === 'RoundTrip' ? currentBooking.returnDate : null,
            totalPrice,
            // Ghép đúng từng hành khách với số ghế theo thứ tự đã chọn ở bước Chọn Ghế
            passengers: currentBooking.passengers.map((p, idx) => ({
              fullName: p.fullName,
              passportId: p.passportId,
              nationality: p.nationality,
              age: p.age,
              email: p.email,
              seatNumber: currentBooking.selectedSeats[idx] || ''
            })),
            addons: currentBooking.selectedAddons
          })
        });
        const data = await res.json();

        if (!data.success) {
          triggerToast(`❌ Không thể đặt vé: ${data.message || 'SQL Server từ chối yêu cầu.'}`);
          btnCompleteCheckout.disabled = false;
          return;
        }

        isBackendOnline = true;
        bookingCode = data.bookingCode;
        // Server luôn tự tính lại giá thật từ CSDL (không tin số tiền do trình duyệt gửi lên,
        // để tránh bị sửa giá qua DevTools) — nếu server tính ra số khác, hiện đúng số đó.
        if (typeof data.totalPrice === 'number') totalPrice = data.totalPrice;
      } catch (err) {
        triggerToast('❌ Không kết nối được SQL Server — vé KHÔNG được lưu. Vui lòng kiểm tra lại XAMPP/driver rồi thử lại!');
        console.warn('⚠️ Không lưu được vé vào SQL Server. Lý do:', err.message);
        btnCompleteCheckout.disabled = false;
        return;
      }

      setTimeout(() => {
        btnCompleteCheckout.disabled = false;
        // Log booking to DB
        const newBookingRef = {
          id: bookingCode,
          passengerName: allPassengerNames.length > 1 ? `${allPassengerNames[0]} +${allPassengerNames.length - 1}` : allPassengerNames[0],
          passengerNames: allPassengerNames, // Danh sách đầy đủ — dùng để in lên vé điện tử
          flightNumber: getFlightNumbersLabel(), // "CA101" hoặc "CA101 (đi) / CA102 (về)" nếu Khứ hồi
          tripType: currentBooking.tripType,
          cabinClass: currentBooking.cabinClass,
          seat: currentBooking.selectedSeats.join(', ') || 'K3',
          totalPrice,
          date: currentBooking.departureDate,
          returnDate: currentBooking.tripType === 'RoundTrip' ? currentBooking.returnDate : null,
          status: 'Confirmed'
        };
        bookingsDb.push(newBookingRef);

        // Đặt vé đã hoàn tất thành công — KHÔNG cần đồng hồ giữ chỗ nữa.
        // Dọn deadline cũ trong localStorage để tránh sót lại mốc giờ không còn
        // ý nghĩa; lần đặt vé KẾ TIẾP sẽ được cấp deadline mới khi người dùng
        // thực sự chọn chuyến bay (xem selectBookingFlight/selectReturnFlight).
        localStorage.removeItem(BOOKING_DEADLINE_KEY);
        if (timerId) clearInterval(timerId);

        // Display Success Screen Ticket
        renderSuccessTicket(newBookingRef);
        playChime('success');
        navigateTo('success');
      }, 800);
    });
  }

  // New Booking reset button
  const btnNewBooking = document.getElementById('btn-new-booking');
  if (btnNewBooking) {
    btnNewBooking.addEventListener('click', () => {
      // Reset state parameters
      currentBooking.selectedSeats = [];
      currentBooking.selectedAddons = [];
      currentBooking.passengerCount = 1;
      currentBooking.passengers = [createBlankPassenger()];
      currentBooking.activePassengerIndex = 0;
      currentBooking.tripType = 'OneWay';
      currentBooking.selectingReturnLeg = false;
      currentBooking.returnFlight = null;
      currentBooking.selectedFlight = null;
      
      // Uncheck addon boxes
      const bags = document.getElementById('addon-luggage');
      const meals = document.getElementById('addon-meal');
      const ins = document.getElementById('addon-insurance');
      if (bags) bags.checked = false;
      if (meals) meals.checked = false;
      if (ins) ins.checked = false;

      navigateTo('search');
    });
  }

  // Nút "Quay về tìm chuyến bay" trên screen-error (hết giờ giữ chỗ tạm đặt).
  // Đưa thẳng về 'search' — màn tìm chuyến bay không yêu cầu đăng nhập (cả theo
  // navigateTo() và theo đề bài: "Người đặt vé" không bắt buộc có tài khoản).
  const btnErrorBackToSearch = document.getElementById('btn-error-back-to-search');
  if (btnErrorBackToSearch) {
    btnErrorBackToSearch.addEventListener('click', () => {
      navigateTo('search');
    });
  }

  // Form tra cứu/hủy vé cho KHÁCH LẺ chưa đăng nhập — xác minh bằng Mã vé +
  // Số CMND/Passport (gọi cancel_booking_guest.php, KHÔNG dùng cancel_booking.php
  // vì API đó yêu cầu session đăng nhập mà khách lẻ không có).
  const guestCancelForm = document.getElementById('guest-cancel-form');
  if (guestCancelForm) {
    guestCancelForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bookingCode = document.getElementById('guest-cancel-booking-code').value.trim();
      const passportId = document.getElementById('guest-cancel-passport').value.trim();
      const btnSubmit = document.getElementById('btn-guest-cancel-submit');

      if (!bookingCode || !passportId) {
        triggerToast('⚠️ Vui lòng nhập đầy đủ Mã vé và Số CMND/Passport!');
        return;
      }

      btnSubmit.disabled = true;
      triggerToast('⏳ Đang xác minh và xử lý hủy vé...');

      try {
        const res = await fetch(`${API_BASE}/cancel_booking_guest.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: bookingCode, passportId })
        });
        const data = await res.json();

        if (!data.success) {
          triggerToast(`❌ ${data.message || 'Không thể hủy vé. Vui lòng kiểm tra lại thông tin.'}`);
          btnSubmit.disabled = false;
          return;
        }

        triggerToast(`✅ Vé ${bookingCode} đã được hủy thành công!`);
        playChime('success');
        guestCancelForm.reset();
        btnSubmit.disabled = false;
      } catch (err) {
        triggerToast('❌ Không kết nối được SQL Server — vé KHÔNG được hủy. Vui lòng kiểm tra lại XAMPP/driver rồi thử lại!');
        console.warn('⚠️ Không đồng bộ được việc hủy vé khách lẻ với SQL Server. Lý do:', err.message);
        btnSubmit.disabled = false;
      }
    });
  }

  // Logout header button clicker
  const btnLogout = document.getElementById('btn-header-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      logoutUser();
    });
  }

  // Keyboard shortcut listener for admin/bypass modes
  window.addEventListener('keydown', (e) => {
    // 1. Global shortcut to unlock PHP tab at any time: Pressing Alt + P, or '0'
    const isInputField = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
    
    // Alt + P or '0' (if not currently typing in an input field)
    if ((e.altKey && (e.key === 'p' || e.key === 'P')) || (e.key === '0' && !isInputField)) {
      e.preventDefault();
      phpUnlocked = true;
      updateNavbar();
      triggerToast('📚 ĐÃ MỞ KHÓA MÃ NGUỒN PHP & MYSQL ĐỒ ÁN!');
      
      // Force auto login if not logged in to view immediately
      if (!isLoggedIn) {
        isLoggedIn = true;
        userRole = 'user';
        userFullName = 'Nhóm trưởng Đồ Án';
        // Không startCountdown() — màn xem mã nguồn PHP không thuộc luồng đặt vé.
      }
      navigateTo('php_project');
      return;
    }

    // 2. Allow '9' key to trigger Admin login on Auth Screen
    if (!isLoggedIn && activeScreen === 'auth' && e.key === '9' && !isInputField) {
      e.preventDefault();
      loginAsAdminViaShortcut();
    }
  });
}

// Tài khoản admin dùng cho phím tắt nội bộ — đã có sẵn trong dữ liệu mẫu của database.sql.
// Đây KHÔNG phải cách làm an toàn cho sản phẩm thật (lộ thông tin đăng nhập trong mã nguồn
// client), nhưng phù hợp cho đồ án demo — phía server vẫn xác thực bằng password_verify() thật.
const ADMIN_SHORTCUT_EMAIL = 'admin@cloudairline.com';
const ADMIN_SHORTCUT_PASSWORD = 'Admin@123';

async function loginAsAdminViaShortcut() {
  bookingsDb = []; // Dọn sạch dữ liệu của lượt đăng nhập trước (nếu có) trước khi vào Admin
  try {
    const res = await fetch(`${API_BASE}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_SHORTCUT_EMAIL, password: ADMIN_SHORTCUT_PASSWORD })
    });
    const data = await res.json();
    if (data.success && data.user.role === 'admin') {
      isBackendOnline = true;
      isLoggedIn = true;
      userRole = 'admin';
      adminUnlocked = true;
      userFullName = data.user.fullName;
      triggerToast('🔑 KÍCH HOẠT CHẾ ĐỘ QUẢN TRỊ VIÊN (ADMIN) THÀNH CÔNG!');
      navigateTo('admin');
      // Không startCountdown() — khu vực Admin không thuộc luồng đặt vé của đề bài.
      await loadAdminBookingsFromServer();
      return;
    }
  } catch (err) {
    console.warn('⚠️ Không đăng nhập admin được qua SQL Server, dùng chế độ Admin offline. Lý do:', err.message);
  }

  // Fallback OFFLINE — giữ hành vi demo cũ khi chưa kết nối được SQL Server. KHÔNG có
  // dữ liệu vé thật trong chế độ này (bookingsDb để rỗng) để tránh hiểu nhầm là dữ liệu thật.
  isLoggedIn = true;
  userRole = 'admin';
  adminUnlocked = true;
  userFullName = 'Quản Trị Viên Hệ Thống (Offline)';
  triggerToast('🔑 KÍCH HOẠT ADMIN — chế độ OFFLINE (chưa kết nối SQL Server, không có dữ liệu thật)!');
  navigateTo('admin');
  // Không startCountdown() — lý do tương tự nhánh admin online phía trên.
}

// Global user logouts
function logoutUser() {
  // Hủy session thật phía server (không cần chờ kết quả — đăng xuất ở client vẫn diễn ra ngay)
  fetch(`${API_BASE}/logout.php`, { method: 'POST' }).catch(() => {});

  isLoggedIn = false;
  userFullName = '';
  userRole = 'user';
  adminUnlocked = false;
  phpUnlocked = false;
  bookingsDb = [];                       // QUAN TRỌNG: xoá sạch dữ liệu vé của tài khoản vừa đăng xuất
  currentBooking = createFreshBooking(); // Không để sót thông tin hành khách/chuyến bay đang đặt dở
  if (timerId) clearInterval(timerId);
  localStorage.removeItem(BOOKING_DEADLINE_KEY); // Đăng xuất chủ động -> dọn luôn deadline giữ chỗ
  triggerToast('🔒 Bạn đã đăng xuất hệ thống an toàn!');
  navigateTo('auth');
}

// Update central navigational components
function updateNavbar() {
  const brandSub = document.getElementById('brand-sub');
  const userProfileBadge = document.getElementById('user-profile-badge');
  const userProfileName = document.getElementById('user-profile-name');
  const btnManageLobby = document.getElementById('nav-lobby-hub');
  const btnManageSearch = document.getElementById('nav-flight-search');
  const btnManageAdmin = document.getElementById('nav-admin-console');
  const btnManagePhp = document.getElementById('nav-php-project');
  const btnHeaderLogout = document.getElementById('btn-header-logout');
  const topStepsRow = document.getElementById('navigation-wizard-steps');

  // Welcome user label configuration
  if (isLoggedIn) {
    if (userProfileBadge) userProfileBadge.classList.remove('hidden');
    if (userProfileName) userProfileName.textContent = userFullName;
    if (btnHeaderLogout) btnHeaderLogout.classList.remove('hidden');
    if (btnManageLobby) btnManageLobby.classList.remove('hidden');
    if (btnManageSearch) btnManageSearch.classList.remove('hidden');
    
    // Only show PHP tab if phpUnlocked is true
    if (phpUnlocked) {
      if (btnManagePhp) btnManagePhp.classList.remove('hidden');
    } else {
      if (btnManagePhp) btnManagePhp.classList.add('hidden');
    }
    
    // Tab "BẢNG HÀNH KHÁCH ADMIN" chỉ hiện với đúng người đăng nhập bằng quyền admin
    // (Bug cũ: nhánh else cũng remove('hidden') nên khách hàng thường vẫn thấy tab này)
    if (userRole === 'admin' && adminUnlocked) {
      if (brandSub) brandSub.textContent = 'ADMIN CONSOLE';
      if (btnManageAdmin) btnManageAdmin.classList.remove('hidden');
    } else {
      if (brandSub) brandSub.textContent = 'ELITE MEMBER';
      if (btnManageAdmin) btnManageAdmin.classList.add('hidden');
    }
  } else {
    if (userProfileBadge) userProfileBadge.classList.add('hidden');
    if (btnHeaderLogout) btnHeaderLogout.classList.add('hidden');
    if (btnManageLobby) btnManageLobby.classList.add('hidden');
    // "Tìm chuyến bay" vẫn hiện cho khách lẻ chưa đăng nhập — đề bài cho phép
    // đặt vé không cần tài khoản, nên không có lý do ẩn lối vào luồng đặt vé.
    if (btnManageSearch) btnManageSearch.classList.remove('hidden');
    if (btnManageAdmin) btnManageAdmin.classList.add('hidden');
    if (btnManagePhp) btnManagePhp.classList.add('hidden');
    if (brandSub) brandSub.textContent = 'VANILLA EDITION';
  }

  // Manage highlight headers
  const linkLobby = document.getElementById('link-nav-lobby');
  const linkSearch = document.getElementById('link-nav-search');
  const linkAdmin = document.getElementById('link-nav-admin');
  const linkPhp = document.getElementById('link-nav-php');

  if (linkLobby) linkLobby.className = activeScreen === 'lobby' ? 'text-[#2af598] font-bold py-1.5' : 'text-[#bacbbc] hover:text-[#d0ffdc] py-1.5';
  if (linkSearch) linkSearch.className = activeScreen === 'search' ? 'text-[#2af598] font-bold py-1.5' : 'text-[#bacbbc] hover:text-[#d0ffdc] py-1.5';
  if (linkAdmin) linkAdmin.className = activeScreen === 'admin' ? 'text-[#2af598] font-bold py-1.5' : 'text-[#bacbbc] hover:text-[#d0ffdc] py-1.5';
  if (linkPhp) linkPhp.className = activeScreen === 'php_project' ? 'text-[#2af598] font-bold py-1.5' : 'text-[#bacbbc] hover:text-[#d0ffdc] py-1.5';

  // Manage Wizard displays
  const wizardScreens = ['select_flight', 'passenger', 'seats', 'extras', 'checkout'];
  if (wizardScreens.includes(activeScreen)) {
    if (topStepsRow) topStepsRow.classList.remove('hidden');
    updateWizardUI();
  } else {
    if (topStepsRow) topStepsRow.classList.add('hidden');
  }
}

// Wizard progression bar updater
function updateWizardUI() {
  const stepsOrder = ['select_flight', 'seats', 'extras', 'checkout'];
  let currentStepIndex = stepsOrder.indexOf(activeScreen);
  if (activeScreen === 'passenger') currentStepIndex = 0; // bundle passenger under base choosing

  for (let i = 1; i <= 4; i++) {
    const bubble = document.getElementById(`step-bubble-${i}`);
    const line = document.getElementById(`step-line-${i}`);
    const label = document.getElementById(`step-label-${i}`);

    if (i - 1 < currentStepIndex) { // Complete
      if (bubble) {
        bubble.className = "w-7 h-7 rounded-full flex items-center justify-center bg-[#2af598] text-black font-bold text-xs shadow-[0_0_15px_rgba(42,245,152,0.4)]";
        bubble.innerHTML = '✓';
      }
      if (line) line.className = "flex-grow h-0.5 bg-[#2af598]";
    } else if (i - 1 === currentStepIndex) { // Current Active
      if (bubble) {
        bubble.className = "w-7 h-7 rounded-full flex items-center justify-center bg-[#2af598]/20 border border-[#2af598] text-[#2af598] font-bold text-xs shadow-[0_0_15px_rgba(42,245,152,0.3)] animate-pulse";
        bubble.innerHTML = i;
      }
      if (line) line.className = "flex-grow h-0.5 bg-white/10";
    } else { // Pending
      if (bubble) {
        bubble.className = "w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/40 text-xs";
        bubble.innerHTML = i;
      }
      if (line) line.className = "flex-grow h-0.5 bg-white/10";
    }
  }
}

// Generate Search screen stats panel
function renderSearchScreen() {
  const scheduledCount = flightsDb.filter(f => f.status === 'Scheduled').length;
  const delayedCount = flightsDb.filter(f => f.status === 'Delayed').length;
  
  const elTotal = document.getElementById('search-stat-total-flights');
  const elActive = document.getElementById('search-stat-active-flights');
  
  if (elTotal) elTotal.textContent = flightsDb.length;
  if (elActive) elActive.textContent = scheduledCount + ' CHUYẾN';

  // Đồng bộ ô đếm số hành khách trên form với số đã lưu trong currentBooking
  // (ví dụ khi người dùng bấm "Quay lại Tìm kiếm" từ bước sau)
  searchPassengerCountDraft = currentBooking.passengerCount;
  const display = document.getElementById('search-passenger-count-display');
  if (display) display.textContent = searchPassengerCountDraft;

  // Mỗi lần vào lại màn tìm kiếm coi như bắt đầu tìm chuyến mới — reset trạng thái chọn chuyến về
  currentBooking.selectingReturnLeg = false;

  // Đồng bộ giao diện toggle Một chiều/Khứ hồi + hiện/ẩn ô Ngày Về theo currentBooking.tripType
  const onewayBtn = document.getElementById('trip-type-oneway-btn');
  const roundtripBtn = document.getElementById('trip-type-roundtrip-btn');
  const returnDateField = document.getElementById('return-date-field');
  const activeBtnClass = 'px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer bg-[#2af598] text-black';
  const inactiveBtnClass = 'px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-[#bacbbc] hover:text-white';
  if (onewayBtn) onewayBtn.className = currentBooking.tripType === 'OneWay' ? activeBtnClass : inactiveBtnClass;
  if (roundtripBtn) roundtripBtn.className = currentBooking.tripType === 'RoundTrip' ? activeBtnClass : inactiveBtnClass;
  if (returnDateField) returnDateField.classList.toggle('hidden', currentBooking.tripType !== 'RoundTrip');
}

// Đổi giữa Một chiều / Khứ hồi trên form tìm kiếm — hiện/ẩn ô Ngày Về tương ứng
function setTripType(type) {
  currentBooking.tripType = type;
  renderSearchScreen(); // vẽ lại để đồng bộ giao diện toggle + ô Ngày Về
  playChime('click');
}
window.setTripType = setTripType;

// Số hành khách đang được chọn tạm trên form tìm kiếm (chưa bấm "Tìm kiếm")
let searchPassengerCountDraft = 1;

// Tăng/giảm số hành khách trên form tìm kiếm — tối thiểu 1, tối đa 6 (theo chuẩn các hãng bay)
function adjustSearchPassengerCount(delta) {
  searchPassengerCountDraft = Math.min(6, Math.max(1, searchPassengerCountDraft + delta));
  const display = document.getElementById('search-passenger-count-display');
  if (display) display.textContent = searchPassengerCountDraft;
  playChime('click');
}
window.adjustSearchPassengerCount = adjustSearchPassengerCount;

// Đổi chỗ Sân bay khởi hành <-> Sân bay đến (nút mũi tên hai chiều trên form tìm kiếm)
function swapOriginDestination() {
  const origin = document.getElementById('search-origin');
  const destination = document.getElementById('search-destination');
  if (!origin || !destination) return;
  const temp = origin.value;
  origin.value = destination.value;
  destination.value = temp;
  playChime('click');
}
window.swapOriginDestination = swapOriginDestination;

// Bấm vào 1 card "Khám Phá Điểm Đến" ở Sảnh chung -> nhảy tới form tìm kiếm, tự điền sẵn điểm đến
function quickSearchTo(destinationValue) {
  navigateTo('search');
  // Chờ DOM của màn tìm kiếm render xong rồi mới gán giá trị cho 2 select
  setTimeout(() => {
    const destSelect = document.getElementById('search-destination');
    const originSelect = document.getElementById('search-origin');
    if (destSelect) destSelect.value = destinationValue;
    // Nếu điểm khởi hành đang trùng với điểm đến vừa chọn thì đổi điểm khởi hành về New York (JFK)
    if (originSelect && originSelect.value === destinationValue) {
      originSelect.value = 'New York (JFK)';
    }
  }, 50);
}
window.quickSearchTo = quickSearchTo;

// Generate Choice flight panel list using card templates
function renderFlightSelection() {
  const isReturnLeg = currentBooking.selectingReturnLeg;
  // Khứ hồi + đang ở bước 2: đảo chiều origin/destination để tìm chuyến bay chiều về
  const fromCountry = isReturnLeg ? currentBooking.destination : currentBooking.origin;
  const toCountry = isReturnLeg ? currentBooking.origin : currentBooking.destination;

  const headerLabel = document.getElementById('flight-select-title-route');
  if (headerLabel) headerLabel.textContent = `${fromCountry} ➔ ${toCountry}`;

  const legBadge = document.getElementById('flight-select-leg-badge');
  if (legBadge) {
    if (isReturnLeg) {
      legBadge.textContent = `BƯỚC 2/2 — CHỌN CHUYẾN VỀ (Hạng ${getCabinLabelShort(currentBooking.cabinClass)})`;
    } else if (currentBooking.tripType === 'RoundTrip') {
      legBadge.textContent = 'BƯỚC 1/2 — CHỌN CHUYẾN ĐI & HẠNG VÉ';
    } else {
      legBadge.textContent = 'SO SÁNH & CHỌN HẠNG VÉ PHÙ HỢP VỚI BẠN';
    }
  }

  const cardsContainer = document.getElementById('flights-list-container');
  if (!cardsContainer) return;

  cardsContainer.innerHTML = '';

  // Filter flights matching itinerary route
  const matchingFlights = flightsDb.filter(
    f => f.origin === fromCountry && f.destination === toCountry
  );

  if (matchingFlights.length === 0) {
    cardsContainer.className = "py-12 text-center flex flex-col items-center justify-center";
    cardsContainer.innerHTML = `
      <div class="p-6 rounded-full bg-red-50 border border-red-100 text-red-500 mb-4">
        <i data-lucide="alert-circle" class="w-12 h-12"></i>
      </div>
      <h3 class="text-lg font-bold text-slate-800">Không tìm thấy chuyến bay thẳng</h3>
      <p class="text-slate-500 text-xs mt-1 max-w-sm">Mẹo: Hãy thử tìm kiếm lộ trình "New York (JFK)" đi "Đà Nẵng (DAD)" hoặc "London (LHR)" để hiển thị danh sách các chuyến bay demo tuyệt đẹp của chúng tôi!</p>
      <button onclick="navigateTo('search')" class="mt-4 px-4 py-2 bg-slate-100 border border-slate-200 text-xs text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-mono cursor-pointer">
         ← Quay Lại Nhập Lộ Trình
      </button>
    `;
    lucide.createIcons();
    return;
  }

  // Danh sách dọc full-width — đủ chỗ ngang để xếp 3 cột so sánh hạng vé trong mỗi thẻ
  cardsContainer.className = "flex flex-col gap-6";
  cardsContainer.innerHTML = matchingFlights
    .map(flight => isReturnLeg ? buildReturnFlightCardHtml(flight) : buildFlightCardHtml(flight))
    .join('');

  lucide.createIcons();
}

// Bấm "← Trở Lại Tìm Kiếm" — nếu đang ở bước chọn CHUYẾN VỀ thì lùi về bước chọn chuyến ĐI
// (giữ lại lộ trình/ngày đã nhập) thay vì văng thẳng ra lại form tìm kiếm.
function goBackFromFlightSelection() {
  if (currentBooking.selectingReturnLeg) {
    currentBooking.selectingReturnLeg = false;
    currentBooking.selectedFlight = null;
    navigateTo('select_flight');
  } else {
    navigateTo('search');
  }
}
window.goBackFromFlightSelection = goBackFromFlightSelection;

// Phần "header" của thẻ chuyến bay (số hiệu/trạng thái/hành lý + lộ trình/giờ bay) —
// dùng chung cho cả thẻ chọn chuyến ĐI (so sánh hạng vé) và chọn chuyến VỀ (1 giá duy nhất).
function buildFlightCardHeaderHtml(flight) {
  return `
    <!-- Hàng đầu: số hiệu, trạng thái, hành lý, khí thải -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-5 border-b border-slate-100">
      <div class="flex items-center gap-2.5 flex-wrap">
        <span class="px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-200 rounded-lg text-[10px] font-mono font-bold text-emerald-700 uppercase">
          ${flight.flightNumber}
        </span>
        <span class="text-[10px] font-mono text-slate-400">Bay thẳng · ${flight.aircraft}</span>
        <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
          flight.status === 'Scheduled'
            ? 'bg-emerald-50 text-emerald-700'
            : flight.status === 'Delayed'
            ? 'bg-amber-50 text-amber-700'
            : 'bg-red-50 text-red-600'
        }">
          ${flight.status === 'Scheduled' ? '🟢 Đúng giờ' : flight.status === 'Delayed' ? '⚠️ Chậm chuyến' : '❌ Đã hủy'}
        </span>
      </div>
      <div class="flex items-center gap-2 text-[10px] font-mono text-slate-400">
        <i data-lucide="briefcase" class="w-3.5 h-3.5"></i><span>${flight.baggage}</span>
        <span class="w-px h-3 bg-slate-200"></span>
        <i data-lucide="leaf" class="w-3.5 h-3.5 text-emerald-500"></i><span class="text-emerald-600">${flight.emissions}</span>
      </div>
    </div>

    <!-- Lộ trình + giờ bay -->
    <div class="flex items-center justify-between gap-4 py-5 font-mono">
      <div class="text-left">
        <strong class="block text-2xl text-slate-900">${flight.departureTime}</strong>
        <span class="text-xs text-slate-500">${flight.origin}</span>
      </div>
      <div class="flex-grow flex flex-col items-center text-slate-400 px-2">
        <span class="text-[10px]">${flight.duration}</span>
        <div class="w-full flex items-center gap-1 my-1">
          <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span class="flex-grow border-t border-dashed border-slate-300"></span>
          <i data-lucide="plane" class="w-4 h-4 text-emerald-500 shrink-0"></i>
          <span class="flex-grow border-t border-dashed border-slate-300"></span>
          <span class="w-2 h-2 rounded-full bg-slate-300 shrink-0"></span>
        </div>
        <span class="text-[10px]">Bay thẳng</span>
      </div>
      <div class="text-right">
        <strong class="block text-2xl text-slate-900">${flight.arrivalTime}</strong>
        <span class="text-xs text-slate-500">${flight.destination}</span>
      </div>
    </div>
  `;
}

// Dựng HTML cho 1 thẻ chuyến bay: thông tin chuyến bay + bảng so sánh 3 hạng vé ngay bên dưới,
// để khách so sánh quyền lợi/giá trước khi chọn — đúng kiểu UX của các trang bán vé máy bay lớn.
function buildFlightCardHtml(flight) {
  const isCancelled = flight.status === 'Cancelled';

  const ACCENT_STYLES = {
    slate:   { ring: 'border-slate-200',   badge: 'bg-slate-100 text-slate-600',     btn: 'bg-slate-700 hover:bg-slate-800' },
    emerald: { ring: 'border-emerald-300', badge: 'bg-emerald-50 text-emerald-700', btn: 'bg-gradient-to-r from-sky-500 to-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.35)]' },
    amber:   { ring: 'border-amber-300',   badge: 'bg-amber-50 text-amber-700',     btn: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)]' }
  };

  const fareColumnsHtml = FARE_TIERS.map(tier => {
    const price = flight[tier.priceField];
    // Field có thể chưa tồn tại nếu dữ liệu cũ chưa kịp cập nhật -> fallback an
    // toàn về 0 thay vì để hiển thị "undefined" ra giao diện.
    const seatsLeft = flight[tier.seatsLeftField] ?? 0;
    const isSoldOut = seatsLeft <= 0;
    const accent = ACCENT_STYLES[tier.accent];
    const perksHtml = tier.perks.map(perk => `
      <li class="flex items-center gap-1.5 text-[11px] ${perk.ok ? 'text-slate-700' : 'text-slate-400'}">
        <i data-lucide="${perk.ok ? 'check' : 'x'}" class="w-3.5 h-3.5 ${perk.ok ? 'text-emerald-500' : 'text-slate-300'} shrink-0"></i>
        <span>${perk.text}</span>
      </li>
    `).join('');

    // Badge số vé còn: đổi màu cảnh báo khi sắp hết (≤3 vé) hoặc đã hết hẳn.
    const seatsBadgeHtml = isSoldOut
      ? `<span class="inline-block self-start px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-red-50 text-red-600">Hết vé</span>`
      : seatsLeft <= 3
      ? `<span class="inline-block self-start px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-700">Còn ${seatsLeft} vé</span>`
      : `<span class="inline-block self-start px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-400">Còn ${seatsLeft} vé</span>`;

    return `
      <div class="flex-1 min-w-[180px] rounded-2xl border-2 ${accent.ring} p-4 flex flex-col gap-3 bg-white ${isSoldOut ? 'opacity-60' : ''}">
        <div class="flex items-center justify-between gap-2">
          <span class="inline-block self-start px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase ${accent.badge}">${tier.label}</span>
          ${seatsBadgeHtml}
        </div>
        <strong class="text-2xl font-black text-slate-900">$${price.toLocaleString()}</strong>
        <ul class="flex flex-col gap-1.5">${perksHtml}</ul>
        <button onclick="selectBookingFlight(${flight.id}, '${tier.key}')" class="mt-1 w-full py-2.5 ${accent.btn} text-white font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" ${isCancelled || isSoldOut ? 'disabled' : ''}>
          ${isSoldOut ? 'Đã hết vé' : 'Chọn vé'}
        </button>
      </div>
    `;
  }).join('');

  return `
    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6">
      ${buildFlightCardHeaderHtml(flight)}
      <!-- Bảng so sánh 3 hạng vé -->
      <div class="flex flex-col sm:flex-row gap-4 pt-2">
        ${fareColumnsHtml}
      </div>
    </div>
  `;
}

// Thẻ chuyến bay cho bước chọn CHUYẾN VỀ (khứ hồi) — hạng vé đã được chốt ở chuyến đi,
// nên chỉ cần hiện đúng 1 mức giá theo hạng đó + nút chọn giờ bay, không cần so sánh lại.
function buildReturnFlightCardHtml(flight) {
  const isCancelled = flight.status === 'Cancelled';
  let price = flight.priceEco;
  if (currentBooking.cabinClass === 'SkyBoss') price = flight.priceSkyBoss;
  else if (currentBooking.cabinClass === 'Promo') price = flight.pricePromo;

  return `
    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6">
      ${buildFlightCardHeaderHtml(flight)}
      <div class="flex items-center justify-between gap-4 pt-2">
        <div>
          <span class="text-[10px] font-mono text-slate-400 uppercase block">Giá hạng ${getCabinLabelShort(currentBooking.cabinClass)} (chuyến về) / khách</span>
          <strong class="text-2xl font-black text-slate-900">$${price.toLocaleString()}</strong>
        </div>
        <button onclick="selectReturnFlight(${flight.id})" class="px-6 py-3 bg-gradient-to-r from-sky-500 to-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] text-white font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" ${isCancelled ? 'disabled' : ''}>
          Chọn chuyến về này
        </button>
      </div>
    </div>
  `;
}

// Booking flight save callback — nhận thêm hạng vé được chọn ngay tại bảng so sánh.
// Nếu là vé Khứ hồi thì chuyển sang bước chọn CHUYẾN VỀ trước khi qua bước Hành khách.
function selectBookingFlight(id, cabinClass) {
  const selected = flightsDb.find(f => f.id === id);
  if (!selected) return;

  if (selected.status === 'Cancelled') {
    triggerToast('❌ Chuyến bay này đã bị HỦY do điều kiện khí tượng bất khả kháng!');
    return;
  }

  // Kiểm tra sớm phía client (dữ liệu seatsLeft từ lần tải flightsDb gần nhất).
  // Đây CHỈ là lớp cảnh báo UX — kiểm tra THẬT SỰ đáng tin cậy vẫn nằm ở book.php
  // (chạy trong transaction, khóa dòng FOR UPDATE) vì dữ liệu ở đây có thể đã cũ
  // nếu người khác vừa đặt vé trong lúc mình đang xem màn hình này.
  const tier = FARE_TIERS.find(t => t.key === (cabinClass || 'Eco'));
  const seatsLeft = tier ? (selected[tier.seatsLeftField] ?? 0) : 0;
  if (seatsLeft <= 0) {
    triggerToast('❌ Rất tiếc, hạng vé này vừa hết chỗ! Vui lòng chọn hạng khác hoặc chuyến bay khác.');
    navigateTo('select_flight'); // vẽ lại danh sách để cập nhật số vé còn mới nhất
    return;
  }

  currentBooking.selectedFlight = selected;
  currentBooking.cabinClass = cabinClass || 'Eco';

  if (currentBooking.tripType === 'RoundTrip') {
    triggerToast(`🎫 Đã chọn chuyến đi ${selected.flightNumber} — Hạng ${getCabinLabelShort(currentBooking.cabinClass)}. Giờ chọn chuyến về!`);
    currentBooking.selectingReturnLeg = true;
    navigateTo('select_flight'); // tái sử dụng lại màn này, đổi sang chế độ chọn CHUYẾN VỀ
    // CHƯA startCountdown() ở đây — khứ hồi phải chọn xong CẢ 2 chặng mới coi là
    // "tạm đặt vé" hoàn tất (xem selectReturnFlight() là nơi thật sự cấp deadline).
  } else {
    triggerToast(`🎫 Đã chọn ${selected.flightNumber} — Hạng ${getCabinLabelShort(currentBooking.cabinClass)}`);
    navigateTo('passenger');
    // Một chiều: chọn xong chuyến bay này là đã "tạm đặt vé" theo đề bài ("Nếu
    // còn đủ thì hệ thống sẽ tạm đặt số vé như khách hàng yêu cầu. Nếu trong 30
    // phút mà người dùng không hoàn tất thủ tục đăng kí thì sẽ xóa giao dịch
    // này.") -> bắt đầu đếm 30 phút NGAY tại đây, không phải từ lúc đăng nhập.
    startCountdown();
  }
}

// Chọn chuyến VỀ (chỉ xuất hiện trong luồng Khứ hồi, sau khi đã chọn chuyến đi + hạng vé)
function selectReturnFlight(id) {
  const selected = flightsDb.find(f => f.id === id);
  if (!selected) return;

  if (selected.status === 'Cancelled') {
    triggerToast('❌ Chuyến bay này đã bị HỦY do điều kiện khí tượng bất khả kháng!');
    return;
  }

  currentBooking.returnFlight = selected;
  currentBooking.selectingReturnLeg = false;
  triggerToast(`🎫 Đã chọn chuyến về ${selected.flightNumber}`);
  navigateTo('passenger');
  // Khứ hồi: chọn xong CẢ 2 chặng (đi + về) mới coi là "tạm đặt vé" hoàn tất
  // theo đề bài -> bắt đầu đếm 30 phút tại đây.
  startCountdown();
}
window.selectReturnFlight = selectReturnFlight;

// Seat layouter renderer screen
// bookedSeats được tải bất đồng bộ từ SQL Server rồi mới vẽ lại lưới ghế
async function renderSeatsScreen() {
  const seatsGrid = document.getElementById('rendered-seats-grid');
  if (!seatsGrid) return;

  seatsGrid.innerHTML = '<div class="col-span-6 text-center text-[#bacbbc]/50 font-mono text-xs py-6">⏳ Đang tải sơ đồ ghế từ hệ thống...</div>';
  currentBooking.selectedSeats = [];

  const nameIndicator = document.getElementById('seats-passenger-name-indicator');
  if (nameIndicator) {
    const primaryName = currentBooking.passengers[0]?.fullName || 'Hành Khách';
    nameIndicator.textContent = currentBooking.passengerCount > 1
      ? `${primaryName} (+${currentBooking.passengerCount - 1})`
      : primaryName;
  }

  const requiredEl = document.getElementById('seats-required-count');
  if (requiredEl) requiredEl.textContent = currentBooking.passengerCount;

  const priceIndicator = document.getElementById('seats-summary-total-price');
  if (priceIndicator) priceIndicator.textContent = `$${calculateTotalBill().toLocaleString()}`;

  // ── Xác định hạng vé và quy tắc ghế ──────────────────────────────────────
  // SkyBoss (Thương Gia) : chỉ được chọn hàng 1–2 (VIP)
  // Eco / Promo (Phổ Thông): chỉ được chọn hàng 3–8 (Economy)
  const cabinClass = currentBooking.cabinClass; // 'SkyBoss' | 'Eco' | 'Promo'
  const isSkyBoss = cabinClass === 'SkyBoss';

  // ── Lấy danh sách ghế đã đặt thật từ SQL Server ─────────────────────────
  let bookedSeats = ['A2', 'C4', 'B5', 'D7', 'A4', 'C1']; // fallback mặc định
  if (currentBooking.selectedFlight) {
    try {
      const res = await fetch(`${API_BASE}/booked_seats.php?flight_id=${currentBooking.selectedFlight.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.bookedSeats)) {
        bookedSeats = data.bookedSeats;
        isBackendOnline = true;
        console.log(`✅ Sơ đồ ghế: ${bookedSeats.length} ghế đã đặt từ SQL Server.`);
      }
    } catch (err) {
      console.warn('⚠️ Không lấy được danh sách ghế thật từ SQL Server — dùng dữ liệu mẫu.');
    }
  }
  updateBackendStatusBadge();

  // ── Vẽ chú thích hạng vé trên sơ đồ ghế ─────────────────────────────────
  const cabinNote = document.getElementById('seats-cabin-class-note');
  if (cabinNote) {
    if (isSkyBoss) {
      cabinNote.innerHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold">👑 Hạng ${getCabinLabelShort(cabinClass)} — Chỉ được chọn ghế hàng 1–2 (Thương Gia)</span>`;
    } else {
      cabinNote.innerHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-300 font-mono text-[10px] font-bold">🪑 Hạng ${getCabinLabelShort(cabinClass)} — Chỉ được chọn ghế hàng 3–8 (Phổ Thông)</span>`;
    }
    cabinNote.classList.remove('hidden');
  }

  // ── Xây dựng lưới ghế ────────────────────────────────────────────────────
  seatsGrid.innerHTML = '';
  const alphaRows = ['A', 'B', 'C', 'D'];
  const columnsCount = 8;

  // Header hàng ghế (A B | lối đi | C D)
  seatsGrid.appendChild(document.createElement('div')); // góc trên-trái
  ['A', 'B'].forEach(letter => {
    const lbl = document.createElement('div');
    lbl.className = 'flex items-center justify-center font-mono text-[9px] text-slate-400 font-bold';
    lbl.textContent = letter;
    seatsGrid.appendChild(lbl);
  });
  seatsGrid.appendChild(document.createElement('div')); // khoảng lối đi
  ['C', 'D'].forEach(letter => {
    const lbl = document.createElement('div');
    lbl.className = 'flex items-center justify-center font-mono text-[9px] text-slate-400 font-bold';
    lbl.textContent = letter;
    seatsGrid.appendChild(lbl);
  });

  for (let col = 1; col <= columnsCount; col++) {
    // Label số hàng
    const headLabel = document.createElement('div');
    headLabel.className = 'flex items-center justify-center font-mono text-[9px] text-[#bacbbc]/70 font-bold';
    headLabel.textContent = col;
    seatsGrid.appendChild(headLabel);

    alphaRows.forEach(row => {
      const seatId = `${row}${col}`;
      const isVipRow = col <= 2;           // Hàng 1-2: Thương Gia (SkyBoss)
      const isEcoRow = col >= 3;           // Hàng 3-8: Phổ Thông (Eco / Promo)
      const isBooked = bookedSeats.includes(seatId);

      // Ghế bị khoá vì sai hạng vé
      const isWrongClass = (isSkyBoss && isEcoRow) || (!isSkyBoss && isVipRow);

      const seatBtn = document.createElement('button');
      seatBtn.id = `seat-btn-cell-${seatId}`;
      seatBtn.dataset.seatId = seatId;
      seatBtn.dataset.isVip = isVipRow ? '1' : '0';
      seatBtn.dataset.wrongClass = isWrongClass ? '1' : '0';
      seatBtn.type = 'button';

      if (isBooked) {
        seatBtn.className = 'w-10 h-10 rounded-xl border font-mono text-xs flex flex-col items-center justify-center transition-all cursor-not-allowed select-none relative bg-red-500/15 border-red-500/30 text-red-500/40';
        seatBtn.title = 'Ghế đã được đặt';
      } else if (isWrongClass) {
        // Ghế bị khoá vì không đúng hạng vé — hiển thị mờ + ổ khoá
        const lockStyle = isVipRow
          ? 'bg-amber-900/20 border-amber-500/15 text-amber-500/25 cursor-not-allowed'
          : 'bg-white/[0.02] border-white/5 text-white/15 cursor-not-allowed';
        seatBtn.className = `w-10 h-10 rounded-xl border font-mono text-xs flex flex-col items-center justify-center transition-all select-none relative ${lockStyle}`;
        seatBtn.title = isVipRow
          ? 'Chỉ dành cho hạng SkyBoss Thương Gia'
          : 'Chỉ dành cho hạng Eco / Promo Phổ Thông';
      } else if (isVipRow) {
        seatBtn.className = 'w-10 h-10 rounded-xl border font-mono text-xs flex flex-col items-center justify-center transition-all cursor-pointer select-none relative bg-amber-500/5 hover:bg-amber-500/15 border-amber-500/30 text-amber-300';
        seatBtn.title = `Ghế thương gia ${seatId} — $45`;
      } else {
        seatBtn.className = 'w-10 h-10 rounded-xl border font-mono text-xs flex flex-col items-center justify-center transition-all cursor-pointer select-none relative bg-white/5 hover:bg-white/10 border-white/10 text-white';
        seatBtn.title = `Ghế phổ thông ${seatId} — $15`;
      }

      const priceLabel = isBooked ? '—' : isWrongClass ? '🔒' : isVipRow ? '$45' : '$15';
      seatBtn.innerHTML = `
        <span class="font-bold">${seatId}</span>
        <span class="text-[7px] text-[#bacbbc]/50 font-sans mt-0.5">${priceLabel}</span>
      `;

      if (!isBooked && !isWrongClass) {
        seatBtn.addEventListener('click', () => toggleSeatSelection(seatId));
      }

      seatsGrid.appendChild(seatBtn);

      // Lối đi giữa máy bay (sau ghế B)
      if (row === 'B') {
        seatsGrid.appendChild(document.createElement('div'));
      }
    });
  }
}

// Interactive seat clicker state toggles
function toggleSeatSelection(seatId) {
  const btn = document.getElementById(`seat-btn-cell-${seatId}`);
  if (!btn) return;

  // ── Kiểm tra quy tắc hạng vé trước khi cho chọn ──────────────────────────
  const isVipRow = btn.dataset.isVip === '1';     // hàng 1-2 (Thương Gia)
  const cabinClass = currentBooking.cabinClass;
  const isSkyBoss = cabinClass === 'SkyBoss';

  if (isSkyBoss && !isVipRow) {
    triggerToast('🔒 Hạng SkyBoss Thương Gia chỉ được chọn ghế hàng 1–2!');
    return;
  }
  if (!isSkyBoss && isVipRow) {
    triggerToast(`🔒 Hạng ${getCabinLabelShort(cabinClass)} Phổ Thông chỉ được chọn ghế hàng 3–8!`);
    return;
  }

  const index = currentBooking.selectedSeats.indexOf(seatId);

  if (index !== -1) { // Bỏ chọn
    playChime('click');
    currentBooking.selectedSeats.splice(index, 1);
    if (isVipRow) {
      btn.className = 'w-10 h-10 rounded-xl border font-mono text-xs flex flex-col items-center justify-center transition-all cursor-pointer select-none bg-amber-500/5 hover:bg-amber-500/15 border-amber-500/30 text-amber-300';
    } else {
      btn.className = 'w-10 h-10 rounded-xl border font-mono text-xs flex flex-col items-center justify-center transition-all cursor-pointer select-none bg-white/5 hover:bg-white/10 border-white/10 text-white';
    }
  } else { // Chọn ghế
    // Số ghế không vượt quá số hành khách
    if (currentBooking.selectedSeats.length >= currentBooking.passengerCount) {
      triggerToast(`⚠️ Bạn chỉ đặt ${currentBooking.passengerCount} hành khách — hãy bỏ chọn 1 ghế khác trước!`);
      return;
    }
    playChime('click');
    currentBooking.selectedSeats.push(seatId);
    btn.className = 'w-10 h-10 rounded-xl border border-[#2af598] bg-[#2af598]/20 text-white font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer shadow-[0_0_15px_rgba(42,245,152,0.4)]';
  }

  // Cập nhật thanh tóm tắt ghế đã chọn
  const summarySeatsList = document.getElementById('summary-selected-seats');
  if (summarySeatsList) {
    const progress = `${currentBooking.selectedSeats.length}/${currentBooking.passengerCount}`;
    summarySeatsList.textContent = currentBooking.selectedSeats.length > 0
      ? `${currentBooking.selectedSeats.join(', ')} (${progress})`
      : `Chưa chọn (0/${currentBooking.passengerCount})`;
  }

  const priceIndicator = document.getElementById('seats-summary-total-price');
  if (priceIndicator) {
    priceIndicator.textContent = `$${calculateTotalBill().toLocaleString()}`;
  }
}

// Invoice billing calculation core
function calculateTotalBill() {
  if (!currentBooking.selectedFlight) return 0;

  let baseRate = currentBooking.selectedFlight.priceEco;
  if (currentBooking.cabinClass === 'SkyBoss') baseRate = currentBooking.selectedFlight.priceSkyBoss;
  if (currentBooking.cabinClass === 'Promo') baseRate = currentBooking.selectedFlight.pricePromo;

  // Khứ hồi: cộng thêm giá chuyến về (cùng hạng vé) vào giá vé cơ bản / hành khách
  if (currentBooking.tripType === 'RoundTrip' && currentBooking.returnFlight) {
    let returnRate = currentBooking.returnFlight.priceEco;
    if (currentBooking.cabinClass === 'SkyBoss') returnRate = currentBooking.returnFlight.priceSkyBoss;
    if (currentBooking.cabinClass === 'Promo') returnRate = currentBooking.returnFlight.pricePromo;
    baseRate += returnRate;
  }

  // Single seat rate surcharge calculation
  const seatFees = currentBooking.selectedSeats.reduce((total, seat) => {
    const isVip = seat.endsWith('1') || seat.endsWith('2');
    return total + (isVip ? 45 : 15);
  }, 0);

  // Addons fees
  const addOnFees = currentBooking.selectedAddons.reduce((acc, currentItem) => acc + currentItem.price, 0);

  // Cumulative price tag multiplication by passengers count (seats booked)
  // Trước khi vào bước chọn ghế, selectedSeats rỗng — tạm ước tính theo passengerCount
  // để giá hiển thị ở bước "Thông Tin Hành Khách" không bị hiểu nhầm là giá cho 1 người.
  const ticketCount = Math.max(currentBooking.passengerCount, currentBooking.selectedSeats.length);
  const mainFares = baseRate * ticketCount;

  return mainFares + seatFees + addOnFees;
}

// Generate checkout screen dynamic invoice list reciept
function renderCheckoutScreen() {
  const flight = currentBooking.selectedFlight;
  if (!flight) return;

  const totalBill = calculateTotalBill();

  // Draw prices fields in HTML
  document.getElementById('receipt-flight-info').textContent = `${getFlightNumbersLabel()} (${getCabinLabel(currentBooking.cabinClass)})`;
  document.getElementById('receipt-route').textContent = getRouteLabel();
  document.getElementById('receipt-date').textContent = currentBooking.departureDate;
  
  let baseRate = flight.priceEco;
  if (currentBooking.cabinClass === 'SkyBoss') baseRate = flight.priceSkyBoss;
  if (currentBooking.cabinClass === 'Promo') baseRate = flight.pricePromo;

  document.getElementById('receipt-base-price').textContent = `$${baseRate.toLocaleString()} x ${currentBooking.selectedSeats.length}`;
  document.getElementById('receipt-base-total').textContent = `$${(baseRate * currentBooking.selectedSeats.length).toLocaleString()}`;
  document.getElementById('receipt-seats-list').textContent = currentBooking.selectedSeats.join(', ');

  const seatSurcharges = currentBooking.selectedSeats.reduce((total, s) => total + (s.endsWith('1') || s.endsWith('2') ? 45 : 15), 0);
  document.getElementById('receipt-seats-fee').textContent = `$${seatSurcharges.toLocaleString()}`;

  // Addons list inside invoice
  const listAddonsContainer = document.getElementById('receipt-addons-list-summary');
  if (listAddonsContainer) {
    listAddonsContainer.innerHTML = '';
    if (currentBooking.selectedAddons.length === 0) {
      listAddonsContainer.innerHTML = `
        <div class="flex justify-between items-center text-xs opacity-60 font-mono">
          <span>Không có tiện ích đi kèm</span>
          <span>$0</span>
        </div>
      `;
    } else {
      currentBooking.selectedAddons.forEach(ad => {
        listAddonsContainer.innerHTML += `
          <div class="flex justify-between items-center text-xs font-mono">
            <span class="text-[#bacbbc]">🎁 ${ad.name}:</span>
            <span class="text-white font-bold">$${ad.price}</span>
          </div>
        `;
      });
    }
  }

  // Grand complete total bill
  document.getElementById('receipt-grand-total').textContent = `$${totalBill.toLocaleString()}`;
}

// Draw Ticket Details invoice successful window
function renderSuccessTicket(bookingRef) {
  const ticketId = document.getElementById('success-booking-id');
  const passName = document.getElementById('success-passenger');
  const fliNum = document.getElementById('success-flight-number');
  const flightRoute = document.getElementById('success-route');
  const fliDept = document.getElementById('success-departure-time');
  const fliSeat = document.getElementById('success-seat');
  const fliCab = document.getElementById('success-class');
  const fliTotal = document.getElementById('success-total-paid');

  if (ticketId) ticketId.textContent = bookingRef.id;
  if (passName) passName.textContent = bookingRef.passengerName;
  if (fliNum) fliNum.textContent = getFlightNumbersLabel();
  if (flightRoute) flightRoute.textContent = getRouteLabel();
  if (fliDept) {
    fliDept.textContent = currentBooking.tripType === 'RoundTrip' && currentBooking.returnFlight
      ? `Đi: ${currentBooking.departureDate} ${currentBooking.selectedFlight.departureTime}  •  Về: ${currentBooking.returnDate} ${currentBooking.returnFlight.departureTime}`
      : currentBooking.departureDate + ' ' + currentBooking.selectedFlight.departureTime;
  }
  if (fliSeat) fliSeat.textContent = bookingRef.seat;
  if (fliCab) fliCab.textContent = getCabinLabel(currentBooking.cabinClass);
  if (fliTotal) fliTotal.textContent = `$${bookingRef.totalPrice.toLocaleString()}`;
}

// Operational Admin Screen panels layout state updates
function renderAdminDashboard() {
  const tableBody = document.getElementById('admin-flights-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  flightsDb.forEach(flight => {
    const row = document.createElement('tr');
    row.className = "border-b border-white/5 hover:bg-white/[0.02] text-xs font-mono transition-colors";

    row.innerHTML = `
      <td class="px-5 py-4 font-bold text-[#2af598]">${flight.flightNumber}</td>
      <td class="px-5 py-4 text-white">${flight.origin.split(' ')[0]} ➔ ${flight.destination.split(' ')[0]}</td>
      <td class="px-5 py-4 text-[#bacbbc]">${flight.departureTime}</td>
      <td class="px-5 py-4">
        <span class="px-2.5 py-1 rounded-full text-[9px] font-bold ${
          flight.status === 'Scheduled' 
            ? 'bg-emerald-500/10 text-emerald-400' 
            : flight.status === 'Delayed'
            ? 'bg-amber-500/10 text-amber-400'
            : 'bg-red-500/10 text-red-500'
        }">
          ${flight.status}
        </span>
      </td>
      <td class="px-5 py-4 text-right">
        <div class="flex items-center gap-1.5 justify-end">
          <button onclick="adminSetFlightStatus(${flight.id}, 'Scheduled')" class="px-2.5 py-1 text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-all font-bold cursor-pointer font-sans">
            VẬN HÀNH
          </button>
          <button onclick="adminSetFlightStatus(${flight.id}, 'Delayed')" class="px-2.5 py-1 text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 transition-all font-bold cursor-pointer font-sans">
            HOÃN
          </button>
          <button onclick="adminSetFlightStatus(${flight.id}, 'Cancelled')" class="px-2.5 py-1 text-[9px] bg-red-500/15 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all font-bold cursor-pointer font-sans">
            HỦY CA
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Populate dynamic Admin Passenger Table card (Dan Sach Ve & Hanh Khach Dang Ky)
  const bookingsTableBody = document.getElementById('admin-bookings-table-body');
  const passengerCountBadge = document.getElementById('admin-passenger-count');
  
  if (bookingsTableBody) {
    bookingsTableBody.innerHTML = '';
    
    // Count active passengers (not cancelled)
    const activeCount = bookingsDb.filter(b => b.status !== 'Cancelled').length;
    if (passengerCountBadge) {
      passengerCountBadge.textContent = `${activeCount} hành khách`;
    }
    
    if (bookingsDb.length === 0) {
      bookingsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="py-6 text-center text-xs text-slate-500 font-semibold font-sans">
            Chưa có hành khách nào đăng ký mua vé trực tuyến
          </td>
        </tr>
      `;
    } else {
      bookingsDb.forEach(b => {
        const isCancelled = b.status === 'Cancelled';
        const statusBadge = isCancelled
          ? `<span class="px-2.5 py-1 rounded-xl text-[9px] bg-rose-50 text-rose-700 border border-rose-100 font-extrabold uppercase font-sans">Đã hủy</span>`
          : `<span class="px-2.5 py-1 rounded-xl text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold uppercase font-sans">CONFIRMED</span>`;
        
        const row = document.createElement('tr');
        row.className = `border-b border-slate-100 hover:bg-slate-50 text-xs font-sans transition-colors ${isCancelled ? 'opacity-60' : ''}`;
        
        row.innerHTML = `
          <td class="px-5 py-4 font-mono font-black text-slate-700">${b.id}</td>
          <td class="px-5 py-4 font-bold text-slate-900">${b.passengerName}</td>
          <td class="px-5 py-4 font-mono font-bold text-sky-700">${b.flightNumber}</td>
          <td class="px-5 py-4">
            <span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-extrabold">${getCabinLabel(b.cabinClass)}</span> • 
            <strong class="text-slate-950 font-mono font-black">${b.seat || 'K3'}</strong>
          </td>
          <td class="px-5 py-4 font-mono font-bold text-emerald-600 text-sm">$${b.totalPrice}</td>
          <td class="px-5 py-4">${statusBadge}</td>
          <td class="px-5 py-4 text-right">
            <button onclick="cancelBookingTicket('${b.id}')" 
                    class="px-3.5 py-1 rounded-xl transition-all text-[11px] font-bold font-sans flex items-center gap-1.5 ml-auto cursor-pointer ${
                      isCancelled 
                        ? 'bg-slate-150 text-slate-400 border border-slate-200 cursor-not-allowed opacity-40' 
                        : 'bg-red-50 hover:bg-rose-100 text-red-650 hover:text-red-700 border border-red-100 shadow-sm'
                    }"
                    ${isCancelled ? 'disabled' : ''}>
              Hủy vé
            </button>
          </td>
        `;
        bookingsTableBody.appendChild(row);
      });
    }
  }

  // Calculate live statistics of successful active orders (excluding initial seeds logic or synced status)
  const totalRevenue = bookingsDb.reduce((acc, curr) => {
    return curr.status !== 'Cancelled' ? acc + curr.totalPrice : acc;
  }, 6380); // Seed initial standard revenue to look solid
  
  const successBookings = bookingsDb.filter(curr => curr.status !== 'Cancelled').length + 8; // Seed starting bookings count
  
  document.getElementById('admin-stat-revenue').textContent = `$${totalRevenue.toLocaleString()}`;
  document.getElementById('admin-stat-bookings-count').textContent = `${successBookings} lượt`;
  document.getElementById('admin-stat-flights-count').textContent = `${flightsDb.length} tuyến`;
}

// Live Status manipulation from Admin
async function adminSetFlightStatus(flightId, newStatus) {
  const flight = flightsDb.find(f => f.id === flightId);
  if (!flight) return;

  flight.status = newStatus;
  triggerToast(`⚡ Trạng thái chuyến bay ${flight.flightNumber} đã chuyển thành ${newStatus}!`);
  playChime('click');
  renderAdminDashboard();

  // Đồng bộ vào SQL Server (chỉ admin mới gọi được — server tự kiểm tra qua session)
  try {
    const res = await fetch(`${API_BASE}/admin_flight_status.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flightId, status: newStatus })
    });
    const data = await res.json();
    if (data.success) isBackendOnline = true;
    else console.warn('⚠️ SQL Server từ chối cập nhật trạng thái chuyến bay:', data.message);
  } catch (err) {
    console.warn('⚠️ Không đồng bộ được trạng thái chuyến bay với SQL Server. Lý do:', err.message);
  }
}

// IDE Tabs panel for the PHP code exporter
let activeTabFileName = 'database.sql';
function renderPhpTabs() {
  const listTabsMenu = document.getElementById('php-files-tab-menu');
  if (!listTabsMenu) return;

  listTabsMenu.innerHTML = '';

  Object.keys(PHP_FILES).forEach(fileName => {
    const isSelected = activeTabFileName === fileName;
    const btn = document.createElement('button');
    btn.className = `flex items-center gap-3 px-4 py-3 rounded-xl transition-all border text-left cursor-pointer ${
      isSelected 
        ? 'bg-gradient-to-r from-emerald-500/10 to-[#2af598]/20 border-[#2af598]/35 text-white font-bold' 
        : 'bg-white/5 border-transparent hover:border-white/10 text-[#bacbbc]'
    }`;
    btn.innerHTML = `
      <i data-lucide="${fileName.endsWith('.sql') ? 'database' : 'code'}" class="w-4 h-4 text-emerald-400"></i>
      <div class="truncate">
        <span class="block text-xs font-mono font-bold">${fileName}</span>
      </div>
    `;

    btn.addEventListener('click', () => {
      activeTabFileName = fileName;
      playChime('click');
      renderPhpTabs();
    });

    listTabsMenu.appendChild(btn);
  });

  // Load editor code parameters
  const currentFile = PHP_FILES[activeTabFileName];
  const elLabel = document.getElementById('php-active-filename-badge');
  const elDesc = document.getElementById('php-file-desc-box');
  const elPre = document.getElementById('php-code-pre-box');

  if (elLabel) elLabel.textContent = activeTabFileName;
  if (elDesc) elDesc.textContent = currentFile.desc;
  if (elPre) elPre.textContent = currentFile.code;

  lucide.createIcons();
}

// Copy Code Clipboard utility button
function copyCodeToClipboard() {
  const codeContent = PHP_FILES[activeTabFileName].code;
  navigator.clipboard.writeText(codeContent).then(() => {
    const copyBtn = document.getElementById('btn-copy-php-code');
    const originalHtml = copyBtn.innerHTML;
    copyBtn.innerHTML = `
      <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>
      <span class="text-emerald-400 font-bold">Đã sao chép!</span>
    `;
    lucide.createIcons();
    triggerToast('📋 Sao chép mã nguồn file PHP thành công!');
    setTimeout(() => {
      copyBtn.innerHTML = originalHtml;
      lucide.createIcons();
    }, 2000);
  }).catch(() => {
    triggerToast('⚠️ Lỗi sao chép tệp tin!');
  });
}

// ============================================================================
// MEGA MENU — vẽ thanh điều hướng tổng quan + khung nội dung sổ xuống (flyout)
// ============================================================================

let activeMegaMenuKey = null; // category đang mở (null = đang đóng)

// Vẽ 6 nút danh mục (từ MEGA_MENU) + 1 nút "Trợ Giúp" mở thẳng CloudBot
function renderMegaNavBar() {
  const container = document.getElementById('mega-nav-bar');
  if (!container) return;

  const categoryButtons = MEGA_MENU.map(cat => `
    <button data-mega-key="${cat.key}" onclick="toggleMegaMenu('${cat.key}')" class="mega-nav-btn flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-mono font-semibold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer">
      <i data-lucide="${cat.icon}" class="w-4 h-4"></i>
      <span>${cat.label}</span>
    </button>
  `).join('');

  const helpButton = `
    <button onclick="toggleChatWidget()" class="mega-nav-btn flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-mono font-semibold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer">
      <i data-lucide="help-circle" class="w-4 h-4"></i>
      <span>Trợ Giúp</span>
    </button>
  `;

  container.innerHTML = categoryButtons + helpButton;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Mở/đóng khung flyout của 1 danh mục — bấm lại nút đang mở sẽ đóng nó
function toggleMegaMenu(key) {
  // Đóng khung chat CloudBot nếu đang mở, tránh 2 lớp nổi che nhau
  const chatPanel = document.getElementById('chat-widget-panel');
  if (chatPanel && !chatPanel.classList.contains('hidden')) {
    chatPanel.classList.add('hidden');
  }

  if (activeMegaMenuKey === key) {
    closeMegaMenu();
    return;
  }
  activeMegaMenuKey = key;
  renderMegaMenuFlyout(key);
  playChime('click');
}
window.toggleMegaMenu = toggleMegaMenu;

function closeMegaMenu() {
  activeMegaMenuKey = null;
  const flyout = document.getElementById('mega-menu-flyout');
  const backdrop = document.getElementById('mega-menu-backdrop');
  if (flyout) { flyout.classList.add('hidden'); flyout.innerHTML = ''; }
  if (backdrop) backdrop.classList.add('hidden');
}
window.closeMegaMenu = closeMegaMenu;

function renderMegaMenuFlyout(key) {
  const category = MEGA_MENU.find(c => c.key === key);
  const flyout = document.getElementById('mega-menu-flyout');
  const backdrop = document.getElementById('mega-menu-backdrop');
  if (!category || !flyout) return;

  const colsClass = category.sections.length >= 2 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-xl';

  flyout.innerHTML = `
    <div class="max-w-6xl mx-auto px-8 py-8">
      <div class="grid grid-cols-1 ${colsClass} gap-x-12 gap-y-6">
        ${category.sections.map(sec => `
          <div>
            ${sec.title ? `<span class="text-[11px] font-mono font-bold text-emerald-600 uppercase tracking-wider block mb-3 pb-2 border-b border-slate-100">${sec.title}</span>` : ''}
            <ul class="space-y-2.5 ${sec.title ? '' : 'grid grid-cols-1 sm:grid-cols-2 gap-x-8'}">
              ${sec.links.map(link => `
                <li>
                  <button onclick="openInfoModal('${link.slug}')" class="text-left text-sm text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer flex items-center gap-2 group w-full">
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0"></i>
                    <span>${link.label}</span>
                  </button>
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  flyout.classList.remove('hidden');
  if (backdrop) backdrop.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================================================
// INFO MODAL — hiển thị nội dung chi tiết khi bấm 1 mục trong Mega Menu
// ============================================================================

function openInfoModal(slug) {
  const content = INFO_CONTENT[slug];
  if (!content) return;

  closeMegaMenu();

  const modal = document.getElementById('info-modal');
  const titleEl = document.getElementById('info-modal-title');
  const bodyEl = document.getElementById('info-modal-body');
  const ctaContainer = document.getElementById('info-modal-cta');
  if (!modal || !titleEl || !bodyEl) return;

  titleEl.textContent = content.title;
  bodyEl.textContent = content.body;

  // Một số mục có nút hành động (CTA) khai báo kèm trong MEGA_MENU, ví dụ "Mua vé" -> "Đặt vé ngay"
  let cta = null;
  MEGA_MENU.forEach(cat => cat.sections.forEach(sec => {
    const found = sec.links.find(l => l.slug === slug && l.cta);
    if (found) cta = found.cta;
  }));

  if (ctaContainer) {
    if (!cta) {
      ctaContainer.innerHTML = '';
    } else {
      // "Quản lý đặt chỗ" trỏ tới Sảnh chung — cần đăng nhập trước, không thì đưa về màn đăng nhập
      const onclickJs = cta.action === 'lobby'
        ? "if (!isLoggedIn) { triggerToast('🔒 Vui lòng đăng nhập để quản lý đặt chỗ!'); closeInfoModal(); navigateTo('auth'); } else { closeInfoModal(); navigateTo('lobby'); }"
        : `closeInfoModal(); navigateTo('${cta.action}')`;
      ctaContainer.innerHTML = `
        <button onclick="${onclickJs}" class="w-full py-3 bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-bold rounded-xl text-xs hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5">
          <span>${cta.label}</span><i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
        </button>
      `;
    }
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}
window.openInfoModal = openInfoModal;

function closeInfoModal() {
  const modal = document.getElementById('info-modal');
  if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}
window.closeInfoModal = closeInfoModal;

// ============================================================================
// CLOUDBOT — trợ lý ảo dạng chat (rule-based, không cần gọi API ngoài)
// ============================================================================

let chatMessages = [
  { sender: 'bot', text: 'Xin chào! Mình là CloudBot 🤖 — trợ lý ảo của Cloud Airline. Mình có thể giúp gì cho hành trình của bạn? (vé, hành lý, hoàn/đổi vé, chọn ghế, CloudMiles...)' }
];

function toggleChatWidget() {
  closeMegaMenu();
  const panel = document.getElementById('chat-widget-panel');
  if (!panel) return;

  const willOpen = panel.classList.contains('hidden');
  panel.classList.toggle('hidden');
  if (willOpen) {
    renderChatMessages();
    const input = document.getElementById('chat-input');
    if (input) input.focus();
  }
  playChime('click');
}
window.toggleChatWidget = toggleChatWidget;

function renderChatMessages() {
  const list = document.getElementById('chat-messages-list');
  if (!list) return;
  list.innerHTML = chatMessages.map(m => `
    <div class="flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}">
      <div class="max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
        m.sender === 'user'
          ? 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-br-sm'
          : 'bg-slate-100 text-slate-700 rounded-bl-sm'
      }">${m.text}</div>
    </div>
  `).join('');
  list.scrollTop = list.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  chatMessages.push({ sender: 'user', text });
  input.value = '';
  renderChatMessages();

  // Giả lập độ trễ trả lời cho tự nhiên — đây là bot rule-based, không gọi API ngoài
  setTimeout(() => {
    chatMessages.push({ sender: 'bot', text: getCloudBotReply(text) });
    renderChatMessages();
  }, 450);
}
window.sendChatMessage = sendChatMessage;

function handleChatInputKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendChatMessage();
  }
}
window.handleChatInputKeydown = handleChatInputKeydown;

// Bộ trả lời theo từ khoá — đủ để CloudBot trả lời có ích cho các câu hỏi thường gặp nhất
function getCloudBotReply(message) {
  const text = message.toLowerCase();

  const RULES = [
    { keywords: ['hành lý', 'ky gui', 'xách tay', 'baggage'], reply: 'Về hành lý: Promo chỉ có xách tay 7kg, Eco miễn cước 23kg ký gửi, SkyBoss miễn cước 32kg. Bạn có thể mua thêm hành lý ở bước "Tiện Ích" khi đặt vé nha!' },
    { keywords: ['hủy', 'huỷ', 'hoàn vé', 'hoàn tiền'], reply: 'Bạn có thể hủy vé trực tiếp tại Sảnh Chung → mục "Danh Sách Vé Đã Đặt", bấm "Hủy chuyến bay". Vé Eco/SkyBoss được hoàn tiền vào ví sandbox ngay lập tức.' },
    { keywords: ['đổi vé', 'đổi chuyến', 'doi ve'], reply: 'Hạng SkyBoss được đổi chuyến miễn phí 1 lần, hạng Eco áp dụng phụ phí đổi vé, hạng Promo hiện chưa hỗ trợ đổi chuyến.' },
    { keywords: ['ghế', 'seat', 'chỗ ngồi'], reply: 'Bạn chọn ghế trực quan ngay trong sơ đồ máy bay ở bước "Chọn Ghế" khi đặt vé. Hàng 1-2 là khu Skyboss/VIP (phụ thu $45); ghế Eco tiêu chuẩn phụ thu $15.' },
    { keywords: ['giá', 'gia ve', 'bao nhiêu tiền', 'tiền vé'], reply: 'Giá vé thay đổi theo hạng (Promo/Eco/SkyBoss) — bạn so sánh đầy đủ giá & quyền lợi 3 hạng ngay trong trang kết quả tìm chuyến bay.' },
    { keywords: ['thanh toán', 'payment', 'trả tiền', 'thẻ'], reply: 'Cloud Airline hỗ trợ thanh toán bằng thẻ Visa/Mastercard/Amex ngay trên website (môi trường sandbox demo cho mục đích học tập).' },
    { keywords: ['check-in', 'checkin', 'làm thủ tục'], reply: 'Bạn có thể làm thủ tục trực tuyến (mở trước 24h), tại kiosk sân bay, hoặc tại quầy truyền thống (mở 2-3h trước giờ bay).' },
    { keywords: ['cloudmiles', 'dặm', 'tích điểm', 'thành viên'], reply: 'CloudMiles là chương trình khách hàng thân thiết — tích dặm mỗi khi bay để đổi vé thưởng, nâng hạng và nhiều ưu đãi độc quyền. Đăng ký miễn phí ngay khi tạo tài khoản!' },
    { keywords: ['admin', 'quản trị'], reply: 'Mình chỉ hỗ trợ thông tin cho hành khách thôi nha — bạn vui lòng liên hệ bộ phận kỹ thuật nếu cần quyền quản trị hệ thống 😊' },
    { keywords: ['chào', 'hello', 'hi ', 'xin chào'], reply: 'Chào bạn! Mình có thể giúp gì về chuyến bay, hành lý, hoàn/đổi vé, chọn ghế hoặc chương trình CloudMiles không?' }
  ];

  for (const rule of RULES) {
    if (rule.keywords.some(k => text.includes(k))) {
      return rule.reply;
    }
  }

  return 'Cảm ơn câu hỏi của bạn! CloudBot hiện vẫn đang trong giai đoạn demo nên chưa trả lời được hết mọi câu hỏi 🙏 Bạn thử hỏi về "hành lý", "hủy vé", "chọn ghế", "thanh toán" hoặc "CloudMiles" xem, hoặc bấm vào menu phía trên để xem thông tin chi tiết nhé!';
}

// Assign global listeners
window.addEventListener('DOMContentLoaded', initializeApp);
