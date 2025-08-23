import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  onPress: () => void;
}

export default function MoreScreen() {
  const { colors, toggleTheme, isDark } = useTheme();

  const menuItems: MenuItem[] = [
    {
      id: 'attendance',
      title: 'حضور العمال',
      icon: 'checkmark-circle',
      description: 'تسجيل حضور وغياب العمال',
      onPress: () => Alert.alert('قريباً', 'ستتوفر هذه الميزة قريباً'),
    },
    {
      id: 'expenses',
      title: 'المصاريف اليومية',
      icon: 'calculator',
      description: 'تسجيل المصاريف اليومية للمشاريع',
      onPress: () => Alert.alert('قريباً', 'ستتوفر هذه الميزة قريباً'),
    },
    {
      id: 'materials',
      title: 'شراء المواد',
      icon: 'cube',
      description: 'إدارة مشتريات مواد البناء',
      onPress: () => Alert.alert('قريباً', 'ستتوفر هذه الميزة قريباً'),
    },
    {
      id: 'equipment',
      title: 'إدارة المعدات',
      icon: 'construct',
      description: 'إدارة المعدات مع النقل والتتبع',
      onPress: () => Alert.alert('قريباً', 'ستتوفر هذه الميزة قريباً'),
    },
    {
      id: 'transfers',
      title: 'تحويلات العهدة',
      icon: 'swap-horizontal',
      description: 'إدارة تحويلات الأموال بين المشاريع',
      onPress: () => Alert.alert('قريباً', 'ستتوفر هذه الميزة قريباً'),
    },
    {
      id: 'reports',
      title: 'التقارير',
      icon: 'document-text',
      description: 'التقارير المالية والإحصائيات',
      onPress: () => Alert.alert('قريباً', 'ستتوفر هذه الميزة قريباً'),
    },
    {
      id: 'supplier-accounts',
      title: 'حسابات الموردين',
      icon: 'card',
      description: 'إدارة حسابات ودفعات الموردين',
      onPress: () => Alert.alert('قريباً', 'ستتوفر هذه الميزة قريباً'),
    },
    {
      id: 'worker-accounts',
      title: 'حسابات العمال',
      icon: 'wallet',
      description: 'إدارة حوالات وتحويلات العمال',
      onPress: () => Alert.alert('قريباً', 'ستتوفر هذه الميزة قريباً'),
    },
  ];

  const settingsItems = [
    {
      id: 'theme',
      title: 'تغيير المظهر',
      icon: isDark ? 'sunny' : 'moon',
      description: isDark ? 'المظهر الفاتح' : 'المظهر الداكن',
      onPress: toggleTheme,
    },
    {
      id: 'about',
      title: 'حول التطبيق',
      icon: 'information-circle',
      description: 'معلومات التطبيق والنسخة',
      onPress: () => Alert.alert('نظام إدارة المشاريع الإنشائية', 'النسخة 1.0.0\nتم تطويره خصيصاً لإدارة المشاريع الإنشائية باللغة العربية'),
    },
  ];

  const MenuItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={item.onPress}
    >
      <View style={styles.menuItemContent}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name={item.icon as any} size={24} color={colors.primary} />
        </View>
        <View style={styles.menuItemText}>
          <Text style={[styles.menuItemTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.menuItemDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
        </View>
        <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* عنوان الصفحة */}
      <Text style={[styles.title, { color: colors.text }]}>المزيد</Text>

      {/* الوظائف الإضافية */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>الوظائف</Text>
      {menuItems.map((item) => (
        <MenuItem key={item.id} item={item} />
      ))}

      {/* الإعدادات */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>الإعدادات</Text>
      {settingsItems.map((item) => (
        <MenuItem key={item.id} item={item} />
      ))}

      {/* معلومات إضافية */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>نظام إدارة المشاريع الإنشائية</Text>
        <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
          تطبيق شامل لإدارة المشاريع الإنشائية يوفر جميع الأدوات اللازمة لمتابعة المشاريع والعمال والمصاريف والتقارير.
          مصمم خصيصاً للشركات الإنشائية في الشرق الأوسط.
        </Text>
        <View style={styles.features}>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>• إدارة شاملة للمشاريع والعمال</Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>• تتبع دقيق للمصاريف والإيرادات</Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>• تقارير مالية مفصلة</Text>
          <Text style={[styles.featureItem, { color: colors.textSecondary }]}>• واجهة عربية متكاملة</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  menuItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  features: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  featureItem: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
  },
});