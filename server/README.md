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

## Yêu cầu

- Node.js
- MongoDB (local hoặc MongoDB Atlas)



