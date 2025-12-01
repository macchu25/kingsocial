const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
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

// Get all posts
router.get('/', verifyToken, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'username name avatar')
      .lean();

    const formattedPosts = await Promise.all(posts.map(async (post) => {
      // Get user info if userId is populated
      let username = post.username;
      let userAvatar = post.userAvatar || '';
      
      if (post.userId && typeof post.userId === 'object') {
        username = post.userId.username || post.username;
        userAvatar = post.userId.avatar || post.userAvatar || '';
      }

      // Get images array, fallback to single image for backward compatibility
      const images = post.images && post.images.length > 0 
        ? post.images 
        : (post.image ? [post.image] : []);
      
      return {
        id: post._id.toString(),
        userId: post.userId?._id?.toString() || post.userId?.toString() || post.userId,
        username: username,
        userAvatar: userAvatar,
        image: images[0] || post.image || '',
        images: images,
        caption: post.caption || '',
        likes: post.likes?.length || 0,
        isLiked: post.likes?.some(like => like.toString() === req.userId) || false,
        comments: post.comments?.length || 0,
        commentsList: await Promise.all((post.comments?.slice(-2) || []).map(async (comment) => {
          let userAvatar = null;
          if (comment.userId) {
            try {
              const commentUser = await User.findById(comment.userId).lean();
              userAvatar = (commentUser?.avatar && commentUser.avatar.trim() !== '') ? commentUser.avatar : null;
            } catch (err) {
              // Silent fail
            }
          }
          return {
            id: comment._id?.toString() || comment._id,
            userId: comment.userId?.toString() || comment.userId,
            username: comment.username,
            text: comment.text || '',
            image: comment.image || '',
            avatar: userAvatar
          };
        })),
        createdAt: post.createdAt
      };
    }));

    res.json({
      success: true,
      posts: formattedPosts
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Create new post
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { image, images, caption } = req.body;

    // Support both single image (backward compatibility) and multiple images
    let imagesArray = [];
    if (images && Array.isArray(images) && images.length > 0) {
      imagesArray = images;
    } else if (image) {
      imagesArray = [image];
    }

    if (imagesArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một ảnh'
      });
    }

    if (caption && caption.length > 2200) {
      return res.status(400).json({
        success: false,
        message: 'Caption không được quá 2200 ký tự'
      });
    }

    // Get user info
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const post = new Post({
      userId: req.userId,
      username: user.username,
      userAvatar: user.avatar || '',
      image: imagesArray[0], // Keep for backward compatibility
      images: imagesArray,
      caption: caption || '',
      likes: [],
      comments: []
    });

    await post.save();

    res.status(201).json({
      success: true,
      message: 'Đăng bài thành công!',
      post: {
        id: post._id,
        userId: post.userId,
        username: post.username,
        userAvatar: post.userAvatar,
        image: post.images[0] || post.image,
        images: post.images,
        caption: post.caption,
        likes: 0,
        isLiked: false,
        comments: 0,
        commentsList: [],
        createdAt: post.createdAt
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Like/Unlike post
router.post('/:postId/like', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    const userId = req.userId;
    const isLiked = post.likes && post.likes.some(like => like.toString() === userId);

    if (isLiked) {
      // Unlike
      if (post.likes) {
        post.likes = post.likes.filter(like => like.toString() !== userId);
      }
    } else {
      // Like
      if (!post.likes) {
        post.likes = [];
      }
      post.likes.push(userId);
      
      // Create notification for post owner (if not own post)
      if (post.userId.toString() !== userId) {
        try {
          const user = await User.findById(userId);
          if (user) {
            const notification = new Notification({
              userId: post.userId,
              type: 'like',
              fromUserId: userId,
              fromUsername: user.username,
              fromUserAvatar: user.avatar || '',
              postId: post._id
            });
            await notification.save();
            console.log('✅ Like notification created:', notification._id);
          }
        } catch (notifError) {
          console.error('❌ Create like notification error:', notifError);
          // Don't fail the like action if notification fails
        }
      }
    }

    await post.save();

    res.json({
      success: true,
      likes: post.likes.length,
      isLiked: !isLiked
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Add comment
router.post('/:postId/comment', verifyToken, async (req, res) => {
  try {
    const { text, image } = req.body;

    if ((!text || text.trim().length === 0) && (!image || image.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung bình luận hoặc chọn ảnh'
      });
    }

    if (text && text.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Bình luận không được quá 500 ký tự'
      });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    post.comments.push({
      userId: req.userId,
      username: user.username,
      text: text ? text.trim() : '',
      image: image || ''
    });

    // Create notification for post owner (if not own post)
    if (post.userId.toString() !== req.userId) {
      try {
        const notification = new Notification({
          userId: post.userId,
          type: 'comment',
          fromUserId: req.userId,
          fromUsername: user.username,
          fromUserAvatar: user.avatar || '',
          postId: post._id
        });
        await notification.save();
        console.log('✅ Comment notification created:', notification._id);
      } catch (notifError) {
        console.error('❌ Create comment notification error:', notifError);
        // Don't fail the comment action if notification fails
      }
    }

    await post.save();

    const newComment = post.comments[post.comments.length - 1];

    res.json({
      success: true,
      message: 'Bình luận thành công!',
      comment: {
        id: newComment._id,
        userId: newComment.userId.toString(),
        username: newComment.username,
        text: newComment.text || '',
        image: newComment.image || '',
        avatar: user.avatar || '',
        createdAt: newComment.createdAt
      },
      commentsCount: post.comments.length
    });
  } catch (error) {
    console.error('Comment post error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Delete comment
router.delete('/:postId/comment/:commentId', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }

    // Check permission: user can delete their own comment OR post owner can delete any comment
    const isCommentOwner = comment.userId.toString() === req.userId.toString();
    const isPostOwner = post.userId.toString() === req.userId.toString();

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa bình luận này'
      });
    }

    comment.deleteOne();
    await post.save();

    res.json({
      success: true,
      message: 'Đã xóa bình luận',
      commentsCount: post.comments.length
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Update comment
router.put('/:postId/comment/:commentId', verifyToken, async (req, res) => {
  try {
    const { text, image } = req.body;

    if ((!text || text.trim().length === 0) && (!image || image.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung bình luận hoặc chọn ảnh'
      });
    }

    if (text && text.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Bình luận không được quá 500 ký tự'
      });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }

    // Only comment owner can edit
    if (comment.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa bình luận này'
      });
    }

    if (text !== undefined) {
      comment.text = text ? text.trim() : '';
    }
    if (image !== undefined) {
      comment.image = image || '';
    }

    await post.save();

    const user = await User.findById(req.userId);

    res.json({
      success: true,
      message: 'Đã cập nhật bình luận',
      comment: {
        id: comment._id.toString(),
        userId: comment.userId.toString(),
        username: comment.username,
        text: comment.text || '',
        image: comment.image || '',
        avatar: user?.avatar || '',
        createdAt: comment.createdAt
      }
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Get posts by user ID
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate userId format
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }

    const posts = await Post.find({ userId: userId })
      .sort({ createdAt: -1 })
      .lean();

    const formattedPosts = posts.map(post => ({
      id: post._id.toString(),
      userId: post.userId.toString(),
      username: post.username,
      userAvatar: post.userAvatar || '',
      image: post.image,
      caption: post.caption || '',
      likes: post.likes?.length || 0,
      isLiked: post.likes?.some(like => like.toString() === req.userId) || false,
      comments: post.comments?.length || 0,
      createdAt: post.createdAt
    }));

    res.json({
      success: true,
      posts: formattedPosts,
      count: formattedPosts.length
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Get post by ID with all comments (must be after /user/:userId to avoid conflict)
router.get('/:postId', verifyToken, async (req, res) => {
  try {
    const postId = req.params.postId;
    
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bài viết không hợp lệ'
      });
    }

    const post = await Post.findById(postId)
      .populate('userId', 'username name avatar')
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Get user info
    let username = post.username;
    let userAvatar = post.userAvatar || '';
    
    if (post.userId && typeof post.userId === 'object') {
      username = post.userId.username || post.username;
      userAvatar = post.userId.avatar || post.userAvatar || '';
    }

    // Format all comments with user avatars
    const allComments = await Promise.all((post.comments || []).map(async (comment) => {
      let userAvatar = null;
      if (comment.userId) {
        try {
          const commentUser = await User.findById(comment.userId).lean();
          userAvatar = (commentUser?.avatar && commentUser.avatar.trim() !== '') ? commentUser.avatar : null;
        } catch (err) {
          // Silent fail
        }
      }
      return {
        id: comment._id?.toString() || comment._id,
        userId: comment.userId?.toString() || comment.userId,
        username: comment.username,
        text: comment.text || '',
        image: comment.image || '',
        avatar: userAvatar,
        createdAt: comment.createdAt
      };
    }));

    // Get images array, fallback to single image for backward compatibility
    const images = post.images && post.images.length > 0 
      ? post.images 
      : (post.image ? [post.image] : []);

    res.json({
      success: true,
      post: {
        id: post._id.toString(),
        userId: post.userId?._id?.toString() || post.userId?.toString() || post.userId,
        username: username,
        userAvatar: userAvatar,
        image: images[0] || post.image || '',
        images: images,
        caption: post.caption || '',
        likes: post.likes?.length || 0,
        isLiked: post.likes?.some(like => like.toString() === req.userId) || false,
        comments: post.comments?.length || 0,
        commentsList: allComments,
        createdAt: post.createdAt
      }
    });
  } catch (error) {
    console.error('Get post by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Update post
router.put('/:postId', verifyToken, async (req, res) => {
  try {
    const postId = req.params.postId;
    const { caption } = req.body;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bài viết không hợp lệ'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Check if user owns this post
    if (post.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa bài viết này'
      });
    }

    // Update caption if provided
    if (caption !== undefined) {
      if (caption.length > 2200) {
        return res.status(400).json({
          success: false,
          message: 'Caption không được quá 2200 ký tự'
        });
      }
      post.caption = caption || '';
    }

    await post.save();

    res.json({
      success: true,
      message: 'Đã cập nhật bài viết',
      post: {
        id: post._id.toString(),
        userId: post.userId.toString(),
        username: post.username,
        userAvatar: post.userAvatar,
        image: post.image,
        caption: post.caption,
        likes: post.likes?.length || 0,
        comments: post.comments?.length || 0,
        createdAt: post.createdAt
      }
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Delete post
router.delete('/:postId', verifyToken, async (req, res) => {
  try {
    const postId = req.params.postId;
    
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bài viết không hợp lệ'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Check if user owns this post
    if (post.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa bài viết này'
      });
    }

    await Post.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: 'Đã xóa bài viết'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

module.exports = router;

