import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { noteService } from '../services/noteService';
import NoteModal from './NoteModal';

const DEFAULT_AVATAR = require('../asset/avt.jpg');

const NotesSection = ({ user, onCreateNote, onCreateStory, onViewStory, refreshTrigger, isDarkMode = false }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      loadNotes();
    }
  }, [refreshTrigger]);

  const getTimeAgo = (createdAt) => {
    if (!createdAt) return '';
    const now = new Date();
    const created = new Date(createdAt);
    const diffInSeconds = Math.floor((now - created) / 1000);
    
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ`;
    return `${Math.floor(diffInSeconds / 86400)} ngày`;
  };

  const loadNotes = async () => {
    try {
      const response = await noteService.getAllNotes();
      if (response.success) {
        const allNotes = response.notes || [];
        
        // Sort notes: unviewed first, then viewed
        const sortedNotes = allNotes.sort((a, b) => {
          if (a.note && !a.note.isViewed && b.note && b.note.isViewed) return -1;
          if (a.note && a.note.isViewed && b.note && !b.note.isViewed) return 1;
          return 0;
        });
        
        setNotes(sortedNotes);
      }
    } catch (error) {
      console.error('Load notes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = () => {
    if (onCreateNote) {
      onCreateNote();
    } else if (onCreateStory) {
      onCreateStory();
    }
  };

  const handleViewNote = (noteUser) => {
    if (noteUser.note) {
      // Mark as viewed
      if (!noteUser.note.isViewed) {
        noteService.markNoteViewed(noteUser.note.id);
      }
      setSelectedNote({
        ...noteUser.note,
        userAvatar: noteUser.userAvatar,
        username: noteUser.username,
        userId: noteUser.userId,
      });
      setModalVisible(true);
    }
  };

  const handleDeleteNote = async () => {
    if (selectedNote && selectedNote.id) {
      try {
        const response = await noteService.deleteNote(selectedNote.id);
        if (response.success) {
          // Reload notes
          loadNotes();
          return true;
        }
      } catch (error) {
        console.error('Delete note error:', error);
        throw error;
      }
    }
    return false;
  };

  const truncateText = (text, maxLength = 10) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Your Note */}
        <TouchableOpacity 
          style={styles.noteItem}
          onPress={handleCreateNote}
        >
          <View style={[styles.speechBubble, isDarkMode && styles.speechBubbleDark]}>
            <Text style={[styles.speechBubbleText, isDarkMode && styles.speechBubbleTextDark]} numberOfLines={2}>
              Ghi chú của bạn
            </Text>
          </View>
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
          <Text style={[styles.username, isDarkMode && styles.usernameDark]} numberOfLines={1}>
            Ghi chú của bạn
          </Text>
        </TouchableOpacity>

        {/* Other users' notes */}
        {notes.map((noteUser) => {
          if (!noteUser.note) return null;
          const hasUnviewed = !noteUser.note.isViewed;
          return (
            <TouchableOpacity
              key={noteUser.userId}
              style={styles.noteItem}
              onPress={() => handleViewNote(noteUser)}
            >
              {/* Speech bubble above avatar */}
              <View style={[styles.speechBubble, isDarkMode && styles.speechBubbleDark]}>
                {noteUser.note.text ? (
                  <Text style={[styles.speechBubbleText, isDarkMode && styles.speechBubbleTextDark]} numberOfLines={2}>
                    {truncateText(noteUser.note.text, 10)}
                  </Text>
                ) : (
                  <Text style={[styles.speechBubbleText, isDarkMode && styles.speechBubbleTextDark]} numberOfLines={2}>
                    {' '}
                  </Text>
                )}
              </View>
              <View style={[
                styles.avatarContainer,
                hasUnviewed ? styles.avatarBorder : styles.avatarBorderViewed
              ]}>
                <Image
                  source={
                    (noteUser.userAvatar && noteUser.userAvatar.trim() !== '') 
                      ? { uri: noteUser.userAvatar }
                      : DEFAULT_AVATAR
                  }
                  style={styles.avatar}
                  defaultSource={DEFAULT_AVATAR}
                />
              </View>
              <Text style={[styles.username, isDarkMode && styles.usernameDark]} numberOfLines={1}>
                {noteUser.username}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Note Modal */}
      <NoteModal
        visible={modalVisible}
        note={selectedNote}
        isOwnNote={selectedNote && selectedNote.userId === user?.id}
        isDarkMode={isDarkMode}
        onClose={() => {
          setModalVisible(false);
          setSelectedNote(null);
        }}
        onEdit={() => {
          if (onCreateNote) {
            onCreateNote();
          }
        }}
        onDelete={handleDeleteNote}
        onDeleteSuccess={() => {
          loadNotes();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
    paddingVertical: 10,
  },
  containerDark: {
    borderBottomColor: '#333',
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  noteItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 70,
    position: 'relative',
  },
  speechBubble: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
    width: 70,
    minHeight: 35,
    maxHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  speechBubbleDark: {
    backgroundColor: '#2a2a2a',
  },
  speechBubbleText: {
    fontSize: 11,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '400',
  },
  speechBubbleTextDark: {
    color: '#fff',
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
    borderColor: '#E1306C',
  },
  avatarBorderViewed: {
    borderWidth: 2,
    borderColor: '#8e8e8e',
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
    marginTop: 2,
  },
  usernameDark: {
    color: '#fff',
  },
});

export default NotesSection;

