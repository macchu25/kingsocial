const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
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

// Get all notes from mutual follows only
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
    
    // Get mutual follows (users who follow current user back)
    const mutualFollows = [];
    for (const followingId of followingIds) {
      const followingUser = await User.findById(followingId);
      if (followingUser && followingUser.followers.some(id => id.toString() === req.userId)) {
        mutualFollows.push(followingId);
      }
    }
    
    // Also include current user's own notes
    const userIdsToFetch = [...mutualFollows, req.userId];

    // Get notes that haven't expired
    const now = new Date();
    const notes = await Note.find({
      userId: { $in: userIdsToFetch },
      expiresAt: { $gt: now }
    })
      .sort({ createdAt: -1 })
      .lean();

    // Group notes by user (only latest note per user)
    const notesByUser = {};
    notes.forEach(note => {
      const userId = note.userId.toString();
      if (!notesByUser[userId]) {
        notesByUser[userId] = {
          userId: userId,
          username: note.username,
          userAvatar: note.userAvatar || '',
          note: {
            id: note._id.toString(),
            text: note.text,
            createdAt: note.createdAt,
            isViewed: note.viewedBy && note.viewedBy.some(id => id.toString() === req.userId)
          }
        };
      }
    });

    // Convert to array
    const notesArray = Object.values(notesByUser);

    res.json({
      success: true,
      notes: notesArray
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Create new note
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung ghi chú'
      });
    }

    if (text.length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Ghi chú không được quá 60 ký tự'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Delete old notes of this user (even if they haven't expired yet)
    // This ensures only one note per user exists at a time
    await Note.deleteMany({ userId: req.userId });

    // Set expiresAt (1 day from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    const note = new Note({
      userId: req.userId,
      username: user.username,
      userAvatar: user.avatar || '',
      text: text.trim(),
      expiresAt: expiresAt
    });

    await note.save();

    res.status(201).json({
      success: true,
      message: 'Đăng ghi chú thành công!',
      note: {
        id: note._id,
        userId: note.userId,
        username: note.username,
        userAvatar: note.userAvatar,
        text: note.text,
        createdAt: note.createdAt,
        expiresAt: note.expiresAt
      }
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Delete note
router.delete('/:noteId', verifyToken, async (req, res) => {
  try {
    const noteId = req.params.noteId;
    
    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({
        success: false,
        message: 'ID ghi chú không hợp lệ'
      });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú'
      });
    }

    // Check if user owns this note
    if (note.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa ghi chú này'
      });
    }

    await Note.findByIdAndDelete(noteId);

    res.json({
      success: true,
      message: 'Đã xóa ghi chú'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

// Mark note as viewed
router.post('/:noteId/view', verifyToken, async (req, res) => {
  try {
    const noteId = req.params.noteId;
    
    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({
        success: false,
        message: 'ID ghi chú không hợp lệ'
      });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú'
      });
    }

    // Check if already viewed
    const userIdStr = req.userId.toString();
    if (!note.viewedBy || !note.viewedBy.some(id => id.toString() === userIdStr)) {
      if (!note.viewedBy) {
        note.viewedBy = [];
      }
      note.viewedBy.push(req.userId);
      await note.save();
    }

    res.json({
      success: true,
      message: 'Đã đánh dấu ghi chú đã xem'
    });
  } catch (error) {
    console.error('Mark note viewed error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại sau.'
    });
  }
});

module.exports = router;

