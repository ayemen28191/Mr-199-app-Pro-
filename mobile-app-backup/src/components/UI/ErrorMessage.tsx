import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import * as Icons from '../Icons';

interface ErrorMessageProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  onRetry?: () => void;
  type?: 'error' | 'warning' | 'info';
}

export default function ErrorMessage({ 
  visible,
  title,
  message,
  onClose,
  onRetry,
  type = 'error'
}: ErrorMessageProps) {
  const { colors } = useTheme();

  const getConfig = () => {
    switch (type) {
      case 'warning':
        return {
          icon: <Icons.AlertTriangle size={24} color="#f59e0b" />,
          iconBg: '#fef3c7',
          borderColor: '#f59e0b',
          title: title || 'تحذير'
        };
      case 'info':
        return {
          icon: <Icons.AlertCircle size={24} color="#3b82f6" />,
          iconBg: '#dbeafe',
          borderColor: '#3b82f6',
          title: title || 'معلومة'
        };
      default:
        return {
          icon: <Icons.XCircle size={24} color="#ef4444" />,
          iconBg: '#fecaca',
          borderColor: '#ef4444',
          title: title || 'خطأ'
        };
    }
  };

  const config = getConfig();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
            {config.icon}
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>
            {config.title}
          </Text>
          
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>
          
          <View style={styles.buttonContainer}>
            {onRetry && (
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={onRetry}
              >
                <Icons.RefreshCw size={16} color="#ffffff" />
                <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.closeButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>
                إغلاق
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});