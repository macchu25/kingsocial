const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

module.exports = router;

