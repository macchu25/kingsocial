import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { storyService } from '../services/storyService';
import { handleApiError } from '../utils/errorHandler';
import { alertError, alertSuccess, alertInfo } from '../utils/alert';

const { width } = Dimensions.get('window');

const CreateStoryScreen = ({ user, onStoryCreated, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);

  useEffect(() => {
    // Request permission for image picker
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alertInfo(
            'Cần quyền truy cập',
            'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh.'
          );
        }
      }
    })();
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16], // Story format (vertical)
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
          setImageBase64(imageUri);
        } catch (error) {
          console.error('Error converting image:', error);
          alertError('Lỗi', 'Không thể xử lý ảnh. Vui lòng thử lại.');
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

  const handlePost = async () => {
    if (!selectedImage || !imageBase64) {
      alertError('Lỗi', 'Vui lòng chọn ảnh');
      return;
    }

    setLoading(true);

    try {
      const response = await storyService.createStory(imageBase64);

      if (response.success) {
        alertSuccess('Thành công', response.message);
        onStoryCreated();
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo tin</Text>
        <TouchableOpacity
          onPress={handlePost}
          style={styles.postButton}
          disabled={loading || !selectedImage}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.postButtonText, !selectedImage && styles.postButtonDisabled]}>
              Đăng
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Image Section */}
      <View style={styles.imageSection}>
        {imageLoading ? (
          <View style={styles.imagePlaceholder}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : selectedImage ? (
          <Image
            source={{ uri: selectedImage }}
            style={styles.selectedImage}
            resizeMode="cover"
          />
        ) : (
          <TouchableOpacity
            style={styles.imagePlaceholder}
            onPress={handlePickImage}
          >
            <Text style={styles.placeholderText}>Chọn ảnh</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  cancelButton: {
    paddingVertical: 5,
  },
  cancelText: {
    fontSize: 16,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  postButton: {
    paddingVertical: 5,
    minWidth: 50,
    alignItems: 'flex-end',
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0095F6',
  },
  postButtonDisabled: {
    color: '#8e8e8e',
  },
  imageSection: {
    flex: 1,
    width: width,
    backgroundColor: '#000',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    fontSize: 16,
    color: '#8e8e8e',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
});

export default CreateStoryScreen;

