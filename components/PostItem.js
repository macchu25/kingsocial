import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { postService } from '../services/postService';
import { followService } from '../services/followService';
import { handleApiError } from '../utils/errorHandler';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://via.placeholder.com/40/cccccc/ffffff?text=User';

const PostItem = ({ post, currentUserId, onUpdate, onViewProfile }) => {
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [commentsList, setCommentsList] = useState(post.commentsList || []);
  const [commentsCount, setCommentsCount] = useState(post.comments || 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  const isOwnPost = currentUserId === post.userId;

  // Update when post changes
  useEffect(() => {
    setCommentsCount(post.comments || 0);
    setCommentsList(post.commentsList || []);
  }, [post.comments, post.commentsList]);

  // Check follow status when post changes
  useEffect(() => {
    if (!isOwnPost && post.userId) {
      checkFollowStatus();
    }
  }, [post.userId, isOwnPost]);

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
      onViewProfile(post.userId, post.username, post.userAvatar);
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

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    const commentToAdd = commentText.trim();
    setCommenting(true);
    const tempComment = {
      id: Date.now(),
      username: 'You',
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
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={handleViewProfile}
          activeOpacity={0.7}
        >
          <Image
            source={{
              uri: post.userAvatar || post.avatar || DEFAULT_AVATAR,
            }}
            style={styles.avatar}
            defaultSource={{ uri: DEFAULT_AVATAR }}
          />
          <Text style={styles.username}>{post.username}</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {!isOwnPost && (
            <TouchableOpacity
              style={styles.followButton}
              onPress={handleFollow}
              disabled={followingLoading}
            >
              {followingLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? "#000" : "#0095F6"} />
              ) : (
                <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                  {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                </Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Image */}
      <Image
        source={{ uri: post.image }}
        style={styles.postImage}
        resizeMode="cover"
      />

      {/* Post Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Ionicons 
              name={liked ? 'heart' : 'heart-outline'} 
              size={24} 
              color={liked ? '#FF3040' : '#000'} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Post Info */}
      <View style={styles.info}>
        <Text style={styles.likes}>{likesCount.toLocaleString()} lượt thích</Text>
        <View style={styles.captionContainer}>
          <Text style={styles.username}>{post.username} </Text>
          <Text style={styles.caption}>{post.caption}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowComments(!showComments)}>
          <Text style={styles.comments}>
            {commentsCount > 0
              ? `Xem tất cả ${commentsCount} bình luận`
              : 'Thêm bình luận đầu tiên'}
          </Text>
        </TouchableOpacity>

        {/* Comments List */}
        {showComments && commentsList.length > 0 && (
          <View style={styles.commentsList}>
            {commentsList.map((comment, index) => (
              <View key={comment.id || index} style={styles.commentItem}>
                <Text style={styles.commentUsername}>{comment.username} </Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.time}>{formatTime(post.createdAt)}</Text>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Thêm bình luận..."
            placeholderTextColor="#8e8e8e"
            value={commentText}
            onChangeText={setCommentText}
            onSubmitEditing={handleAddComment}
            editable={!commenting}
          />
          {commentText.trim().length > 0 && (
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={commenting}
              style={styles.postCommentButton}
            >
              <Text style={styles.postCommentText}>Đăng</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
    backgroundColor: '#0095F6',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#000',
  },
  moreButton: {
    padding: 5,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  postImage: {
    width: width,
    height: width,
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
  captionContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  caption: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  comments: {
    fontSize: 14,
    color: '#8e8e8e',
    marginBottom: 5,
  },
  time: {
    fontSize: 12,
    color: '#8e8e8e',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  commentsList: {
    marginTop: 5,
    marginBottom: 5,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  commentText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    paddingVertical: 5,
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

export default PostItem;

