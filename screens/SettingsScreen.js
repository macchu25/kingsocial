import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = ({ user, isDarkMode, onToggleTheme, onClose, onLogout }) => {
  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Cài đặt</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Theme Section */}
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Giao diện</Text>
          
          <View style={[styles.settingItem, isDarkMode && styles.settingItemDark]}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name={isDarkMode ? "moon" : "sunny"} 
                size={24} 
                color={isDarkMode ? "#fff" : "#000"} 
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, isDarkMode && styles.settingTitleDark]}>
                  Chế độ tối
                </Text>
                <Text style={[styles.settingSubtitle, isDarkMode && styles.settingSubtitleDark]}>
                  Sử dụng giao diện tối để bảo vệ mắt
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={onToggleTheme}
              trackColor={{ false: '#767577', true: '#0095F6' }}
              thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Tài khoản</Text>
          
          <TouchableOpacity style={[styles.settingItem, isDarkMode && styles.settingItemDark]}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="person-outline" 
                size={24} 
                color={isDarkMode ? "#fff" : "#000"} 
                style={styles.settingIcon}
              />
              <Text style={[styles.settingTitle, isDarkMode && styles.settingTitleDark]}>
                Chỉnh sửa hồ sơ
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#999" : "#8e8e8e"} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, isDarkMode && styles.settingItemDark]}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="lock-closed-outline" 
                size={24} 
                color={isDarkMode ? "#fff" : "#000"} 
                style={styles.settingIcon}
              />
              <Text style={[styles.settingTitle, isDarkMode && styles.settingTitleDark]}>
                Đổi mật khẩu
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#999" : "#8e8e8e"} />
          </TouchableOpacity>
        </View>

        {/* Privacy Section */}
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Quyền riêng tư</Text>
          
          <TouchableOpacity style={[styles.settingItem, isDarkMode && styles.settingItemDark]}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="eye-outline" 
                size={24} 
                color={isDarkMode ? "#fff" : "#000"} 
                style={styles.settingIcon}
              />
              <Text style={[styles.settingTitle, isDarkMode && styles.settingTitleDark]}>
                Quyền riêng tư
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#999" : "#8e8e8e"} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, isDarkMode && styles.settingItemDark]}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="notifications-outline" 
                size={24} 
                color={isDarkMode ? "#fff" : "#000"} 
                style={styles.settingIcon}
              />
              <Text style={[styles.settingTitle, isDarkMode && styles.settingTitleDark]}>
                Thông báo
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#999" : "#8e8e8e"} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Về ứng dụng</Text>
          
          <TouchableOpacity style={[styles.settingItem, isDarkMode && styles.settingItemDark]}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="information-circle-outline" 
                size={24} 
                color={isDarkMode ? "#fff" : "#000"} 
                style={styles.settingIcon}
              />
              <Text style={[styles.settingTitle, isDarkMode && styles.settingTitleDark]}>
                Giới thiệu
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#999" : "#8e8e8e"} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, isDarkMode && styles.settingItemDark]}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="help-circle-outline" 
                size={24} 
                color={isDarkMode ? "#fff" : "#000"} 
                style={styles.settingIcon}
              />
              <Text style={[styles.settingTitle, isDarkMode && styles.settingTitleDark]}>
                Trợ giúp
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#999" : "#8e8e8e"} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, isDarkMode && styles.logoutButtonDark]}
          onPress={onLogout}
        >
          <Text style={[styles.logoutText, isDarkMode && styles.logoutTextDark]}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerTitleDark: {
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionDark: {
    // Same as section
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e8e',
    paddingHorizontal: 15,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  sectionTitleDark: {
    color: '#999',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  settingItemDark: {
    borderBottomColor: '#333',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  settingTitleDark: {
    color: '#fff',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#8e8e8e',
    marginTop: 2,
  },
  settingSubtitleDark: {
    color: '#999',
  },
  logoutButton: {
    marginTop: 30,
    marginHorizontal: 15,
    marginBottom: 30,
    paddingVertical: 15,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  logoutButtonDark: {
    backgroundColor: '#333',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3040',
  },
  logoutTextDark: {
    color: '#FF3040',
  },
});

export default SettingsScreen;

