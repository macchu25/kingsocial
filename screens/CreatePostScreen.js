import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { postService } from '../services/postService';
import { handleApiError } from '../utils/errorHandler';

const { width } = Dimensions.get('window');

const CreatePostScreen = ({ user, onPostCreated, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    // Request permission for image picker
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
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
          setImageBase64(imageUri);
        } catch (error) {
          console.error('Error converting image:', error);
          Alert.alert('Lỗi', 'Không thể xử lý ảnh. Vui lòng thử lại.');
        } finally {
          setImageLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
      setImageLoading(false);
    }
  };

  const handlePost = async () => {
    if (!selectedImage || !imageBase64) {
      Alert.alert('Lỗi', 'Vui lòng chọn ảnh');
      return;
    }

    if (caption.length > 2200) {
      Alert.alert('Lỗi', 'Caption không được quá 2200 ký tự');
      return;
    }

    setLoading(true);

    try {
      const response = await postService.createPost(imageBase64, caption);

      if (response.success) {
        Alert.alert('Thành công', response.message);
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
          disabled={loading || !selectedImage}
        >
          {loading ? (
            <ActivityIndicator color="#0095F6" size="small" />
          ) : (
            <Text style={[styles.postButtonText, !selectedImage && styles.postButtonDisabled]}>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholderText: {
    fontSize: 16,
    color: '#8e8e8e',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
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

