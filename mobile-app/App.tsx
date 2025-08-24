import React from 'react';
import { I18nManager, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import { NavigationContainer } from '@react-navigation/native';

import { ThemeProvider } from './src/context/ThemeContext';
import { ProjectProvider } from './src/context/ProjectContext';
import MainNavigator from './src/navigation/MainNavigator';

// تفعيل RTL للغة العربية
if (Platform.OS !== 'web') {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function App() {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      </ProjectProvider>
    </ThemeProvider>
  );
}