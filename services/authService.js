import axios from 'axios';
import { API_URL } from '../config/constants';

export const authService = {
  // Đăng ký
  register: async (username, email, password) => {
    const response = await axios.post(`${API_URL}/register`, {
      username,
      email,
      password,
    });
    return response.data;
  },

  // Đăng nhập
  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });
    return response.data;
  },
};



