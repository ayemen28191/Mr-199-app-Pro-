import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, I18nManager, Platform } from 'react-native';

// تفعيل RTL للغة العربية
if (Platform.OS !== 'web') {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>نظام إدارة المشاريع الإنشائية</Text>
        <Text style={styles.subtitle}>تطبيق إدارة المشاريع للأندرويد</Text>
        <Text style={styles.version}>الإصدار 1.0.0</Text>
        <Text style={styles.description}>
          تطبيق شامل لإدارة المشاريع الإنشائية{'\n'}
          • إدارة العمال والمرتبات{'\n'}
          • تتبع المصاريف اليومية{'\n'}
          • إدارة الموردين والمدفوعات{'\n'}
          • تقارير مالية شاملة
        </Text>
        <StatusBar style="light" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2563eb',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 18,
    color: '#93c5fd',
    textAlign: 'center',
    marginBottom: 20,
    writingDirection: 'rtl',
  },
  version: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'center',
    marginBottom: 30,
    writingDirection: 'rtl',
  },
  description: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    writingDirection: 'rtl',
  },
});