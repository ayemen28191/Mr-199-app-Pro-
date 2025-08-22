import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// استيراد الشاشات
import ProjectsScreen from './screens/ProjectsScreen';
import WorkersScreen from './screens/WorkersScreen';
import EquipmentScreen from './screens/EquipmentScreen';
import ReportsScreen from './screens/ReportsScreen';
import TabNavigation from './components/TabNavigation';

// شاشة Dashboard الرئيسية
const Dashboard = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>نظام إدارة المشاريع والمعدات</Text>
        <Text style={styles.headerSubtitle}>مرحباً بك في النظام الشامل لإدارة مشاريع البناء</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🏗️</Text>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>المشاريع النشطة</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>👷</Text>
          <Text style={styles.statNumber}>24</Text>
          <Text style={styles.statLabel}>العمال</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔧</Text>
          <Text style={styles.statNumber}>156</Text>
          <Text style={styles.statLabel}>الأدوات</Text>
        </View>
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>الإجراءات السريعة</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#eff6ff' }]} 
            onPress={() => Alert.alert('تسجيل حضور', 'سيتم فتح صفحة تسجيل الحضور')}
          >
            <Text style={styles.actionIcon}>✅</Text>
            <Text style={styles.actionTitle}>تسجيل حضور</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#f0fdf4' }]} 
            onPress={() => Alert.alert('إضافة مصروف', 'سيتم فتح نموذج إضافة مصروف')}
          >
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionTitle}>إضافة مصروف</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#fefce8' }]} 
            onPress={() => Alert.alert('نقل معدة', 'سيتم فتح نموذج نقل المعدات')}
          >
            <Text style={styles.actionIcon}>🚚</Text>
            <Text style={styles.actionTitle}>نقل معدة</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#fdf2f8' }]} 
            onPress={() => Alert.alert('تقرير سريع', 'سيتم إنشاء تقرير سريع')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>تقرير سريع</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.recentActivityContainer}>
        <Text style={styles.sectionTitle}>النشاط الأخير</Text>
        
        <View style={styles.activityItem}>
          <Text style={styles.activityIcon}>👷</Text>
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>تم تسجيل حضور أحمد محمد علي</Text>
            <Text style={styles.activityTime}>منذ 30 دقيقة</Text>
          </View>
        </View>

        <View style={styles.activityItem}>
          <Text style={styles.activityIcon}>💰</Text>
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>تم إضافة مصروف: مواد بناء - 2,500 ر.س</Text>
            <Text style={styles.activityTime}>منذ ساعة</Text>
          </View>
        </View>

        <View style={styles.activityItem}>
          <Text style={styles.activityIcon}>🔧</Text>
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>تم نقل حفارة كاتربيلار إلى مشروع إبار التحيتا</Text>
            <Text style={styles.activityTime}>منذ 3 ساعات</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return <ProjectsScreen />;
      case 'workers':
        return <WorkersScreen />;
      case 'equipment':
        return <EquipmentScreen />;
      case 'reports':
        return <ReportsScreen />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar style="light" backgroundColor="#2563eb" />
      
      <View style={styles.contentContainer}>
        {renderScreen()}
      </View>
      
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 25,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statCard: {
    alignItems: 'center',
    padding: 15,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  quickActionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
    textAlign: 'right',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionCard: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  recentActivityContainer: {
    padding: 20,
    paddingBottom: 100, // مساحة إضافية للـ Tab Navigation
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#1f2937',
    textAlign: 'right',
    marginBottom: 5,
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
});