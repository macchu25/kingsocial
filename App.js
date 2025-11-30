import React, { useState, useEffect } from 'react';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import CreatePostScreen from './screens/CreatePostScreen';
import CreateStoryScreen from './screens/CreateStoryScreen';
import ViewStoryScreen from './screens/ViewStoryScreen';
import { storage } from './utils/storage';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [viewingUser, setViewingUser] = useState(null);
  const [viewingStory, setViewingStory] = useState(null);

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

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleSwitchToRegister = () => {
    setIsLogin(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    setCurrentScreen('profile');
  };

  const handleViewUserProfile = (userId, username, avatar) => {
    if (!userId) return;
    setViewingUser({ 
      id: userId.toString(), 
      username: username || 'User', 
      avatar: avatar || '' 
    });
    setCurrentScreen('userProfile');
  };

  const handleBackFromUserProfile = () => {
    setViewingUser(null);
    setCurrentScreen('home');
  };

  if (user) {
    if (currentScreen === 'viewStory' && viewingStory) {
      return (
        <ViewStoryScreen
          storyUser={viewingStory}
          currentUser={user}
          onClose={() => setCurrentScreen('home')}
          onStoryViewed={() => {
            // Refresh stories will be handled by StoriesSection
          }}
        />
      );
    }
    if (currentScreen === 'createStory') {
      return (
        <CreateStoryScreen
          user={user}
          onStoryCreated={() => {
            setCurrentScreen('home');
            // Refresh stories will be handled by StoriesSection
          }}
          onCancel={() => setCurrentScreen('home')}
        />
      );
    }
    if (currentScreen === 'createPost') {
      return (
        <CreatePostScreen
          user={user}
          onPostCreated={() => setCurrentScreen('home')}
          onCancel={() => setCurrentScreen('home')}
        />
      );
    }
    if (currentScreen === 'editProfile') {
      return (
        <EditProfileScreen
          user={user}
          onUpdate={handleUpdateUser}
          onCancel={() => setCurrentScreen('profile')}
        />
      );
    }
    if (currentScreen === 'userProfile' && viewingUser) {
      return (
        <ProfileScreen
          user={viewingUser}
          currentUser={user}
          onLogout={handleLogout}
          onNavigateToHome={handleBackFromUserProfile}
          onEditProfile={() => setCurrentScreen('editProfile')}
        />
      );
    }
    if (currentScreen === 'profile') {
      return (
        <ProfileScreen
          user={user}
          currentUser={user}
          onLogout={handleLogout}
          onNavigateToHome={() => setCurrentScreen('home')}
          onEditProfile={() => setCurrentScreen('editProfile')}
        />
      );
    }
    return (
      <HomeScreen
        user={user}
        onLogout={handleLogout}
        onNavigateToProfile={() => setCurrentScreen('profile')}
        onNavigateToCreatePost={() => setCurrentScreen('createPost')}
        onViewUserProfile={handleViewUserProfile}
        onCreateStory={() => setCurrentScreen('createStory')}
        onViewStory={(storyUser) => {
          setViewingStory(storyUser);
          setCurrentScreen('viewStory');
        }}
      />
    );
  }

  if (isLogin) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={handleSwitchToRegister}
      />
    );
  }

  return (
    <RegisterScreen
      onRegisterSuccess={handleRegisterSuccess}
      onSwitchToLogin={handleSwitchToLogin}
    />
  );
}
