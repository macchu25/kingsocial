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
  const isHorizontalSwipe = useRef(false);

  if (!canDelete && !canEdit) {
    // No swipe actions available, just render children
    return <View>{children}</View>;
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      // Không capture ngay từ đầu - để ScrollView có cơ hội xử lý vertical scroll
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Kiểm tra xem có phải horizontal swipe không
        const { dx, dy } = gestureState;
        // Threshold thấp hơn để phát hiện sớm hơn trên mobile
        const isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.1;
        const hasHorizontalMovement = Math.abs(dx) > 2;
        
        // Update ref để track direction
        isHorizontalSwipe.current = isHorizontal && hasHorizontalMovement;
        
        // Nếu là vertical scroll rõ ràng, không bắt - để ScrollView xử lý
        if (!isHorizontal && Math.abs(dy) > 8) {
          isHorizontalSwipe.current = false;
          return false;
        }
        
        // Nếu là horizontal swipe, bắt gesture
        return isHorizontal && hasHorizontalMovement;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        // Capture horizontal swipes TRƯỚC ScrollView trên mobile
        // Đây là key để hoạt động trên điện thoại
        const { dx, dy } = gestureState;
        // Threshold thấp hơn để phát hiện sớm hơn
        const isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.1;
        const hasHorizontalMovement = Math.abs(dx) > 2;
        
        // Update ref để track direction
        isHorizontalSwipe.current = isHorizontal && hasHorizontalMovement;
        
        // Nếu là vertical scroll rõ ràng, không bắt - để ScrollView xử lý
        if (!isHorizontal && Math.abs(dy) > 8) {
          isHorizontalSwipe.current = false;
          return false;
        }
        
        // Nếu là horizontal swipe, BẮT gesture trước ScrollView
        return isHorizontal && hasHorizontalMovement;
      },
      // Cho phép ScrollView lấy lại gesture nếu không phải horizontal swipe
      onPanResponderTerminationRequest: () => {
        // Nếu không phải horizontal swipe, cho phép terminate để ScrollView xử lý
        return !isHorizontalSwipe.current;
      },
      onPanResponderGrant: (evt) => {
        startX.current = evt.nativeEvent.pageX;
        currentX.current = translateX._value;
        translateX.setOffset(currentX.current);
        translateX.setValue(0);
        setIsSwiping(true);
        isHorizontalSwipe.current = false; // Reset khi bắt đầu gesture mới
      },
      onPanResponderMove: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const maxSwipe = canEdit && canDelete ? ACTION_WIDTH * 2 : ACTION_WIDTH;
        
        // Kiểm tra lại direction trong move
        const isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
        isHorizontalSwipe.current = isHorizontal && Math.abs(dx) > 3;
        
        // Nếu là vertical scroll nhiều hơn horizontal, không update position
        if (!isHorizontal && Math.abs(dy) > 15) {
          // Không làm gì, để ScrollView xử lý
          return;
        }
        
        // Calculate new position based on current offset and gesture
        const newX = currentX.current + dx;
        
        // Clamp between -maxSwipe (fully open) and 0 (fully closed)
        const clampedX = Math.max(-maxSwipe, Math.min(0, newX));
        translateX.setValue(clampedX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateX.flattenOffset();
        const { dx, vx } = gestureState;
        const threshold = canEdit && canDelete ? ACTION_WIDTH * 2 : ACTION_WIDTH;
        const finalX = translateX._value;
        
        setIsSwiping(false);
        
        // Determine action based on swipe direction, distance, and velocity
        // If swiping right (positive dx), always close regardless of distance
        if (dx > 10 || (dx > 0 && vx > 0.5)) {
          // Swiping right (closing) - always close
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        } else if (dx < -10 || (dx < 0 && vx < -0.5)) {
          // Swiping left - check if we should open
          if (Math.abs(finalX) > SWIPE_THRESHOLD || Math.abs(dx) > SWIPE_THRESHOLD) {
            // Opened enough - keep open
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
        } else if (finalX < -SWIPE_THRESHOLD) {
          // Already open (or opened enough) - keep open
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
    // Gọi onDelete trực tiếp sau khi đóng swipe
    if (onDelete) onDelete();
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

