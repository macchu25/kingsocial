const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const { verifyToken } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');

// Search users
router.get('/users', searchLimiter, verifyToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        users: []
      });
    }

    const searchQuery = q.trim();
    
    // Search by username or name (case-insensitive)
    const users = await User.find({
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { name: { $regex: searchQuery, $options: 'i' } }
      ]
    })
    .select('username name avatar')
    .limit(50)
    .lean();

    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      name: user.name || '',
      avatar: user.avatar || ''
    }));

    res.json({
      success: true,
      users: formattedUsers
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Search posts
router.get('/posts', searchLimiter, verifyToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        posts: []
      });
    }

    const searchQuery = q.trim();
    
    // Search posts by caption (case-insensitive)
    const posts = await Post.find({
      caption: { $regex: searchQuery, $options: 'i' }
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

    // Get images array, fallback to single image for backward compatibility
    const formattedPosts = posts.map(post => {
      const images = post.images && post.images.length > 0 
        ? post.images 
        : (post.image ? [post.image] : []);

      return {
        id: post._id.toString(),
        userId: post.userId?.toString() || post.userId,
        username: post.username,
        userAvatar: post.userAvatar || '',
        image: images[0] || post.image || '',
        images: images,
        caption: post.caption || '',
        likes: post.likes?.length || 0,
        comments: post.comments?.length || 0,
        createdAt: post.createdAt
      };
    });

    res.json({
      success: true,
      posts: formattedPosts
    });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

module.exports = router;



