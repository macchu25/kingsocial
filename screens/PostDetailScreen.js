import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Video } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { postService } from '../services/postService';
import { followService } from '../services/followService';
import { handleApiError } from '../utils/errorHandler';
import { alertSuccess, alertInfo } from '../utils/alert';
import PostMenuModal from '../components/PostMenuModal';
import CommentModal from '../components/CommentModal';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = require('../asset/avt.jpg');

const PostDetailScreen = ({ post, currentUser, isDarkMode = false, onClose, onViewProfile, onUpdate, onEditPost }) => {
  // Ensure post has images array
  const initialPost = {
    ...post,
    images: post.images && post.images.length > 0 
      ? post.images 
      : (post.image ? [post.image] : [])
  };
  const [postData, setPostData] = useState(initialPost);
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [commentText, setCommentText] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef(null);
  
  // Get images array, fallback to single image for backward compatibility
  const images = postData.images && postData.images.length > 0 
    ? postData.images 
    : (postData.image ? [postData.image] : []);

  // Check if post is a reel (video)
  const isReel = useMemo(() => {
    return postData.type === 'reel' || (images.length > 0 && images[0]?.includes('data:video/'));
  }, [postData.type, images]);
  const [commenting, setCommenting] = useState(false);
  const [commentsList, setCommentsList] = useState(post.commentsList || []);
  const [commentsCount, setCommentsCount] = useState(post.comments || 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const moreButtonRef = useRef(null);

  const isOwnPost = currentUser?.id === post.userId;

  useEffect(() => {
    if (!isOwnPost && post.userId) {
      checkFollowStatus();
    }
    // Load full post data when component mounts to ensure we have all images
    const loadFullPost = async () => {
      try {
        const response = await postService.getPostById(post.id);
        if (response.success && response.post) {
          const fullPost = {
            ...response.post,
            images: response.post.images && response.post.images.length > 0 
              ? response.post.images 
              : (response.post.image ? [response.post.image] : [])
          };
          setPostData(fullPost);
        }
      } catch (error) {
        // Silent fail, use post prop data
        console.error('Load full post error:', error);
      }
    };
    loadFullPost();
  }, [post.id, post.userId, isOwnPost]);

  const checkFollowStatus = async () => {
    if (!post.userId) return;
    try {
      const response = await followService.checkFollowStatus(post.userId);
      if (response.success) {
        setIsFollowing(response.isFollowing);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleFollow = async () => {
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
  };

  const handleViewProfile = () => {
    if (onViewProfile && post.userId) {
      onViewProfile(post.userId, post.username, post.userAvatar || post.avatar);
    }
  };

  const handleLike = async () => {
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
        if (onUpdate) onUpdate();
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
  };

  const loadAllComments = async () => {
    if (loadingComments || showAllComments) return;
    
    setLoadingComments(true);
    try {
      const response = await postService.getPostById(post.id);
      if (response.success && response.post) {
        // Always use images from server response, it should have all images
        const updatedPost = {
          ...response.post,
          images: response.post.images && response.post.images.length > 0 
            ? response.post.images 
            : (response.post.image ? [response.post.image] : [])
        };
        setPostData(updatedPost);
        setCommentsList(response.post.commentsList || []);
        setCommentsCount(response.post.comments || 0);
        setShowAllComments(true);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleViewAllComments = () => {
    if (commentsList.length < commentsCount) {
      loadAllComments();
    } else {
      setShowAllComments(!showAllComments);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    const commentToAdd = commentText.trim();
    setCommenting(true);
    const tempComment = {
      id: Date.now(),
      username: currentUser?.username || 'You',
      text: commentToAdd,
    };
    const updatedComments = [...commentsList, tempComment];
    setCommentsList(updatedComments);
    setCommentText('');

    try {
      const response = await postService.addComment(post.id, commentToAdd);
      if (response.success) {
        // Replace temp comment with real comment from server
        setCommentsList([...commentsList, response.comment]);
        setCommentsCount(response.commentsCount);
        if (onUpdate) onUpdate();
        // Reload all comments if showing all
        if (showAllComments) {
          loadAllComments();
        }
      } else {
        // Remove temp comment on error
        setCommentsList(commentsList);
      }
    } catch (error) {
      // Remove temp comment on error
      setCommentsList(commentsList);
      handleApiError(error);
    } finally {
      setCommenting(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return postDate.toLocaleDateString('vi-VN');
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Bài viết</Text>
        <View style={styles.headerRight}>
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Post Header */}
        <View style={styles.postHeader}>
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
                style={[styles.followButton, isFollowing && styles.followingButton]}
                onPress={handleFollow}
                disabled={followingLoading}
              >
                {followingLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? "#fff" : "#0095F6"} />
                ) : (
                  <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                    {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
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
              
              return (
                isVideo ? (
                  <Video
                    key={index}
                    source={{ uri: imageUri }}
                    style={styles.postImage}
                    resizeMode="contain"
                    shouldPlay={true}
                    isLooping
                    isMuted={false}
                    useNativeControls={true}
                  />
                ) : (
                  <Image
                    key={index}
                    source={{ uri: imageUri }}
                    style={styles.postImage}
                    resizeMode="contain"
                  />
                )
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
                size={28} 
                color={liked ? '#FF3040' : (isDarkMode ? '#fff' : '#000')} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setCommentModalVisible(true)}
            >
              <Ionicons name="chatbubble-outline" size={28} color={isDarkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="paper-plane-outline" size={28} color={isDarkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity>
            <Ionicons name="bookmark-outline" size={28} color={isDarkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
        </View>

        {/* Post Info */}
        <View style={styles.info}>
          <Text style={[styles.likes, isDarkMode && styles.likesDark]}>{likesCount.toLocaleString()} lượt thích</Text>
          <View style={styles.captionContainer}>
            <TouchableOpacity onPress={handleViewProfile}>
              <Text style={[styles.username, isDarkMode && styles.usernameDark]}>{post.username} </Text>
            </TouchableOpacity>
            <Text style={[styles.caption, isDarkMode && styles.captionDark]}>{post.caption}</Text>
          </View>
          {commentsCount > 0 && (
            <TouchableOpacity onPress={() => setCommentModalVisible(true)}>
              <Text style={[styles.viewAllComments, isDarkMode && styles.viewAllCommentsDark]}>
                Xem tất cả {commentsCount} bình luận
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.time, isDarkMode && styles.timeDark]}>{formatTime(post.createdAt)}</Text>
        </View>
      </ScrollView>

      {/* Comment Modal */}
      <CommentModal
        visible={commentModalVisible}
        post={postData}
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        onClose={() => {
          setCommentModalVisible(false);
          // Reload comments when modal closes
          loadAllComments();
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
            onEditPost(postData);
          }
        }}
        onDelete={async () => {
          try {
            const response = await postService.deletePost(post.id);
            if (response.success) {
              alertSuccess('Thành công', 'Đã xóa bài viết');
              if (onClose) {
                onClose();
              }
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
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerTitleDark: {
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  moreButton: {
    padding: 5,
    alignSelf: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
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
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#0095F6',
  },
  followingButton: {
    backgroundColor: '#333',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#fff',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  username: {
    fontSize: 15,
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
    backgroundColor: '#000',
  },
  postImage: {
    width: width,
    height: width,
    backgroundColor: '#000',
  },
  imageIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
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
    zIndex: 2,
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
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 20,
  },
  info: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  likes: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  likesDark: {
    color: '#fff',
  },
  captionContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  caption: {
    fontSize: 15,
    color: '#000',
    flex: 1,
  },
  captionDark: {
    color: '#fff',
  },
  viewAllComments: {
    fontSize: 15,
    color: '#8e8e8e',
    marginBottom: 8,
  },
  viewAllCommentsDark: {
    color: '#999',
  },
  commentsList: {
    marginBottom: 12,
  },
  commentItem: {
    marginBottom: 12,
  },
  commentUserContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  commentUsername: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  commentUsernameDark: {
    color: '#fff',
  },
  commentText: {
    fontSize: 15,
    color: '#000',
    flex: 1,
  },
  commentTextDark: {
    color: '#fff',
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
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
  },
  commentInputContainerDark: {
    borderTopColor: '#333',
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#0095F6',
  },
});

export default React.memo(PostDetailScreen);

