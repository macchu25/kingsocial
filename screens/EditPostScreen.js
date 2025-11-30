import React, { useState } from 'react';
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { postService } from '../services/postService';
import { handleApiError } from '../utils/errorHandler';

const { width } = Dimensions.get('window');

const EditPostScreen = ({ post, isDarkMode = false, onPostUpdated, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState(post?.caption || '');

  const handleUpdate = async () => {
    if (caption.length > 2200) {
      Alert.alert('Lỗi', 'Caption không được quá 2200 ký tự');
      return;
    }

    setLoading(true);

    try {
      const response = await postService.updatePost(post.id, caption);

      if (response.success) {
        Alert.alert('Thành công', response.message);
        if (onPostUpdated) {
          onPostUpdated(response.post);
        }
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
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={[styles.cancelText, isDarkMode && styles.cancelTextDark]}>Hủy</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Chỉnh sửa bài viết</Text>
        <TouchableOpacity
          onPress={handleUpdate}
          style={styles.updateButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0095F6" size="small" />
          ) : (
            <Text style={styles.updateButtonText}>
              Lưu
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Section - Read only */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: post?.image }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </View>

        {/* Caption Section */}
        <View style={styles.captionSection}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Caption</Text>
          <TextInput
            style={[styles.captionInput, isDarkMode && styles.captionInputDark]}
            placeholder="Viết caption cho bài viết..."
            placeholderTextColor={isDarkMode ? "#666" : "#8e8e8e"}
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={6}
            maxLength={2200}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, isDarkMode && styles.charCountDark]}>
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
  cancelButton: {
    paddingVertical: 5,
  },
  cancelText: {
    fontSize: 16,
    color: '#000',
  },
  cancelTextDark: {
    color: '#fff',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  headerTitleDark: {
    color: '#fff',
  },
  updateButton: {
    paddingVertical: 5,
    minWidth: 50,
    alignItems: 'flex-end',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0095F6',
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
  postImage: {
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
  labelDark: {
    color: '#fff',
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
  captionInputDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
    color: '#fff',
  },
  charCount: {
    fontSize: 12,
    color: '#8e8e8e',
    textAlign: 'right',
    marginTop: 5,
  },
  charCountDark: {
    color: '#666',
  },
});

export default EditPostScreen;

