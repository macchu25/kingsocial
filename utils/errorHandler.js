import { alertError } from './alert';

export const handleApiError = (error) => {
  console.error('API Error:', error);
  console.error('Error details:', {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status,
    url: error.config?.url,
  });
  
  let message = 'Có lỗi xảy ra. Vui lòng thử lại.';
  
  if (error.response) {
    // Server responded with error status
    if (error.response.status === 404) {
      message = 'Không tìm thấy API endpoint. Vui lòng kiểm tra:\n- Backend có đang chạy không?\n- Route có đúng không?';
    } else if (error.response.status === 401) {
      message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    } else if (error.response.status === 413) {
      message = 'Kích thước ảnh quá lớn. Vui lòng:\n- Chọn ít ảnh hơn\n- Hoặc chọn ảnh có kích thước nhỏ hơn';
    } else {
      message = error.response.data?.message || `Lỗi ${error.response.status}: ${error.response.statusText || 'Unknown error'}`;
    }
  } else if (error.request) {
    // Request was made but no response received
    message = 'Không thể kết nối đến server. Vui lòng kiểm tra:\n- Backend có đang chạy không?\n- IP và port có đúng không?';
  } else {
    // Error setting up request
    message = error.message || 'Lỗi khi gửi yêu cầu';
  }
  
  alertError('Lỗi', message);
};

