import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { storyService } from '../services/storyService';

const { width, height } = Dimensions.get('window');

const ViewStoryScreen = ({ storyUser, currentUser, onClose, onStoryViewed }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [viewed, setViewed] = useState(false);

  const stories = storyUser?.stories || [];
  const currentStory = stories[currentStoryIndex];

  useEffect(() => {
    if (currentStory && !viewed && currentStory.id) {
      // Mark story as viewed
      markStoryAsViewed(currentStory.id);
    }
  }, [currentStoryIndex, currentStory]);

  const markStoryAsViewed = async (storyId) => {
    if (!storyId) {
      console.error('Story ID is missing');
      return;
    }
    
    try {
      const response = await storyService.markStoryViewed(storyId);
      if (response.success) {
        setViewed(true);
        if (onStoryViewed) {
          onStoryViewed(storyId);
        }
      }
    } catch (error) {
      console.error('Mark story viewed error:', error);
      // Don't block UI if marking fails
      setViewed(true);
    }
  };

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setViewed(false);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setViewed(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const storyDate = new Date(date);
    const diffInHours = Math.floor((now - storyDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours} giờ`;
    return storyDate.toLocaleDateString('vi-VN');
  };

  if (!currentStory) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Story Image */}
      <Image
        source={{ uri: currentStory.image }}
        style={styles.storyImage}
        resizeMode="cover"
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.profileInfo}>
            <Image
              source={{ uri: storyUser.userAvatar || 'https://via.placeholder.com/40' }}
              style={styles.profileAvatar}
            />
            <View style={styles.profileText}>
              <Text style={styles.username}>{storyUser.username}</Text>
              <Text style={styles.time}>{formatTime(currentStory.createdAt)}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      {stories.length > 1 && (
        <View style={styles.progressContainer}>
          {stories.map((story, index) => (
            <View
              key={story.id}
              style={[
                styles.progressBar,
                index < currentStoryIndex && styles.progressBarFilled,
                index === currentStoryIndex && styles.progressBarActive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Navigation Areas */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navArea, styles.navLeft]}
          onPress={handlePrevious}
          activeOpacity={0.5}
        />
        <TouchableOpacity
          style={[styles.navArea, styles.navRight]}
          onPress={handleNext}
          activeOpacity={0.5}
        />
      </View>

      {/* Bottom Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomBar}
      >
        <View style={styles.messageContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Gửi tin nhắn..."
            placeholderTextColor="#fff"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="heart-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="paper-plane-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topBarLeft: {
    flex: 1,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileText: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  time: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  closeButton: {
    padding: 5,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 10,
    gap: 4,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
  },
  progressBarFilled: {
    backgroundColor: '#fff',
  },
  progressBarActive: {
    backgroundColor: '#fff',
  },
  navigationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  navArea: {
    flex: 1,
  },
  navLeft: {
    // Left half for previous
  },
  navRight: {
    // Right half for next
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    marginRight: 10,
    maxHeight: 100,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    padding: 5,
  },
});

export default ViewStoryScreen;

