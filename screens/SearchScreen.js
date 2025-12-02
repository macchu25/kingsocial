import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation from '../components/BottomNavigation';
import { searchService } from '../services/searchService';
import { handleApiError } from '../utils/errorHandler';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = require('../asset/avt.jpg');

const SearchScreen = ({ user, isDarkMode = false, onClose, onViewUserProfile, onViewPost, onNavigateToHome, onNavigateToProfile, onNavigateToReels, onNavigateToCreatePost }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'users', 'posts'
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [allResults, setAllResults] = useState({ users: [], posts: [] });

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const debounceTimer = setTimeout(() => {
        performSearch();
      }, 500);

      return () => clearTimeout(debounceTimer);
    } else {
      setUsers([]);
      setPosts([]);
      setAllResults({ users: [], posts: [] });
    }
  }, [searchQuery, activeTab]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      if (activeTab === 'all') {
        // Search both users and posts
        const [usersResponse, postsResponse] = await Promise.all([
          searchService.searchUsers(searchQuery),
          searchService.searchPosts(searchQuery),
        ]);

        if (usersResponse.success) {
          setAllResults(prev => ({ ...prev, users: usersResponse.users || [] }));
        }
        if (postsResponse.success) {
          setAllResults(prev => ({ ...prev, posts: postsResponse.posts || [] }));
        }
      } else if (activeTab === 'users') {
        const response = await searchService.searchUsers(searchQuery);
        if (response.success) {
          setUsers(response.users || []);
        }
      } else if (activeTab === 'posts') {
        const response = await searchService.searchPosts(searchQuery);
        if (response.success) {
          setPosts(response.posts || []);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (userId, username, avatar) => {
    if (onViewUserProfile) {
      onViewUserProfile(userId, username, avatar);
    }
  };

  const handleViewPost = (post) => {
    if (onViewPost) {
      onViewPost(post);
    }
  };

  const renderUserItem = (userItem) => (
    <TouchableOpacity
      key={userItem.id}
      style={[styles.userItem, isDarkMode && styles.userItemDark]}
      onPress={() => handleViewUser(userItem.id, userItem.username, userItem.avatar)}
      activeOpacity={0.7}
    >
      <Image
        source={
          (userItem.avatar && userItem.avatar.trim() !== '')
            ? { uri: userItem.avatar }
            : DEFAULT_AVATAR
        }
        style={styles.userAvatar}
        defaultSource={DEFAULT_AVATAR}
      />
      <View style={styles.userInfo}>
        <Text style={[styles.username, isDarkMode && styles.usernameDark]}>
          {userItem.username}
        </Text>
        {userItem.name && (
          <Text style={[styles.name, isDarkMode && styles.nameDark]}>
            {userItem.name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderPostItem = (post) => (
    <TouchableOpacity
      key={post.id}
      style={styles.postItem}
      onPress={() => handleViewPost(post)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: post.images?.[0] || post.image }}
        style={styles.postThumbnail}
        resizeMode="cover"
      />
      {post.images && post.images.length > 1 && (
        <View style={styles.multipleImagesIndicator}>
          <Ionicons name="layers" size={16} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      );
    }

    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={isDarkMode ? "#666" : "#8e8e8e"} />
          <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
            Tìm kiếm
          </Text>
          <Text style={[styles.emptySubtext, isDarkMode && styles.emptySubtextDark]}>
            Nhập từ khóa để tìm kiếm người dùng hoặc bài viết
          </Text>
        </View>
      );
    }

    if (activeTab === 'all') {
      const hasResults = allResults.users.length > 0 || allResults.posts.length > 0;
      if (!hasResults) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
              Không tìm thấy kết quả
            </Text>
            <Text style={[styles.emptySubtext, isDarkMode && styles.emptySubtextDark]}>
              Thử tìm kiếm với từ khóa khác
            </Text>
          </View>
        );
      }

      return (
        <ScrollView showsVerticalScrollIndicator={false}>
          {allResults.users.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Người dùng
              </Text>
              {allResults.users.slice(0, 5).map(renderUserItem)}
              {allResults.users.length > 5 && (
                <TouchableOpacity
                  style={styles.seeMoreButton}
                  onPress={() => setActiveTab('users')}
                >
                  <Text style={[styles.seeMoreText, isDarkMode && styles.seeMoreTextDark]}>
                    Xem tất cả ({allResults.users.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {allResults.posts.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Bài viết
              </Text>
              <View style={styles.postsGrid}>
                {allResults.posts.slice(0, 6).map(renderPostItem)}
              </View>
              {allResults.posts.length > 6 && (
                <TouchableOpacity
                  style={styles.seeMoreButton}
                  onPress={() => setActiveTab('posts')}
                >
                  <Text style={[styles.seeMoreText, isDarkMode && styles.seeMoreTextDark]}>
                    Xem tất cả ({allResults.posts.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      );
    }

    if (activeTab === 'users') {
      if (users.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
              Không tìm thấy người dùng
            </Text>
          </View>
        );
      }

      return (
        <ScrollView showsVerticalScrollIndicator={false}>
          {users.map(renderUserItem)}
        </ScrollView>
      );
    }

    if (activeTab === 'posts') {
      if (posts.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
              Không tìm thấy bài viết
            </Text>
          </View>
        );
      }

      return (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.postsGrid}>
            {posts.map(renderPostItem)}
          </View>
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={[styles.searchBar, isDarkMode && styles.searchBarDark]}>
          <Ionicons name="search" size={20} color={isDarkMode ? "#999" : "#8e8e8e"} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, isDarkMode && styles.searchInputDark]}
            placeholder="Tìm kiếm"
            placeholderTextColor={isDarkMode ? "#999" : "#8e8e8e"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={isDarkMode ? "#999" : "#8e8e8e"} />
            </TouchableOpacity>
          )}
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, isDarkMode && styles.cancelTextDark]}>Hủy</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, isDarkMode && styles.tabsContainerDark]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[
            styles.tabText,
            isDarkMode && styles.tabTextDark,
            activeTab === 'all' && styles.tabTextActive,
            activeTab === 'all' && isDarkMode && styles.tabTextActiveDark
          ]}>
            Tất cả
          </Text>
          {activeTab === 'all' && <View style={[styles.tabIndicator, isDarkMode && styles.tabIndicatorDark]} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[
            styles.tabText,
            isDarkMode && styles.tabTextDark,
            activeTab === 'users' && styles.tabTextActive,
            activeTab === 'users' && isDarkMode && styles.tabTextActiveDark
          ]}>
            Người dùng
          </Text>
          {activeTab === 'users' && <View style={[styles.tabIndicator, isDarkMode && styles.tabIndicatorDark]} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[
            styles.tabText,
            isDarkMode && styles.tabTextDark,
            activeTab === 'posts' && styles.tabTextActive,
            activeTab === 'posts' && isDarkMode && styles.tabTextActiveDark
          ]}>
            Bài viết
          </Text>
          {activeTab === 'posts' && <View style={[styles.tabIndicator, isDarkMode && styles.tabIndicatorDark]} />}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation
        user={user}
        isDarkMode={isDarkMode}
        activeTab="search"
        onTabChange={(tab) => {
          if (tab === 'home' && onNavigateToHome) {
            onNavigateToHome();
          } else if (tab === 'reels' && onNavigateToReels) {
            onNavigateToReels();
          } else if (tab === 'profile' && onNavigateToProfile) {
            onNavigateToProfile();
          } else if (tab === 'add' && onNavigateToCreatePost) {
            onNavigateToCreatePost();
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
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
  },
  searchBarDark: {
    backgroundColor: '#1a1a1a',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 0,
  },
  searchInputDark: {
    color: '#fff',
  },
  cancelButton: {
    paddingVertical: 5,
  },
  cancelText: {
    fontSize: 16,
    color: '#0095F6',
  },
  cancelTextDark: {
    color: '#0095F6',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  tabsContainerDark: {
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabActive: {
    // Indicator will be shown via tabIndicator
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e8e',
  },
  tabTextDark: {
    color: '#666',
  },
  tabTextActive: {
    color: '#000',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#000',
  },
  tabIndicatorDark: {
    backgroundColor: '#fff',
  },
  content: {
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
    marginTop: 20,
    marginBottom: 10,
  },
  emptyTextDark: {
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e8e',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptySubtextDark: {
    color: '#999',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  sectionTitleDark: {
    color: '#fff',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  userItemDark: {
    borderBottomColor: '#333',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
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
    fontSize: 14,
    color: '#8e8e8e',
  },
  nameDark: {
    color: '#ccc',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -1,
  },
  postItem: {
    width: (width - 4) / 3,
    height: (width - 4) / 3,
    margin: 1,
    position: 'relative',
  },
  postThumbnail: {
    width: '100%',
    height: '100%',
  },
  multipleImagesIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  seeMoreButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0095F6',
  },
  seeMoreTextDark: {
    color: '#0095F6',
  },
});

export default SearchScreen;

