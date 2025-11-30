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

export const notificationService = {
  // Lấy tất cả thông báo
  getNotifications: async () => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.get(`${baseUrl}/api/notifications`, {
      headers,
    });
    return response.data;
  },

  // Đánh dấu thông báo đã đọc
  markAsRead: async (notificationId) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.post(
      `${baseUrl}/api/notifications/${notificationId}/read`,
      {},
      { headers }
    );
    return response.data;
  },
};

