// Load environment variables FIRST before requiring any modules
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/validator');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const postsRoutes = require('./routes/posts');
const followRoutes = require('./routes/follow');
const usersRoutes = require('./routes/users');
const storiesRoutes = require('./routes/stories');
const notesRoutes = require('./routes/notes');
const notificationsRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');
const messagesRoutes = require('./routes/messages');
const chatgptRoutes = require('./routes/chatgpt');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API (can enable if needed)
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration - Restrict to specific origins in production
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*', // Allow all in development, restrict in production
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parser with size limits
app.use(express.json({ 
  limit: '10mb', // Reduced from 50mb for security
  verify: (req, res, buf) => {
    // Prevent JSON parsing errors from crashing server
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ success: false, message: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

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
app.use('/api/search', searchRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/chatgpt', chatgptRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend server is running!',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be after all routes)
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔒 Security features enabled: Rate Limiting, Helmet, CORS`);
});

