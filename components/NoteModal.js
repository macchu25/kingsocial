import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_AVATAR = require('../asset/avt.jpg');

const NoteModal = ({ visible, note, isOwnNote, isDarkMode = false, onClose, onEdit, onDelete, onDeleteSuccess }) => {
  if (!note) return null;

  const handleDelete = () => {
    Alert.alert(
      'Xóa ghi chú',
      'Bạn có chắc chắn muốn xóa ghi chú này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              if (onDelete) {
                await onDelete();
                if (onDeleteSuccess) {
                  onDeleteSuccess();
                }
              }
              onClose();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa ghi chú');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
          {/* Handle bar */}
          <View style={[styles.handleBar, isDarkMode && styles.handleBarDark]} />

          {/* Avatar */}
          <Image
            source={
              (note.userAvatar && note.userAvatar.trim() !== '')
                ? { uri: note.userAvatar }
                : DEFAULT_AVATAR
            }
            style={styles.avatar}
            defaultSource={DEFAULT_AVATAR}
          />

          {/* Note text */}
          <Text style={[styles.noteText, isDarkMode && styles.noteTextDark]}>
            {note.text}
          </Text>

          {/* Shared info */}
          <Text style={[styles.sharedText, isDarkMode && styles.sharedTextDark]}>
            Đã chia sẻ với bạn bè
          </Text>

          {/* Action buttons */}
          {isOwnNote ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => {
                  onClose();
                  if (onEdit) {
                    onEdit();
                  }
                }}
              >
                <Text style={styles.actionButtonText}>Viết ghi chú mới</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                  Xóa ghi chú
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    minHeight: 300,
  },
  modalContainerDark: {
    backgroundColor: '#1a1a1a',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginBottom: 20,
    opacity: 0.3,
  },
  handleBarDark: {
    backgroundColor: '#fff',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  noteText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  noteTextDark: {
    color: '#fff',
  },
  sharedText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 30,
  },
  sharedTextDark: {
    color: '#999',
  },
  actionButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#0095F6',
  },
  deleteButton: {
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButtonText: {
    color: '#fff',
  },
});

export default NoteModal;





