import { VALIDATION } from '../config/constants';
import { Alert } from 'react-native';

export const validateForm = (isLogin, formData) => {
  // Kiểm tra email và password
  if (!formData.email || !formData.password) {
    Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
    return false;
  }

  // Validation cho đăng ký
  if (!isLogin) {
    if (!formData.username) {
      Alert.alert('Lỗi', 'Vui lòng điền tên đăng nhập');
      return false;
    }
    if (formData.username.length < VALIDATION.USERNAME_MIN_LENGTH) {
      Alert.alert('Lỗi', `Tên đăng nhập phải có ít nhất ${VALIDATION.USERNAME_MIN_LENGTH} ký tự`);
      return false;
    }
    if (formData.username.length > VALIDATION.USERNAME_MAX_LENGTH) {
      Alert.alert('Lỗi', `Tên đăng nhập không được quá ${VALIDATION.USERNAME_MAX_LENGTH} ký tự`);
      return false;
    }
  }

  // Validation mật khẩu
  if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    Alert.alert('Lỗi', `Mật khẩu phải có ít nhất ${VALIDATION.PASSWORD_MIN_LENGTH} ký tự`);
    return false;
  }

  return true;
};









