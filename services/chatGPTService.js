import axios from 'axios';
import { API_URL } from '../config/constants';
import { storage } from '../utils/storage';

// Get base URL from API_URL
const getBaseUrl = () => {
  return API_URL.replace('/api/auth', '');
};

const getAuthHeaders = async () => {
  const token = await storage.getToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const chatGPTService = {
  // Send message to ChatGPT via backend proxy
  sendMessage: async (message, conversationHistory = []) => {
    try {
      if (!message || message.trim().length === 0) {
        return {
          success: false,
          message: 'Vui lòng nhập tin nhắn',
        };
      }

      const headers = await getAuthHeaders();
      const baseUrl = getBaseUrl();

      const response = await axios.post(
        `${baseUrl}/api/chatgpt/chat`,
        {
          message: message.trim(),
          conversationHistory: conversationHistory,
        },
        {
          headers,
        }
      );

      return response.data;
    } catch (error) {
      console.error('ChatGPT API error:', error);
      if (error.response) {
        // API error response
        return {
          success: false,
          message: error.response.data?.message || 'Lỗi khi gọi ChatGPT API',
        };
      } else if (error.request) {
        // Network error
        return {
          success: false,
          message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
        };
      } else {
        // Other error
        return {
          success: false,
          message: error.message || 'Đã xảy ra lỗi không xác định',
        };
      }
    }
  },
};

