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
const SWIPE_THRESHOLD = 30; // Reduced threshold for easier closing
const ACTION_WIDTH = 80;

const SwipeableCommentRow = ({
  children,
  onDelete,
  onEdit,
  canDelete,
  canEdit,
  isDarkMode = false,
  backgroundColor = '#fff',
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);
  const currentX = useRef(0);
  const [isSwiping, setIsSwiping] = useState(false);

  if (!canDelete && !canEdit) {
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
        const maxSwipe = canEdit && canDelete ? ACTION_WIDTH * 2 : ACTION_WIDTH;
        
        // Calculate new position based on current offset and gesture
        const newX = currentX.current + dx;
        
        // Clamp between -maxSwipe (fully open) and 0 (fully closed)
        const clampedX = Math.max(-maxSwipe, Math.min(0, newX));
        translateX.setValue(clampedX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateX.flattenOffset();
        const { dx } = gestureState;
        const threshold = canEdit && canDelete ? ACTION_WIDTH * 2 : ACTION_WIDTH;
        const finalX = translateX._value;
        const startPosition = currentX.current;
        
        setIsSwiping(false);
        
        // Determine action based on swipe direction and distance
        // If swiping right (positive dx), always close regardless of distance
        if (dx > 5) {
          // Swiping right (closing) - always close
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        } else if (dx < -5 && finalX < -SWIPE_THRESHOLD) {
          // Swiping left and reached threshold - open it
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
          // Not enough movement or swiping right - close it
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
    // Delay nhỏ để đảm bảo swipe animation hoàn thành trước khi hiển thị alert
    // Điều này giúp tránh xung đột với các component khác trên mobile
    setTimeout(() => {
      if (onDelete) onDelete();
    }, 200);
  };

  const handleEdit = () => {
    closeSwipe();
    if (onEdit) onEdit();
  };

  const totalActionsWidth = (canEdit && canDelete ? ACTION_WIDTH * 2 : ACTION_WIDTH);

  return (
    <View style={styles.container}>
      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {canEdit && (
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        {canDelete && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  actionButton: {
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#0095F6',
  },
  deleteButton: {
    backgroundColor: '#FF3040',
  },
  content: {
    // backgroundColor will be set dynamically
  },
});

export default SwipeableCommentRow;

