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

### Frontend

1. Mở terminal trong thư mục frontend.
2. Chạy npm install.
3. Tạo .env theo .env.example, cấu hình VITE_API_URL trỏ đến backend.
4. Chạy npm run dev.
5. Truy cập http://localhost:5173 và giữ backend chạy ở terminal riêng.

## Tiến độ

- Câu 1: Khởi tạo cấu trúc dự án và quản lý mã nguồn bằng GitHub.
- Câu 2: Tạo database MongoDB Atlas, cấu hình kết nối và dữ liệu mẫu.
- Câu 3: Xây dựng backend API và kiểm thử các chức năng quản lý thiết bị.
- Câu 4: Xây dựng giao diện React kết nối backend API.
- Câu 5: Đóng gói backend bằng Docker, chạy thử và đẩy image lên Docker Hub.
- Câu 6: Đóng gói frontend bằng Docker, kết nối backend và đẩy image lên Docker Hub.
- Câu 7 trở đi: Triển khai Render và hoàn thiện bài nộp sẽ được cập nhật sau.

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

## Câu 4. Xây dựng frontend bằng React

Frontend sử dụng React và Vite, lấy dữ liệu từ backend Express và lưu
các thay đổi thông qua API vào MongoDB Atlas.

### Cài đặt và chạy

Khởi động backend theo hướng dẫn Câu 3. Mở terminal thứ hai tại thư mục
gốc dự án, chạy:

```powershell
cd frontend
npm ci
```

Nếu chưa có `frontend/.env`, sao chép cấu hình mẫu:

```powershell
Copy-Item .env.example .env
```

Cấu hình trong `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000
```

Chạy frontend:

```powershell
npm run dev
```

Mở `http://localhost:5173`. Cổng frontend được cố định ở `5173` để khớp
với CORS của backend. Nếu thay địa chỉ frontend, cập nhật `FRONTEND_URL`
trong cấu hình backend và khởi động lại backend.

`VITE_API_URL` chỉ chứa URL công khai của backend, không bao gồm mật khẩu
hoặc chuỗi kết nối MongoDB. Sau khi thay biến môi trường, khởi động lại
Vite; khi triển khai, dùng URL backend HTTPS và build lại frontend.

### Chức năng giao diện

- Hiển thị mã, tên, loại, phòng học, số lượng và tình trạng thiết bị.
- Tìm kiếm theo mã, tên, loại hoặc phòng học; nút Tất cả để bỏ tìm kiếm.
- Xem chi tiết đầy đủ thông tin thiết bị.
- Thêm thiết bị qua form, kiểm tra các trường bắt buộc và số lượng không âm.
- Sửa thông tin và chọn một trong bốn trạng thái thiết bị.
- Xác nhận trước khi xóa thiết bị.
- Hiển thị trạng thái đang tải, đang xử lý, thông báo thành công và lỗi.
- Hiển thị lỗi từ backend khi mã thiết bị trùng hoặc dữ liệu không hợp lệ.
- Giao diện thích ứng với màn hình nhỏ, bảng có thể cuộn ngang.

### Build và kiểm tra

Trong thư mục `frontend`, chạy:

```powershell
npm run build
```

Kết quả build nằm trong `frontend/dist` và không đưa lên GitHub.
Có thể xem thử bản build bằng `npm run preview` sau khi build thành công;
nếu xem thử ở cổng khác `5173`, cần điều chỉnh CORS backend tương ứng.

Đã kiểm tra build thành công và giao diện hiển thị ba thiết bị từ database.
Kiểm tra tích hợp API với origin `http://localhost:5173` đã đạt cho các thao tác
thêm, xem chi tiết, sửa, tìm kiếm, xóa, từ chối mã trùng và số lượng âm.

Quy trình kiểm tra trực tiếp trên giao diện:

1. Tìm một thiết bị theo mã hoặc phòng học, sau đó chọn Tất cả.
2. Mở Chi tiết và kiểm tra thông tin.
3. Thêm một thiết bị kiểm thử với mã mới.
4. Sửa trạng thái, tải lại trang và kiểm tra dữ liệu vẫn được lưu.
5. Thử thêm mã trùng để kiểm tra thông báo lỗi.
6. Xóa thiết bị kiểm thử và xác nhận thiết bị không còn trong danh sách.

## Câu 5. Đóng gói backend bằng Docker và đẩy lên Docker Hub

### Docker image backend

- Image: `234905lenhuttoan/backend:latest`
- Docker Hub: https://hub.docker.com/r/234905lenhuttoan/backend
- Tag: https://hub.docker.com/r/234905lenhuttoan/backend/tags

Yêu cầu: cài Docker Desktop, khởi động Docker Engine và chuẩn bị
`backend/.env` với cấu hình MongoDB Atlas thật. IP máy chạy container
phải được cho phép trong Atlas IP Access List.

### Build image

Chạy tại thư mục gốc dự án:

```powershell
docker build -t backend:latest ./backend
docker tag backend:latest 234905lenhuttoan/backend:latest
```

`backend/Dockerfile` sử dụng Node.js 24 Alpine, cài thư viện bằng
`npm ci --omit=dev` và chạy `server.js` bằng user `node`.

### Chạy container

```powershell
docker run --rm --name backend-test --env-file ./backend/.env -e PORT=5000 -p 127.0.0.1:5001:5000 234905lenhuttoan/backend:latest
```

Ứng dụng trong container chạy ở cổng `5000`, được ánh xạ ra cổng `5001`
trên máy để tránh trùng backend đang chạy trực tiếp ở cổng `5000`.
Giữ terminal chạy trong khi kiểm tra.

| Địa chỉ | Mục đích |
|---|---|
| http://localhost:5001/health | Kiểm tra backend và kết nối Atlas |
| http://localhost:5001/api/devices | Xem danh sách thiết bị |

Xem container và log trong terminal khác:

```powershell
docker ps
docker logs backend-test
```

Dừng container bằng `Ctrl + C` trong terminal chạy container, hoặc:

```powershell
docker stop backend-test
```

Container thử được tự động xóa sau khi dừng nhờ tùy chọn `--rm`.

### Đẩy image lên Docker Hub

Đăng nhập bằng tài khoản `234905lenhuttoan` rồi push:

```powershell
docker login
docker push 234905lenhuttoan/backend:latest
```

Để tải image về máy khác:

```powershell
docker pull 234905lenhuttoan/backend:latest
```

Sau khi tải, chuẩn bị tệp cấu hình `.env` trên máy đó và chạy container
bằng lệnh ở phần trên.

### Cấu hình và bảo vệ thông tin kết nối

- `backend/.dockerignore` loại `.env`, `.env.*`, `node_modules` và các tệp không cần thiết khỏi build context.
- Mật khẩu và chuỗi kết nối thật không được nhúng vào image hoặc đưa lên GitHub.
- Các biến môi trường được truyền khi chạy container qua `--env-file`.
- `PORT=5000` được đặt rõ ràng khi chạy để khớp với ánh xạ cổng.
- Cấu hình DNS tùy chọn `MONGODB_DNS_SERVERS` được đọc từ môi trường giống khi chạy trực tiếp.

### Kết quả thực hiện

- Đã build image backend và chạy thử container.
- Endpoint `http://localhost:5001/health` trả về `status: ok`, `database: connected`.
- Đã đẩy image `234905lenhuttoan/backend:latest` lên Docker Hub.

## Câu 6. Đóng gói frontend bằng Docker và đẩy lên Docker Hub

### Docker image frontend

- Image: `234905lenhuttoan/frontend:latest`
- Docker Hub: https://hub.docker.com/r/234905lenhuttoan/frontend
- Tag: https://hub.docker.com/r/234905lenhuttoan/frontend/tags

Frontend sử dụng Dockerfile hai giai đoạn: Node.js 24 để cài thư viện và
build React, sau đó Nginx phục vụ các tệp trong `dist`. Image cuối không
chứa thư viện build hoặc `.env` của máy phát triển.

### Build image

Chạy tại thư mục gốc dự án:

```powershell
docker build -t 234905lenhuttoan/frontend:latest ./frontend
```

Trong bản Docker, build argument `VITE_API_URL` mặc định là `/`.
Trình duyệt gọi API trên cùng địa chỉ với frontend; Nginx chuyển tiếp
`/api/` và `/health` sang backend qua biến môi trường `API_UPSTREAM`.
Vì vậy không cần thay CORS backend khi mở giao diện Docker ở cổng `8080`.
Cấu hình phát triển trực tiếp bằng Vite ở Câu 4 vẫn được giữ nguyên.

### Chạy frontend kết nối container backend

Tạo mạng một lần nếu chưa có:

```powershell
docker network create qlthietbi-net
```

Nếu container `backend-test` từ Câu 5 đang chạy, nối nó vào mạng một lần:

```powershell
docker network connect qlthietbi-net backend-test
```

Nếu backend chưa chạy, dùng lệnh sau thay cho thao tác nối mạng:

```powershell
docker run -d --rm --name backend-test --network qlthietbi-net --env-file ./backend/.env -e PORT=5000 -p 127.0.0.1:5001:5000 234905lenhuttoan/backend:latest
```

Khi backend đã sẵn sàng, chạy frontend:

```powershell
docker run -d --rm --name frontend-test --network qlthietbi-net -e API_UPSTREAM=http://backend-test:5000 -p 127.0.0.1:8080:8080 234905lenhuttoan/frontend:latest
```

Nếu container cùng tên đang chạy, sử dụng container đó thay vì chạy thêm.
Trên máy hiện tại, mạng và hai container đã được thiết lập theo cấu hình trên.

| Địa chỉ | Mục đích |
|---|---|
| http://localhost:8080 | Giao diện React từ Docker |
| http://localhost:8080/health | Kiểm tra kết nối backend qua Nginx |
| http://localhost:8080/api/devices | Danh sách thiết bị qua Nginx |

Kiểm tra container:

```powershell
docker ps
docker logs frontend-test
docker exec frontend-test nginx -t
```

Dừng riêng frontend khi không dùng:

```powershell
docker stop frontend-test
```

### Cấu hình triển khai

| Tham số | Ý nghĩa |
|---|---|
| Build argument `VITE_API_URL` | Mặc định `/` để gọi API qua Nginx trên cùng origin |
| Environment `API_UPSTREAM` | URL backend mà Nginx chuyển tiếp đến, không thêm dấu `/` cuối |
| Environment `PORT` | Cổng Nginx trong container, mặc định `8080` |

Khi chuyển lên Render, đặt `API_UPSTREAM` bằng URL HTTPS backend thật.
Nginx hỗ trợ HTTPS upstream với kiểm tra chứng chỉ. Không dùng
`backend-test` hoặc `host.docker.internal` làm địa chỉ backend trên Render.
Nếu thay `PORT`, ánh xạ cổng Docker phải khớp cổng mới.

Tệp `frontend/.dockerignore` loại `node_modules`, `dist`, `.env` và
`.env.*` khỏi build context. Frontend không chứa thông tin xác thực MongoDB.

### Đẩy image lên Docker Hub

```powershell
docker login
docker push 234905lenhuttoan/frontend:latest
```

Tải image về máy khác:

```powershell
docker pull 234905lenhuttoan/frontend:latest
```

### Kiểm tra

- Build image thành công; cấu hình Nginx hợp lệ.
- Trang HTML và JavaScript được phục vụ thành công ở cổng `8080`.
- `/health` qua Nginx trả về HTTP 200, database đã kết nối.
- API qua Nginx trả danh sách ba thiết bị từ MongoDB Atlas.
- Đã kiểm tra thêm, xem chi tiết, sửa, tìm kiếm và xóa bản ghi thử qua cổng `8080`.
- API từ chối mã thiết bị trùng với HTTP 409; dữ liệu thử đã được xóa sau kiểm tra.
- Đã đẩy image `234905lenhuttoan/frontend:latest` lên Docker Hub.
