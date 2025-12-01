import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../services/notificationService';

const { width } = Dimensions.get('window');
const PANEL_WIDTH = width * 0.85;
const DEFAULT_AVATAR = require('../asset/avt.jpg');

const NotificationPanel = ({ visible, isDarkMode = false, onClose, currentUserId, onViewProfile, onViewPost }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications();
      if (response.success) {
        const notifs = response.notifications || [];
        console.log('📬 Loaded notifications:', notifs.length, notifs);
        setNotifications(notifs);
      } else {
        console.error('❌ Failed to load notifications:', response.message);
      }
    } catch (error) {
      console.error('❌ Load notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = (notification) => {
    if (notification.type === 'follow' && notification.fromUserId) {
      // Navigate to user profile
      if (onViewProfile) {
        onViewProfile(
          notification.fromUserId,
          notification.fromUsername,
          notification.fromUserAvatar
        );
      }
      onClose();
    } else if ((notification.type === 'like' || notification.type === 'comment')) {
      // Navigate to post
      if (notification.postId && onViewPost) {
        onViewPost(notification.postId);
        onClose();
      } else {
        console.warn('Notification missing postId:', notification);
        // Still close the panel even if postId is missing
        onClose();
      }
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const notifDate = new Date(date);
    const diffInSeconds = Math.floor((now - notifDate) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return notifDate.toLocaleDateString('vi-VN');
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay} onTouchEnd={onClose}>
      <View style={[styles.panel, isDarkMode && styles.panelDark]} onStartShouldSetResponder={() => true}>
        {/* Header */}
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Thông báo</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDarkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#0095F6" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>Chưa có thông báo nào</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[styles.notificationItem, isDarkMode && styles.notificationItemDark]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <Image
                  source={
                    (notification.fromUserAvatar && notification.fromUserAvatar.trim() !== '') 
                      ? { uri: notification.fromUserAvatar }
                      : DEFAULT_AVATAR
                  }
                  style={styles.avatar}
                  defaultSource={DEFAULT_AVATAR}
                />
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationText, isDarkMode && styles.notificationTextDark]} numberOfLines={2}>
                    <Text style={[styles.username, isDarkMode && styles.usernameDark]}>{notification.fromUsername}</Text>
                    {' '}
                    {notification.type === 'follow' && 'đã theo dõi bạn'}
                    {notification.type === 'like' && 'đã thích bài viết của bạn'}
                    {notification.type === 'comment' && 'đã bình luận bài viết của bạn'}
                  </Text>
                  <Text style={[styles.time, isDarkMode && styles.timeDark]}>{formatTime(notification.createdAt)}</Text>
                </View>
                {notification.type === 'follow' && (
                  <Ionicons name="person-add" size={20} color="#0095F6" />
                )}
                {notification.type === 'like' && (
                  <Ionicons name="heart" size={20} color="#FF3040" />
                )}
                {notification.type === 'comment' && (
                  <Ionicons name="chatbubble" size={20} color="#0095F6" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1000,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 10,
  },
  panel: {
    width: PANEL_WIDTH,
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  panelDark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerTitleDark: {
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  emptyTextDark: {
    color: '#999',
  },
  content: {
    maxHeight: '70%',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  notificationItemDark: {
    borderBottomColor: '#333',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  notificationTextDark: {
    color: '#fff',
  },
  username: {
    fontWeight: '600',
    color: '#000',
  },
  usernameDark: {
    color: '#fff',
  },
  time: {
    fontSize: 12,
    color: '#8e8e8e',
  },
  timeDark: {
    color: '#999',
  },
});

export default NotificationPanel;

