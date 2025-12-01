const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTPEmail } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng điền đầy đủ thông tin' 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tên đăng nhập phải có ít nhất 3 ký tự' 
      });
    }

    if (username.length > 20) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tên đăng nhập không được quá 20 ký tự' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mật khẩu phải có ít nhất 6 ký tự' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email không hợp lệ' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email hoặc tên đăng nhập đã tồn tại' 
      });
    }

    // Create new user
    const user = new User({ username, email, password });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = error.errors;
      let message = 'Dữ liệu không hợp lệ';
      
      // Check specific validation errors
      if (errors.username) {
        if (errors.username.kind === 'minlength') {
          message = 'Tên đăng nhập phải có ít nhất 3 ký tự';
        } else if (errors.username.kind === 'maxlength') {
          message = 'Tên đăng nhập không được quá 20 ký tự';
        } else {
          message = errors.username.message || 'Tên đăng nhập không hợp lệ';
        }
      } else if (errors.email) {
        message = errors.email.message || 'Email không hợp lệ';
      } else if (errors.password) {
        if (errors.password.kind === 'minlength') {
          message = 'Mật khẩu phải có ít nhất 6 ký tự';
        } else {
          message = errors.password.message || 'Mật khẩu không hợp lệ';
        }
      } else {
        // Get first error message
        const firstError = Object.values(errors)[0];
        message = firstError?.message || 'Dữ liệu không hợp lệ';
      }
      
      return res.status(400).json({ 
        success: false, 
        message 
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        message: `${field === 'email' ? 'Email' : 'Tên đăng nhập'} đã tồn tại` 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server. Vui lòng thử lại sau.' 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng điền đầy đủ thông tin' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server. Vui lòng thử lại sau.' 
    });
  }
});

// Forgot Password - Request OTP code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng nhập email' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email không hợp lệ' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({
        success: true,
        message: 'Nếu email tồn tại, chúng tôi đã gửi mã OTP đến email của bạn.'
      });
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
    
    // Save OTP to user (expires in 10 minutes)
    user.resetPasswordToken = otpHash;
    user.resetPasswordExpires = Date.now() + 600000; // 10 minutes
    await user.save();

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otpCode);

    // Always return success message (don't reveal if email was sent successfully for security)
    res.json({
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (bao gồm thư mục spam).'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server. Vui lòng thử lại sau.' 
    });
  }
});

// Reset Password - Use OTP code to reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;

    // Validation
    if (!email || !otpCode || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng điền đầy đủ thông tin' 
      });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otpCode)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mã OTP phải là 6 chữ số' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mật khẩu phải có ít nhất 6 ký tự' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email không tồn tại' 
      });
    }

    // Hash the OTP to compare with stored hash
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

    // Check if OTP is valid and not expired
    if (user.resetPasswordToken !== otpHash) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mã OTP không đúng' 
      });
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' 
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server. Vui lòng thử lại sau.' 
    });
  }
});

module.exports = router;

