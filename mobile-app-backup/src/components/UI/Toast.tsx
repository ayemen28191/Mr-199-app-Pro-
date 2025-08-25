import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  TouchableOpacity 
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import * as Icons from '../Icons';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onHide: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function Toast({ 
  message, 
  type = 'success', 
  duration = 3000, 
  onHide 
}: ToastProps) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // عرض Toast
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // إخفاء Toast بعد المدة المحددة
    const timer = setTimeout(() => {
      hideToast();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <Icons.CheckCircle size={20} color="#ffffff" />,
          backgroundColor: '#10b981',
        };
      case 'error':
        return {
          icon: <Icons.XCircle size={20} color="#ffffff" />,
          backgroundColor: '#ef4444',
        };
      case 'warning':
        return {
          icon: <Icons.AlertTriangle size={20} color="#ffffff" />,
          backgroundColor: '#f59e0b',
        };
      case 'info':
        return {
          icon: <Icons.AlertCircle size={20} color="#ffffff" />,
          backgroundColor: '#3b82f6',
        };
      default:
        return {
          icon: <Icons.CheckCircle size={20} color="#ffffff" />,
          backgroundColor: '#10b981',
        };
    }
  };

  const config = getConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity 
        style={styles.content}
        onPress={hideToast}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          {config.icon}
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Toast Manager Component
interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

class ToastManager {
  private toasts: ToastData[] = [];
  private listeners: ((toasts: ToastData[]) => void)[] = [];

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 3000) {
    const id = Date.now().toString();
    const toast = { id, message, type, duration };
    
    this.toasts = [...this.toasts, toast];
    this.notifyListeners();
    
    // إزالة Toast تلقائياً
    setTimeout(() => {
      this.remove(id);
    }, duration + 300);
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }

  subscribe(listener: (toasts: ToastData[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.toasts));
  }
}

export const toastManager = new ToastManager();

// Toast Container Component
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return (
    <View style={styles.toastContainer}>
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onHide={() => toastManager.remove(toast.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginLeft: 8,
  },
  message: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
});