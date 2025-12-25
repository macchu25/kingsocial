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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../components/BottomNavigation';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { postService } from '../services/postService';
import { handleApiError } from '../utils/errorHandler';
import { alertError, alertSuccess, alertInfo, alertWarning } from '../utils/alert';
import { validatePostContentAI } from '../utils/contentModeration';

const { width } = Dimensions.get('window');

const CreatePostScreen = ({ user, isDarkMode = false, onPostCreated, onCancel, onNavigateToHome, onNavigateToProfile, onNavigateToSearch }) => {
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagesBase64, setImagesBase64] = useState([]);
  const [caption, setCaption] = useState('');
  const [isVideo, setIsVideo] = useState(false);
  const [contentWarning, setContentWarning] = useState(null);
  const [isContentValid, setIsContentValid] = useState(true);

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

  // Kiểm tra nội dung khi caption thay đổi
  // useEffect(() => {
  //   const checkContent = async () => {
  //     if (caption.trim().length === 0) {
  //       setContentWarning(null);
  //       setIsContentValid(true);
  //       return;
  //     }

  //     const validation = await validatePostContentAI(caption);
      
  //     if (!validation.isValid) {
  //       setIsContentValid(false);
  //       setContentWarning({
  //         severity: validation.severity,
  //         message: validation.message,
  //         sensitiveWords: validation.sensitiveWords || [],
  //       });
  //     } else if (validation.severity === 'medium' || validation.severity === 'low') {
  //       setIsContentValid(true);
  //       setContentWarning({
  //         severity: validation.severity,
  //         message: validation.message,
  //         sensitiveWords: validation.sensitiveWords || [],
  //       });
  //     } else {
  //       setIsContentValid(true);
  //       setContentWarning(null);
  //     }
  //   };

  //   // Debounce để tránh kiểm tra quá nhiều lần
  //   const timeoutId = setTimeout(checkContent, 500);
  //   return () => clearTimeout(timeoutId);
  // }, [caption, imagesBase64]);

  const handlePost = async () => {
    if (selectedImages.length === 0 || imagesBase64.length === 0) {
      alertError('Lỗi', 'Vui lòng chọn ít nhất một ảnh');
      return;
    }

    if (caption.length > 2200) {
      alertError('Lỗi', 'Caption không được quá 2200 ký tự');
      return;
    }

    // Kiểm tra nội dung trước khi đăng
    const validation = await validatePostContentAI(caption);
    
    if (!validation.isValid) {
      // Vi phạm mức độ cao - không cho đăng
      alertError('Không thể đăng bài', validation.message);
      return;
    }

    // Nếu có cảnh báo mức độ trung bình, hỏi xác nhận
    if (validation.severity === 'medium') {
      Alert.alert(
        'Cảnh báo',
        validation.message + '\n\nBạn có muốn tiếp tục đăng bài không?',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Đăng bài',
            onPress: async () => {
              await proceedWithPost(validation);
            },
          },
        ]
      );
      return;
    }

    // Đăng bài bình thường
    await proceedWithPost(validation);
  };

  const proceedWithPost = async (validation) => {
    setLoading(true);

    try {
      // Determine type: if video, use 'reel', otherwise 'post'
      const postType = isVideo ? 'reel' : 'post';
      
      // Gửi flag isSensitive nếu có vi phạm
      const isSensitive = validation.severity !== 'none';
      const sensitiveReason = validation.severity !== 'none' 
        ? validation.message 
        : null;

      const response = await postService.createPost(
        imagesBase64, 
        caption, 
        postType,
        isSensitive,
        sensitiveReason
      );

      if (response.success) {
        alertSuccess('Thành công', response.message);
        // Reset state
        setSelectedImages([]);
        setImagesBase64([]);
        setCaption('');
        setIsVideo(false);
        setContentWarning(null);
        setIsContentValid(true);
        onPostCreated();
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar 
        barStyle="dark-content" 
        translucent={false}
        backgroundColor="#fff"
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo bài viết mới</Text>
        <TouchableOpacity
          onPress={handlePost}
          style={styles.postButton}
          disabled={loading || selectedImages.length === 0 || !isContentValid}
        >
          {loading ? (
            <ActivityIndicator color="#0095F6" size="small" />
          ) : (
            <Text style={[
              styles.postButtonText, 
              (selectedImages.length === 0 || !isContentValid) && styles.postButtonDisabled
            ]}>
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
            style={[
              styles.captionInput,
              contentWarning && contentWarning.severity === 'high' && styles.captionInputError,
              contentWarning && contentWarning.severity === 'medium' && styles.captionInputWarning,
            ]}
            placeholder="Viết caption cho bài viết..."
            placeholderTextColor="#8e8e8e"
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={6}
            maxLength={2200}
            textAlignVertical="top"
          />
          
          {/* Content Warning */}
          {contentWarning && (
            <View style={[
              styles.warningContainer,
              contentWarning.severity === 'high' && styles.warningContainerError,
              contentWarning.severity === 'medium' && styles.warningContainerWarning,
            ]}>
              <Ionicons 
                name={contentWarning.severity === 'high' ? 'alert-circle' : 'warning'} 
                size={16} 
                color={contentWarning.severity === 'high' ? '#FF3040' : '#FF9500'} 
              />
              <Text style={[
                styles.warningText,
                contentWarning.severity === 'high' && styles.warningTextError,
                contentWarning.severity === 'medium' && styles.warningTextWarning,
              ]}>
                {contentWarning.message}
              </Text>
            </View>
          )}
          
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
  captionInputError: {
    borderColor: '#FF3040',
    backgroundColor: '#fff5f5',
  },
  captionInputWarning: {
    borderColor: '#FF9500',
    backgroundColor: '#fffbf0',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  warningContainerError: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#FF3040',
  },
  warningContainerWarning: {
    backgroundColor: '#fffbf0',
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  warningText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  warningTextError: {
    color: '#FF3040',
    fontWeight: '600',
  },
  warningTextWarning: {
    color: '#FF9500',
    fontWeight: '500',
  },
});

export default CreatePostScreen;

