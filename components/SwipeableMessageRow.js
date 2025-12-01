import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 30;
const ACTION_WIDTH = 80;

const SwipeableMessageRow = ({
  children,
  onDelete,
  canDelete,
  isDarkMode = false,
  backgroundColor = '#fff',
  alignRight = false, // For own messages (right aligned)
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
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        // Capture horizontal swipes before ScrollView
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
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
        
        // For right-aligned messages (own messages), swipe left to reveal delete
        // For left-aligned messages (other messages), swipe right to reveal delete
        const swipeDirection = alignRight ? -1 : 1;
        const maxSwipe = ACTION_WIDTH;
        
        // Calculate new position based on current offset and gesture
        const newX = currentX.current + (dx * swipeDirection);
        
        // Clamp between -maxSwipe (fully open) and 0 (fully closed)
        const clampedX = Math.max(-maxSwipe, Math.min(0, newX));
        translateX.setValue(clampedX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateX.flattenOffset();
        const { dx } = gestureState;
        const threshold = ACTION_WIDTH;
        const finalX = translateX._value;
        const swipeDirection = alignRight ? -1 : 1;
        
        setIsSwiping(false);
        
        // Determine action based on swipe direction and distance
        // For right-aligned: swipe left (negative dx) opens, swipe right (positive dx) closes
        // For left-aligned: swipe right (positive dx) opens, swipe left (negative dx) closes
        const isClosingSwipe = alignRight ? (dx > 5) : (dx < -5);
        const isOpeningSwipe = alignRight ? (dx < -5) : (dx > 5);
        
        if (isClosingSwipe) {
          // Swiping to close - always close
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        } else if (isOpeningSwipe && finalX < -SWIPE_THRESHOLD) {
          // Swiping to open and reached threshold - open it
          Animated.spring(translateX, {
            toValue: -threshold,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        } else if (finalX < -SWIPE_THRESHOLD) {
          // Already open (or opened enough) - keep open
          Animated.spring(translateX, {
            toValue: -threshold,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        } else {
          // Not enough movement or swiping to close - close it
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
      <View style={[
        styles.actionsContainer,
        alignRight ? styles.actionsContainerRight : styles.actionsContainerLeft
      ]}>
        {canDelete && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
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
            backgroundColor: backgroundColor,
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
    marginBottom: 8,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  actionsContainerRight: {
    right: 0,
  },
  actionsContainerLeft: {
    left: 0,
  },
  actionButton: {
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3040',
  },
  content: {
    // backgroundColor will be set dynamically
  },
});

export default SwipeableMessageRow;



