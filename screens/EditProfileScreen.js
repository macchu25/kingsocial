import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { profileService } from '../services/profileService';
import { storage } from '../utils/storage';
import { handleApiError } from '../utils/errorHandler';
import { alertError, alertSuccess, alertInfo } from '../utils/alert';

const DEFAULT_AVATAR = require('../asset/avt.jpg');

const EditProfileScreen = ({ user, onUpdate, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
  });
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    // Request permission for image picker
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alertInfo(
            'Cần quyền truy cập',
            'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh đại diện.'
          );
        }
      }
    })();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        
        // Convert image to base64
        setImageLoading(true);
        try {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'base64',
          });
          const imageUri = `data:image/jpeg;base64,${base64}`;
          
          setFormData(prev => ({
            ...prev,
            avatar: imageUri,
          }));
        } catch (error) {
          console.error('Error converting image:', error);
          // Fallback to local URI if base64 conversion fails
          setFormData(prev => ({
            ...prev,
            avatar: asset.uri,
          }));
        } finally {
          setImageLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alertError('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
      setImageLoading(false);
    }
  };

  const handleSave = async () => {
    if (loading) return;

    // Validation
    if (formData.name && formData.name.length > 50) {
      alertError('Lỗi', 'Tên không được quá 50 ký tự');
      return;
    }

    if (formData.bio && formData.bio.length > 150) {
      alertError('Lỗi', 'Tiểu sử không được quá 150 ký tự');
      return;
    }

    setLoading(true);

    try {
      const response = await profileService.updateProfile(
        formData.name,
        formData.bio,
        formData.avatar || ''
      );

      if (response.success) {
        // Update local storage
        await storage.saveUser(response.user);
        alertSuccess('Thành công', response.message);
        onUpdate(response.user);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa trang cá nhân</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0095F6" size="small" />
          ) : (
            <Text style={styles.saveText}>Xong</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {imageLoading ? (
              <View style={[styles.avatar, styles.avatarLoading]}>
                <ActivityIndicator size="large" color="#0095F6" />
              </View>
            ) : (
              <Image
                source={
                  selectedImage 
                    ? { uri: selectedImage }
                    : (formData.avatar && formData.avatar.trim() !== '') 
                      ? { uri: formData.avatar }
                      : (user?.avatar && user.avatar.trim() !== '') 
                        ? { uri: user.avatar }
                        : DEFAULT_AVATAR
                }
                style={styles.avatar}
                defaultSource={DEFAULT_AVATAR}
              />
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handlePickImage}
              disabled={imageLoading}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.changeAvatarButton}
            onPress={handlePickImage}
            disabled={imageLoading}
          >
            <Text style={styles.changeAvatarText}>Thay đổi ảnh đại diện</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Tên</Text>
            <TextInput
              style={styles.input}
              placeholder="Tên của bạn"
              placeholderTextColor="#8e8e8e"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              maxLength={50}
            />
            <Text style={styles.charCount}>
              {formData.name.length}/50
            </Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Tên người dùng</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.username || ''}
              editable={false}
            />
            <Text style={styles.hint}>
              Bạn không thể thay đổi tên người dùng
            </Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Tiểu sử</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Viết tiểu sử của bạn..."
              placeholderTextColor="#8e8e8e"
              value={formData.bio}
              onChangeText={(value) => handleInputChange('bio', value)}
              multiline
              numberOfLines={4}
              maxLength={150}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {formData.bio.length}/150
            </Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>URL ảnh đại diện</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/avatar.jpg"
              placeholderTextColor="#8e8e8e"
              value={formData.avatar}
              onChangeText={(value) => handleInputChange('avatar', value)}
              keyboardType="url"
              autoCapitalize="none"
            />
            <Text style={styles.hint}>
              Nhập URL của ảnh đại diện (để trống sẽ dùng ảnh mặc định)
            </Text>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  cancelButton: {
    paddingVertical: 5,
  },
  cancelText: {
    fontSize: 16,
    color: '#000',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    paddingVertical: 5,
    minWidth: 50,
    alignItems: 'flex-end',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0095F6',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#E1306C',
  },
  avatarLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0095F6',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  changeAvatarButton: {
    paddingVertical: 8,
  },
  changeAvatarText: {
    fontSize: 16,
    color: '#0095F6',
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  fieldContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#8e8e8e',
  },
  bioInput: {
    height: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#8e8e8e',
    textAlign: 'right',
    marginTop: 5,
  },
  hint: {
    fontSize: 12,
    color: '#8e8e8e',
    marginTop: 5,
  },
});

export default EditProfileScreen;

