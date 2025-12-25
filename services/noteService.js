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

export const noteService = {
  // Lấy tất cả notes (chỉ của người follow lẫn nhau)
  getAllNotes: async () => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.get(`${baseUrl}/api/notes`, {
      headers,
    });
    return response.data;
  },

  // Tạo note mới
  createNote: async (text) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.post(
      `${baseUrl}/api/notes/create`,
      { text },
      { headers }
    );
    return response.data;
  },

  // Đánh dấu note đã xem
  markNoteViewed: async (noteId) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.post(
      `${baseUrl}/api/notes/${noteId}/view`,
      {},
      { headers }
    );
    return response.data;
  },

  // Xóa note
  deleteNote: async (noteId) => {
    const headers = await getAuthHeaders();
    const baseUrl = getBaseUrl();
    const response = await axios.delete(
      `${baseUrl}/api/notes/${noteId}`,
      { headers }
    );
    return response.data;
  },
};

