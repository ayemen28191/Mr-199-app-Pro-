import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { I18nManager } from 'react-native';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import WorkersScreen from '../screens/WorkersScreen';
import SuppliersProfessionalScreen from '../screens/SuppliersProfessionalScreen';
import MoreScreen from '../screens/MoreScreen';

// Import sub-screens from More menu
import WorkerAttendanceScreen from '../screens/WorkerAttendanceScreen';
import WorkerAccountsScreen from '../screens/WorkerAccountsScreen';
import DailyExpensesScreen from '../screens/DailyExpensesScreen';
import MaterialPurchaseScreen from '../screens/MaterialPurchaseScreen';
import EquipmentManagementScreen from '../screens/EquipmentManagementScreen';
import ProjectTransfers from '../screens/ProjectTransfers';
import ProjectTransactionsPage from '../screens/ProjectTransactionsPage';
import SupplierAccountsScreen from '../screens/SupplierAccountsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AdvancedReportsScreen from '../screens/AdvancedReportsScreen';
import AutocompleteAdminScreen from '../screens/AutocompleteAdminScreen';

// توحيد الأيقونات مع تطبيق الويب
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// تحديد الألوان العربية
const TabNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 65,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTitleAlign: 'center',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          title: 'المشاريع',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Workers"
        component={WorkersScreen}
        options={{
          title: 'العمال',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Suppliers"
        component={SuppliersProfessionalScreen}
        options={{
          title: 'الموردين',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          title: 'المزيد',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      
      {/* Sub-screens from More menu */}
      <Stack.Screen 
        name="WorkerAttendance" 
        component={WorkerAttendanceScreen}
        options={{ headerShown: true, title: 'حضور العمال' }} 
      />
      <Stack.Screen 
        name="WorkerAccounts" 
        component={WorkerAccountsScreen}
        options={{ headerShown: true, title: 'حسابات العمال' }} 
      />
      <Stack.Screen 
        name="DailyExpenses" 
        component={DailyExpensesScreen}
        options={{ headerShown: true, title: 'المصاريف اليومية' }} 
      />
      <Stack.Screen 
        name="MaterialPurchase" 
        component={MaterialPurchaseScreen}
        options={{ headerShown: true, title: 'شراء المواد' }} 
      />
      <Stack.Screen 
        name="Equipment" 
        component={EquipmentManagementScreen}
        options={{ headerShown: true, title: 'إدارة المعدات' }} 
      />
      <Stack.Screen 
        name="ProjectTransfers" 
        component={ProjectTransfers}
        options={{ headerShown: true, title: 'تحويلات العهدة' }} 
      />
      <Stack.Screen 
        name="ProjectTransactions" 
        component={ProjectTransactionsPage}
        options={{ headerShown: true, title: 'سجل العمليات' }} 
      />
      <Stack.Screen 
        name="SupplierAccounts" 
        component={SupplierAccountsScreen}
        options={{ headerShown: true, title: 'حسابات الموردين' }} 
      />
      <Stack.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ headerShown: true, title: 'التقارير الأساسية' }} 
      />
      <Stack.Screen 
        name="AdvancedReports" 
        component={AdvancedReportsScreen}
        options={{ headerShown: true, title: 'التقارير المتقدمة' }} 
      />
      <Stack.Screen 
        name="AutocompleteAdmin" 
        component={AutocompleteAdminScreen}
        options={{ headerShown: true, title: 'إعدادات الإكمال التلقائي' }} 
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;