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

export const followService = {
  // Follow/Unfollow user
  toggleFollow: async (userId) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.post(
      `${baseUrl}/api/follow/${userId}`,
      {},
      { headers }
    );
    return response.data;
  },

  // Check follow status
  checkFollowStatus: async (userId) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.get(
      `${baseUrl}/api/follow/${userId}/status`,
      { headers }
    );
    return response.data;
  },

  // Get user stats
  getUserStats: async (userId) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.get(
      `${baseUrl}/api/follow/${userId}/stats`,
      { headers }
    );
    return response.data;
  },
};


