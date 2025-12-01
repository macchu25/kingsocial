import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { alertSuccess } from '../utils/alert';

const { height } = Dimensions.get('window');

const LoginScreen = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!validateForm(true, formData)) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);

      if (response.success) {
        await storage.saveToken(response.token);
        await storage.saveUser(response.user);
        alertSuccess('Thành công', response.message);
        onLoginSuccess(response.user);
        setFormData({ email: '', password: '' });
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSwitchToRegister = () => {
    Animated.timing(slideAnim, {
      toValue: -height * 0.3,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      onSwitchToRegister();
    });
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
              <Text style={styles.title}>Sign in</Text>
              <View style={styles.titleUnderline} />
            </View>

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

          <View style={styles.optionsContainer}>
            <View style={styles.rememberMeContainer}>
              <View style={styles.checkbox}>
                {formData.rememberMe && <View style={styles.checkboxInner} />}
              </View>
              <TouchableOpacity onPress={() => handleInputChange('rememberMe', !formData.rememberMe)}>
                <Text style={styles.rememberMeText}>Remember Me</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Login"
            onPress={handleSubmit}
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
});

export default LoginScreen;

