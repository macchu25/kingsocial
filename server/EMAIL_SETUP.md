# Hướng dẫn cấu hình Email để gửi mã OTP

## Tổng quan

Chức năng quên mật khẩu sử dụng email để gửi mã OTP 6 số. Bạn cần cấu hình SMTP server để gửi email.

## Cách 1: Sử dụng Gmail (Khuyến nghị)

### Bước 1: Bật 2-Step Verification

1. Truy cập: https://myaccount.google.com/security
2. Tìm mục "2-Step Verification" và bật nó
3. Làm theo hướng dẫn để thiết lập

### Bước 2: Tạo App Password

1. Truy cập: https://myaccount.google.com/apppasswords
2. Chọn "Mail" và "Other (Custom name)"
3. Nhập tên: "Expo App" (hoặc tên bạn muốn)
4. Click "Generate"
5. **Copy mã 16 ký tự** (không có khoảng trắng)

### Bước 3: Cấu hình trong .env

Tạo file `.env` trong thư mục `server/` (copy từ `.env.example`):
                            
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME=My App
```

**Lưu ý:** 
- `SMTP_USER`: Email Gmail của bạn
- `SMTP_PASS`: Mã App Password 16 ký tự (có thể có hoặc không có khoảng trắng)
- `SMTP_FROM_NAME`: Tên hiển thị trong email

### Ví dụ:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=nguyenvana@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM_NAME=My Social App
```

---

## Cách 2: Sử dụng Outlook/Hotmail

### Bước 1: Cấu hình trong .env

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM_NAME=My App
```

**Lưu ý:** Với Outlook, bạn có thể dùng mật khẩu thường, không cần App Password.

---

## Cách 3: Sử dụng SMTP Server khác

Nếu bạn có SMTP server riêng (ví dụ: SendGrid, Mailgun, AWS SES):

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM_NAME=My App
```

**Lưu ý:** 
- `SMTP_PORT`: Thường là 587 (TLS) hoặc 465 (SSL)
- `SMTP_SECURE`: `true` cho port 465, `false` cho port 587

---

## Chế độ Development (Không cấu hình email)

Nếu bạn **KHÔNG** cấu hình email, hệ thống vẫn hoạt động:

- Mã OTP sẽ được **log ra console** (terminal)
- Kiểm tra terminal khi test để lấy mã OTP
- Phù hợp cho development và testing

**Ví dụ output trong console:**
```
📧 [Email Service - Development Mode]
═══════════════════════════════════════
To: user@example.com
Subject: Mã đặt lại mật khẩu
Mã OTP: 123456
═══════════════════════════════════════
```

---

## Kiểm tra cấu hình

1. Tạo file `.env` trong thư mục `server/`
2. Thêm các biến môi trường như hướng dẫn trên
3. Khởi động lại server: `npm run dev`
4. Test chức năng quên mật khẩu:
   - Nhập email
   - Kiểm tra email inbox (hoặc console nếu chưa cấu hình)
   - Nhập mã OTP và đặt lại mật khẩu

---

## Xử lý lỗi thường gặp

### Lỗi: "Invalid login"
- **Gmail:** Đảm bảo bạn đã tạo App Password, không dùng mật khẩu thường
- **Outlook:** Kiểm tra lại mật khẩu

### Lỗi: "Connection timeout"
- Kiểm tra firewall/antivirus có chặn port 587 không
- Thử đổi `SMTP_PORT=465` và `SMTP_SECURE=true`

### Email không đến
- Kiểm tra thư mục Spam/Junk
- Kiểm tra console để xem có lỗi gửi email không
- Đảm bảo email đúng định dạng

---

## Bảo mật

⚠️ **QUAN TRỌNG:**
- **KHÔNG** commit file `.env` lên Git
- File `.env` đã được thêm vào `.gitignore`
- Trong production, sử dụng biến môi trường an toàn (ví dụ: Heroku Config Vars, AWS Secrets Manager)

---

## Tài liệu tham khảo

- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [SMTP Settings cho các email provider](https://www.arclab.com/en/kb/email/list-of-smtp-and-pop3-servers-mailserver-settings.html)

