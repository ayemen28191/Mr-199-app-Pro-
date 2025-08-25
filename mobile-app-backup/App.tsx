import React, { useEffect } from 'react';
import { I18nManager, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import { NavigationContainer } from '@react-navigation/native';
import Constants from 'expo-constants';

import { ThemeProvider } from './src/context/ThemeContext';
import { ProjectProvider } from './src/context/ProjectContext';
import MainNavigator from './src/navigation/MainNavigator';
import { Analytics } from './src/utils/analytics';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ToastContainer } from './src/components/UI/Toast';
import AppStatusBar from './src/components/AppStatusBar';

// تفعيل RTL للغة العربية
if (Platform.OS !== 'web') {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

// تهيئة LogRocket (فقط في التطبيق المبني، ليس في Expo Go)
const initializeLogRocket = () => {
  if (Constants.appOwnership !== 'expo') {
    try {
      const LogRocket = require('@logrocket/react-native');
      const Updates = require('expo-updates');
      
      LogRocket.init('mfxetx/binarjoinanalytic', {
        updateId: Updates.isEmbeddedLaunch ? null : Updates.updateId,
        expoChannel: Updates.channel,
      });
      
      // تسجيل بدء تشغيل التطبيق
      Analytics.startSession('app_launch', {
        platform: Platform.OS,
        version: Constants.expoConfig?.version || '1.0.0',
        updateId: Updates.updateId,
        channel: Updates.channel
      });
      
      console.log('✅ تم تفعيل LogRocket بنجاح');
    } catch (error) {
      console.warn('⚠️ فشل في تهيئة LogRocket:', error);
      Analytics.logError(error as Error, { context: 'LogRocket initialization' });
    }
  } else {
    console.log('ℹ️ LogRocket معطل في Expo Go');
  }
};

export default function App() {
  useEffect(() => {
    initializeLogRocket();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ProjectProvider>
          <AppStatusBar />
          <NavigationContainer>
            <MainNavigator />
            <ToastContainer />
          </NavigationContainer>
        </ProjectProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}