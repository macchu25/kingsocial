import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SWIPE_THRESHOLD = 30;
const ACTION_WIDTH = 80;

const SwipeableConversationRow = ({
  children,
  onDelete,
  canDelete = true,
  isDarkMode = false,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);
  const currentX = useRef(0);
  const [isSwiping, setIsSwiping] = useState(false);

  if (!canDelete) {
    // No swipe actions available, just render children
    return <View>{children}</View>;
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        // Capture horizontal swipes before ScrollView
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5;
      },
      onPanResponderGrant: (evt) => {
        startX.current = evt.nativeEvent.pageX;
        currentX.current = translateX._value;
        translateX.setOffset(currentX.current);
        translateX.setValue(0);
        setIsSwiping(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        const { dx } = gestureState;
        const maxSwipe = ACTION_WIDTH;
        
        // Calculate new position based on current offset and gesture
        // Swipe left (negative dx) to reveal delete button
        const newX = currentX.current + dx;
        
        // Clamp between -maxSwipe (fully open) and 0 (fully closed)
        const clampedX = Math.max(-maxSwipe, Math.min(0, newX));
        translateX.setValue(clampedX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateX.flattenOffset();
        const { dx } = gestureState;
        const threshold = ACTION_WIDTH;
        const finalX = translateX._value;
        
        setIsSwiping(false);
        
        // If swiped right significantly, always close
        if (dx > 5) {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        } else if (finalX < -SWIPE_THRESHOLD) {
          // Swiped left enough - open delete button
          Animated.spring(translateX, {
            toValue: -threshold,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        } else {
          // Not enough movement - close it
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        translateX.flattenOffset();
        setIsSwiping(false);
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const handleDelete = () => {
    closeSwipe();
    if (onDelete) onDelete();
  };

  return (
    <View style={styles.container}>
      {/* Action Button - Delete */}
      <View style={styles.actionsContainer}>
        {canDelete && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX }],
            backgroundColor: isDarkMode ? '#000' : '#fff',
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 0,
  },
  actionButton: {
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF3040',
  },
  content: {
    zIndex: 1,
    // backgroundColor will be set dynamically based on isDarkMode
  },
});

export default SwipeableConversationRow;

