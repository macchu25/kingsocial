import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import BottomNavigation from '../components/BottomNavigation';
import CommentModal from '../components/CommentModal';
import { postService } from '../services/postService';
import { followService } from '../services/followService';
import { handleApiError } from '../utils/errorHandler';

const { width, height } = Dimensions.get('window');
const DEFAULT_AVATAR = require('../asset/avt.jpg');

const ReelScreen = ({ user, isDarkMode = false, onNavigateToProfile, onNavigateToCreatePost, onNavigateToSearch, onNavigateToHome, onViewUserProfile, onViewPost, onEditPost }) => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedReels, setLikedReels] = useState({});
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);
  const [isFollowing, setIsFollowing] = useState({});
  const flatListRef = useRef(null);
  const videoRefs = useRef({});
  const lastTap = useRef({});

  const loadReels = useCallback(async () => {
    try {
      const response = await postService.getAllPosts('reel');
      if (response.success) {
        setReels(response.posts);
        // Initialize liked state
        const likedMap = {};
        response.posts.forEach(reel => {
          likedMap[reel.id] = reel.isLiked || false;
        });
        setLikedReels(likedMap);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReels();
    
    // Cleanup on unmount
    return () => {
      // Pause all videos and cleanup refs
      Object.keys(videoRefs.current).forEach((key) => {
        if (videoRefs.current[key]) {
          videoRefs.current[key].pauseAsync().catch(() => {});
          videoRefs.current[key] = null;
        }
      });
      videoRefs.current = {};
    };
  }, [loadReels]);

  // Pause all videos when reels change or on mount
  useEffect(() => {
    // Pause all videos initially
    Object.keys(videoRefs.current).forEach((key) => {
      if (videoRefs.current[key]) {
        videoRefs.current[key].pauseAsync().catch(() => {});
      }
    });
    
    // Play only the first video (index 0) after a short delay
    if (reels.length > 0 && currentIndex === 0) {
      setTimeout(() => {
        const firstReel = reels[0];
        if (firstReel && videoRefs.current[firstReel.id]) {
          videoRefs.current[firstReel.id].playAsync().catch(() => {});
        }
      }, 100);
    }
  }, [reels.length]); // Only when reels list changes

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReels();
  }, [loadReels]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    try {
      if (viewableItems.length > 0) {
        // Get the most visible item (first one in the list)
        const visibleItem = viewableItems[0];
        const index = visibleItem.index;
        
        if (index !== null && index !== currentIndex) {
          // Pause ALL videos first
          Object.keys(videoRefs.current).forEach((key) => {
            try {
              if (videoRefs.current[key]) {
                videoRefs.current[key].pauseAsync().catch(() => {});
              }
            } catch (err) {
              console.error('Error pausing video:', err);
            }
          });
          
          setCurrentIndex(index);
          
          // Play only the current video after a short delay
          const currentReel = visibleItem.item;
          if (currentReel && videoRefs.current[currentReel.id]) {
            setTimeout(() => {
              try {
                videoRefs.current[currentReel.id]?.playAsync().catch((err) => {
                  console.error('Error playing video:', err);
                });
              } catch (err) {
                console.error('Error in play timeout:', err);
              }
            }, 150);
          }
        }
      } else {
        // If no items are visible, pause all videos
        Object.keys(videoRefs.current).forEach((key) => {
          try {
            if (videoRefs.current[key]) {
              videoRefs.current[key].pauseAsync().catch(() => {});
            }
          } catch (err) {
            console.error('Error pausing video:', err);
          }
        });
        setCurrentIndex(-1);
      }
    } catch (error) {
      console.error('Error in onViewableItemsChanged:', error);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80, // Phải thấy ít nhất 80% để được coi là visible
    minimumViewTime: 100,
    waitForInteraction: false,
  }).current;

  const handleLike = async (reel) => {
    const previousLiked = likedReels[reel.id] || false;
    const previousCount = reel.likes || 0;
    
    // Optimistic update
    setLikedReels(prev => ({ ...prev, [reel.id]: !previousLiked }));
    
    try {
      const response = await postService.likePost(reel.id);
      if (response.success) {
        setLikedReels(prev => ({ ...prev, [reel.id]: response.isLiked }));
        // Update reel in list
        setReels(prev => prev.map(r => 
          r.id === reel.id ? { ...r, isLiked: response.isLiked, likes: response.likes } : r
        ));
      } else {
        // Revert on error
        setLikedReels(prev => ({ ...prev, [reel.id]: previousLiked }));
      }
    } catch (error) {
      setLikedReels(prev => ({ ...prev, [reel.id]: previousLiked }));
      handleApiError(error);
    }
  };

  const handleOpenComments = (reel) => {
    setSelectedReel(reel);
    setCommentModalVisible(true);
  };

  const checkFollowStatus = async (userId) => {
    if (!userId || userId === user?.id) return;
    try {
      const response = await followService.checkFollowStatus(userId);
      if (response.success) {
        setIsFollowing(prev => ({ ...prev, [userId]: response.isFollowing }));
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleFollow = async (reel) => {
    if (!reel.userId || reel.userId === user?.id) return;
    
    try {
      const response = await followService.toggleFollow(reel.userId);
      if (response.success) {
        setIsFollowing(prev => ({ ...prev, [reel.userId]: response.isFollowing }));
        // Silent follow - no success message
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const renderReel = useCallback(({ item: reel, index }) => {
    const isActive = index === currentIndex;
    const isLiked = likedReels[reel.id] || false;
    const following = isFollowing[reel.userId] || false;
    
    // Check follow status when reel is viewed
    if (isActive && reel.userId && reel.userId !== user?.id) {
      checkFollowStatus(reel.userId);
    }
    
    const handleVideoPress = () => {
      const now = Date.now();
      const DOUBLE_PRESS_DELAY = 300;
      const reelId = reel.id;
      
      if (lastTap.current[reelId] && (now - lastTap.current[reelId]) < DOUBLE_PRESS_DELAY) {
        // Double tap detected - like/unlike reel
        handleLike(reel);
        lastTap.current[reelId] = null;
      } else {
        // Single tap - toggle play/pause
        lastTap.current[reelId] = now;
        setTimeout(() => {
          if (lastTap.current[reelId] === now) {
            // Single tap confirmed - toggle play/pause
            const videoRef = videoRefs.current[reel.id];
            if (videoRef) {
              videoRef.getStatusAsync().then((status) => {
                if (status.isPlaying) {
                  videoRef.pauseAsync().catch(() => {});
                } else {
                  videoRef.playAsync().catch(() => {});
                }
              }).catch(() => {});
            }
            lastTap.current[reelId] = null;
          }
        }, DOUBLE_PRESS_DELAY);
      }
    };

    return (
      <View style={styles.reelContainer}>
        {/* Video */}
        {reel.images && reel.images.length > 0 && (
          <TouchableOpacity 
            style={styles.videoContainer}
            activeOpacity={1}
            onPress={handleVideoPress}
          >
            <Video
              ref={(ref) => {
                try {
                  if (ref) {
                    videoRefs.current[reel.id] = ref;
                    // If this is the active video, play it
                    if (isActive) {
                      setTimeout(() => {
                        ref?.playAsync().catch((err) => {
                          console.error('Error playing video:', err);
                        });
                      }, 100);
                    } else {
                      // Otherwise, ensure it's paused
                      ref.pauseAsync().catch(() => {});
                    }
                  } else {
                    // Cleanup ref if component unmounts
                    delete videoRefs.current[reel.id];
                  }
                } catch (error) {
                  console.error('Error setting video ref:', error);
                }
              }}
              source={{ uri: reel.images[0] }}
              style={styles.video}
              resizeMode="contain"
              shouldPlay={false} // Always false, we control manually
              isLooping
              isMuted={false}
              volume={1.0}
              useNativeControls={false}
              onError={(error) => {
                console.error('Video playback error:', error);
              }}
            />
          </TouchableOpacity>
        )}
        
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.topBarText}>Reels</Text>
          <View style={styles.topBarRight}>
            <Text style={styles.topBarTextLight}>Bạn bè</Text>
            <View style={styles.friendsAvatars}>
              <View style={styles.friendAvatar} />
              <View style={[styles.friendAvatar, styles.friendAvatar2]} />
              <View style={[styles.friendAvatar, styles.friendAvatar3]} />
            </View>
          </View>
        </View>

        {/* Right Side Actions */}
        <View style={styles.rightActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(reel)}
          >
            <Ionicons 
              name={isLiked ? 'heart' : 'heart-outline'} 
              size={32} 
              color={isLiked ? '#FF3040' : '#fff'} 
            />
            <Text style={styles.actionCount}>{reel.likes || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleOpenComments(reel)}
          >
            <Ionicons name="chatbubble-outline" size={32} color="#fff" />
            <Text style={styles.actionCount}>{reel.comments || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="arrow-redo-outline" size={32} color="#fff" />
            <Text style={styles.actionCount}>631</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.lastActionButton]}>
            <Ionicons name="paper-plane-outline" size={32} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <View style={styles.userSection}>
            <TouchableOpacity
              onPress={() => onViewUserProfile(reel.userId, reel.username, reel.userAvatar)}
              style={styles.userInfo}
            >
              <Image
                source={
                  reel.userAvatar && reel.userAvatar.trim() !== ''
                    ? { uri: reel.userAvatar }
                    : DEFAULT_AVATAR
                }
                style={styles.avatar}
                defaultSource={DEFAULT_AVATAR}
              />
              <Text style={styles.username}>{reel.username}</Text>
            </TouchableOpacity>
            
            {reel.userId !== user?.id && (
              <TouchableOpacity
                style={[styles.followButton, following && styles.followingButton]}
                onPress={() => handleFollow(reel)}
              >
                <Text style={[styles.followButtonText, following && styles.followingButtonText]}>
                  {following ? 'Đang theo dõi' : 'Theo dõi'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {reel.caption && (
            <Text style={styles.caption} numberOfLines={2}>
              {reel.caption}
            </Text>
          )}
          
          {/* Music Info */}
          <View style={styles.musicInfo}>
            <Ionicons name="musical-notes" size={16} color="#fff" />
            <Text style={styles.musicText}>Hoang - Điền Vào Ô Trống</Text>
          </View>
        </View>
      </View>
    );
  }, [currentIndex, likedReels, isFollowing, user, commentModalVisible, isDarkMode, onViewUserProfile, handleLike, handleOpenComments, handleFollow, onViewPost]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      
      {/* Reels List */}
      {reels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="play-circle-outline" size={64} color="#8e8e8e" />
          <Text style={styles.emptyText}>Chưa có reel nào</Text>
          <Text style={styles.emptySubtext}>Hãy tạo reel đầu tiên của bạn!</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={reels}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderReel}
          pagingEnabled={true}
          snapToInterval={height} // Snap to each full screen
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          removeClippedSubviews={true} // Tối ưu memory
          initialNumToRender={2} // Giảm số lượng render ban đầu
          maxToRenderPerBatch={2} // Giảm batch size
          windowSize={3} // Giảm window size
          updateCellsBatchingPeriod={50} // Batch updates
          getItemLayout={(data, index) => ({
            length: height,
            offset: height * index,
            index,
          })}
          contentContainerStyle={{ flexGrow: 1 }}
          scrollEnabled={true}
          bounces={false} // Không cho bounce khi đến cuối
        />
      )}

      {/* Comment Modal */}
      {selectedReel && (
        <CommentModal
          visible={commentModalVisible}
          post={selectedReel}
          currentUser={user}
          isDarkMode={isDarkMode}
          onClose={() => {
            setCommentModalVisible(false);
            setSelectedReel(null);
            loadReels();
          }}
          onViewProfile={onViewUserProfile}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        user={user}
        isDarkMode={isDarkMode}
        activeTab="reels"
        onTabChange={(tab) => {
          if (tab === 'home' && onNavigateToHome) {
            onNavigateToHome();
          } else if (tab === 'profile' && onNavigateToProfile) {
            onNavigateToProfile();
          } else if (tab === 'add' && onNavigateToCreatePost) {
            onNavigateToCreatePost();
          } else if (tab === 'search' && onNavigateToSearch) {
            onNavigateToSearch();
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  containerDark: {
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelContainer: {
    width: width,
    height: height,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 14, // Giảm padding để video hiển thị nhiều hơn
    paddingBottom: 1,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  topBarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarTextLight: {
    fontSize: 16,
    color: '#999',
    marginRight: 8,
  },
  friendsAvatars: {
    flexDirection: 'row',
    marginLeft: 5,
  },
  friendAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#000',
    marginLeft: -8,
  },
  friendAvatar2: {
    backgroundColor: '#555',
  },
  friendAvatar3: {
    backgroundColor: '#777',
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 80, // Căn với bottomInfo
    alignItems: 'center',
    zIndex: 10,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 16, // Giảm khoảng cách giữa các icon
  },
  actionCount: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  lastActionButton: {
    marginBottom: 0, // Icon cuối cùng không có margin bottom
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 60,
    paddingHorizontal: 15,
    zIndex: 10,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#fff',
  },
  followingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#ccc',
  },
  caption: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  musicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicText: {
    fontSize: 13,
    color: '#fff',
    marginLeft: 6,
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
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e8e',
  },
});

export default memo(ReelScreen);
