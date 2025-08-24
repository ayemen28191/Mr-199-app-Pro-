import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import * as Icons from '../components/Icons';

const { width } = Dimensions.get('window');

interface MoreOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

export default function MoreScreen({ navigation }: any) {
  const { colors } = useTheme();

  const menuOptions: MoreOption[] = [
    // العمليات اليومية
    {
      id: 'worker-attendance',
      title: 'حضور العمال',
      description: 'تسجيل حضور وغياب العمال',
      icon: <Icons.UserCheck size={24} color="#ffffff" />,
      route: 'WorkerAttendance',
      color: '#10B981', // أخضر
    },
    {
      id: 'worker-accounts',
      title: 'حسابات العمال',
      description: 'إدارة حوالات وتحويلات العمال',
      icon: <Icons.DollarSign size={24} color="#ffffff" />,
      route: 'WorkerAccounts',
      color: '#F59E0B', // ذهبي
    },
    {
      id: 'daily-expenses',
      title: 'المصاريف اليومية',
      description: 'تسجيل المصاريف اليومية للمشاريع',
      icon: <Icons.Calculator size={24} color="#ffffff" />,
      route: 'DailyExpenses',
      color: '#EF4444', // أحمر
    },
    {
      id: 'material-purchase',
      title: 'شراء المواد',
      description: 'إدارة مشتريات مواد البناء',
      icon: <Icons.Package size={24} color="#ffffff" />,
      route: 'MaterialPurchase',
      color: '#8B5CF6', // بنفسجي
    },
    {
      id: 'equipment',
      title: 'إدارة المعدات',
      description: 'إدارة المعدات مع النقل والتتبع',
      icon: <Icons.Settings size={24} color="#ffffff" />,
      route: 'Equipment',
      color: '#06B6D4', // سماوي
    },
    {
      id: 'project-transfers',
      title: 'تحويلات العهدة',
      description: 'إدارة تحويلات الأموال بين المشاريع',
      icon: <Icons.ArrowLeftRight size={24} color="#ffffff" />,
      route: 'ProjectTransfers',
      color: '#F97316', // برتقالي
    },
    {
      id: 'project-transactions',
      title: 'سجل العمليات',
      description: 'عرض شامل لجميع المعاملات المالية',
      icon: <Icons.FileText size={24} color="#ffffff" />,
      route: 'ProjectTransactions',
      color: '#EC4899', // وردي
    },
    // إدارة الموردين
    {
      id: 'supplier-accounts',
      title: 'حسابات الموردين',
      description: 'إدارة حسابات ودفعات الموردين',
      icon: <Icons.CreditCard size={24} color="#ffffff" />,
      route: 'SupplierAccounts',
      color: '#6366F1', // نيلي
    },
    // التقارير والإحصائيات
    {
      id: 'reports',
      title: 'التقارير الأساسية',
      description: 'التقارير المالية الأساسية',
      icon: <Icons.FileSpreadsheet size={24} color="#ffffff" />,
      route: 'Reports',
      color: '#059669', // أخضر داكن
    },
    {
      id: 'advanced-reports',
      title: 'التقارير المتقدمة',
      description: 'تقارير مفصلة ومخصصة',
      icon: <Icons.TrendingUp size={24} color="#ffffff" />,
      route: 'AdvancedReports',
      color: '#DC2626', // أحمر داكن
    },
    // الإعدادات والإدارة
    {
      id: 'autocomplete-admin',
      title: 'إعدادات الإكمال التلقائي',
      description: 'إدارة بيانات الإكمال التلقائي',
      icon: <Icons.Settings size={24} color="#ffffff" />,
      route: 'AutocompleteAdmin',
      color: '#7C3AED', // بنفسجي داكن
    },
  ];

  const handleOptionPress = (route: string) => {
    // التنقل للشاشة المحددة
    navigation.navigate(route);
  };

  const renderOption = (option: MoreOption, index: number) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.optionCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={() => handleOptionPress(option.route)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
        {option.icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>
          {option.title}
        </Text>
        <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
          {option.description}
        </Text>
      </View>
      <View style={styles.arrowContainer}>
        <Icons.ChevronLeft size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>المزيد من الخدمات</Text>
        <Text style={styles.headerSubtitle}>اختر الخدمة التي تريد الوصول إليها</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.optionsContainer}>
          {/* العمليات اليومية */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              العمليات اليومية
            </Text>
            {menuOptions.slice(0, 7).map((option, index) => renderOption(option, index))}
          </View>

          {/* إدارة الموردين */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              إدارة الموردين
            </Text>
            {menuOptions.slice(7, 8).map((option, index) => renderOption(option, index + 7))}
          </View>

          {/* التقارير والإحصائيات */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              التقارير والإحصائيات
            </Text>
            {menuOptions.slice(8, 10).map((option, index) => renderOption(option, index + 8))}
          </View>

          {/* الإعدادات والإدارة */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              الإعدادات والإدارة
            </Text>
            {menuOptions.slice(10).map((option, index) => renderOption(option, index + 10))}
          </View>
        </View>

        {/* مساحة إضافية للشريط السفلي */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  optionsContainer: {
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginRight: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'right',
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
  },
  arrowContainer: {
    marginRight: 8,
  },
});