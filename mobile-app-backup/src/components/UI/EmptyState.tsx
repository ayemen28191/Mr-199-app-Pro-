import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: any;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onActionPress,
  style
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
        {icon}
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      
      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      )}
      
      {actionLabel && onActionPress && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={onActionPress}
        >
          <Text style={styles.actionButtonText}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});