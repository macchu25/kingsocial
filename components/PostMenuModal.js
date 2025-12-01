import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { alertDelete, alertError, alertInfo } from '../utils/alert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PostMenuModal = ({ 
  visible, 
  isOwnPost, 
  isDarkMode = false, 
  onClose, 
  onEdit, 
  onDelete,
  onHide,
  buttonPosition = { x: 0, y: 0, width: 0, height: 0 }
}) => {
  const handleDelete = () => {
    alertDelete(
      'Xóa bài viết',
      'Bạn có chắc chắn muốn xóa bài viết này?',
      async () => {
        try {
          if (onDelete) {
            await onDelete();
          }
          onClose();
        } catch (error) {
          alertError('Lỗi', 'Không thể xóa bài viết');
        }
      }
    );
  };

  const handleHide = () => {
    alertInfo(
      'Ẩn bài viết',
      'Bạn có muốn ẩn bài viết này khỏi bảng tin của mình không?',
      async () => {
        try {
          if (onHide) {
            await onHide();
          }
          onClose();
        } catch (error) {
          alertError('Lỗi', 'Không thể ẩn bài viết');
        }
      }
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View 
          style={[
            styles.menuContainer, 
            isDarkMode && styles.menuContainerDark,
            {
              position: 'absolute',
              top: buttonPosition.y + buttonPosition.height - 50,
              right: buttonPosition.x ? (SCREEN_WIDTH - buttonPosition.x - buttonPosition.width) : 15,
            }
          ]} 
          onStartShouldSetResponder={() => true}
        >
          {isOwnPost ? (
            <>
              <TouchableOpacity
                style={[styles.menuItem, isDarkMode && styles.menuItemDark]}
                onPress={() => {
                  onClose();
                  if (onEdit) {
                    onEdit();
                  }
                }}
              >
                <Ionicons name="create-outline" size={20} color={isDarkMode ? "#fff" : "#000"} />
                <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>
                  Chỉnh sửa
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, isDarkMode && styles.menuItemDark]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3040" />
                <Text style={[styles.menuText, styles.deleteText]}>
                  Xóa
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.menuItem, isDarkMode && styles.menuItemDark]}
              onPress={handleHide}
            >
              <Ionicons name="eye-off-outline" size={20} color={isDarkMode ? "#fff" : "#000"} />
              <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>
                Ẩn bài viết
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuContainerDark: {
    backgroundColor: '#1a1a1a',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  menuItemDark: {
    borderBottomColor: '#333',
  },
  menuText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 15,
  },
  menuTextDark: {
    color: '#fff',
  },
  deleteText: {
    color: '#FF3040',
  },
});

export default PostMenuModal;

