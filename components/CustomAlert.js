import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

let alertRef = null;

export const showAlert = (title, message, buttons = [], options = {}) => {
  if (alertRef) {
    alertRef.show(title, message, buttons, options);
  }
};

export const hideAlert = () => {
  if (alertRef) {
    alertRef.hide();
  }
};

const CustomAlert = ({ isDarkMode = false }) => {
  const [visible, setVisible] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [buttons, setButtons] = React.useState([]);
  const [options, setOptions] = React.useState({});
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  React.useEffect(() => {
    alertRef = {
      show: (titleText, messageText, buttonsArray, optionsObj) => {
        setTitle(titleText || '');
        setMessage(messageText || '');
        setButtons(buttonsArray || [{ text: 'OK' }]);
        setOptions(optionsObj || {});
        setVisible(true);
      },
      hide: () => {
        setVisible(false);
      },
    };
  }, []);

  const handleButtonPress = (button) => {
    setVisible(false);
    // Delay callback để animation hoàn thành
    setTimeout(() => {
      if (button.onPress) {
        button.onPress();
      }
    }, 200);
  };

  const getIcon = () => {
    if (options.type === 'error') {
      return <Ionicons name="close-circle" size={48} color="#ff4444" />;
    } else if (options.type === 'success') {
      return <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />;
    } else if (options.type === 'warning') {
      return <Ionicons name="warning" size={48} color="#FF9800" />;
    } else if (options.type === 'info') {
      return <Ionicons name="information-circle" size={48} color="#2196F3" />;
    }
    return null;
  };

  const getTitleColor = () => {
    if (options.type === 'error') return '#ff4444';
    if (options.type === 'success') return '#4CAF50';
    if (options.type === 'warning') return '#FF9800';
    if (options.type === 'info') return '#2196F3';
    return isDarkMode ? '#fff' : '#000';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.overlayAnimated,
            {
              opacity: opacityAnim,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.alertContainer,
            isDarkMode && styles.alertContainerDark,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {getIcon() && (
            <View style={styles.iconContainer}>
              {getIcon()}
            </View>
          )}
          
          {title ? (
            <Text
              style={[
                styles.title,
                isDarkMode && styles.titleDark,
                { color: getTitleColor() },
              ]}
            >
              {title}
            </Text>
          ) : null}

          {message ? (
            <Text style={[styles.message, isDarkMode && styles.messageDark]}>
              {message}
            </Text>
          ) : null}

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              const isDestructive = button.style === 'destructive';
              const isLast = index === buttons.length - 1;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    buttons.length === 1 && styles.buttonSingle,
                    !isLast && styles.buttonMargin,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isDarkMode && styles.buttonTextDark,
                      isCancel && styles.buttonTextCancel,
                      isDestructive && styles.buttonTextDestructive,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  overlayAnimated: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContainer: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  alertContainerDark: {
    backgroundColor: '#1a1a1a',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  titleDark: {
    color: '#fff',
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  messageDark: {
    color: '#ccc',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#FFB6C1',
    minWidth: 80,
    alignItems: 'center',
  },
  buttonSingle: {
    width: '100%',
  },
  buttonMargin: {
    marginRight: 12,
  },
  buttonCancel: {
    backgroundColor: '#f0f0f0',
  },
  buttonDestructive: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonTextDark: {
    color: '#fff',
  },
  buttonTextCancel: {
    color: '#000',
  },
  buttonTextDestructive: {
    color: '#fff',
  },
});

export default CustomAlert;

