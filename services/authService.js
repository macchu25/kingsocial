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

  // Quên mật khẩu - Yêu cầu reset token
  forgotPassword: async (email) => {
    const response = await axios.post(`${API_URL}/forgot-password`, {
      email,
    });
    return response.data;
  },

  // Đặt lại mật khẩu - Sử dụng mã OTP 6 số
  resetPassword: async (email, otpCode, newPassword) => {
    const response = await axios.post(`${API_URL}/reset-password`, {
      email,
      otpCode,
      newPassword,
    });
    return response.data;
  },
};










