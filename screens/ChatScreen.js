import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { messageService } from '../services/messageService';
import { chatGPTService } from '../services/chatGPTService';
import { handleApiError } from '../utils/errorHandler';

const DEFAULT_AVATAR = require('../asset/avt.jpg');
const CHAT_BACKGROUND = require('../asset/zsa.jpg');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ChatScreen = ({ 
  chatUser, 
  currentUser, 
  isDarkMode = false, 
  onClose 
}) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const scrollViewRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const lastMessageTimeRef = useRef(null);

  // Check if chatting with AI
  const isAIChat = chatUser?.id === 'openai' || chatUser?.isAI;

  // Load initial messages (50 most recent)
  useEffect(() => {
    if (chatUser?.id) {
      if (isAIChat) {
        // For AI chat, just set loading to false (no messages to load)
        setLoading(false);
      } else {
        loadMessages();
        // Mark messages as read
        messageService.markAsRead(chatUser.id).catch(() => {});
      }
    }

    // Request permissions (only for non-AI chat)
    if (!isAIChat) {
      (async () => {
        if (Platform.OS !== 'web') {
          await ImagePicker.requestMediaLibraryPermissionsAsync();
          await ImagePicker.requestCameraPermissionsAsync();
        }
      })();
    }

    // Start polling for new messages every 3 seconds (only for non-AI chat)
    if (!isAIChat) {
      pollingIntervalRef.current = setInterval(() => {
        checkNewMessages();
      }, 3000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [chatUser?.id, isAIChat]);

  const loadMessages = async (before = null) => {
    if (!chatUser?.id) return;

    try {
      if (!before) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await messageService.getMessages(chatUser.id, before, 50);
      
      if (response.success) {
        if (before) {
          // Loading older messages - prepend to existing
          setMessages(prev => [...response.messages, ...prev]);
        } else {
          // Initial load - replace all
          setMessages(response.messages);
          // Scroll to bottom after initial load
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }
        setHasMore(response.hasMore);
        if (response.messages.length > 0) {
          lastMessageTimeRef.current = response.messages[response.messages.length - 1].createdAt;
        }
      }
    } catch (error) {
      console.error('Load messages error:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const checkNewMessages = async () => {
    if (!chatUser?.id || loading || loadingMore) return;

    try {
      const response = await messageService.getMessages(chatUser.id, null, 50);
      
      if (response.success && response.messages.length > 0) {
        const latestMessage = response.messages[response.messages.length - 1];
        
        // Check if we have new messages
        if (!lastMessageTimeRef.current || 
            new Date(latestMessage.createdAt) > new Date(lastMessageTimeRef.current)) {
          // Update messages list with new messages
          setMessages(response.messages);
          lastMessageTimeRef.current = latestMessage.createdAt;
          
          // Scroll to bottom if user is near bottom
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
          
          // Mark as read
          messageService.markAsRead(chatUser.id).catch(() => {});
        }
      }
    } catch (error) {
      // Silent fail for polling
      console.error('Check new messages error:', error);
    }
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    
    const oldestMessage = messages[0];
    loadMessages(oldestMessage.createdAt);
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !imageBase64) || sending || !chatUser?.id) return;

    // AI chat doesn't support images
    if (isAIChat && imageBase64) {
      Alert.alert('Thông báo', 'ChatGPT hiện không hỗ trợ gửi ảnh. Vui lòng chỉ gửi tin nhắn văn bản.');
      return;
    }

    const textToSend = messageText.trim();
    const imageToSend = imageBase64;
    setMessageText('');
    setSelectedImage(null);
    setImageBase64(null);
    setSending(true);

    // Optimistic update - user message
    const userMessage = {
      id: `user-${Date.now()}`,
      text: textToSend || '',
      image: imageToSend || null,
      senderId: currentUser?.id,
      receiverId: chatUser?.id,
      senderUsername: currentUser?.username || '',
      receiverUsername: chatUser?.username || '',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      if (isAIChat) {
        // Handle AI chat
        const conversationHistory = messages.map(msg => ({
          senderId: msg.senderId === currentUser?.id ? 'user' : 'openai',
          text: msg.text || '',
        }));

        const response = await chatGPTService.sendMessage(textToSend, conversationHistory);
        
        if (response.success) {
          // Add AI response
          const aiMessage = {
            id: `ai-${Date.now()}`,
            text: response.message,
            image: null,
            senderId: 'openai',
            receiverId: currentUser?.id,
            senderUsername: 'Gemini',
            receiverUsername: currentUser?.username || '',
            read: false,
            createdAt: new Date().toISOString(),
          };
          setMessages(prev => [...prev, aiMessage]);
          
          // Scroll to bottom after AI response
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } else {
          // Show error message
          Alert.alert('Lỗi', response.message || 'Không thể nhận phản hồi từ ChatGPT.');
        }
      } else {
        // Handle regular chat
        const response = await messageService.sendMessage(chatUser.id, textToSend, imageToSend);
        
        if (response.success) {
          // Replace temp message with real message
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== userMessage.id);
            return [...filtered, response.message];
          });
          lastMessageTimeRef.current = response.message.createdAt;
        } else {
          // Remove temp message on error
          setMessages(prev => prev.filter(m => m.id !== userMessage.id));
          Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
        }
      }
    } catch (error) {
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      handleApiError(error);
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        
        // Convert to base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'base64',
        });
        const imageUri = `data:image/jpeg;base64,${base64}`;
        setImageBase64(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Check camera permissions first
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập bị từ chối',
          'Cần quyền truy cập camera để chụp ảnh. Vui lòng cấp quyền trong cài đặt.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        
        // Convert to base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'base64',
        });
        const imageUri = `data:image/jpeg;base64,${base64}`;
        setImageBase64(imageUri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      const errorMessage = error.message || 'Không thể chụp ảnh';
      
      // Check for specific error types (camera not available on emulator/device)
      if (errorMessage.includes('Failed to resolve activity') || 
          errorMessage.includes('resolve activity') ||
          errorMessage.includes('rejected')) {
        Alert.alert(
          'Camera không khả dụng',
          'Camera không khả dụng trên thiết bị/emulator này. Vui lòng chọn ảnh từ thư viện thay thế.',
          [
            {
              text: 'Chọn từ thư viện',
              onPress: () => handlePickImage(),
            },
            {
              text: 'Hủy',
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert(
          'Lỗi', 
          `Không thể chụp ảnh: ${errorMessage}. Vui lòng thử lại hoặc chọn ảnh từ thư viện.`,
          [
            {
              text: 'Chọn từ thư viện',
              onPress: () => handlePickImage(),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageBase64(null);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Background Image */}
      <Image 
        source={CHAT_BACKGROUND} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.backgroundOverlay} />
      
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.userInfo}>
          <Image
            source={
              (chatUser?.avatar && chatUser.avatar.trim() !== '')
                ? { uri: chatUser.avatar }
                : DEFAULT_AVATAR
            }
            style={styles.headerAvatar}
            defaultSource={DEFAULT_AVATAR}
          />
          <Text style={[styles.headerUsername, isDarkMode && styles.headerUsernameDark]}>
            {chatUser?.username === 'ChatGPT' ? 'Gemini' : (chatUser?.username || 'User')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.videoButton}>
          <Ionicons name="videocam-outline" size={24} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.messagesContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
                Chưa có tin nhắn nào
              </Text>
              <Text style={[styles.emptySubtext, isDarkMode && styles.emptySubtextDark]}>
                Bắt đầu cuộc trò chuyện với {chatUser?.username || 'người này'}
              </Text>
            </View>
          ) : (
            messages.map((message) => {
              // For AI chat: user messages have senderId === currentUser?.id, AI messages have senderId === 'openai'
              // For regular chat: user messages have senderId === currentUser?.id
              const isOwnMessage = isAIChat 
                ? (message.senderId === currentUser?.id)
                : (message.senderId === currentUser?.id);
              
              const hasImage = !!message.image;
              const messageContent = (
                <View
                  style={[
                    styles.messageBubble,
                    isOwnMessage ? styles.ownMessage : styles.otherMessage,
                    isDarkMode && (isOwnMessage ? styles.ownMessageDark : styles.otherMessageDark),
                    hasImage && styles.messageBubbleNoBorder, // No border if has image
                  ]}
                >
                  {message.image && (
                    <Image
                      source={{ uri: message.image }}
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  )}
                  {message.text ? (
                    <Text
                      style={[
                        styles.messageText,
                        isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                        isDarkMode && (isOwnMessage ? styles.ownMessageTextDark : styles.otherMessageTextDark),
                      ]}
                    >
                      {message.text}
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      styles.messageTime,
                      isDarkMode && styles.messageTimeDark,
                    ]}
                  >
                    {formatTime(message.createdAt)}
                  </Text>
                </View>
              );

              return (
                <View key={message.id}>
                  {messageContent}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Image Preview - Only for non-AI chat */}
        {!isAIChat && selectedImage && (
          <View style={[styles.imagePreviewContainer, isDarkMode && styles.imagePreviewContainerDark]}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} resizeMode="cover" />
            <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
          {!isAIChat && (
            <TouchableOpacity style={styles.attachButton} onPress={handlePickImage}>
              <Ionicons name="add-circle-outline" size={28} color={isDarkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
          )}
          <TextInput
            style={[styles.messageInput, isDarkMode && styles.messageInputDark]}
            placeholder={isAIChat ? "Nhập câu hỏi..." : "Tin nhắn..."}
            placeholderTextColor={isDarkMode ? "#666" : "#8e8e8e"}
            value={messageText}
            onChangeText={setMessageText}
            onSubmitEditing={handleSendMessage}
            multiline
            maxLength={1000}
          />
          {messageText.trim() || imageBase64 ? (
            <TouchableOpacity 
              onPress={handleSendMessage} 
              style={styles.sendButton}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#0095F6" />
              ) : (
                <Ionicons name="send" size={24} color="#0095F6" />
              )}
            </TouchableOpacity>
          ) : (
            !isAIChat && (
              <TouchableOpacity style={styles.cameraButton} onPress={handleTakePhoto}>
                <Ionicons name="camera-outline" size={24} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            )
          )}
        </View>
      </KeyboardAvoidingView>
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
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Semi-transparent white overlay for better text readability
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(219, 219, 219, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  headerDark: {
    borderBottomColor: 'rgba(51, 51, 51, 0.5)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  aiHeaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  headerUsernameDark: {
    color: '#fff',
  },
  videoButton: {
    padding: 5,
  },
  messagesContainer: {
    flex: 1,
    zIndex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 20,
    flexGrow: 1,
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  loadMoreButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  loadMoreText: {
    fontSize: 14,
    color: '#0095F6',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8e8e8e',
    marginBottom: 8,
  },
  emptyTextDark: {
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  emptySubtextDark: {
    color: '#666',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    marginBottom: 8,
    borderWidth: 1,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e0e0e0',
    borderColor: '#000',
    borderBottomRightRadius: 4,
  },
  ownMessageDark: {
    backgroundColor: '#4a4a4a',
    borderColor: '#000',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e0e0',
    borderColor: '#000',
    borderBottomLeftRadius: 4,
  },
  otherMessageDark: {
    backgroundColor: '#4a4a4a',
    borderColor: '#000',
  },
  messageBubbleNoBorder: {
    borderWidth: 0, // No border for messages with images
  },
  messageBubbleNoBackground: {
    backgroundColor: 'transparent', // No background for messages with images
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#000',
  },
  ownMessageTextDark: {
    color: '#000',
  },
  otherMessageText: {
    color: '#000',
  },
  otherMessageTextDark: {
    color: '#000',
  },
  messageTime: {
    fontSize: 11,
    color: '#8e8e8e',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeDark: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(219, 219, 219, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  inputContainerDark: {
    borderTopColor: 'rgba(51, 51, 51, 0.5)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  attachButton: {
    padding: 5,
    marginRight: 8,
  },
  messageInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    fontSize: 15,
    color: '#000',
  },
  messageInputDark: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
  },
  sendButton: {
    padding: 5,
    marginLeft: 8,
  },
  cameraButton: {
    padding: 5,
    marginLeft: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
  },
  imagePreviewContainerDark: {
    backgroundColor: '#1a1a1a',
    borderTopColor: '#333',
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
});

export default React.memo(ChatScreen);

