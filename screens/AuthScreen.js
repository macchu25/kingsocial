import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Input from '../components/Input';
import Button from '../components/Button';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';
import { validateForm } from '../utils/validation';
import { handleApiError } from '../utils/errorHandler';
import { alertSuccess } from '../utils/alert';

const { height } = Dimensions.get('window');

const AuthScreen = ({ onLoginSuccess, onRegisterSuccess, onForgotPassword }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loginFormData, setLoginFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [registerFormData, setRegisterFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const slideAnim = useRef(new Animated.Value(height * 0.25)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: height * 0.25,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleLoginInputChange = (field, value) => {
    setLoginFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRegisterInputChange = (field, value) => {
    setRegisterFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSwitchToRegister = () => {
    setIsLogin(false);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
    Animated.timing(slideAnim, {
      toValue: height * 0.25,
      duration: 500,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  };

  const handleLoginSubmit = async () => {
    if (loading) return;

    if (!validateForm(true, loginFormData)) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(loginFormData.email, loginFormData.password);

      if (response.success) {
        await storage.saveToken(response.token);
        await storage.saveUser(response.user);
        alertSuccess('Thành công', response.message);
        onLoginSuccess(response.user);
        setLoginFormData({ email: '', password: '', rememberMe: false });
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (loading) return;

    if (!validateForm(false, registerFormData)) {
      return;
    }

    if (registerFormData.password !== registerFormData.confirmPassword) {
      alertError('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(
        registerFormData.username,
        registerFormData.email,
        registerFormData.password
      );

      if (response.success) {
        await storage.saveToken(response.token);
        await storage.saveUser(response.user);
        alertSuccess('Thành công', response.message);
        onRegisterSuccess(response.user);
        setRegisterFormData({ username: '', email: '', password: '', confirmPassword: '' });
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
              top: slideAnim,
            },
          ]}
        >
          <View style={styles.formContent}>
            {isLogin ? (
              <>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Sign in</Text>
                  <View style={styles.titleUnderline} />
                </View>

                <Input
                  label="Email"
                  placeholder="demo@email.com"
                  value={loginFormData.email}
                  onChangeText={(value) => handleLoginInputChange('email', value)}
                  keyboardType="email-address"
                />

                <Input
                  label="Password"
                  placeholder="enter your password"
                  value={loginFormData.password}
                  onChangeText={(value) => handleLoginInputChange('password', value)}
                  secureTextEntry
                />

                <View style={styles.optionsContainer}>
                  <View style={styles.rememberMeContainer}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => handleLoginInputChange('rememberMe', !loginFormData.rememberMe)}
                    >
                      {loginFormData.rememberMe && <View style={styles.checkboxInner} />}
                    </TouchableOpacity>
                    <Text style={styles.rememberMeText}>Remember Me</Text>
                  </View>
                  <TouchableOpacity onPress={onForgotPassword}>
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                <Button
                  title="Login"
                  onPress={handleLoginSubmit}
                  loading={loading}
                />

                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>
                    Don't have an Account?{' '}
                  </Text>
                  <TouchableOpacity onPress={handleSwitchToRegister}>
                    <Text style={styles.switchLink}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Sign up</Text>
                  <View style={styles.titleUnderline} />
                </View>

                <Input
                  label="Username"
                  placeholder="enter your username"
                  value={registerFormData.username}
                  onChangeText={(value) => handleRegisterInputChange('username', value)}
                />

                <Input
                  label="Email"
                  placeholder="demo@email.com"
                  value={registerFormData.email}
                  onChangeText={(value) => handleRegisterInputChange('email', value)}
                  keyboardType="email-address"
                />

                <Input
                  label="Password"
                  placeholder="enter your password"
                  value={registerFormData.password}
                  onChangeText={(value) => handleRegisterInputChange('password', value)}
                  secureTextEntry
                />

                <Input
                  label="Confirm Password"
                  placeholder="confirm your password"
                  value={registerFormData.confirmPassword}
                  onChangeText={(value) => handleRegisterInputChange('confirmPassword', value)}
                  secureTextEntry
                />

                <Button
                  title="Sign up"
                  onPress={handleRegisterSubmit}
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
              </>
            )}
          </View>
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
    height: height * 0.25,
    backgroundColor: '#FFB6C1',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  logo: {
    
    width: 400,
    height: 400,
  },
  formContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 25,
    paddingHorizontal: 25,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  formContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFB6C1',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFB6C1',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#000',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#FFB6C1',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
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

export default AuthScreen;

