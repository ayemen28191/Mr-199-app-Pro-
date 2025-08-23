/**
 * 🃏 Card Component - مطابق 100% لبطاقات الويب
 * تحويل دقيق من client/src/components/ui/card.tsx
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { designTokens } from '@mobile/tokens/design-tokens';
import { useTheme } from './hooks/useTheme';

export interface CardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'gradient-green' | 'gradient-red' | 'gradient-purple' | 'gradient-blue' | 'gradient-orange';
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  testID,
}) => {
  const { isDark } = useTheme();
  const colors = designTokens.colors[isDark ? 'dark' : 'light'];

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius: designTokens.borderRadius.xl, // 12px مثل الويب
      padding: designTokens.spacing[6], // 24px
      ...designTokens.shadows.md,
      borderWidth: 1,
      borderColor: colors.border,
    };

    // Gradient variants للمحمول
    const variantStyles: Record<string, ViewStyle> = {
      'gradient-green': {
        backgroundColor: '#d4fdd4',
        borderColor: '#10b981',
      },
      'gradient-red': {
        backgroundColor: '#fee2e2',
        borderColor: '#ef4444',
      },
      'gradient-purple': {
        backgroundColor: '#ede9fe',
        borderColor: '#8b5cf6',
      },
      'gradient-blue': {
        backgroundColor: '#dbeafe',
        borderColor: '#3b82f6',
      },
      'gradient-orange': {
        backgroundColor: '#fed7aa',
        borderColor: '#f97316',
      },
    };

    return {
      ...baseStyle,
      ...(variant !== 'default' ? variantStyles[variant] : {}),
    };
  };

  return (
    <View style={[getCardStyle(), style]} testID={testID}>
      {children}
    </View>
  );
};

export default Card;