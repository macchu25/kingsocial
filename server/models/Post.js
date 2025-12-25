const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  text: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  image: {
    type: String,
    default: ''
  },
  isSensitive: {
    type: Boolean,
    default: false
  },
  sensitiveReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  userAvatar: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  images: {
    type: [String],
    default: []
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 2200,
    default: ''
  },
  type: {
    type: String,
    enum: ['post', 'reel'],
    default: 'post'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema]
}, {
  timestamps: true
});

// Virtual for likes count
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for comments count
postSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Ensure virtuals are included in JSON
postSchema.set('toJSON', { virtuals: true });

// Add indexes for better query performance
postSchema.index({ userId: 1, createdAt: -1 }); // For user posts queries
postSchema.index({ type: 1, createdAt: -1 }); // For filtering by type
postSchema.index({ createdAt: -1 }); // For general post listing

module.exports = mongoose.model('Post', postSchema);



