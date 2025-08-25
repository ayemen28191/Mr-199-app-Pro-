import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface PullToRefreshProps {
  onRefresh: () => void;
  refreshing: boolean;
  children: React.ReactNode;
  style?: any;
  showsVerticalScrollIndicator?: boolean;
}

export default function PullToRefresh({
  onRefresh,
  refreshing,
  children,
  style,
  showsVerticalScrollIndicator = false
}: PullToRefreshProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={style}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]} // لـ Android
          tintColor={colors.primary} // لـ iOS
          title="اسحب للتحديث"
          titleColor={colors.textSecondary}
        />
      }
    >
      {children}
    </ScrollView>
  );
}