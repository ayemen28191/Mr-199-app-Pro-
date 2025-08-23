import React from 'react';
import { StyleSheet, I18nManager } from 'react-native';
import 'react-native-url-polyfill/auto';

import MainNavigator from './src/navigation/MainNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { ProjectProvider } from './src/context/ProjectContext';

// تفعيل RTL للغة العربية
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const queryClient = {
  // Simple client for now
};

export default function App() {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <MainNavigator />
      </ProjectProvider>
    </ThemeProvider>
  );
}