const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const postsRoutes = require('./routes/posts');
const followRoutes = require('./routes/follow');
const usersRoutes = require('./routes/users');
const storiesRoutes = require('./routes/stories');
const notesRoutes = require('./routes/notes');
const notificationsRoutes = require('./routes/notifications');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expo-app';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

