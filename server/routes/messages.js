const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
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

// Get messages between current user and another user
// Load 50 most recent messages by default
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { before, limit = 50 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin người dùng'
      });
    }

    // Build query for messages between two users
    const query = {
      $or: [
        { senderId: req.userId, receiverId: userId },
        { senderId: userId, receiverId: req.userId }
      ]
    };

    // If before is provided, load older messages (for pagination)
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Get messages, sorted by newest first, then reverse to show oldest first
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Reverse to show oldest first (for chat display)
    messages.reverse();

    // Get sender/receiver info
    const formattedMessages = await Promise.all(messages.map(async (message) => {
      const isSender = message.senderId.toString() === req.userId.toString();
      const otherUserId = isSender ? message.receiverId : message.senderId;
      
      let otherUser = null;
      try {
        otherUser = await User.findById(otherUserId).select('username avatar').lean();
      } catch (err) {
        // Silent fail
      }

      return {
        id: message._id.toString(),
        text: message.text || '',
        image: message.image || '',
        senderId: message.senderId.toString(),
        receiverId: message.receiverId.toString(),
        senderUsername: isSender ? req.username : (otherUser?.username || ''),
        receiverUsername: !isSender ? req.username : (otherUser?.username || ''),
        read: message.read,
        createdAt: message.createdAt
      };
    }));

    res.json({
      success: true,
      messages: formattedMessages,
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Send a message
router.post('/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { text, image } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin người dùng'
      });
    }

    if ((!text || text.trim().length === 0) && (!image || image.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung tin nhắn hoặc chọn ảnh'
      });
    }

    if (text && text.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Tin nhắn không được quá 1000 ký tự'
      });
    }

    // Get sender info
    const sender = await User.findById(req.userId).select('username avatar').lean();
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người gửi'
      });
    }

    // Create message
    const message = new Message({
      senderId: req.userId,
      receiverId: userId,
      text: text ? text.trim() : '',
      image: image || ''
    });

    await message.save();

    res.status(201).json({
      success: true,
      message: {
        id: message._id.toString(),
        text: message.text || '',
        image: message.image || '',
        senderId: message.senderId.toString(),
        receiverId: message.receiverId.toString(),
        senderUsername: sender.username,
        receiverUsername: '',
        read: message.read,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Mark messages as read
router.put('/:userId/read', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin người dùng'
      });
    }

    // Mark all unread messages from this user as read
    await Message.updateMany(
      {
        senderId: userId,
        receiverId: req.userId,
        read: false
      },
      {
        $set: { read: true }
      }
    );

    res.json({
      success: true,
      message: 'Đã đánh dấu đã đọc'
    });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Delete a message (only sender can delete their own message)
router.delete('/:userId/:messageId', verifyToken, async (req, res) => {
  try {
    const { userId, messageId } = req.params;

    if (!userId || !messageId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin'
      });
    }

    // Find the message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin nhắn'
      });
    }

    // Check if user is the sender (only sender can delete)
    if (message.senderId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể xóa tin nhắn của chính mình'
      });
    }

    // Verify message is part of conversation with userId
    const isPartOfConversation = 
      (message.senderId.toString() === req.userId.toString() && message.receiverId.toString() === userId) ||
      (message.senderId.toString() === userId && message.receiverId.toString() === req.userId.toString());

    if (!isPartOfConversation) {
      return res.status(403).json({
        success: false,
        message: 'Tin nhắn không thuộc cuộc trò chuyện này'
      });
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: 'Đã xóa tin nhắn'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

module.exports = router;



