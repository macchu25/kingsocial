import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Text,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const BottomNavigation = ({ user, activeTab = 'home', onTabChange }) => {
  const tabs = [
    { 
      id: 'home', 
      icon: (active) => active ? 'home' : 'home-outline',
      iconType: 'Ionicons'
    },
    { 
      id: 'search', 
      icon: (active) => active ? 'search' : 'search-outline',
      iconType: 'Ionicons'
    },
    { 
      id: 'add', 
      icon: () => 'add-circle-outline',
      iconType: 'Ionicons'
    },
    { 
      id: 'reels', 
      icon: (active) => active ? 'play-circle' : 'play-circle-outline',
      iconType: 'Ionicons'
    },
    { 
      id: 'profile', 
      icon: null,
      iconType: null
    },
  ];

  const handleTabPress = (tabId) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tab}
          onPress={() => handleTabPress(tab.id)}
        >
          {tab.id === 'profile' ? (
            <View style={styles.profileContainer}>
              <Image
                source={{
                  uri: user?.avatar || 'https://via.placeholder.com/28/cccccc/ffffff?text=U'
                }}
                style={[
                  styles.profileAvatar,
                  activeTab === 'profile' && styles.profileAvatarActive
                ]}
                defaultSource={{ uri: 'https://via.placeholder.com/28/cccccc/ffffff?text=U' }}
              />
              {activeTab === 'profile' && (
                <View style={styles.activeDot} />
              )}
            </View>
          ) : (
            <>
              {tab.iconType === 'Ionicons' ? (
                <Ionicons 
                  name={tab.icon(activeTab === tab.id)} 
                  size={24} 
                  color={activeTab === tab.id ? '#000' : '#8e8e8e'} 
                />
              ) : (
                <MaterialIcons 
                  name={tab.icon(activeTab === tab.id)} 
                  size={24} 
                  color={activeTab === tab.id ? '#000' : '#8e8e8e'} 
                />
              )}
              {activeTab === tab.id && <View style={styles.activeDot} />}
            </>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
    backgroundColor: '#fff',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  icon: {
    fontSize: 24,
  },
  profileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: '#f0f0f0',
  },
  profileAvatarActive: {
    borderColor: '#000',
    borderWidth: 1.5,
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000',
  },
});

export default BottomNavigation;

