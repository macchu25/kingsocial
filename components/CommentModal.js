import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { postService } from '../services/postService';
import { handleApiError } from '../utils/errorHandler';
import SwipeableCommentRow from './SwipeableCommentRow';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_AVATAR = require('../asset/avt.jpg');

const CommentModal = ({ 
  visible, 
  post, 
  currentUser, 
  isDarkMode = false, 
  onClose,
  onViewProfile 
}) => {
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editImageBase64, setEditImageBase64] = useState(null);
  const swipeRefs = useRef({});

  useEffect(() => {
    if (visible && post) {
      loadComments();
    }
  }, [visible, post]);

  const loadComments = async () => {
    if (!post?.id) return;
    
    setLoading(true);
    try {
      const response = await postService.getPostById(post.id);
      if (response.success && response.post) {
        const commentsList = response.post.commentsList || [];
        setComments(commentsList);
        setCommentsCount(response.post.comments || 0);
        console.log('Loaded comments:', commentsList.length);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        
        // Convert image to base64
        try {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'base64',
          });
          const imageUri = `data:${asset.type || 'image/jpeg'};base64,${base64}`;
          setImageBase64(imageUri);
        } catch (error) {
          console.error('Error converting image:', error);
          Alert.alert('Lỗi', 'Không thể xử lý ảnh. Vui lòng thử lại.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageBase64(null);
  };

  const commonEmojis = ['😀', '😂', '❤️', '😍', '😊', '👍', '🔥', '😢', '😮', '😄'];

  const insertEmoji = (emoji) => {
    if (editingComment) {
      setEditText(editText + emoji);
    } else {
      setCommentText(commentText + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      'Xóa bình luận',
      'Bạn có chắc chắn muốn xóa bình luận này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await postService.deleteComment(post.id, commentId);
              if (response.success) {
                setComments(comments.filter(c => c.id !== commentId));
                setCommentsCount(response.commentsCount);
              }
            } catch (error) {
              handleApiError(error);
            }
          },
        },
      ]
    );
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditText(comment.text || '');
    setEditImage(comment.image || null);
    setEditImageBase64(comment.image || null);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText('');
    setEditImage(null);
    setEditImageBase64(null);
  };

  const handleSaveEdit = async () => {
    if ((!editText.trim() && !editImageBase64) || !editingComment) return;

    try {
      const response = await postService.updateComment(
        post.id, 
        editingComment.id, 
        editText.trim(), 
        editImageBase64
      );
      if (response.success) {
        setComments(comments.map(c => 
          c.id === editingComment.id ? response.comment : c
        ));
        handleCancelEdit();
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const handlePickEditImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setEditImage(asset.uri);
        
        try {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'base64',
          });
          const imageUri = `data:${asset.type || 'image/jpeg'};base64,${base64}`;
          setEditImageBase64(imageUri);
        } catch (error) {
          console.error('Error converting image:', error);
          Alert.alert('Lỗi', 'Không thể xử lý ảnh. Vui lòng thử lại.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const handleAddComment = async () => {
    if ((!commentText.trim() && !imageBase64) || !post?.id) return;

    const commentToAdd = commentText.trim();
    setCommenting(true);
    const tempComment = {
      id: `temp-${Date.now()}`,
      userId: currentUser?.id,
      username: currentUser?.username || 'Bạn',
      avatar: currentUser?.avatar || '',
      text: commentToAdd,
      image: selectedImage ? imageBase64 : null,
      createdAt: new Date().toISOString(),
    };
    const updatedComments = [...comments, tempComment];
    setComments(updatedComments);
    setCommentText('');
    setSelectedImage(null);
    setImageBase64(null);

    try {
      const response = await postService.addComment(post.id, commentToAdd, imageBase64);
      if (response.success) {
        // Replace temp comment with real comment from server
        setComments([...comments, response.comment]);
        setCommentsCount(response.commentsCount);
        // Reload all comments
        loadComments();
      } else {
        // Remove temp comment on error
        setComments(comments);
      }
    } catch (error) {
      // Remove temp comment on error
      setComments(comments);
      handleApiError(error);
    } finally {
      setCommenting(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày`;
    if (hours > 0) return `${hours} giờ`;
    if (minutes > 0) return `${minutes} phút`;
    return 'Vừa xong';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
            {/* Header */}
            <View style={[styles.header, isDarkMode && styles.headerDark]}>
              <View style={styles.headerLine} />
              <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
                Bình luận
              </Text>
            </View>

            {/* Comments List */}
            <ScrollView
              style={styles.commentsScroll}
              contentContainerStyle={styles.commentsScrollContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled={true}
              nestedScrollEnabled={true}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={isDarkMode ? "#fff" : "#000"} />
                </View>
              ) : comments.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
                    Chưa có bình luận nào
                  </Text>
                </View>
              ) : (
                comments.map((comment, index) => {
                  const isCommentOwner = comment.userId === currentUser?.id;
                  const isPostOwner = post?.userId === currentUser?.id;
                  const canEdit = isCommentOwner;
                  const canDelete = isCommentOwner || isPostOwner;

                  return (
                    <SwipeableCommentRow
                      key={comment.id || index}
                      onDelete={() => handleDeleteComment(comment.id)}
                      onEdit={() => handleEditComment(comment)}
                      canDelete={canDelete}
                      canEdit={canEdit}
                      isDarkMode={isDarkMode}
                      backgroundColor={isDarkMode ? '#1a1a1a' : '#fff'}
                    >
                      <View style={styles.commentItem}>
                        <TouchableOpacity
                          onPress={() => {
                            if (onViewProfile && comment.userId) {
                              onViewProfile(comment.userId, comment.username, comment.avatar);
                            }
                          }}
                          style={styles.commentUserContainer}
                          activeOpacity={0.7}
                        >
                          <Image
                            source={
                              (comment.avatar && comment.avatar.trim() !== '') 
                                ? { uri: comment.avatar }
                                : DEFAULT_AVATAR
                            }
                            style={styles.commentAvatar}
                            defaultSource={DEFAULT_AVATAR}
                          />
                          <View style={styles.commentContent}>
                            <View style={styles.commentHeader}>
                              <TouchableOpacity
                                onPress={() => {
                                  if (onViewProfile && comment.userId) {
                                    onViewProfile(comment.userId, comment.username, comment.avatar);
                                  }
                                }}
                              >
                                <Text style={[styles.commentUsername, isDarkMode && styles.commentUsernameDark]}>
                                  {comment.username}
                                </Text>
                              </TouchableOpacity>
                              <Text style={[styles.commentTime, isDarkMode && styles.commentTimeDark]}>
                                {formatTime(comment.createdAt)}
                              </Text>
                            </View>
                            <Text style={[styles.commentText, isDarkMode && styles.commentTextDark]}>
                              {comment.text}
                            </Text>
                            {comment.image && (
                              <Image
                                source={{ uri: comment.image }}
                                style={styles.commentImage}
                                resizeMode="cover"
                              />
                            )}
                            <TouchableOpacity style={styles.replyButton}>
                              <Text style={[styles.replyText, isDarkMode && styles.replyTextDark]}>
                                Trả lời
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity style={styles.likeButton}>
                            <Ionicons 
                              name="heart-outline" 
                              size={16} 
                              color={isDarkMode ? "#fff" : "#000"} 
                            />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      </View>
                    </SwipeableCommentRow>
                  );
                })
              )}
            </ScrollView>

            {/* Selected Image Preview */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={handleRemoveImage}
                >
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <View style={[styles.emojiPickerContainer, isDarkMode && styles.emojiPickerContainerDark]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {commonEmojis.map((emoji, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.emojiItem}
                      onPress={() => insertEmoji(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Comment Input */}
            <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
              <Image
                source={
                  (currentUser?.avatar && currentUser.avatar.trim() !== '') 
                    ? { uri: currentUser.avatar }
                    : DEFAULT_AVATAR
                }
                style={styles.userAvatar}
                defaultSource={DEFAULT_AVATAR}
              />
              <TextInput
                style={[styles.commentInput, isDarkMode && styles.commentInputDark]}
                placeholder={`Bình luận cho ${post?.username || ''}...`}
                placeholderTextColor={isDarkMode ? "#666" : "#8e8e8e"}
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={handleAddComment}
                editable={!commenting}
                multiline
              />
              <TouchableOpacity 
                style={styles.emojiButton}
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Ionicons name="happy-outline" size={24} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.imageButton}
                onPress={handlePickImage}
              >
                <Ionicons name="image-outline" size={24} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddComment}
                disabled={(!commentText.trim() && !imageBase64) || commenting}
                style={styles.sendButton}
              >
                {commenting ? (
                  <ActivityIndicator size="small" color={isDarkMode ? "#0095F6" : "#0095F6"} />
                ) : (
                  <Ionicons 
                    name="paper-plane-outline" 
                    size={24} 
                    color={((commentText.trim() || imageBase64) && !commenting) ? "#0095F6" : (isDarkMode ? "#666" : "#ccc")} 
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Edit Comment Modal */}
            {editingComment && (
              <View style={[styles.editModal, isDarkMode && styles.editModalDark]}>
                <View style={[styles.editHeader, isDarkMode && styles.editHeaderDark]}>
                  <TouchableOpacity onPress={handleCancelEdit}>
                    <Text style={[styles.editCancelText, isDarkMode && styles.editCancelTextDark]}>Hủy</Text>
                  </TouchableOpacity>
                  <Text style={[styles.editTitle, isDarkMode && styles.editTitleDark]}>Chỉnh sửa bình luận</Text>
                  <TouchableOpacity 
                    onPress={handleSaveEdit}
                    disabled={(!editText.trim() && !editImageBase64)}
                  >
                    <Text style={[
                      styles.editSaveText,
                      (!editText.trim() && !editImageBase64) && styles.editSaveTextDisabled
                    ]}>Lưu</Text>
                  </TouchableOpacity>
                </View>
                {editImage && (
                  <View style={styles.editImagePreviewContainer}>
                    <Image source={{ uri: editImage }} style={styles.editImagePreview} />
                    <TouchableOpacity 
                      style={styles.removeEditImageButton}
                      onPress={() => {
                        setEditImage(null);
                        setEditImageBase64(null);
                      }}
                    >
                      <Ionicons name="close-circle" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
                <TextInput
                  style={[styles.editInput, isDarkMode && styles.editInputDark]}
                  placeholder="Chỉnh sửa bình luận..."
                  placeholderTextColor={isDarkMode ? "#666" : "#8e8e8e"}
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  autoFocus
                />
                <View style={styles.editActions}>
                  <TouchableOpacity 
                    style={styles.editImageButton}
                    onPress={handlePickEditImage}
                  >
                    <Ionicons name="image-outline" size={24} color={isDarkMode ? "#fff" : "#000"} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.editEmojiButton}
                    onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Ionicons name="happy-outline" size={24} color={isDarkMode ? "#fff" : "#000"} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  modalContentDark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
    position: 'relative',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  headerLine: {
    position: 'absolute',
    top: 8,
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  headerTitleDark: {
    color: '#fff',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginHorizontal: 15,
    marginBottom: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  emojiPickerContainer: {
    backgroundColor: '#f5f5f5',
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
    paddingVertical: 10,
    maxHeight: 100,
  },
  emojiPickerContainerDark: {
    backgroundColor: '#2a2a2a',
    borderTopColor: '#333',
  },
  emojiItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emojiText: {
    fontSize: 24,
  },
  sendButton: {
    padding: 5,
    marginLeft: 5,
  },
  imageButton: {
    padding: 5,
    marginLeft: 5,
  },
  commentImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  commentsScroll: {
    flex: 1,
  },
  commentsScrollContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  emptyTextDark: {
    color: '#666',
  },
  commentItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  commentUserContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  commentUsernameDark: {
    color: '#fff',
  },
  commentTime: {
    fontSize: 12,
    color: '#8e8e8e',
  },
  commentTimeDark: {
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 6,
  },
  commentTextDark: {
    color: '#fff',
  },
  replyButton: {
    marginTop: 4,
  },
  replyText: {
    fontSize: 12,
    color: '#8e8e8e',
  },
  replyTextDark: {
    color: '#666',
  },
  commentImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  likeButton: {
    padding: 5,
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
  },
  inputContainerDark: {
    borderTopColor: '#333',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    maxHeight: 100,
  },
  commentInputDark: {
    color: '#fff',
  },
  emojiButton: {
    padding: 5,
    marginLeft: 10,
  },
  editModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  editModalDark: {
    backgroundColor: '#1a1a1a',
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  editHeaderDark: {
    borderBottomColor: '#333',
  },
  editCancelText: {
    fontSize: 16,
    color: '#0095F6',
  },
  editCancelTextDark: {
    color: '#0095F6',
  },
  editTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  editTitleDark: {
    color: '#fff',
  },
  editSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0095F6',
  },
  editSaveTextDisabled: {
    color: '#ccc',
  },
  editImagePreviewContainer: {
    position: 'relative',
    marginHorizontal: 15,
    marginTop: 10,
  },
  editImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeEditImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  editInput: {
    marginHorizontal: 15,
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
    fontSize: 14,
    color: '#000',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editInputDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
    color: '#fff',
  },
  editActions: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  editImageButton: {
    padding: 5,
    marginRight: 10,
  },
  editEmojiButton: {
    padding: 5,
  },
});

export default CommentModal;

