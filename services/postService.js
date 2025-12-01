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
  createPost: async (images, caption) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    // Support both single image (backward compatibility) and multiple images
    const payload = Array.isArray(images) 
      ? { images, caption }
      : { image: images, caption };
    const response = await axios.post(
      `${baseUrl}/api/posts/create`,
      payload,
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
      addComment: async (postId, text, image = null) => {
        const headers = await getAuthHeaders();
        const baseUrl = getBaseUrl();
        const response = await axios.post(
          `${baseUrl}/api/posts/${postId}/comment`,
          { text, image },
          { headers }
        );
        return response.data;
      },

      // Xóa comment
      deleteComment: async (postId, commentId) => {
        const headers = await getAuthHeaders();
        const baseUrl = getBaseUrl();
        const response = await axios.delete(
          `${baseUrl}/api/posts/${postId}/comment/${commentId}`,
          { headers }
        );
        return response.data;
      },

      // Cập nhật comment
      updateComment: async (postId, commentId, text, image = null) => {
        const headers = await getAuthHeaders();
        const baseUrl = getBaseUrl();
        const response = await axios.put(
          `${baseUrl}/api/posts/${postId}/comment/${commentId}`,
          { text, image },
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

      // Lấy post theo ID với tất cả comments
      getPostById: async (postId) => {
        const headers = await getAuthHeaders();
        const baseUrl = getBaseUrl();
        const response = await axios.get(
          `${baseUrl}/api/posts/${postId}`,
          { headers }
        );
        return response.data;
      },

      // Xóa post
      deletePost: async (postId) => {
        const headers = await getAuthHeaders();
        const baseUrl = getBaseUrl();
        const response = await axios.delete(
          `${baseUrl}/api/posts/${postId}`,
          { headers }
        );
        return response.data;
      },

      // Cập nhật post
      updatePost: async (postId, caption) => {
        const headers = await getAuthHeaders();
        const baseUrl = getBaseUrl();
        const response = await axios.put(
          `${baseUrl}/api/posts/${postId}`,
          { caption },
          { headers }
        );
        return response.data;
      },
    };


