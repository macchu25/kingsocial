import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '../components/Input';
import { profileService } from '../services/profileService';
import { handleApiError } from '../utils/errorHandler';
import { alertError, alertSuccess } from '../utils/alert';

const ChangePasswordScreen = ({ user, isDarkMode = false, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      alertError('Lỗi', 'Vui lòng nhập mật khẩu hiện tại');
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

    if (formData.newPassword === formData.currentPassword) {
      alertError('Lỗi', 'Mật khẩu mới phải khác mật khẩu hiện tại');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      alertError('Lỗi', 'Mật khẩu xác nhận không khớp');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await profileService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      if (response.success) {
        alertSuccess('Thành công', response.message, () => {
          setFormData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          if (onSuccess) {
            onSuccess();
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
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
          Đổi mật khẩu
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.description, isDarkMode && styles.descriptionDark]}>
            Để đảm bảo tài khoản của bạn được bảo mật, vui lòng nhập mật khẩu hiện tại và mật khẩu mới.
          </Text>

          {/* Current Password */}
          <View style={styles.inputContainer}>
            <Input
              label="Mật khẩu hiện tại"
              placeholder="Nhập mật khẩu hiện tại"
              value={formData.currentPassword}
              onChangeText={(value) => handleInputChange('currentPassword', value)}
              secureTextEntry
              isDarkMode={isDarkMode}
            />
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Input
              label="Mật khẩu mới"
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              value={formData.newPassword}
              onChangeText={(value) => handleInputChange('newPassword', value)}
              secureTextEntry
              isDarkMode={isDarkMode}
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Input
              label="Xác nhận mật khẩu mới"
              placeholder="Nhập lại mật khẩu mới"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry
              isDarkMode={isDarkMode}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword) && styles.saveButtonDisabled,
              isDarkMode && styles.saveButtonDark
            ]}
            onPress={handleChangePassword}
            disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Đổi mật khẩu</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerTitleDark: {
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 15,
  },
  description: {
    fontSize: 14,
    color: '#8e8e8e',
    marginBottom: 20,
    lineHeight: 20,
  },
  descriptionDark: {
    color: '#ccc',
  },
  inputContainer: {
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#0095F6',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDark: {
    backgroundColor: '#0095F6',
  },
  saveButtonDisabled: {
    backgroundColor: '#c0c0c0',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChangePasswordScreen;

