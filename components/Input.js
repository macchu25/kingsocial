import React, { useState } from 'react';
import { TextInput, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Input = ({ 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  label,
  icon,
  isDarkMode = false,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = secureTextEntry || placeholder?.toLowerCase().includes('password') || placeholder?.toLowerCase().includes('mật khẩu') || placeholder?.toLowerCase().includes('confirm password');

  const getIconName = () => {
    if (icon) return icon;
    if (placeholder?.toLowerCase().includes('email')) return 'mail-outline';
    if (placeholder?.toLowerCase().includes('password') || placeholder?.toLowerCase().includes('mật khẩu')) return 'lock-closed-outline';
    if (placeholder?.toLowerCase().includes('username') || placeholder?.toLowerCase().includes('tên đăng nhập')) return 'person-outline';
    return 'information-circle-outline';
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, isDarkMode && styles.labelDark]}>{label}</Text>}
      <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
        <Ionicons 
          name={getIconName()} 
          size={20} 
          color={isDarkMode ? "#999" : "#999"} 
          style={styles.icon}
        />
        <TextInput
          style={[styles.input, isDarkMode && styles.inputDark]}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? "#666" : "#999"}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPasswordField && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          {...props}
        />
        {isPasswordField && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.eyeIcon}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={isDarkMode ? "#999" : "#999"}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  labelDark: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
  },
  inputContainerDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#000',
  },
  inputDark: {
    color: '#fff',
  },
  eyeIcon: {
    padding: 5,
    marginLeft: 5,
  },
});

export default Input;



