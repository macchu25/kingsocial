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
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <Ionicons 
          name={getIconName()} 
          size={20} 
          color="#999" 
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
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
              color="#999"
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
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
  eyeIcon: {
    padding: 5,
    marginLeft: 5,
  },
});

export default Input;



