/**
 * 🔘 Button Component - مطابق 100% لسلوك شادكن
 * تحويل دقيق من client/src/components/ui/button.tsx
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { designTokens } from '@mobile/tokens/design-tokens';
import { useTheme } from './hooks/useTheme';

// Button Variants - نفس متغيرات شاهدكن
export type ButtonVariant = 
  | 'default' 
  | 'destructive' 
  | 'outline' 
  | 'secondary' 
  | 'ghost' 
  | 'link';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  children,
  onPress,
  style,
  textStyle,
  testID,
}) => {
  const { theme, isDark } = useTheme();
  const colors = designTokens.colors[isDark ? 'dark' : 'light'];

  // Button Styles - مطابقة للويب
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: designTokens.borderRadius.md,
      ...designTokens.sizes.button[size],
      ...designTokens.shadows.sm,
    };

    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      default: {
        backgroundColor: colors.primary,
      },
      destructive: {
        backgroundColor: colors.destructive,
      },
      outline: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
      },
      secondary: {
        backgroundColor: colors.secondary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      link: {
        backgroundColor: 'transparent',
        ...designTokens.shadows.sm, // إزالة الظل
        shadowOpacity: 0,
        elevation: 0,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      opacity: disabled ? 0.5 : 1,
    };
  };

  // Text Styles - مطابقة للويب
  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: designTokens.typography.fontSizes.sm,
      fontWeight: designTokens.typography.fontWeights.medium,
      fontFamily: designTokens.typography.fontFamily.primary,
    };

    const variantTextStyles: Record<ButtonVariant, TextStyle> = {
      default: {
        color: colors.primaryForeground,
      },
      destructive: {
        color: colors.destructiveForeground,
      },
      outline: {
        color: colors.foreground,
      },
      secondary: {
        color: colors.secondaryForeground,
      },
      ghost: {
        color: colors.foreground,
      },
      link: {
        color: colors.primary,
        textDecorationLine: 'underline',
      },
    };

    return {
      ...baseStyle,
      ...variantTextStyles[variant],
    };
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      testID={testID}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'default' 
              ? colors.primaryForeground
              : colors.foreground
          }
        />
      ) : (
        <>
          {typeof children === 'string' ? (
            <Text style={[getTextStyle(), textStyle]}>{children}</Text>
          ) : (
            children
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

// Export default
export default Button;