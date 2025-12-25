# Backend Server

Server backend cho ứng dụng Expo với MongoDB.

## Cài đặt

```bash
cd server
npm install
```

## Cấu hình

1. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

2. Cập nhật các giá trị trong `.env`:
- `MONGODB_URI`: Đường dẫn kết nối MongoDB (mặc định: mongodb://localhost:27017/expo-app)
- `JWT_SECRET`: Secret key cho JWT (nên thay đổi trong production)
- `PORT`: Port chạy server (mặc định: 3000)

### Cấu hình Email (Cho chức năng quên mật khẩu)

Để gửi email OTP, thêm các biến sau vào `.env`:

**Với Gmail:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=App Name
```

**Lưu ý khi dùng Gmail:**
1. Bật "2-Step Verification" trong tài khoản Google
2. Tạo "App Password" tại: https://myaccount.google.com/apppasswords
3. Sử dụng App Password (16 ký tự) làm `SMTP_PASS`, không dùng mật khẩu thường

**Với Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM_NAME=App Name
```

**Nếu chưa cấu hình email:**
- Mã OTP sẽ được log ra console (chế độ development)
- Kiểm tra terminal để xem mã OTP khi test

## Chạy server

```bash
# Development mode (với nodemon)
npm run dev

# Production mode
npm start
```

## API Endpoints

### POST /api/auth/register
Đăng ký tài khoản mới

**Body:**
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /api/auth/login
Đăng nhập

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công!",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "username": "user123",
    "email": "user@example.com"
  }
}
```

### POST /api/auth/forgot-password
Yêu cầu mã OTP 6 số để đặt lại mật khẩu

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mã OTP đã được gửi đến email của bạn..."
}
```

### POST /api/auth/reset-password
Đặt lại mật khẩu bằng mã OTP

**Body:**
```json
{
  "email": "user@example.com",
  "otpCode": "123456",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đặt lại mật khẩu thành công!..."
}
```

## Yêu cầu

- Node.js
- MongoDB (local hoặc MongoDB Atlas)










