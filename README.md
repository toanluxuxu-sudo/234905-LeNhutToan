# Hệ thống quản lý thiết bị phòng học

## Thông tin sinh viên

- MSSV: 234905
- Họ tên: Lê Nhứt Toàn
- Học phần: Điện toán đám mây

## Mô tả đề tài

Xây dựng ứng dụng quản lý thiết bị phòng học, hỗ trợ xem danh sách,
xem chi tiết, thêm, cập nhật, xóa và tìm kiếm thiết bị.
Hệ thống theo dõi số lượng và tình trạng sử dụng thiết bị.

## Công nghệ sử dụng

- Frontend: React
- Backend: Node.js, Express
- Cơ sở dữ liệu: MongoDB Atlas
- Quản lý mã nguồn: Git, GitHub
- Đóng gói: Docker
- Lưu trữ image: Docker Hub
- Triển khai: Render

## Cấu trúc dự án

```text
backend/     Mã nguồn backend API
frontend/    Mã nguồn giao diện React
.gitignore   Các tệp và thư mục không đưa lên Git
README.md    Tài liệu dự án
```

## Hướng dẫn cài đặt và chạy

Yêu cầu: Node.js 24 LTS và npm; MongoDB Atlas đã có database user
và cho phép IP của máy chạy backend.

### Backend

1. Mở terminal trong thư mục backend.
2. Chạy npm install.
3. Tạo tệp .env theo .env.example và điền cấu hình MongoDB Atlas.
4. Chạy npm start.

### Frontend (dự kiến ở Câu 4)

1. Mở terminal trong thư mục frontend.
2. Chạy npm install.
3. Cấu hình địa chỉ backend API.
4. Chạy npm run dev.
5. Truy cập địa chỉ được hiển thị trong terminal.

## Tiến độ

- Câu 1: Khởi tạo cấu trúc dự án và quản lý mã nguồn bằng GitHub.
- Câu 2: Tạo database MongoDB Atlas, cấu hình kết nối và dữ liệu mẫu.
- Câu 3: Xây dựng backend API và kiểm thử các chức năng quản lý thiết bị.
- Câu 4 trở đi: Giao diện React, Docker và triển khai Render sẽ được cập nhật sau.

## Câu 2. Tạo cơ sở dữ liệu MongoDB Atlas

- Database: 234905_LeNhutToan
- Collection: devices
- Có 3 thiết bị mẫu: máy chiếu, máy tính và thiết bị âm thanh.

### Các trường dữ liệu

deviceId, name, deviceType, room, brand, model,
quantity, status, purchaseDate, description.

### Trạng thái thiết bị

- Đang sử dụng
- Hư hỏng
- Đang sửa chữa
- Ngừng sử dụng

### Cấu hình kết nối

Sao chép backend/.env.example thành backend/.env.
Điền chuỗi kết nối MongoDB Atlas vào biến MONGODB_URI.

## Câu 3. Xây dựng backend API

### Cài đặt và khởi động

Từ thư mục gốc dự án, chạy:

```powershell
cd backend
npm ci
```

Nếu chưa có `.env`, sao chép tệp cấu hình mẫu:

```powershell
Copy-Item .env.example .env
```

Điền thông tin kết nối thật vào `MONGODB_URI` trong `backend/.env`.
Không ghi mật khẩu vào README hoặc đưa `.env` lên GitHub.

| Biến môi trường | Mục đích |
|---|---|
| `PORT` | Cổng backend, mặc định `5000` |
| `MONGODB_URI` | Chuỗi kết nối MongoDB Atlas, database `234905_LeNhutToan` |
| `FRONTEND_URL` | Origin frontend được phép đọc API qua CORS; mặc định `http://localhost:5173` |
| `MONGODB_DNS_SERVERS` | DNS riêng cho tiến trình Node, phân cách bằng dấu phẩy; dùng khi DNS mạng không phân giải được Atlas SRV |

Khởi động backend:

```powershell
npm start
```

Hoặc tự khởi động lại khi sửa mã:

```powershell
npm run dev
```

Backend chỉ mở cổng sau khi kết nối MongoDB và tạo unique index thành công.
Mặc định truy cập tại `http://localhost:5000`.

### Các API

| Phương thức | Endpoint | Chức năng |
|---|---|---|
| GET | `/health` | Kiểm tra backend và kết nối database |
| GET | `/api/devices` | Danh sách thiết bị |
| GET | `/api/devices/:id` | Xem chi tiết thiết bị |
| POST | `/api/devices` | Thêm thiết bị |
| PUT | `/api/devices/:id` | Cập nhật thiết bị |
| DELETE | `/api/devices/:id` | Xóa thiết bị |
| GET | `/api/devices?search=TB001` | Tìm theo mã, tên, loại thiết bị hoặc phòng học |

Tham số `:id` là `_id` của MongoDB, khác với mã thiết bị `deviceId`.
Các yêu cầu POST và PUT sử dụng `Content-Type: application/json`.

Ví dụ dữ liệu thêm thiết bị:

```json
{
  "deviceId": "TB004",
  "name": "Máy chiếu Epson",
  "deviceType": "Máy chiếu",
  "room": "A104",
  "brand": "Epson",
  "model": "EB-X06",
  "quantity": 1,
  "status": "Đang sử dụng",
  "purchaseDate": "2025-01-15",
  "description": "Thiết bị phục vụ giảng dạy"
}
```

### Kiểm tra dữ liệu và xử lý lỗi

- `deviceId` bắt buộc và không được trùng.
- `quantity` phải là số nguyên không âm.
- `status` chỉ nhận bốn trạng thái được liệt kê ở Câu 2.
- Kiểm tra các trường bắt buộc, ngày mua và ID thiết bị.
- Trả dữ liệu JSON cùng mã HTTP phù hợp.

### Kết quả kiểm thử thủ công

Đã kiểm thử các chức năng trên backend local:

| Tình huống | Kết quả |
|---|---|
| Kiểm tra `/health` khi kết nối Atlas | HTTP 200, `database: connected` |
| Lấy danh sách, tìm kiếm và xem chi tiết | HTTP 200 |
| Thêm thiết bị hợp lệ | HTTP 201 |
| Thêm lại mã thiết bị đã tồn tại | HTTP 409 |
| Cập nhật thiết bị hợp lệ | HTTP 200, dữ liệu được lưu |
| Cập nhật số lượng âm | HTTP 400, dữ liệu cũ được giữ nguyên |
| Xóa thiết bị kiểm thử | HTTP 200 |
| Xem lại thiết bị đã xóa | HTTP 404 |

Các phép thử thêm, xem chi tiết, sửa, xóa, mã trùng và số lượng âm
được sinh viên thực hiện bằng PowerShell theo hướng dẫn.
