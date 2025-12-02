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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../components/BottomNavigation';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { postService } from '../services/postService';
import { handleApiError } from '../utils/errorHandler';
import { alertError, alertSuccess, alertInfo, alertWarning } from '../utils/alert';

const { width } = Dimensions.get('window');

const CreatePostScreen = ({ user, isDarkMode = false, onPostCreated, onCancel, onNavigateToHome, onNavigateToProfile, onNavigateToSearch }) => {
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagesBase64, setImagesBase64] = useState([]);
  const [caption, setCaption] = useState('');
  const [isVideo, setIsVideo] = useState(false);

  useEffect(() => {
    // Request permission for image picker
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (libraryStatus !== 'granted' || cameraStatus !== 'granted') {
          alertInfo(
            'Cần quyền truy cập',
            'Ứng dụng cần quyền truy cập thư viện ảnh và camera để chọn/chụp ảnh.'
          );
        }
      }
    })();
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.4, // Low quality to reduce file size significantly
        exif: false, // Remove EXIF data to reduce size
        videoMaxDuration: 60, // Max 60 seconds for videos
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processMedia(result.assets);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      alertError('Lỗi', 'Không thể chọn ảnh/video. Vui lòng thử lại.');
      setImageLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
        allowsEditing: false,
        quality: 0.4,
        exif: false,
        videoMaxDuration: 60, // Max 60 seconds for videos
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processMedia(result.assets);
      }
    } catch (error) {
      console.error('Error taking photo/video:', error);
      alertError('Lỗi', 'Không thể chụp ảnh/quay video. Vui lòng thử lại.');
      setImageLoading(false);
    }
  };

  const processMedia = async (assets) => {
    // Limit to 1 video or 5 images max to avoid payload too large
    const maxImages = 5;
    const maxVideos = 1;
    
    // Check if any asset is a video
    const hasVideo = assets.some(asset => asset.type === 'video');
    
      if (hasVideo) {
      // If video, only allow 1 video
      const videoAssets = assets.filter(asset => asset.type === 'video').slice(0, maxVideos);
      if (videoAssets.length === 0) {
        alertError('Lỗi', 'Vui lòng chọn video hợp lệ.');
        return;
      }
      if (assets.length > 1) {
        alertWarning('Thông báo', 'Chỉ có thể chọn 1 video. Đã chọn video đầu tiên.');
      }
      const assetsToProcess = videoAssets;
      
      setImageLoading(true);
      try {
        const newImages = [];
        const newImagesBase64 = [];
        
        for (const asset of assetsToProcess) {
          newImages.push(asset.uri);
          
          // Convert video to base64
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'base64',
          });
          const videoUri = `data:video/mp4;base64,${base64}`;
          newImagesBase64.push(videoUri);
        }
        
        setSelectedImages(newImages);
        setImagesBase64(newImagesBase64);
        setIsVideo(true); // Mark as video/reel
      } catch (error) {
        console.error('Error converting video:', error);
        alertError('Lỗi', 'Không thể xử lý video. Vui lòng thử lại.');
      } finally {
        setImageLoading(false);
      }
    } else {
      // If images, allow up to 5
      const assetsToProcess = assets.slice(0, maxImages);
      
      if (assets.length > maxImages) {
        alertWarning('Thông báo', `Chỉ có thể chọn tối đa ${maxImages} ảnh. Đã chọn ${maxImages} ảnh đầu tiên.`);
      }
      
      setImageLoading(true);
      try {
        const newImages = [];
        const newImagesBase64 = [];
        
        for (const asset of assetsToProcess) {
          newImages.push(asset.uri);
          
          // Convert image to base64
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'base64',
          });
          const imageUri = `data:image/jpeg;base64,${base64}`;
          newImagesBase64.push(imageUri);
        }
        
        setSelectedImages(newImages);
        setImagesBase64(newImagesBase64);
        setIsVideo(false); // Mark as image/post
      } catch (error) {
        console.error('Error converting images:', error);
        alertError('Lỗi', 'Không thể xử lý ảnh. Vui lòng thử lại.');
      } finally {
        setImageLoading(false);
      }
    }
  };

  const handlePost = async () => {
    if (selectedImages.length === 0 || imagesBase64.length === 0) {
      alertError('Lỗi', 'Vui lòng chọn ít nhất một ảnh');
      return;
    }

    if (caption.length > 2200) {
      alertError('Lỗi', 'Caption không được quá 2200 ký tự');
      return;
    }

    setLoading(true);

    try {
      // Determine type: if video, use 'reel', otherwise 'post'
      const postType = isVideo ? 'reel' : 'post';
      const response = await postService.createPost(imagesBase64, caption, postType);

      if (response.success) {
        alertSuccess('Thành công', response.message);
        // Reset state
        setSelectedImages([]);
        setImagesBase64([]);
        setCaption('');
        setIsVideo(false);
        onPostCreated();
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
        <Text style={styles.headerTitle}>Tạo bài viết mới</Text>
        <TouchableOpacity
          onPress={handlePost}
          style={styles.postButton}
          disabled={loading || selectedImages.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#0095F6" size="small" />
          ) : (
            <Text style={[styles.postButtonText, selectedImages.length === 0 && styles.postButtonDisabled]}>
              Đăng
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          {imageLoading ? (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="large" color="#0095F6" />
            </View>
          ) : selectedImages.length > 0 ? (
            <ScrollView 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              style={styles.imagesScrollView}
            >
              {selectedImages.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={styles.selectedImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.imagePlaceholder}>
              <TouchableOpacity
                style={styles.imageOptionButton}
                onPress={handlePickImage}
              >
                <Ionicons name="images-outline" size={32} color="#0095F6" />
                <Text style={styles.placeholderText}>Chọn ảnh</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.imageOptionButton}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera-outline" size={32} color="#0095F6" />
                <Text style={styles.placeholderText}>Chụp ảnh</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Caption Section */}
        <View style={styles.captionSection}>
          <Text style={styles.label}>Caption</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="Viết caption cho bài viết..."
            placeholderTextColor="#8e8e8e"
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={6}
            maxLength={2200}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {caption.length}/2200
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        user={user}
        isDarkMode={isDarkMode}
        activeTab="add"
        onTabChange={(tab) => {
          if (tab === 'home' && onNavigateToHome) {
            onNavigateToHome();
          } else if (tab === 'profile' && onNavigateToProfile) {
            onNavigateToProfile();
          } else if (tab === 'search' && onNavigateToSearch) {
            onNavigateToSearch();
          }
        }}
      />
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
  content: {
    flex: 1,
  },
  imageSection: {
    width: width,
    height: width,
    backgroundColor: '#f0f0f0',
    marginBottom: 20,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  imageOptionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#8e8e8e',
    marginTop: 8,
  },
  imagesScrollView: {
    width: width,
    height: width,
  },
  selectedImage: {
    width: width,
    height: width,
  },
  captionSection: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  captionInput: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#8e8e8e',
    textAlign: 'right',
    marginTop: 5,
  },
});

export default CreatePostScreen;

