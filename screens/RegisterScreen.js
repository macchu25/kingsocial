import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Input from '../components/Input';
import Button from '../components/Button';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';
import { validateForm } from '../utils/validation';
import { handleApiError } from '../utils/errorHandler';

const { height } = Dimensions.get('window');

const RegisterScreen = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const slideAnim = useRef(new Animated.Value(height * 0.3)).current;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSwitchToLogin = () => {
    Animated.timing(slideAnim, {
      toValue: height * 0.3,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      onSwitchToLogin();
    });
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!validateForm(false, formData)) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(
        formData.username,
        formData.email,
        formData.password
      );

      if (response.success) {
        await storage.saveToken(response.token);
        await storage.saveUser(response.user);
        Alert.alert('Thành công', response.message);
        onRegisterSuccess(response.user);
        setFormData({ username: '', email: '', password: '' });
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Pink Header with Logo */}
        <View style={styles.headerContainer}>
          <Image
            source={require('../asset/lginse.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* White Form Container with Animation */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Sign up</Text>
              <View style={styles.titleUnderline} />
            </View>

          <Input
            label="Username"
            placeholder="enter your username"
            value={formData.username}
            onChangeText={(value) => handleInputChange('username', value)}
          />

          <Input
            label="Email"
            placeholder="demo@email.com"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
          />

          <Input
            label="Password"
            placeholder="enter your password"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry
          />

          <Input
            label="Confirm Password"
            placeholder="confirm your password"
            value={formData.confirmPassword || ''}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            secureTextEntry
          />

          <Button
            title="Sign up"
            onPress={handleSubmit}
            loading={loading}
          />

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                Already have an Account?{' '}
              </Text>
              <TouchableOpacity onPress={handleSwitchToLogin}>
                <Text style={styles.switchLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFB6C1',
  },
  headerContainer: {
    height: height * 0.35,
    backgroundColor: '#FFB6C1',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logo: {
    width: 220,
    height: 100,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
    paddingHorizontal: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  titleContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  titleUnderline: {
    width: 50,
    height: 3,
    backgroundColor: '#FFB6C1',
    marginTop: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    color: '#666',
    fontSize: 14,
  },
  switchLink: {
    color: '#FFB6C1',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;



