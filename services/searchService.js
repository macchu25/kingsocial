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

export const searchService = {
  // Tìm kiếm người dùng
  searchUsers: async (query) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.get(
      `${baseUrl}/api/search/users`,
      {
        params: { q: query },
        headers,
      }
    );
    return response.data;
  },

  // Tìm kiếm bài viết
  searchPosts: async (query) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.get(
      `${baseUrl}/api/search/posts`,
      {
        params: { q: query },
        headers,
      }
    );
    return response.data;
  },
};



