import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { postService } from '../services/postService';
import { followService } from '../services/followService';
import { handleApiError } from '../utils/errorHandler';
import { alertSuccess, alertInfo } from '../utils/alert';
import PostMenuModal from './PostMenuModal';
import CommentModal from './CommentModal';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = require('../asset/avt.jpg');

const PostItem = ({ post, currentUserId, isDarkMode = false, onUpdate, onViewProfile, onViewPost, onEditPost }) => {
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments || 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const moreButtonRef = useRef(null);
  const scrollViewRef = useRef(null);
  const videoRef = useRef(null);
  const lastTap = useRef(null);
  
  // Get images array, fallback to single image for backward compatibility
  const images = useMemo(() => {
    return post.images && post.images.length > 0 
      ? post.images 
      : (post.image ? [post.image] : []);
  }, [post.images, post.image]);

  // Check if post is a reel (video)
  const isReel = useMemo(() => {
    return post.type === 'reel' || (images.length > 0 && images[0]?.includes('data:video/'));
  }, [post.type, images]);

  const isOwnPost = currentUserId === post.userId;

  // Update when post changes
  useEffect(() => {
    setCommentsCount(post.comments || 0);
  }, [post.comments]);

  // Check follow status when post changes (memoized to avoid unnecessary calls)
  useEffect(() => {
    if (!isOwnPost && post.userId) {
      checkFollowStatus();
    }
  }, [post.userId, isOwnPost, checkFollowStatus]);

  const checkFollowStatus = useCallback(async () => {
    if (!post.userId) return;
    try {
      const response = await followService.checkFollowStatus(post.userId);
      if (response.success) {
        setIsFollowing(response.isFollowing);
      }
    } catch (error) {
      // Silent fail
    }
  }, [post.userId]);

  const handleFollow = useCallback(async () => {
    if (!post.userId || isOwnPost) return;

    setFollowingLoading(true);
    try {
      const response = await followService.toggleFollow(post.userId);
      if (response.success) {
        setIsFollowing(response.isFollowing);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setFollowingLoading(false);
    }
  }, [post.userId, isOwnPost]);

  const handleViewProfile = useCallback(() => {
    if (onViewProfile && post.userId) {
      onViewProfile(post.userId, post.username, post.userAvatar);
    }
  }, [onViewProfile, post.userId, post.username, post.userAvatar]);

  const handleLike = useCallback(async () => {
    const previousLiked = liked;
    const previousCount = likesCount;
    
    // Optimistic update
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    try {
      const response = await postService.likePost(post.id);
      if (response.success) {
        setLiked(response.isLiked);
        setLikesCount(response.likes);
      } else {
        // Revert on error
        setLiked(previousLiked);
        setLikesCount(previousCount);
      }
    } catch (error) {
      // Revert on error
      setLiked(previousLiked);
      setLikesCount(previousCount);
      handleApiError(error);
    }
  }, [liked, likesCount, post.id]);


  const formatTime = useCallback((date) => {
    if (!date) return '';
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return postDate.toLocaleDateString('vi-VN');
  }, []);

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={handleViewProfile}
          activeOpacity={0.7}
        >
          <Image
            source={
              ((post.userAvatar && post.userAvatar.trim() !== '') || (post.avatar && post.avatar.trim() !== '')) 
                ? { uri: (post.userAvatar || post.avatar) }
                : DEFAULT_AVATAR
            }
            style={styles.avatar}
            defaultSource={DEFAULT_AVATAR}
          />
          <Text style={[styles.username, isDarkMode && styles.usernameDark]}>{post.username}</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {!isOwnPost && (
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
                isFollowing && isDarkMode && styles.followingButtonDark
              ]}
              onPress={handleFollow}
              disabled={followingLoading}
            >
              {followingLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? (isDarkMode ? "#fff" : "#000") : "#0095F6"} />
              ) : (
                <Text style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText,
                  isFollowing && isDarkMode && styles.followingButtonTextDark
                ]}>
                  {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                </Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            ref={moreButtonRef}
            style={styles.moreButton}
            onPress={() => {
              moreButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
                setButtonPosition({ x: pageX, y: pageY, width, height });
                setMenuVisible(true);
              });
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={isDarkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Images Carousel */}
      <View style={styles.imageContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
          scrollEnabled={images.length > 1}
        >
          {images.map((imageUri, index) => {
            const isVideo = isReel && (imageUri.includes('data:video/') || imageUri.includes('.mp4') || imageUri.includes('.mov'));
            
            const handlePress = () => {
              if (isVideo) {
                const now = Date.now();
                const DOUBLE_PRESS_DELAY = 300;
                
                if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
                  // Double tap detected - open post detail
                  onViewPost && onViewPost(post);
                  lastTap.current = null;
                } else {
                  // Single tap - toggle play/pause
                  lastTap.current = now;
                  setTimeout(() => {
                    if (lastTap.current === now) {
                      // Single tap confirmed
                      if (isVideoPlaying && videoRef.current) {
                        videoRef.current.pauseAsync();
                        setIsVideoPlaying(false);
                      } else if (videoRef.current) {
                        videoRef.current.playAsync();
                        setIsVideoPlaying(true);
                      }
                      lastTap.current = null;
                    }
                  }, DOUBLE_PRESS_DELAY);
                }
              } else {
                // For images, single tap opens post detail
                onViewPost && onViewPost(post);
              }
            };
            
            return (
              <TouchableOpacity 
                key={index}
                onPress={handlePress}
                activeOpacity={0.95}
              >
                {isVideo ? (
                  <Video
                    ref={videoRef}
                    source={{ uri: imageUri }}
                    style={styles.postImage}
                    resizeMode="cover"
                    shouldPlay={false}
                    isLooping
                    isMuted={false}
                    useNativeControls={false}
                    onPlaybackStatusUpdate={(status) => {
                      setIsVideoPlaying(status.isPlaying);
                    }}
                  />
                ) : (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.postImage}
                    resizeMode="cover"
                    progressiveRenderingEnabled={true}
                    cache="force-cache"
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {/* Image Indicator - Text (Top Right) */}
        {images.length > 1 && (
          <View style={styles.imageIndicator}>
            <Text style={[styles.imageIndicatorText, isDarkMode && styles.imageIndicatorTextDark]}>
              {currentImageIndex + 1}/{images.length}
            </Text>
          </View>
        )}
        
        {/* Image Indicator - Dots (Bottom Center) */}
        {images.length > 1 && (
          <View style={styles.dotsIndicator}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentImageIndex && styles.dotActive
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Post Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Ionicons 
              name={liked ? 'heart' : 'heart-outline'} 
              size={24} 
              color={liked ? '#FF3040' : (isDarkMode ? '#fff' : '#000')} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setCommentModalVisible(true)}
          >
            <Ionicons name="chatbubble-outline" size={24} color={isDarkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={24} color={isDarkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={24} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
      </View>

      {/* Post Info */}
      <View style={styles.info}>
        <Text style={[styles.likes, isDarkMode && styles.likesDark]}>{likesCount.toLocaleString()} lượt thích</Text>
        <View style={styles.captionContainer}>
          <Text style={[styles.username, isDarkMode && styles.usernameDark]}>{post.username} </Text>
          <Text style={[styles.caption, isDarkMode && styles.captionDark]}>{post.caption}</Text>
        </View>
        {commentsCount > 0 && (
          <TouchableOpacity onPress={() => setCommentModalVisible(true)}>
            <Text style={[styles.comments, isDarkMode && styles.commentsDark]}>
              Xem tất cả {commentsCount} bình luận
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.time, isDarkMode && styles.timeDark]}>{formatTime(post.createdAt)}</Text>
      </View>

      {/* Comment Modal */}
      <CommentModal
        visible={commentModalVisible}
        post={post}
        currentUser={{ id: currentUserId }}
        isDarkMode={isDarkMode}
        onClose={() => {
          setCommentModalVisible(false);
          if (onUpdate) onUpdate();
        }}
        onViewProfile={onViewProfile}
      />

      {/* Post Menu Modal */}
      <PostMenuModal
        visible={menuVisible}
        isOwnPost={isOwnPost}
        isDarkMode={isDarkMode}
        buttonPosition={buttonPosition}
        onClose={() => setMenuVisible(false)}
        onEdit={() => {
          if (onEditPost) {
            onEditPost(post);
          }
        }}
        onDelete={async () => {
          try {
            const response = await postService.deletePost(post.id);
            if (response.success) {
              alertSuccess('Thành công', 'Đã xóa bài viết');
              if (onUpdate) {
                onUpdate();
              }
            }
          } catch (error) {
            handleApiError(error);
            throw error;
          }
        }}
        onHide={async () => {
          // TODO: Implement hide post
          alertInfo('Thông báo', 'Tính năng ẩn bài viết đang được phát triển');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
    paddingBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0095F6',
  },
  followingButton: {
    borderColor: '#000',
  },
  followingButtonDark: {
    borderColor: '#fff',
  },
  followButtonText: {
    color: '#0095F6',
    fontSize: 12,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#000',
  },
  followingButtonTextDark: {
    color: '#fff',
  },
  moreButton: {
    padding: 5,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  usernameDark: {
    color: '#fff',
  },
  imageContainer: {
    position: 'relative',
    width: width,
    height: width,
  },
  postImage: {
    width: width,
    height: width,
  },
  imageIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  imageIndicatorTextDark: {
    color: '#fff',
  },
  dotsIndicator: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 15,
  },
  info: {
    paddingHorizontal: 15,
  },
  likes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  likesDark: {
    color: '#fff',
  },
  captionContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  caption: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  captionDark: {
    color: '#fff',
  },
  comments: {
    fontSize: 14,
    color: '#8e8e8e',
    marginBottom: 5,
  },
  commentsDark: {
    color: '#999',
  },
  time: {
    fontSize: 12,
    color: '#8e8e8e',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  timeDark: {
    color: '#999',
  },
  commentsList: {
    marginTop: 5,
    marginBottom: 5,
  },
  commentItem: {
    marginBottom: 8,
  },
  commentUserContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  commentTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  commentUsernameDark: {
    color: '#fff',
  },
  commentText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  commentTextDark: {
    color: '#fff',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
  },
  commentInputContainerDark: {
    borderTopColor: '#333',
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    paddingVertical: 5,
  },
  commentInputDark: {
    color: '#fff',
  },
  postCommentButton: {
    paddingHorizontal: 10,
  },
  postCommentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0095F6',
  },
});

export default memo(PostItem);

