# Expo Go App với Backend MongoDB

Ứng dụng Expo Go với chức năng đăng nhập/đăng ký và backend MongoDB.

## Cài đặt

### Frontend (Expo)
```bash
npm install
```

### Backend
```bash
cd server
npm install
```

## Cấu hình Backend

1. Tạo file `.env` trong thư mục `server`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/expo-app
JWT_SECRET=your-secret-key
```

2. Đảm bảo MongoDB đang chạy (local hoặc sử dụng MongoDB Atlas)

## Chạy ứng dụng

### 1. Khởi động Backend
```bash
cd server
npm start
# hoặc npm run dev (với nodemon)
```

### 2. Khởi động Frontend
```bash
npm start
```

## Lưu ý quan trọng

### Khi chạy trên thiết bị thật:
Cập nhật `API_URL` trong `App.js` với IP máy tính của bạn:

```javascript
const API_URL = 'http://YOUR_COMPUTER_IP:3000/api/auth';
```

Để tìm IP của bạn:
- Windows: `ipconfig` (tìm IPv4 Address)
- Mac/Linux: `ifconfig` hoặc `ip addr`

### Khi chạy trên emulator/simulator:
- Android Emulator: Sử dụng `http://10.0.2.2:3000`
- iOS Simulator: Sử dụng `http://localhost:3000`

## Cấu trúc dự án

```
.
├── App.js                 # Frontend chính
├── server/                # Backend
│   ├── server.js         # Server chính
│   ├── models/           # MongoDB models
│   │   └── User.js
│   └── routes/           # API routes
│       └── auth.js
└── package.json
```

## Tính năng

- ✅ Đăng ký tài khoản mới
- ✅ Đăng nhập
- ✅ Đăng xuất
- ✅ Lưu trữ token và thông tin user
- ✅ Hash mật khẩu với bcrypt
- ✅ JWT authentication
