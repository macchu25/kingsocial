import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import CreatePostScreen from './screens/CreatePostScreen';
import CreateStoryScreen from './screens/CreateStoryScreen';
import ViewStoryScreen from './screens/ViewStoryScreen';
import PostDetailScreen from './screens/PostDetailScreen';
import SettingsScreen from './screens/SettingsScreen';
import MessagesScreen from './screens/MessagesScreen';
import CreateNoteScreen from './screens/CreateNoteScreen';
import EditPostScreen from './screens/EditPostScreen';
import ChatScreen from './screens/ChatScreen';
import SearchScreen from './screens/SearchScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import CustomAlert from './components/CustomAlert';
import { storage } from './utils/storage';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [viewingUser, setViewingUser] = useState(null);
  const [viewingStory, setViewingStory] = useState(null);
  const [viewingPost, setViewingPost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [previousScreen, setPreviousScreen] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await storage.getToken();
      const userData = await storage.getUser();
      if (token && userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Check auth error:', error);
    }
  };

  const handleLoginSuccess = useCallback((userData) => {
    setUser(userData);
    setCurrentScreen('home'); // Reset về màn hình home khi đăng nhập thành công
  }, []);

  const handleRegisterSuccess = useCallback((userData) => {
    setUser(userData);
    setCurrentScreen('home'); // Reset về màn hình home khi đăng ký thành công
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
  }, []);

  const handleUpdateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    setCurrentScreen('profile');
  }, []);

  const handleViewUserProfile = useCallback((userId, username, avatar) => {
    if (!userId) return;
    setViewingUser({ 
      id: userId.toString(), 
      username: username || 'User', 
      avatar: avatar || '' 
    });
    setCurrentScreen('userProfile');
  }, []);

  const handleBackFromUserProfile = useCallback(() => {
    setViewingUser(null);
    setCurrentScreen('home');
  }, []);

  const handleToggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  if (user) {
    if (currentScreen === 'createNote') {
      return (
        <>
          <CreateNoteScreen
          user={user}
          isDarkMode={isDarkMode}
          onNoteCreated={() => {
            setCurrentScreen('messages');
            // Trigger notes refresh
            setTimeout(() => {
              // NotesSection will refresh via refreshTrigger
            }, 100);
          }}
          onCancel={() => setCurrentScreen('messages')}
        />
        <CustomAlert isDarkMode={isDarkMode} />
      </>
      );
    }
    if (currentScreen === 'chat' && chatUser) {
      return (
        <>
          <ChatScreen
          chatUser={chatUser}
          currentUser={user}
          isDarkMode={isDarkMode}
          onClose={() => {
            setChatUser(null);
            setCurrentScreen('messages');
          }}
        />
        <CustomAlert isDarkMode={isDarkMode} />
      </>
      );
    }
    if (currentScreen === 'messages') {
      return (
        <>
          <MessagesScreen
          user={user}
          isDarkMode={isDarkMode}
          onClose={() => setCurrentScreen('home')}
          onCreateNote={() => setCurrentScreen('createNote')}
          onCreateStory={() => setCurrentScreen('createStory')}
          onViewStory={(storyUser) => {
            setViewingStory(storyUser);
            setCurrentScreen('viewStory');
          }}
          onOpenChat={(chatUser) => {
            setChatUser(chatUser);
            setCurrentScreen('chat');
          }}
        />
        <CustomAlert isDarkMode={isDarkMode} />
      </>
      );
    }
    if (currentScreen === 'changePassword') {
      return (
        <>
          <ChangePasswordScreen
          user={user}
          isDarkMode={isDarkMode}
          onClose={() => setCurrentScreen('settings')}
          onSuccess={() => {
            // Password changed successfully
            setCurrentScreen('settings');
          }}
        />
        <CustomAlert isDarkMode={isDarkMode} />
      </>
      );
    }
    if (currentScreen === 'settings') {
      return (
        <>
          <SettingsScreen
          user={user}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          onClose={() => setCurrentScreen('profile')}
          onLogout={handleLogout}
          onChangePassword={() => setCurrentScreen('changePassword')}
        />
        <CustomAlert isDarkMode={isDarkMode} />
      </>
      );
    }
    if (currentScreen === 'postDetail' && viewingPost) {
      return (
        <>
          <PostDetailScreen
          post={viewingPost}
          currentUser={user}
          isDarkMode={isDarkMode}
          onClose={() => {
            setViewingPost(null);
            setCurrentScreen(previousScreen);
          }}
          onViewProfile={handleViewUserProfile}
          onUpdate={() => {
            // Refresh posts will be handled by parent screens
          }}
          onEditPost={(post) => {
            setEditingPost(post);
            setPreviousScreen('postDetail');
            setCurrentScreen('editPost');
          }}
        />
        <CustomAlert isDarkMode={isDarkMode} />
      </>
      );
    }
    if (currentScreen === 'viewStory' && viewingStory) {
      return (
        <>
          <ViewStoryScreen
          storyUser={viewingStory}
          currentUser={user}
          onClose={() => setCurrentScreen('home')}
          onStoryViewed={() => {
            // Refresh stories will be handled by StoriesSection
          }}
        />
        <CustomAlert isDarkMode={isDarkMode} />
      </>
      );
    }
    if (currentScreen === 'createStory') {
      return (
        <>
          <CreateStoryScreen
          user={user}
          onStoryCreated={() => {
            setCurrentScreen('home');
            // Refresh stories will be handled by StoriesSection
          }}
          onCancel={() => setCurrentScreen('home')}
        />
        <CustomAlert isDarkMode={isDarkMode} />
      </>
      );
    }
    if (currentScreen === 'createPost') {
      return (
        <>
          <CreatePostScreen
          user={user}
          isDarkMode={isDarkMode}
          onPostCreated={() => setCurrentScreen('home')}
          onCancel={() => setCurrentScreen('home')}
          onNavigateToHome={() => setCurrentScreen('home')}
          onNavigateToProfile={() => setCurrentScreen('profile')}
          onNavigateToSearch={() => setCurrentScreen('search')}
        />
        <CustomAlert isDarkMode={isDarkMode} />
      </>
      );
    }
    if (currentScreen === 'editProfile') {
      return (
        <>
          <EditProfileScreen
          user={user}
          onUpdate={handleUpdateUser}
          onCancel={() => setCurrentScreen('profile')}
        />
        <CustomAlert isDarkMode={isDarkMode} />
      </>
      );
    }
    if (currentScreen === 'userProfile' && viewingUser) {
      return (
        <>
          <ProfileScreen
          user={viewingUser}
          currentUser={user}
          isDarkMode={isDarkMode}
          onLogout={handleLogout}
          onNavigateToHome={handleBackFromUserProfile}
          onEditProfile={() => setCurrentScreen('editProfile')}
          onViewPost={(post) => {
            setPreviousScreen('userProfile');
            setViewingPost(post);
            setCurrentScreen('postDetail');
          }}
        />
        <CustomAlert isDarkMode={isDarkMode} />
      </>
      );
    }
    if (currentScreen === 'profile') {
      return (
        <>
          <ProfileScreen
          user={user}
          currentUser={user}
          isDarkMode={isDarkMode}
          onLogout={handleLogout}
          onNavigateToHome={() => setCurrentScreen('home')}
          onEditProfile={() => setCurrentScreen('editProfile')}
          onNavigateToSettings={() => setCurrentScreen('settings')}
          onNavigateToSearch={() => setCurrentScreen('search')}
          onViewPost={(post) => {
            setPreviousScreen('profile');
            setViewingPost(post);
            setCurrentScreen('postDetail');
          }}
        />
        <CustomAlert isDarkMode={isDarkMode} />
      </>
      );
    }
    if (currentScreen === 'search') {
      return (
        <>
          <SearchScreen
          user={user}
          isDarkMode={isDarkMode}
          onClose={() => setCurrentScreen('home')}
          onViewUserProfile={handleViewUserProfile}
          onNavigateToHome={() => setCurrentScreen('home')}
          onNavigateToProfile={() => setCurrentScreen('profile')}
          onNavigateToCreatePost={() => setCurrentScreen('createPost')}
          onViewPost={(post) => {
            setPreviousScreen('search');
            setViewingPost(post);
            setCurrentScreen('postDetail');
          }}
        />
        <CustomAlert isDarkMode={isDarkMode} />
      </>
      );
    }
    return (
      <>
        <HomeScreen
          onEditPost={(post) => {
            setEditingPost(post);
            setPreviousScreen(currentScreen);
            setCurrentScreen('editPost');
          }}
          user={user}
          isDarkMode={isDarkMode}
          onLogout={handleLogout}
          onNavigateToProfile={() => setCurrentScreen('profile')}
          onNavigateToCreatePost={() => setCurrentScreen('createPost')}
          onNavigateToMessages={() => setCurrentScreen('messages')}
          onNavigateToSearch={() => setCurrentScreen('search')}
          onViewUserProfile={handleViewUserProfile}
          onCreateStory={() => setCurrentScreen('createStory')}
          onViewStory={(storyUser) => {
            setViewingStory(storyUser);
            setCurrentScreen('viewStory');
          }}
          onViewPost={(post) => {
            setPreviousScreen('home');
            setViewingPost(post);
            setCurrentScreen('postDetail');
          }}
        />
        <CustomAlert isDarkMode={isDarkMode} />
      </>
    );
  }

  if (showForgotPassword) {
    return (
      <>
        <ForgotPasswordScreen
          onClose={() => setShowForgotPassword(false)}
          onBackToLogin={() => setShowForgotPassword(false)}
        />
        <CustomAlert isDarkMode={isDarkMode} />
      </>
    );
  }

  return (
    <>
      <AuthScreen
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleRegisterSuccess}
        onForgotPassword={() => setShowForgotPassword(true)}
      />
      <CustomAlert isDarkMode={isDarkMode} />
    </>
  );
}
