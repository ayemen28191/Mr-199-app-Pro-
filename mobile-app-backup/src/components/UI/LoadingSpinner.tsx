import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface LoadingSpinnerProps {
  visible: boolean;
  text?: string;
  overlay?: boolean;
  size?: 'small' | 'large';
}

export default function LoadingSpinner({ 
  visible, 
  text = 'جاري التحميل...', 
  overlay = false,
  size = 'large' 
}: LoadingSpinnerProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  const LoadingContent = (
    <View style={[
      styles.container,
      { backgroundColor: overlay ? colors.background : 'transparent' }
    ]}>
      <View style={[styles.loadingBox, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size={size} color={colors.primary} />
        {text && (
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {text}
          </Text>
        )}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        {LoadingContent}
      </Modal>
    );
  }

  return LoadingContent;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingBox: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});