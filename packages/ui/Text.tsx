/**
 * 📝 Text Component - Typography موحد مع دعم RTL
 */

import React from 'react';
import { Text as RNText, TextStyle } from 'react-native';
import { designTokens } from '@mobile/tokens/design-tokens';
import { useTheme } from './hooks/useTheme';

export type TextVariant = 
  | 'h1' | 'h2' | 'h3' | 'h4' 
  | 'body' | 'caption' | 'overline';

export interface TextProps {
  variant?: TextVariant;
  color?: string;
  children?: React.ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
  testID?: string;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color,
  children,
  style,
  numberOfLines,
  testID,
}) => {
  const { colors } = useTheme();

  const getTextStyle = (): TextStyle => {
    const variantStyles: Record<TextVariant, TextStyle> = {
      h1: {
        fontSize: designTokens.typography.fontSizes['4xl'],
        fontWeight: designTokens.typography.fontWeights.bold,
        lineHeight: parseFloat(designTokens.typography.lineHeights.tight) * parseFloat(designTokens.typography.fontSizes['4xl']),
      },
      h2: {
        fontSize: designTokens.typography.fontSizes['3xl'],
        fontWeight: designTokens.typography.fontWeights.bold,
        lineHeight: parseFloat(designTokens.typography.lineHeights.tight) * parseFloat(designTokens.typography.fontSizes['3xl']),
      },
      h3: {
        fontSize: designTokens.typography.fontSizes['2xl'],
        fontWeight: designTokens.typography.fontWeights.semiBold,
        lineHeight: parseFloat(designTokens.typography.lineHeights.normal) * parseFloat(designTokens.typography.fontSizes['2xl']),
      },
      h4: {
        fontSize: designTokens.typography.fontSizes.xl,
        fontWeight: designTokens.typography.fontWeights.semiBold,
        lineHeight: parseFloat(designTokens.typography.lineHeights.normal) * parseFloat(designTokens.typography.fontSizes.xl),
      },
      body: {
        fontSize: designTokens.typography.fontSizes.base,
        fontWeight: designTokens.typography.fontWeights.normal,
        lineHeight: parseFloat(designTokens.typography.lineHeights.normal) * parseFloat(designTokens.typography.fontSizes.base),
      },
      caption: {
        fontSize: designTokens.typography.fontSizes.sm,
        fontWeight: designTokens.typography.fontWeights.normal,
        lineHeight: parseFloat(designTokens.typography.lineHeights.normal) * parseFloat(designTokens.typography.fontSizes.sm),
      },
      overline: {
        fontSize: designTokens.typography.fontSizes.xs,
        fontWeight: designTokens.typography.fontWeights.medium,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
    };

    return {
      fontFamily: designTokens.typography.fontFamily.primary,
      color: color || colors.foreground,
      textAlign: 'right', // RTL support
      writingDirection: 'rtl',
      ...variantStyles[variant],
    };
  };

  return (
    <RNText
      style={[getTextStyle(), style]}
      numberOfLines={numberOfLines}
      testID={testID}
    >
      {children}
    </RNText>
  );
};

export default Text;