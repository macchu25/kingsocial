import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { storyService } from '../services/storyService';

const DEFAULT_AVATAR = require('../asset/avt.jpg');

const StoriesSection = ({ user, onCreateStory, onViewStory, refreshTrigger, isDarkMode = false }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  // Refresh when refreshTrigger changes (e.g., after creating story)
  useEffect(() => {
    if (refreshTrigger) {
      loadStories();
    }
  }, [refreshTrigger]);

  const loadStories = async () => {
    try {
      const response = await storyService.getAllStories();
      if (response.success) {
        const allStories = response.stories || [];
        
        // Sort stories: unviewed first, then viewed
        const sortedStories = allStories.map(storyUser => {
          const unviewedStories = storyUser.stories.filter(s => !s.isViewed);
          const viewedStories = storyUser.stories.filter(s => s.isViewed);
          
          return {
            ...storyUser,
            stories: [...unviewedStories, ...viewedStories],
            hasUnviewed: unviewedStories.length > 0
          };
        }).sort((a, b) => {
          // Sort by hasUnviewed (unviewed first)
          if (a.hasUnviewed && !b.hasUnviewed) return -1;
          if (!a.hasUnviewed && b.hasUnviewed) return 1;
          return 0;
        });
        
        setStories(sortedStories);
      }
    } catch (error) {
      console.error('Load stories error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryViewed = (storyId) => {
    // Update local state when story is viewed
    setStories(prevStories => {
      return prevStories.map(storyUser => {
        const updatedStories = storyUser.stories.map(story => {
          if (story.id === storyId) {
            return { ...story, isViewed: true };
          }
          return story;
        });
        
        const unviewedStories = updatedStories.filter(s => !s.isViewed);
        const viewedStories = updatedStories.filter(s => s.isViewed);
        
        return {
          ...storyUser,
          stories: [...unviewedStories, ...viewedStories],
          hasUnviewed: unviewedStories.length > 0
        };
      }).sort((a, b) => {
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return 0;
      });
    });
  };

  const handleCreateStory = () => {
    if (onCreateStory) {
      onCreateStory();
    }
  };

  const handleViewStory = (storyUser) => {
    if (onViewStory) {
      onViewStory(storyUser);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Your Story */}
        <TouchableOpacity 
          style={styles.storyItem}
          onPress={handleCreateStory}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={
                (user?.avatar && user.avatar.trim() !== '') 
                  ? { uri: user.avatar }
                  : DEFAULT_AVATAR
              }
              style={styles.avatar}
              defaultSource={DEFAULT_AVATAR}
            />
            <View style={styles.plusIcon}>
              <Text style={styles.plusText}>+</Text>
            </View>
          </View>
          <Text style={styles.username} numberOfLines={1}>
            Tin của bạn
          </Text>
        </TouchableOpacity>

        {/* Other users' stories */}
        {stories.map((storyUser) => {
          const hasUnviewed = storyUser.hasUnviewed || storyUser.stories.some(s => !s.isViewed);
          return (
            <TouchableOpacity
              key={storyUser.userId}
              style={styles.storyItem}
              onPress={() => handleViewStory(storyUser)}
            >
              <View style={[
                styles.avatarContainer,
                hasUnviewed ? styles.avatarBorder : styles.avatarBorderViewed
              ]}>
                <Image
                  source={
                    (storyUser.userAvatar && storyUser.userAvatar.trim() !== '') 
                      ? { uri: storyUser.userAvatar }
                      : DEFAULT_AVATAR
                  }
                  style={styles.avatar}
                  defaultSource={DEFAULT_AVATAR}
                />
              </View>
              <Text style={styles.username} numberOfLines={1}>
                {storyUser.username}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 70,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    position: 'relative',
  },
  avatarBorder: {
    borderWidth: 2,
    borderColor: '#E1306C', // Pink for unviewed
  },
  avatarBorderViewed: {
    borderWidth: 2,
    borderColor: '#8e8e8e', // Gray for viewed
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  plusIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0095F6',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  username: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    maxWidth: 70,
  },
});

export default StoriesSection;


