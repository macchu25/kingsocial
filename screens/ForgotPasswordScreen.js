import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '../components/Input';
import Button from '../components/Button';
import { authService } from '../services/authService';
import { handleApiError } from '../utils/errorHandler';
import { alertError, alertSuccess } from '../utils/alert';

const { height } = Dimensions.get('window');

const ForgotPasswordScreen = ({ onClose, onBackToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset password
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateEmail = () => {
    if (!formData.email) {
      alertError('Lỗi', 'Vui lòng nhập email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alertError('Lỗi', 'Email không hợp lệ');
      return false;
    }

    return true;
  };

  const handleOtpChange = (value, index) => {
    // Chỉ cho phép số
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length > 1) {
      // Nếu paste nhiều số, phân bổ vào các ô
      const digits = numericValue.slice(0, 6).split('');
      const newOtp = [...otpCode];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtpCode(newOtp);
      
      // Focus vào ô cuối cùng đã điền
      const nextIndex = Math.min(index + digits.length, 5);
      if (otpRefs.current[nextIndex]) {
        otpRefs.current[nextIndex].focus();
      }
    } else {
      // Chỉ nhập 1 số
      const newOtp = [...otpCode];
      newOtp[index] = numericValue;
      setOtpCode(newOtp);
      
      // Tự động focus sang ô tiếp theo
      if (numericValue && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyPress = (e, index) => {
    // Xử lý phím Backspace
    if (e.nativeEvent.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const getOtpString = () => {
    return otpCode.join('');
  };

  const validateResetForm = () => {
    const otpString = getOtpString();
    if (!otpString || otpString.length !== 6) {
      alertError('Lỗi', 'Vui lòng nhập đầy đủ mã OTP 6 số');
      return false;
    }

    if (!formData.newPassword) {
      alertError('Lỗi', 'Vui lòng nhập mật khẩu mới');
      return false;
    }

    if (formData.newPassword.length < 6) {
      alertError('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      alertError('Lỗi', 'Mật khẩu xác nhận không khớp');
      return false;
    }

    return true;
  };

  const handleRequestResetToken = async () => {
    if (!validateEmail()) return;

    setLoading(true);

    try {
      const response = await authService.forgotPassword(formData.email);

      if (response.success) {
        alertSuccess('Thành công', response.message, () => {
          setStep(2);
        });
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateResetForm()) return;

    setLoading(true);

    try {
      const otpString = getOtpString();
      const response = await authService.resetPassword(formData.email, otpString, formData.newPassword);

      if (response.success) {
        alertSuccess('Thành công', response.message, () => {
          setFormData({
            email: '',
            newPassword: '',
            confirmPassword: '',
          });
          setOtpCode(['', '', '', '', '', '']);
          setStep(1);
          if (onBackToLogin) {
            onBackToLogin();
          }
          if (onClose) {
            onClose();
          }
        });
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (step === 1) {
                if (onClose) onClose();
              } else {
                setStep(1);
                setOtpCode(['', '', '', '', '', '']);
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quên mật khẩu</Text>
          <View style={styles.placeholder} />
        </View>

        {step === 1 ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed-outline" size={64} color="#FFB6C1" />
              </View>
              <Text style={styles.title}>Quên mật khẩu?</Text>
              <Text style={styles.description}>
                Nhập email của bạn để nhận mã OTP 6 số qua email
              </Text>

              <Input
                label="Email"
                placeholder="demo@email.com"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Button
                title="Gửi mã đặt lại"
                onPress={handleRequestResetToken}
                loading={loading}
              />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.content}>
            <View style={styles.resetPasswordContainer}>
              <View style={styles.iconContainerSmall}>
                <Ionicons name="key-outline" size={48} color="#FFB6C1" />
              </View>
              <Text style={styles.titleSmall}>Đặt lại mật khẩu</Text>
              <Text style={styles.descriptionSmall}>
                Nhập mã OTP 6 số đã được gửi đến email {formData.email}
              </Text>

              <View style={styles.otpContainer}>
                <Text style={styles.otpLabel}>Mã OTP</Text>
                <View style={styles.otpInputContainer}>
                  {otpCode.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (otpRefs.current[index] = ref)}
                      style={[
                        styles.otpInput,
                        digit && styles.otpInputFilled,
                      ]}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={(e) => handleOtpKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      textAlign="center"
                    />
                  ))}
                </View>
              </View>

              <Input
                label="Mật khẩu mới"
                placeholder="Nhập mật khẩu mới"
                value={formData.newPassword}
                onChangeText={(value) => handleInputChange('newPassword', value)}
                secureTextEntry
              />

              <Input
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu mới"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
              />

              <Button
                title="Đặt lại mật khẩu"
                onPress={handleResetPassword}
                loading={loading}
              />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 20,
  },
  resetPasswordContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  otpContainer: {
    marginBottom: 15,
  },
  otpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: '#fff',
  },
  otpInputFilled: {
    borderColor: '#FFB6C1',
    backgroundColor: '#fff5f7',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainerSmall: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  titleSmall: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  descriptionSmall: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});

export default ForgotPasswordScreen;

