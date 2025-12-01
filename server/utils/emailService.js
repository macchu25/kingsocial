const nodemailer = require('nodemailer');

// Tạo transporter cho email
// Có thể dùng Gmail, Outlook, hoặc SMTP server khác
const createTransporter = () => {
  // Cấu hình từ .env file
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim().replace(/\s+/g, ''); // Xóa tất cả khoảng trắng
  
  const emailConfig = {
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: smtpUser, // Email của bạn
      pass: smtpPass, // App password hoặc password (đã xóa khoảng trắng)
    },
  };

  // Log cấu hình (ẩn password)
  console.log('📧 Email Configuration:');
  console.log(`   Host: ${emailConfig.host}`);
  console.log(`   Port: ${emailConfig.port}`);
  console.log(`   User: ${emailConfig.auth.user}`);
  console.log(`   Pass: ${emailConfig.auth.pass ? '***' + emailConfig.auth.pass.slice(-4) : 'NOT SET'}`);

  // Nếu không có cấu hình email, trả về null (sẽ log ra console thay vì gửi email)
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('⚠️ Email service chưa được cấu hình. Mã OTP sẽ được log ra console.');
    return null;
  }

  return nodemailer.createTransport(emailConfig);
};

// Gửi email với mã OTP
const sendOTPEmail = async (email, otpCode) => {
  try {
    const transporter = createTransporter();

    // Nếu không có transporter (chưa cấu hình), log ra console
    if (!transporter) {
      console.log('📧 [Email Service - Development Mode]');
      console.log('═══════════════════════════════════════');
      console.log(`To: ${email}`);
      console.log(`Subject: Mã đặt lại mật khẩu`);
      console.log(`Mã OTP: ${otpCode}`);
      console.log('═══════════════════════════════════════');
      return { success: true, message: 'Mã OTP đã được log ra console (chế độ development)' };
    }

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'App'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Mã đặt lại mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FFB6C1;">Đặt lại mật khẩu</h2>
          <p>Xin chào,</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã OTP sau để đặt lại mật khẩu:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #FFB6C1; font-size: 32px; letter-spacing: 5px; margin: 0;">${otpCode}</h1>
          </div>
          <p>Mã này có hiệu lực trong <strong>10 phút</strong>.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">Trân trọng,<br>Đội ngũ hỗ trợ</p>
        </div>
      `,
      text: `Mã đặt lại mật khẩu của bạn là: ${otpCode}. Mã này có hiệu lực trong 10 phút.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email đã được gửi thành công!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   To: ${email}`);
    console.log(`   OTP Code: ${otpCode}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Lỗi gửi email:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error(`   Command: ${error.command || 'N/A'}`);
    
    // Log chi tiết lỗi
    if (error.response) {
      console.error(`   Response: ${error.response}`);
    }
    
    // Nếu lỗi gửi email, vẫn log ra console để development
    console.log('\n📧 [Email Service - Fallback Mode]');
    console.log('═══════════════════════════════════════');
    console.log(`To: ${email}`);
    console.log(`Subject: Mã đặt lại mật khẩu`);
    console.log(`Mã OTP: ${otpCode}`);
    console.log('═══════════════════════════════════════\n');
    
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
};

