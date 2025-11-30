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

export const userService = {
  // Get user by ID
  getUserById: async (userId) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.get(`${baseUrl}/api/users/${userId}`, {
      headers,
    });
    return response.data;
  },
};

