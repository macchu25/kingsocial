import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StoriesSection from '../components/StoriesSection';
import PostItem from '../components/PostItem';
import BottomNavigation from '../components/BottomNavigation';
import NotificationPanel from '../components/NotificationPanel';
import { postService } from '../services/postService';
import { handleApiError } from '../utils/errorHandler';

const HomeScreen = ({ user, onLogout, onNavigateToProfile, onNavigateToCreatePost, onViewUserProfile, onCreateStory, onViewStory }) => {
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Instagram</Text>
        <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setNotificationVisible(true)}
            >
              <Ionicons name="heart-outline" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setNotificationVisible(true)}
            >
              <View style={styles.messageIconContainer}>
                <Ionicons name="chatbubble-outline" size={24} color="#000" />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>4</Text>
                </View>
              </View>
            </TouchableOpacity>
        </View>
      </View>

      {/* Stories Section */}
      <StoriesSection
        user={user}
        onCreateStory={onCreateStory}
        onViewStory={onViewStory}
        refreshTrigger={storiesRefreshTrigger}
      />

      {/* Posts Feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      ) : (
        <ScrollView
          style={styles.feed}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
              <Text style={styles.emptySubtext}>Hãy tạo bài viết đầu tiên của bạn!</Text>
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
                  onUpdate={handlePostUpdate}
                  onViewProfile={onViewUserProfile}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        user={user}
        activeTab="home"
        onTabChange={(tab) => {
          if (tab === 'profile' && onNavigateToProfile) {
            onNavigateToProfile();
          } else if (tab === 'add' && onNavigateToCreatePost) {
            onNavigateToCreatePost();
          }
        }}
      />

          {/* Notification Panel */}
          <NotificationPanel
            visible={notificationVisible}
            onClose={() => setNotificationVisible(false)}
            currentUserId={user?.id}
            onViewProfile={onViewUserProfile}
            onViewPost={(postId) => {
              setNotificationVisible(false);
              // Scroll to the post after a short delay to ensure it's rendered
              setTimeout(() => {
                const postRef = postRefs.current[postId];
                if (postRef && scrollViewRef.current) {
                  postRef.measureLayout(
                    scrollViewRef.current,
                    (x, y) => {
                      scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
                    },
                    () => {
                      // Fallback: just refresh posts
                      loadPosts();
                    }
                  );
                } else {
                  // If post not found, refresh to load it
                  loadPosts();
                }
              }, 300);
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
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
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
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e8e',
  },
});

export default HomeScreen;

