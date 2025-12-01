import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { noteService } from '../services/noteService';
import { handleApiError } from '../utils/errorHandler';
import { alertError, alertSuccess } from '../utils/alert';

const CreateNoteScreen = ({ user, isDarkMode = false, onNoteCreated, onCancel }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      alertError('Lỗi', 'Vui lòng nhập nội dung ghi chú');
      return;
    }

    if (text.length > 60) {
      alertError('Lỗi', 'Ghi chú không được quá 60 ký tự');
      return;
    }

    setLoading(true);

    try {
      const response = await noteService.createNote(text.trim());

      if (response.success) {
        alertSuccess('Thành công', response.message);
        setText('');
        if (onNoteCreated) {
          onNoteCreated();
        }
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={[styles.cancelText, isDarkMode && styles.cancelTextDark]}>Hủy</Text>
          </TouchableOpacity>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>Ghi chú mới</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !text.trim()}
            style={styles.submitButton}
          >
            <Text
              style={[
                styles.submitText,
                isDarkMode && styles.submitTextDark,
                (loading || !text.trim()) && styles.submitTextDisabled
              ]}
            >
              {loading ? 'Đang đăng...' : 'Đăng'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              placeholder="Nhập ghi chú của bạn (tối đa 60 ký tự)"
              placeholderTextColor={isDarkMode ? "#666" : "#999"}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={60}
              autoFocus
            />
            <View style={styles.counterContainer}>
              <Text style={[styles.counter, isDarkMode && styles.counterDark]}>
                {text.length}/60
              </Text>
            </View>
          </View>

          <View style={[styles.infoContainer, isDarkMode && styles.infoContainerDark]}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={isDarkMode ? "#666" : "#999"}
            />
            <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
              Ghi chú sẽ tự động biến mất sau 24 giờ
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  cancelButton: {
    padding: 5,
  },
  cancelText: {
    fontSize: 16,
    color: '#000',
  },
  cancelTextDark: {
    color: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  titleDark: {
    color: '#fff',
  },
  submitButton: {
    padding: 5,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0095F6',
  },
  submitTextDark: {
    color: '#0095F6',
  },
  submitTextDisabled: {
    color: '#8e8e8e',
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    minHeight: 150,
    marginBottom: 20,
  },
  inputContainerDark: {
    backgroundColor: '#1a1a1a',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    textAlignVertical: 'top',
  },
  inputDark: {
    color: '#fff',
  },
  counterContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  counter: {
    fontSize: 12,
    color: '#999',
  },
  counterDark: {
    color: '#666',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  infoContainerDark: {
    backgroundColor: '#1a1a1a',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  infoTextDark: {
    color: '#999',
  },
});

export default CreateNoteScreen;

