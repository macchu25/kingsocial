import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import BottomNavigation from '../components/BottomNavigation';
import { storage } from '../utils/storage';
import { followService } from '../services/followService';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { handleApiError } from '../utils/errorHandler';

const { width } = Dimensions.get('window');
const POST_SIZE = (width - 4) / 3;

const DEFAULT_AVATAR = 'https://via.placeholder.com/100/cccccc/ffffff?text=User';

const ProfileScreen = ({ user, currentUser, onLogout, onNavigateToHome, onEditProfile }) => {
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const isOwnProfile = currentUser?.id === user?.id;

  useEffect(() => {
    loadProfileData();
  }, [user?.id]);

  // Refresh posts when screen comes into focus (if needed)
  useEffect(() => {
    const focusListener = () => {
      if (user?.id) {
        loadUserPosts();
      }
    };
    // This will be called when component mounts
    focusListener();
  }, []);

  const loadProfileData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // If viewing other user's profile, load full user data
      if (!isOwnProfile) {
        try {
          const userResponse = await userService.getUserById(user.id);
          if (userResponse.success) {
            // Update user data with full info
            const fullUser = userResponse.user;
            setStats({
              posts: fullUser.postsCount || 0,
              followers: fullUser.followersCount || 0,
              following: fullUser.followingCount || 0,
            });

            // Check follow status
            try {
              const followStatusResponse = await followService.checkFollowStatus(user.id);
              if (followStatusResponse.success) {
                setIsFollowing(followStatusResponse.isFollowing);
              }
            } catch (followError) {
              console.error('Check follow status error:', followError);
            }
          }
        } catch (userError) {
          console.error('Get user by ID error:', userError);
          // Fallback: try to get stats only
          try {
            const statsResponse = await followService.getUserStats(user.id);
            if (statsResponse.success) {
              setStats(prev => ({
                ...prev,
                followers: statsResponse.followers,
                following: statsResponse.following,
              }));
            }
          } catch (statsError) {
            console.error('Get stats error:', statsError);
          }
        }
      } else {
        // Own profile - load stats
        try {
          const statsResponse = await followService.getUserStats(user.id);
          if (statsResponse.success) {
            setStats(prev => ({
              ...prev,
              followers: statsResponse.followers,
              following: statsResponse.following,
            }));
          }
        } catch (statsError) {
          console.error('Get own stats error:', statsError);
        }
      }
    } catch (error) {
      console.error('Load profile data error:', error);
    } finally {
      setLoading(false);
    }
    
    // Load user's posts
    loadUserPosts();
  };

  const loadUserPosts = async () => {
    if (!user?.id) return;
    
    setPostsLoading(true);
    try {
      const response = await postService.getUserPosts(user.id);
      if (response.success) {
        setPosts(response.posts || []);
        // Update posts count
        setStats(prev => ({
          ...prev,
          posts: response.count || 0,
        }));
      }
    } catch (error) {
      console.error('Load user posts error:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user?.id || isOwnProfile) return;

    setFollowingLoading(true);
    try {
      const response = await followService.toggleFollow(user.id);
      if (response.success) {
        setIsFollowing(response.isFollowing);
        setStats(prev => ({
          ...prev,
          followers: response.followersCount,
        }));
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.clearAll();
              onLogout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {!isOwnProfile && (
            <TouchableOpacity onPress={onNavigateToHome} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerUsername}>{user?.username || 'username'}</Text>
          {isOwnProfile && (
            <TouchableOpacity>
              <Ionicons name="chevron-down" size={16} color="#000" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerIcons}>
          {isOwnProfile && (
            <>
              <TouchableOpacity style={styles.headerIconButton}>
                <Ionicons name="add-outline" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconButton} onPress={handleLogout}>
                <Ionicons name="menu" size={24} color="#000" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: user?.avatar || DEFAULT_AVATAR,
              }}
              style={styles.avatar}
              defaultSource={{ uri: DEFAULT_AVATAR }}
            />
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.posts}</Text>
              <Text style={styles.statLabel}>bài viết</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.followers.toLocaleString()}</Text>
              <Text style={styles.statLabel}>người theo dõi</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.following}</Text>
              <Text style={styles.statLabel}>đang theo dõi</Text>
            </View>
          </View>
          {loading && (
            <ActivityIndicator size="small" color="#0095F6" style={styles.loadingIndicator} />
          )}
        </View>

        {/* Bio */}
        <View style={styles.bioSection}>
          <Text style={styles.bioName}>{user?.name || user?.username || 'Username'}</Text>
          {user?.bio ? (
            <Text style={styles.bioText}>{user.bio}</Text>
          ) : (
            <Text style={styles.bioText}>
              Chưa có tiểu sử. Nhấn "Chỉnh sửa trang cá nhân" để thêm.
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isOwnProfile ? (
            <>
              <TouchableOpacity
                style={styles.editButton}
                onPress={onEditProfile}
              >
                <Text style={styles.editButtonText}>Chỉnh sửa trang cá nhân</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton}>
                <Text style={styles.shareButtonText}>Chia sẻ trang cá nhân</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.editButton, isFollowing && styles.unfollowButton]}
              onPress={handleFollow}
              disabled={followingLoading}
            >
              {followingLoading ? (
                <ActivityIndicator color={isFollowing ? "#000" : "#fff"} size="small" />
              ) : (
                <Text style={[styles.editButtonText, isFollowing && styles.unfollowButtonText]}>
                  {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Highlights */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.highlightsContainer}
          contentContainerStyle={styles.highlightsContent}
        >
          <TouchableOpacity style={styles.highlightItem}>
            <View style={styles.highlightCircle}>
              <Text style={styles.highlightPlus}>+</Text>
            </View>
            <Text style={styles.highlightLabel}>Mới</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.highlightItem}>
            <View style={[styles.highlightCircle, styles.highlightCircleActive]}>
              <Text style={styles.highlightEmoji}>📸</Text>
            </View>
            <Text style={styles.highlightLabel}>Highlight 1</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Posts Grid */}
        {postsLoading ? (
          <View style={styles.postsLoadingContainer}>
            <ActivityIndicator size="small" color="#0095F6" />
          </View>
        ) : posts.length > 0 ? (
          <View style={styles.postsGrid}>
            {posts.map((post) => (
              <TouchableOpacity key={post.id} style={styles.postItem}>
                <Image
                  source={{ uri: post.image }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyPostsContainer}>
            <Text style={styles.emptyPostsText}>Chưa có bài viết nào</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        user={user}
        activeTab="profile"
        onTabChange={(tab) => {
          if (tab === 'home' && onNavigateToHome) {
            onNavigateToHome();
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 10,
  },
  headerUsername: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 5,
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#000',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    marginLeft: 20,
  },
  headerIcon: {
    fontSize: 24,
  },
  profileSection: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#E1306C',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#8e8e8e',
    marginTop: 2,
  },
  bioSection: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  bioName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  bioText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    borderRadius: 5,
    marginRight: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  unfollowButton: {
    backgroundColor: '#f0f0f0',
  },
  unfollowButtonText: {
    color: '#000',
  },
  loadingIndicator: {
    marginTop: 10,
  },
  highlightsContainer: {
    marginBottom: 15,
  },
  highlightsContent: {
    paddingHorizontal: 15,
  },
  highlightItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  highlightCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#dbdbdb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  highlightCircleActive: {
    borderColor: '#000',
  },
  highlightPlus: {
    fontSize: 24,
    color: '#000',
  },
  highlightEmoji: {
    fontSize: 30,
  },
  highlightLabel: {
    fontSize: 12,
    color: '#000',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
    paddingTop: 1,
  },
  postItem: {
    width: POST_SIZE,
    height: POST_SIZE,
    marginBottom: 2,
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  postsLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
  },
  emptyPostsContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
  },
  emptyPostsText: {
    fontSize: 16,
    color: '#8e8e8e',
  },
});

export default ProfileScreen;
