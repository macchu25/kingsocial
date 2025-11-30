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

export const storyService = {
  // Lấy tất cả stories (chỉ của người đã follow)
  getAllStories: async () => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.get(`${baseUrl}/api/stories`, {
      headers,
    });
    return response.data;
  },

  // Tạo story mới
  createStory: async (image) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.post(
      `${baseUrl}/api/stories/create`,
      { image },
      { headers }
    );
    return response.data;
  },

  // Đánh dấu story đã xem
  markStoryViewed: async (storyId) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.post(
      `${baseUrl}/api/stories/${storyId}/view`,
      {},
      { headers }
    );
    return response.data;
  },
};

