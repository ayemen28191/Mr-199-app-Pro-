import React from 'react';
import { Alert } from 'react-native';

interface NavigationWrapperProps {
  children: React.ReactNode;
  navigation: any;
}

export default function NavigationWrapper({ children, navigation }: NavigationWrapperProps) {
  // تحسين التنقل مع معالجة الأخطاء
  const navigateSafely = (routeName: string, params?: any) => {
    try {
      navigation.navigate(routeName, params);
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(
        'خطأ في التنقل',
        'عذراً، لا يمكن الوصول للصفحة المطلوبة حالياً',
        [{ text: 'موافق', style: 'default' }]
      );
    }
  };

  // إضافة navigateSafely للـ navigation
  const enhancedNavigation = {
    ...navigation,
    navigateSafely,
  };

  return (
    <>
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child, { navigation: enhancedNavigation })
          : child
      )}
    </>
  );
}