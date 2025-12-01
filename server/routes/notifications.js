const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không có token xác thực'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};

// Get all notifications for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formattedNotifications = notifications.map(notif => ({
      id: notif._id.toString(),
      type: notif.type,
      fromUserId: notif.fromUserId.toString(),
      fromUsername: notif.fromUsername,
      fromUserAvatar: notif.fromUserAvatar || '',
      postId: notif.postId ? notif.postId.toString() : null,
      read: notif.read,
      createdAt: notif.createdAt
    }));

    res.json({
      success: true,
      notifications: formattedNotifications,
      unreadCount: formattedNotifications.filter(n => !n.read).length
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Mark notification as read
router.post('/:notificationId/read', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    if (notification.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Đã đánh dấu đã đọc'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

module.exports = router;









