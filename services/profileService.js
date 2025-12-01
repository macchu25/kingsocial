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

export const profileService = {
  // Lấy thông tin profile
  getProfile: async () => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.get(`${baseUrl}/api/profile/me`, {
      headers,
    });
    return response.data;
  },

  // Cập nhật profile
  updateProfile: async (name, bio, avatar) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.put(
      `${baseUrl}/api/profile/update`,
      { name, bio, avatar },
      { headers }
    );
      return response.data;
    },

    // Đổi mật khẩu
    changePassword: async (currentPassword, newPassword) => {
      const headers = await getAuthHeaders();
      const baseUrl = getBaseUrl();
      const response = await axios.put(
        `${baseUrl}/api/profile/change-password`,
        { currentPassword, newPassword },
        { headers }
      );
      return response.data;
    },
  };

