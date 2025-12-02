const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }
  next();
};

// Register validation rules
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Tên đăng nhập phải có từ 3-20 ký tự')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'),
  validate
];

// Login validation rules
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống'),
  validate
];

// Post creation validation
const validatePost = [
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 2200 })
    .withMessage('Caption không được quá 2200 ký tự'),
  body('image')
    .optional()
    .custom((value) => {
      // Accept URL or data URI (base64)
      if (typeof value === 'string') {
        const isUrl = /^https?:\/\//.test(value);
        const isDataUri = /^data:(image|video)\/[^;]+;base64,/.test(value);
        return isUrl || isDataUri;
      }
      return false;
    })
    .withMessage('Image phải là URL hoặc data URI hợp lệ'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images phải là một mảng'),
  body('images.*')
    .optional()
    .custom((value) => {
      // Accept URL or data URI (base64)
      if (typeof value === 'string') {
        const isUrl = /^https?:\/\//.test(value);
        const isDataUri = /^data:(image|video)\/[^;]+;base64,/.test(value);
        return isUrl || isDataUri;
      }
      return false;
    })
    .withMessage('Mỗi image/video phải là URL hoặc data URI hợp lệ'),
  body('type')
    .optional()
    .isIn(['post', 'reel'])
    .withMessage('Type phải là "post" hoặc "reel"'),
  validate
];

// Comment validation
const validateComment = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment phải có từ 1-500 ký tự'),
  validate
];

// Sanitize input - remove potentially dangerous characters
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove null bytes and other dangerous characters
        req.body[key] = req.body[key].replace(/\0/g, '');
        // Trim whitespace
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};

module.exports = {
  validate,
  validateRegister,
  validateLogin,
  validatePost,
  validateComment,
  sanitizeInput
};


