import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { followService } from '../services/followService';
import { handleApiError } from '../utils/errorHandler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_AVATAR = require('../asset/avt.jpg');

const FollowersFollowingModal = ({ 
  visible, 
  type, // 'followers' or 'following'
  userId,
  currentUser,
  isDarkMode = false, 
  onClose,
  onViewProfile,
  onFollowChange
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState({});

  useEffect(() => {
    if (visible && userId) {
      loadUsers();
    } else {
      setUsers([]);
    }
  }, [visible, userId, type]);

  const loadUsers = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      let response;
      if (type === 'followers') {
        response = await followService.getFollowersList(userId);
      } else {
        response = await followService.getFollowingListForUser(userId);
      }
      
      if (response.success) {
        const usersList = type === 'followers' ? response.followers : response.following;
        setUsers(usersList || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (targetUserId, currentFollowStatus) => {
    if (targetUserId === currentUser?.id) return; // Can't follow yourself
    
    setFollowingLoading(prev => ({ ...prev, [targetUserId]: true }));
    try {
      const response = await followService.toggleFollow(targetUserId);
      if (response.success) {
        // Update the user's follow status in the list
        setUsers(users.map(user => 
          user.id === targetUserId 
            ? { ...user, isFollowing: response.isFollowing }
            : user
        ));
        
        // Notify parent component about follow change
        if (onFollowChange) {
          onFollowChange();
        }
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setFollowingLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
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
                {type === 'followers' ? 'Người theo dõi' : 'Đang theo dõi'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons 
                  name="close" 
                  size={24} 
                  color={isDarkMode ? "#fff" : "#000"} 
                />
              </TouchableOpacity>
            </View>

            {/* Users List */}
            <ScrollView
              style={styles.usersScroll}
              contentContainerStyle={styles.usersScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={isDarkMode ? "#fff" : "#000"} />
                </View>
              ) : users.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
                    {type === 'followers' 
                      ? 'Chưa có người theo dõi nào' 
                      : 'Chưa theo dõi ai'}
                  </Text>
                </View>
              ) : (
                users.map((user) => {
                  const isOwnProfile = user.id === currentUser?.id;
                  const isFollowing = user.isFollowing;
                  const isLoading = followingLoading[user.id];

                  return (
                    <View 
                      key={user.id} 
                      style={[styles.userItem, isDarkMode && styles.userItemDark]}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          if (onViewProfile && user.id) {
                            onViewProfile(user.id, user.username, user.avatar);
                            onClose();
                          }
                        }}
                        style={styles.userInfo}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={
                            (user.avatar && user.avatar.trim() !== '') 
                              ? { uri: user.avatar }
                              : DEFAULT_AVATAR
                          }
                          style={styles.userAvatar}
                          defaultSource={DEFAULT_AVATAR}
                        />
                        <View style={styles.userDetails}>
                          <Text style={[styles.username, isDarkMode && styles.usernameDark]}>
                            {user.username}
                          </Text>
                          {user.name && user.name !== user.username && (
                            <Text style={[styles.name, isDarkMode && styles.nameDark]}>
                              {user.name}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                      
                      {!isOwnProfile && (
                        <TouchableOpacity
                          style={[
                            styles.followButton,
                            isFollowing && styles.followingButton,
                            isDarkMode && styles.followButtonDark,
                            isFollowing && isDarkMode && styles.followingButtonDark
                          ]}
                          onPress={() => handleToggleFollow(user.id, isFollowing)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <ActivityIndicator 
                              size="small" 
                              color={isFollowing ? (isDarkMode ? "#fff" : "#000") : "#fff"} 
                            />
                          ) : (
                            <Text
                              style={[
                                styles.followButtonText,
                                isFollowing && styles.followingButtonText,
                                isDarkMode && styles.followButtonTextDark,
                                isFollowing && isDarkMode && styles.followingButtonTextDark
                              ]}
                            >
                              {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </View>
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
    height: '80%',
    maxHeight: 600,
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
  closeButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  usersScroll: {
    flex: 1,
  },
  usersScrollContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  loadingContainer: {
    padding: 40,
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
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  userItemDark: {
    borderBottomColor: '#333',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  usernameDark: {
    color: '#fff',
  },
  name: {
    fontSize: 13,
    color: '#8e8e8e',
  },
  nameDark: {
    color: '#666',
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: '#0095F6',
    minWidth: 100,
    alignItems: 'center',
  },
  followButtonDark: {
    backgroundColor: '#0095F6',
  },
  followingButton: {
    backgroundColor: '#f0f0f0',
  },
  followingButtonDark: {
    backgroundColor: '#333',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  followButtonTextDark: {
    color: '#fff',
  },
  followingButtonText: {
    color: '#000',
  },
  followingButtonTextDark: {
    color: '#fff',
  },
});

export default FollowersFollowingModal;

