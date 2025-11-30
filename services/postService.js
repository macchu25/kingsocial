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

export const postService = {
  // Lấy tất cả posts
  getAllPosts: async () => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.get(`${baseUrl}/api/posts`, {
      headers,
    });
    return response.data;
  },

  // Tạo post mới
  createPost: async (image, caption) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.post(
      `${baseUrl}/api/posts/create`,
      { image, caption },
      { headers }
    );
    return response.data;
  },

  // Like/Unlike post
  likePost: async (postId) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.post(
      `${baseUrl}/api/posts/${postId}/like`,
      {},
      { headers }
    );
    return response.data;
  },

      // Thêm comment
      addComment: async (postId, text) => {
        const headers = await getAuthHeaders();
        const baseUrl = getBaseUrl();
        const response = await axios.post(
          `${baseUrl}/api/posts/${postId}/comment`,
          { text },
          { headers }
        );
        return response.data;
      },

      // Lấy posts của một user
      getUserPosts: async (userId) => {
        const headers = await getAuthHeaders();
        const baseUrl = getBaseUrl();
        const response = await axios.get(
          `${baseUrl}/api/posts/user/${userId}`,
          { headers }
        );
        return response.data;
      },
    };


