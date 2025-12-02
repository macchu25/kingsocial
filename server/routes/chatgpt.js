const express = require('express');
const router = express.Router();
const axios = require('axios');
const { verifyToken } = require('../middleware/auth');
const { chatGPTLimiter } = require('../middleware/rateLimiter');

// Send message to Google Gemini via backend proxy
// Set USE_MOCK_AI=true in .env to use simple mock responses (no API needed)
router.post('/chat', chatGPTLimiter, verifyToken, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    // Check if mock mode is enabled (for testing without API)
    const useMockAI = process.env.USE_MOCK_AI === 'true';
    if (useMockAI) {
      // Simple mock AI response
      const mockResponses = [
        'Xin chào! Tôi là trợ lý AI của bạn. Bạn cần tôi giúp gì không?',
        'Tôi hiểu bạn đang nói về: ' + message.substring(0, 50) + '... Bạn có thể giải thích thêm không?',
        'Cảm ơn bạn đã chia sẻ! Tôi đang trong chế độ mock (không dùng API thật). Để dùng AI thật, hãy setup billing cho Gemini API.',
        'Tôi có thể giúp bạn trả lời các câu hỏi cơ bản. Bạn muốn biết gì?'
      ];
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      return res.json({
        success: true,
        message: randomResponse
      });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tin nhắn'
      });
    }

    // Prefer GEMINI_API_KEY over OPENAI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY_HERE' || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return res.status(500).json({
        success: false,
        message: 'Google Gemini API key chưa được cấu hình trên server. Vui lòng thêm GEMINI_API_KEY hoặc OPENAI_API_KEY vào file .env'
      });
    }

    // Validate API key format (Gemini keys typically start with AIza)
    if (!apiKey.startsWith('AIza') && !apiKey.startsWith('sk-')) {
      console.warn('API key format may be incorrect. Gemini keys typically start with "AIza"');
    }

    // Build contents array for Gemini API
    // Gemini uses a different format - it needs contents array with parts
    // Important: contents must alternate between user and model, starting with user
    const contents = [];

    // Add conversation history
    // Note: Frontend may send 'openai' as senderId for AI messages, but we're using Gemini
    conversationHistory.forEach(msg => {
      if (msg.text && typeof msg.text === 'string' && msg.text.trim()) {
        // AI messages: 'openai' or 'gemini' senderId indicates AI response
        if (msg.senderId === 'openai' || msg.senderId === 'gemini') {
          contents.push({
            role: 'model',
            parts: [{ text: msg.text.trim() }]
          });
        } else {
          // User messages (senderId is user's ID or 'user')
          contents.push({
            role: 'user',
            parts: [{ text: msg.text.trim() }]
          });
        }
      }
    });

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }]
    });

    // Validate contents - must start with user message and alternate
    if (contents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung tin nhắn không hợp lệ'
      });
    }

    // Ensure first message is from user
    if (contents[0].role !== 'user') {
      // If first is model, we need to add a dummy user message
      contents.unshift({
        role: 'user',
        parts: [{ text: 'Xin chào' }]
      });
    }

    // Validate alternation (user -> model -> user -> model...)
    for (let i = 0; i < contents.length; i++) {
      const expectedRole = i % 2 === 0 ? 'user' : 'model';
      if (contents[i].role !== expectedRole) {
        console.warn(`Content at index ${i} has role ${contents[i].role}, expected ${expectedRole}`);
      }
    }

    // Build request payload
    const requestPayload = {
      contents: contents,
      generationConfig: {
        temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
        maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 500,
      }
    };

    // Use specific model and API version (simpler, more reliable)
    // Default to gemini-pro with v1beta (most stable combination)
    const model = process.env.GEMINI_MODEL || 'gemini-pro';
    const apiVersion = process.env.GEMINI_API_VERSION || 'v1beta';

    // Use Gemini API endpoint
    const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
    
    console.log(`=== Calling Gemini API: ${model} (${apiVersion}) ===`);
    
    const response = await axios.post(
      apiUrl,
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      const candidate = response.data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        res.json({
          success: true,
          message: candidate.content.parts[0].text.trim(),
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Không nhận được phản hồi từ Gemini'
        });
      }
    } else {
      res.status(500).json({
        success: false,
        message: 'Không nhận được phản hồi từ Gemini'
      });
    }
  } catch (error) {
    console.error('=== Gemini API Error ===');
    console.error('Error message:', error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error statusText:', error.response?.statusText);
    console.error('Error response data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Full error:', error);
    
    if (error.response) {
      // API error response
      const errorData = error.response.data;
      let errorMessage = 'Lỗi khi gọi Gemini API';
      
      // Check for specific error types
      if (errorData?.error?.reason === 'API_KEY_INVALID' || 
          (errorData?.error?.message && errorData.error.message.includes('API key not valid'))) {
        errorMessage = 'API key không hợp lệ. Vui lòng:\n1. Kiểm tra API key trong file .env\n2. Tạo API key mới tại: https://aistudio.google.com/app/apikey\n3. Đảm bảo API key có quyền truy cập Gemini API\n4. Kiểm tra xem đã setup billing chưa (có thể cần billing để sử dụng API)';
      } else if (errorData?.error?.message && errorData.error.message.includes('is not found') || 
                 errorData?.error?.message && errorData.error.message.includes('not supported')) {
        errorMessage = `Model không tìm thấy hoặc không được hỗ trợ. Vui lòng:\n1. Kiểm tra GEMINI_MODEL trong file .env\n2. Thử đổi sang: gemini-pro hoặc gemini-1.5-pro\n3. Hoặc kiểm tra danh sách model tại: https://ai.google.dev/models/gemini\n\nLỗi chi tiết: ${errorData.error.message}`;
      } else if (errorData?.error?.message) {
        errorMessage = `Gemini API: ${errorData.error.message}`;
      } else if (typeof errorData?.error === 'string') {
        errorMessage = `Gemini API: ${errorData.error}`;
      } else if (errorData?.message) {
        errorMessage = `Gemini API: ${errorData.message}`;
      } else if (errorData) {
        errorMessage = `Gemini API: ${JSON.stringify(errorData)}`;
      }
      
      res.status(error.response.status || 500).json({
        success: false,
        message: errorMessage,
      });
    } else if (error.request) {
      // Network error
      res.status(503).json({
        success: false,
        message: 'Không thể kết nối đến Gemini. Vui lòng kiểm tra kết nối mạng.',
      });
    } else {
      // Other error
      res.status(500).json({
        success: false,
        message: error.message || 'Đã xảy ra lỗi không xác định',
      });
    }
  }
});

module.exports = router;

