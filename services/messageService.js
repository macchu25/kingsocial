import axios from 'axios';
import { API_URL } from '../config/constants';
import { storage } from '../utils/storage';

const getAuthHeaders = async () => {
  const token = await storage.getToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Get base URL from API_URL
const getBaseUrl = () => {
  return API_URL.replace('/api/auth', '');
};

export const messageService = {
  // Lấy tin nhắn với người dùng (50 tin nhắn gần nhất)
  getMessages: async (userId, before = null, limit = 50) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const params = { limit };
    if (before) {
      params.before = before;
    }
    const response = await axios.get(
      `${baseUrl}/api/messages/${userId}`,
      {
        params,
        headers,
      }
    );
    return response.data;
  },

  // Gửi tin nhắn
  sendMessage: async (userId, text, image = null) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.post(
      `${baseUrl}/api/messages/${userId}`,
      { text, image },
      { headers }
    );
    return response.data;
  },

  // Đánh dấu tin nhắn đã đọc
  markAsRead: async (userId) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.put(
      `${baseUrl}/api/messages/${userId}/read`,
      {},
      { headers }
    );
    return response.data;
  },

  // Xóa tin nhắn
  deleteMessage: async (userId, messageId) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.delete(
      `${baseUrl}/api/messages/${userId}/${messageId}`,
      { headers }
    );
    return response.data;
  },
};



