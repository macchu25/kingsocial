const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
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
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60 // Giới hạn 60 ký tự cho note
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 1); // Thêm 1 ngày
      return date;
    },
    index: { expireAfterSeconds: 0 } // Tự động xóa sau khi expiresAt
  },
  viewedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Tạo expiresAt tự động (1 ngày từ bây giờ) nếu chưa có
noteSchema.pre('save', function(next) {
  if (!this.expiresAt || this.isNew) {
    this.expiresAt = new Date();
    this.expiresAt.setDate(this.expiresAt.getDate() + 1); // Thêm 1 ngày
  }
  next();
});

module.exports = mongoose.model('Note', noteSchema);

