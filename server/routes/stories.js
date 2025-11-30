const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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

// Get all stories from users that current user is following
router.get('/', verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Get list of user IDs that current user is following
    const followingIds = currentUser.following || [];
    
    // Also include current user's own stories
    const userIdsToFetch = [...followingIds, req.userId];

    // Get stories that haven't expired
    const now = new Date();
    const stories = await Story.find({
      userId: { $in: userIdsToFetch },
      expiresAt: { $gt: now } // Chỉ lấy stories chưa hết hạn
    })
      .sort({ createdAt: -1 })
      .lean();

    // Group stories by user
    const storiesByUser = {};
    stories.forEach(story => {
      const userId = story.userId.toString();
      if (!storiesByUser[userId]) {
        storiesByUser[userId] = {
          userId: userId,
          username: story.username,
          userAvatar: story.userAvatar || '',
          stories: []
        };
      }
      const isViewed = story.viewedBy && story.viewedBy.some(id => id.toString() === req.userId);
      storiesByUser[userId].stories.push({
        id: story._id.toString(),
        image: story.image,
        createdAt: story.createdAt,
        isViewed: isViewed || false
      });
    });

    // Convert to array
    const storiesArray = Object.values(storiesByUser);

    res.json({
      success: true,
      stories: storiesArray
    });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Create new story
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ảnh'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Delete old stories of this user (optional - MongoDB TTL will handle it)
    // await Story.deleteMany({ userId: req.userId, expiresAt: { $lt: new Date() } });

    // Set expiresAt (1 day from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    const story = new Story({
      userId: req.userId,
      username: user.username,
      userAvatar: user.avatar || '',
      image: image,
      expiresAt: expiresAt
    });

    await story.save();

    res.status(201).json({
      success: true,
      message: 'Đăng story thành công!',
      story: {
        id: story._id,
        userId: story.userId,
        username: story.username,
        userAvatar: story.userAvatar,
        image: story.image,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt
      }
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Mark story as viewed
router.post('/:storyId/view', verifyToken, async (req, res) => {
  try {
    const storyId = req.params.storyId;
    
    // Validate storyId format
    if (!storyId || !mongoose.Types.ObjectId.isValid(storyId)) {
      return res.status(400).json({
        success: false,
        message: 'ID story không hợp lệ'
      });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy story'
      });
    }

    // Check if already viewed
    const userIdStr = req.userId.toString();
    if (!story.viewedBy || !story.viewedBy.some(id => id.toString() === userIdStr)) {
      if (!story.viewedBy) {
        story.viewedBy = [];
      }
      story.viewedBy.push(req.userId);
      await story.save();
    }

    res.json({
      success: true,
      message: 'Đã đánh dấu story đã xem'
    });
  } catch (error) {
    console.error('Mark story viewed error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Clean up expired stories (optional endpoint for manual cleanup)
router.delete('/cleanup', verifyToken, async (req, res) => {
  try {
    const result = await Story.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    res.json({
      success: true,
      message: `Đã xóa ${result.deletedCount} story hết hạn`
    });
  } catch (error) {
    console.error('Cleanup stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

module.exports = router;

