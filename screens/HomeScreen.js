import React, { useState, useEffect, useRef, memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StoriesSection from '../components/StoriesSection';
import PostItem from '../components/PostItem';
import BottomNavigation from '../components/BottomNavigation';
import NotificationPanel from '../components/NotificationPanel';
import { postService } from '../services/postService';
import { handleApiError } from '../utils/errorHandler';
import { alertInfo } from '../utils/alert';

const HomeScreen = ({ user, isDarkMode = false, onLogout, onNavigateToProfile, onNavigateToCreatePost, onNavigateToMessages, onNavigateToSearch, onViewUserProfile, onCreateStory, onViewStory, onViewPost, onEditPost }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storiesRefreshTrigger, setStoriesRefreshTrigger] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const scrollViewRef = useRef(null);
  const postRefs = useRef({});

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await postService.getAllPosts();
      if (response.success) {
        setPosts(response.posts);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
    setStoriesRefreshTrigger(prev => prev + 1); // Trigger stories refresh
  };

  const handlePostUpdate = () => {
    loadPosts();
  };

  const handleStoryCreated = () => {
    // StoriesSection will auto-refresh on mount
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <Text style={[styles.logo, isDarkMode && styles.logoDark]}>Instagram</Text>
        <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setNotificationVisible(true)}
            >
              <Ionicons name="heart-outline" size={24} color={isDarkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={onNavigateToMessages}
            >
              <View style={styles.messageIconContainer}>
                <Ionicons name="chatbubble-outline" size={24} color={isDarkMode ? "#fff" : "#000"} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>4</Text>
                </View>
              </View>
            </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content - Stories and Posts */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.feed}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Stories Section */}
          <StoriesSection
            user={user}
            onCreateStory={onCreateStory}
            onViewStory={onViewStory}
            refreshTrigger={storiesRefreshTrigger}
            isDarkMode={isDarkMode}
          />

          {/* Posts Feed */}
          {posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>Chưa có bài viết nào</Text>
              <Text style={[styles.emptySubtext, isDarkMode && styles.emptySubtextDark]}>Hãy tạo bài viết đầu tiên của bạn!</Text>
            </View>
          ) : (
            posts.map((post, index) => (
              <View
                key={post.id}
                ref={(ref) => {
                  if (ref) {
                    postRefs.current[post.id] = ref;
                  }
                }}
              >
                <PostItem
                  post={post}
                  currentUserId={user?.id}
                  isDarkMode={isDarkMode}
                  onUpdate={handlePostUpdate}
                  onViewProfile={onViewUserProfile}
                  onViewPost={onViewPost}
                  onEditPost={onEditPost}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        user={user}
        isDarkMode={isDarkMode}
        activeTab="home"
        onTabChange={(tab) => {
          if (tab === 'profile' && onNavigateToProfile) {
            onNavigateToProfile();
          } else if (tab === 'add' && onNavigateToCreatePost) {
            onNavigateToCreatePost();
          } else if (tab === 'search' && onNavigateToSearch) {
            onNavigateToSearch();
          }
        }}
      />

          {/* Notification Panel */}
          <NotificationPanel
            visible={notificationVisible}
            isDarkMode={isDarkMode}
            onClose={() => setNotificationVisible(false)}
            currentUserId={user?.id}
            onViewProfile={onViewUserProfile}
            onViewPost={async (postId) => {
              setNotificationVisible(false);
              
              if (!postId) {
                console.log('No postId provided');
                return;
              }
              
              // Convert postId to string for comparison
              const postIdStr = postId?.toString();
              
              // Tìm post trong danh sách hiện tại
              let foundPost = posts.find(p => {
                const pIdStr = p.id?.toString();
                return pIdStr === postIdStr || p.id === postId || p.id?.toString() === postIdStr;
              });
              
              if (foundPost) {
                // Nếu tìm thấy, chuyển đến post detail
                if (onViewPost) {
                  onViewPost(foundPost);
                }
              } else {
                // Nếu không tìm thấy, load post cụ thể bằng getPostById
                try {
                  // Đảm bảo postId là string
                  const postIdToFetch = postIdStr || postId?.toString() || postId;
                  console.log('Loading post by ID:', postIdToFetch);
                  
                  const response = await postService.getPostById(postIdToFetch);
                  if (response.success && response.post) {
                    foundPost = response.post;
                    // Cập nhật danh sách posts nếu cần
                    setPosts(prevPosts => {
                      const exists = prevPosts.find(p => {
                        const pIdStr = p.id?.toString();
                        const foundIdStr = foundPost.id?.toString();
                        return pIdStr === foundIdStr || p.id === foundPost.id;
                      });
                      if (!exists) {
                        return [foundPost, ...prevPosts];
                      }
                      return prevPosts;
                    });
                    if (onViewPost) {
                      onViewPost(foundPost);
                    }
                  } else {
                    console.error('Post not found:', postIdToFetch);
                    alertInfo('Thông báo', 'Bài viết này có thể đã bị xóa hoặc không còn tồn tại.');
                  }
                } catch (error) {
                  console.error('Error loading post:', error);
                  if (error.response?.status === 404) {
                    alertInfo('Thông báo', 'Bài viết này có thể đã bị xóa hoặc không còn tồn tại.');
                  } else {
                    handleApiError(error);
                  }
                }
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
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  logoDark: {
    color: '#fff',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 20,
  },
  messageIconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#FF3040',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  feed: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8e8e8e',
    marginBottom: 10,
  },
  emptyTextDark: {
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  emptySubtextDark: {
    color: '#999',
  },
});

export default memo(HomeScreen);

