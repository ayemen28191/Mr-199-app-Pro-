import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';

export default function AppStatusBar() {
  const { isDark } = useTheme();
  
  return (
    <StatusBar
      style={isDark ? 'light' : 'dark'}
      backgroundColor="transparent"
      translucent
    />
  );
}