# Hướng dẫn Bảo mật API

## Tổng quan

Dự án đã được tích hợp các biện pháp bảo mật để bảo vệ API khỏi các cuộc tấn công phổ biến.

## Các biện pháp bảo mật đã triển khai

### 1. Rate Limiting (Giới hạn số lượng requests)

- **API chung**: 100 requests / 15 phút / IP
- **Auth endpoints** (login, register): 5 requests / 15 phút / IP
- **Password reset**: 3 requests / 1 giờ / IP
- **Search**: 20 requests / 1 phút / IP
- **ChatGPT**: 10 requests / 1 phút / IP

### 2. Helmet.js (Security Headers)

Helmet giúp bảo vệ ứng dụng bằng cách thiết lập các HTTP headers bảo mật:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Và nhiều headers khác

### 3. CORS Configuration

- Cấu hình CORS để chỉ cho phép các origin được chỉ định
- Trong production, cần set `ALLOWED_ORIGINS` trong `.env`

### 4. JWT Authentication

- Middleware xác thực tập trung tại `middleware/auth.js`
- Token validation với error handling đầy đủ
- Token expiration handling

### 5. Input Validation & Sanitization

- Validation rules cho register, login, posts, comments
- Sanitization để loại bỏ các ký tự nguy hiểm
- Express-validator để validate input

### 6. Request Size Limits

- JSON body: 10MB (giảm từ 50MB)
- URL encoded: 10MB
- Giúp chống DoS attacks

### 7. Error Handling

- Global error handler
- Không expose thông tin nhạy cảm trong error messages
- Proper error logging

## Cấu hình Production

### 1. Environment Variables

Tạo file `.env` trong thư mục `server/` với các biến sau:

```env
# JWT Secret (QUAN TRỌNG: Phải là chuỗi ngẫu nhiên dài và phức tạp)
JWT_SECRET=your-super-secret-random-string-min-32-characters

# MongoDB URI
MONGODB_URI=mongodb://localhost:27017/expo-app

# Port
PORT=3000

# CORS - Danh sách các origin được phép (phân cách bằng dấu phẩy)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email Configuration (cho password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=My App
```

### 2. JWT Secret

⚠️ **QUAN TRỌNG**: 
- JWT_SECRET phải là chuỗi ngẫu nhiên, dài ít nhất 32 ký tự
- KHÔNG sử dụng default secret trong production
- Sử dụng công cụ tạo secret: `openssl rand -base64 32`

### 3. CORS Origins

Trong production, chỉ cho phép các domain của bạn:

```env
ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com
```

### 4. MongoDB Security

- Sử dụng MongoDB Atlas với authentication
- Enable IP whitelist
- Sử dụng connection string với username/password

## Các cuộc tấn công được bảo vệ

### ✅ DDoS Attacks
- Rate limiting giới hạn số lượng requests từ mỗi IP
- Request size limits ngăn chặn payload lớn

### ✅ Brute Force Attacks
- Rate limiting nghiêm ngặt cho auth endpoints
- Password reset có giới hạn 3 lần/giờ

### ✅ SQL/NoSQL Injection
- Mongoose tự động escape queries
- Input validation và sanitization

### ✅ XSS (Cross-Site Scripting)
- Helmet.js security headers
- Input sanitization

### ✅ CSRF (Cross-Site Request Forgery)
- CORS configuration
- SameSite cookies (nếu sử dụng cookies)

### ✅ JWT Token Attacks
- Token expiration
- Secure token validation
- Error handling không expose thông tin

### ✅ Information Disclosure
- Error messages không chứa thông tin nhạy cảm
- Proper error logging

## Best Practices

### 1. Luôn sử dụng HTTPS trong production
- SSL/TLS certificate
- Redirect HTTP → HTTPS

### 2. Regular Security Updates
```bash
npm audit
npm audit fix
```

### 3. Monitoring & Logging
- Log tất cả authentication attempts
- Monitor rate limit violations
- Set up alerts cho suspicious activities

### 4. Database Security
- Regular backups
- Encrypt sensitive data
- Use connection pooling

### 5. API Keys & Secrets
- Không commit `.env` file
- Sử dụng secret management service (AWS Secrets Manager, etc.)
- Rotate secrets định kỳ

## Testing Security

### Test Rate Limiting
```bash
# Test auth rate limit (sẽ bị block sau 5 requests)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
done
```

### Test Input Validation
```bash
# Test SQL injection attempt
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\''--","email":"test@test.com","password":"test123"}'
```

## Troubleshooting

### Rate limit quá chặt
- Điều chỉnh trong `middleware/rateLimiter.js`
- Tăng `max` hoặc `windowMs` nếu cần

### CORS errors
- Kiểm tra `ALLOWED_ORIGINS` trong `.env`
- Đảm bảo origin chính xác (bao gồm protocol https://)

### JWT errors
- Kiểm tra `JWT_SECRET` đã được set
- Đảm bảo token được gửi đúng format: `Authorization: Bearer <token>`

## Tài liệu tham khảo

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [express-rate-limit](https://github.com/nfriedly/express-rate-limit)


