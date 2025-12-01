import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NotesSection from '../components/NotesSection';
import { followService } from '../services/followService';
import { handleApiError } from '../utils/errorHandler';
import SwipeableConversationRow from '../components/SwipeableConversationRow';

const DEFAULT_AVATAR = require('../asset/avt.jpg');

const MessagesScreen = ({ user, isDarkMode = false, onClose, onCreateNote, onCreateStory, onViewStory, onOpenChat }) => {
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]); // Store all messages for filtering
  const [searchText, setSearchText] = useState('');
  const [notesRefreshTrigger, setNotesRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('messages');

  useEffect(() => {
    loadFollowingList();
  }, []);

  // Filter messages based on search text (only by username)
  useEffect(() => {
    if (!searchText.trim()) {
      setMessages(allMessages);
      return;
    }

    const filtered = allMessages.filter((message) => {
      const searchLower = searchText.toLowerCase().trim();
      const usernameMatch = message.username?.toLowerCase().includes(searchLower);
      return usernameMatch;
    });

    setMessages(filtered);
  }, [searchText, allMessages]);

  const loadFollowingList = async () => {
    setLoading(true);
    try {
      const response = await followService.getFollowingList();
      if (response.success) {
        // Convert following list to messages format
        const followingMessages = response.following.map((followUser) => ({
          id: followUser.id,
          username: followUser.username,
          avatar: followUser.avatar,
          lastMessage: '',
          time: '',
          unread: false,
        }));
        setAllMessages(followingMessages);
        setMessages(followingMessages);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'seen') {
      return <Ionicons name="checkmark-done" size={16} color={isDarkMode ? "#999" : "#8e8e8e"} />;
    }
    if (status === 'sent') {
      return <Ionicons name="checkmark" size={16} color={isDarkMode ? "#999" : "#8e8e8e"} />;
    }
    return null;
  };

  const handleDeleteConversation = (messageId, username) => {
    // Don't allow deleting Gemini AI chat
    if (messageId === 'openai' || messageId === 'gemini') {
      return;
    }

    Alert.alert(
      'Xóa cuộc trò chuyện',
      `Bạn có chắc chắn muốn xóa cuộc trò chuyện với ${username}?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            // Remove from both messages and allMessages lists
            setMessages(prev => prev.filter(m => m.id !== messageId));
            setAllMessages(prev => prev.filter(m => m.id !== messageId));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerUsername, isDarkMode && styles.headerUsernameDark]}>
            {user?.username || 'username'}
          </Text>
          <TouchableOpacity>
            <Ionicons name="chevron-down" size={16} color={isDarkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create-outline" size={24} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, isDarkMode && styles.searchContainerDark]}>
        <View style={[styles.searchBar, isDarkMode && styles.searchBarDark]}>
          <View style={styles.searchIconContainer}>
            <View style={styles.aiIcon} />
          </View>
          <TextInput
            style={[styles.searchInput, isDarkMode && styles.searchInputDark]}
            placeholder="Tìm kiếm cuộc trò chuyện..."
            placeholderTextColor={isDarkMode ? "#666" : "#8e8e8e"}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={isDarkMode ? "#666" : "#8e8e8e"} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notes Section - Only shows notes from mutual follows */}
      <NotesSection
        user={user}
        onCreateNote={() => {
          if (onCreateNote) {
            onCreateNote();
          }
        }}
        onCreateStory={onCreateStory}
        onViewStory={onViewStory}
        refreshTrigger={notesRefreshTrigger}
        isDarkMode={isDarkMode}
      />

      {/* Messages Tabs */}
      <View style={[styles.tabsContainer, isDarkMode && styles.tabsContainerDark]}>
        <TouchableOpacity 
          style={styles.tab}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'messages' && styles.tabTextActive, 
            isDarkMode && (activeTab === 'messages' ? styles.tabTextActiveDark : styles.tabTextDark)
          ]}>
            Tin nhắn
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tab}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'pending' && styles.tabTextActive,
            isDarkMode && (activeTab === 'pending' ? styles.tabTextActiveDark : styles.tabTextDark)
          ]}>
            Tin nhắn đang chờ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <ScrollView style={styles.messagesList} showsVerticalScrollIndicator={false}>
        {/* Gemini AI Item - Show if no search or search matches "gemini" */}
        {(!searchText.trim() || searchText.toLowerCase().trim().includes('gemini') || searchText.toLowerCase().trim().includes('trợ lý') || searchText.toLowerCase().trim().includes('ai')) && (
          <TouchableOpacity
            style={[styles.messageItem, isDarkMode && styles.messageItemDark]}
            activeOpacity={0.7}
            onPress={() => {
              if (onOpenChat) {
                onOpenChat({
                  id: 'openai',
                  username: 'Gemini',
                  avatar: '',
                  isAI: true,
                });
              }
            }}
          >
            <View style={styles.aiAvatarContainer}>
              <Ionicons name="chatbubbles" size={28} color="#4285F4" />
            </View>
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={[styles.username, isDarkMode && styles.usernameDark]}>
                  Gemini
                </Text>
              </View>
              <View style={styles.messageFooter}>
                <Text
                  style={[
                    styles.lastMessage,
                    isDarkMode && styles.lastMessageDark,
                  ]}
                  numberOfLines={1}
                >
                  Trợ lý AI của bạn
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>Đang tải...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
              {searchText.trim() ? `Không tìm thấy kết quả cho "${searchText}"` : 'Chưa có tin nhắn nào'}
            </Text>
          </View>
        ) : (
          messages.map((message) => (
            <SwipeableConversationRow
              key={message.id}
              canDelete={true}
              isDarkMode={isDarkMode}
              onDelete={() => handleDeleteConversation(message.id, message.username)}
            >
              <TouchableOpacity
                style={[styles.messageItem, isDarkMode && styles.messageItemDark]}
                activeOpacity={0.7}
                onPress={() => {
                  if (onOpenChat) {
                    onOpenChat({
                      id: message.id,
                      username: message.username,
                      avatar: message.avatar,
                    });
                  }
                }}
              >
                <Image
                  source={
                    (message.avatar && message.avatar.trim() !== '')
                      ? { uri: message.avatar }
                      : DEFAULT_AVATAR
                  }
                  style={styles.avatar}
                  defaultSource={DEFAULT_AVATAR}
                />
                <View style={styles.messageContent}>
                  <View style={styles.messageHeader}>
                    <Text style={[styles.username, isDarkMode && styles.usernameDark]}>
                      {message.username}
                    </Text>
                    {message.time && (
                      <View style={styles.timeContainer}>
                        {message.unread && <View style={styles.unreadDot} />}
                        <Text style={[styles.time, isDarkMode && styles.timeDark]}>
                          {message.time}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.messageFooter}>
                    {getStatusIcon(message.status)}
                    <Text
                      style={[
                        styles.lastMessage,
                        isDarkMode && styles.lastMessageDark,
                        message.unread && (isDarkMode ? styles.lastMessageUnreadDark : styles.lastMessageUnread),
                      ]}
                      numberOfLines={1}
                    >
                      {message.lastMessage}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.cameraButton}>
                  <Ionicons
                    name="camera-outline"
                    size={24}
                    color={isDarkMode ? "#666" : "#8e8e8e"}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </SwipeableConversationRow>
          ))
        )}
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
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 5,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  headerUsername: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginRight: 5,
  },
  headerUsernameDark: {
    color: '#fff',
  },
  editButton: {
    padding: 5,
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  searchContainerDark: {
    backgroundColor: '#000',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchBarDark: {
    backgroundColor: '#1a1a1a',
  },
  searchIconContainer: {
    marginRight: 10,
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  searchInputDark: {
    color: '#fff',
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
    justifyContent: 'flex-end',
  },
  tabsContainerDark: {
    borderBottomColor: '#333',
  },
  tab: {
    marginLeft: 20,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8e8e8e',
  },
  tabTextActive: {
    color: '#000',
  },
  tabTextActiveDark: {
    color: '#fff',
  },
  tabTextDark: {
    color: '#666',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  loadingTextDark: {
    color: '#666',
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
  messagesList: {
    flex: 1,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  messageItemDark: {
    borderBottomColor: '#1a1a1a',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  usernameDark: {
    color: '#fff',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 6,
  },
  time: {
    fontSize: 13,
    color: '#8e8e8e',
  },
  timeDark: {
    color: '#666',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#8e8e8e',
    marginLeft: 4,
    flex: 1,
  },
  lastMessageDark: {
    color: '#666',
  },
  lastMessageUnread: {
    fontWeight: '600',
    color: '#000',
  },
  lastMessageUnreadDark: {
    color: '#fff',
  },
  cameraButton: {
    padding: 5,
    marginLeft: 10,
  },
  aiAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(MessagesScreen);

