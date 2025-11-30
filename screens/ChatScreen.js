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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_AVATAR = require('../asset/avt.jpg');

const ChatScreen = ({ 
  chatUser, 
  currentUser, 
  isDarkMode = false, 
  onClose 
}) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    // Load messages - TODO: implement API
    // For now, show empty chat
  }, [chatUser]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: messageText.trim(),
      senderId: currentUser?.id,
      receiverId: chatUser?.id,
      createdAt: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setMessageText('');
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
            {chatUser?.username || 'User'}
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
              const isOwnMessage = message.senderId === currentUser?.id;
              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    isOwnMessage ? styles.ownMessage : styles.otherMessage,
                    isDarkMode && (isOwnMessage ? styles.ownMessageDark : styles.otherMessageDark),
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                      isDarkMode && (isOwnMessage ? styles.ownMessageTextDark : styles.otherMessageTextDark),
                    ]}
                  >
                    {message.text}
                  </Text>
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
            })
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle-outline" size={28} color={isDarkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
          <TextInput
            style={[styles.messageInput, isDarkMode && styles.messageInputDark]}
            placeholder="Tin nhắn..."
            placeholderTextColor={isDarkMode ? "#666" : "#8e8e8e"}
            value={messageText}
            onChangeText={setMessageText}
            onSubmitEditing={handleSendMessage}
            multiline
            maxLength={1000}
          />
          {messageText.trim() ? (
            <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
              <Ionicons name="send" size={24} color="#0095F6" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="camera-outline" size={24} color={isDarkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerDark: {
    borderBottomColor: '#333',
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
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 20,
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
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0095F6',
    borderBottomRightRadius: 4,
  },
  ownMessageDark: {
    backgroundColor: '#0095F6',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  otherMessageDark: {
    backgroundColor: '#1a1a1a',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  ownMessageTextDark: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  otherMessageTextDark: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeDark: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
    backgroundColor: '#fff',
  },
  inputContainerDark: {
    borderTopColor: '#333',
    backgroundColor: '#000',
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
});

export default React.memo(ChatScreen);

