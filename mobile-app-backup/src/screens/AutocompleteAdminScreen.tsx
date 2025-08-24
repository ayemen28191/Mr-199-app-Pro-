import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../services/supabaseClient';

const { width } = Dimensions.get('window');

interface AutocompleteStats {
  totalRecords: number;
  categoriesCount: number;
  categoryBreakdown: { category: string; count: number; avgUsage: number }[];
  oldRecordsCount: number;
}

interface MaintenanceResult {
  cleanupResult: { deletedCount: number; categories: string[] };
  limitResult: { trimmedCategories: string[]; deletedCount: number };
  totalProcessed: number;
}

const AutocompleteAdminScreen: React.FC = () => {
  const [stats, setStats] = useState<AutocompleteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'maintenance'>('overview');
  const [isMaintenanceRunning, setIsMaintenanceRunning] = useState(false);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // جلب الإحصائيات من API
      const { data, error } = await supabase.functions.invoke('autocomplete-admin-stats');
      
      if (error) throw error;
      
      setStats(data);
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
      Alert.alert('خطأ', 'فشل في تحميل إحصائيات نظام الإكمال التلقائي');
      
      // بيانات تجريبية في حالة عدم وجود API
      setStats({
        totalRecords: 1250,
        categoriesCount: 12,
        oldRecordsCount: 89,
        categoryBreakdown: [
          { category: 'أسماء العمال', count: 245, avgUsage: 8.5 },
          { category: 'أسماء المواد', count: 156, avgUsage: 12.3 },
          { category: 'أسماء الموردين', count: 89, avgUsage: 6.7 },
          { category: 'أسماء المشاريع', count: 78, avgUsage: 15.2 },
          { category: 'أوصاف المعدات', count: 134, avgUsage: 4.8 },
          { category: 'أسماء المدن', count: 67, avgUsage: 9.1 }
        ]
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const runCleanup = async () => {
    try {
      Alert.alert(
        'تأكيد التنظيف',
        'هل تريد حذف السجلات القديمة؟ لا يمكن التراجع عن هذا الإجراء.',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'نعم، احذف',
            style: 'destructive',
            onPress: async () => {
              const { data, error } = await supabase.functions.invoke('autocomplete-admin-cleanup');
              
              if (error) throw error;
              
              Alert.alert('نجح التنظيف', `تم حذف ${data.deletedCount} سجل قديم`);
              fetchStats();
            }
          }
        ]
      );
    } catch (error) {
      console.error('خطأ في التنظيف:', error);
      Alert.alert('خطأ', 'فشل في تنظيف البيانات القديمة');
    }
  };

  const runMaintenance = async () => {
    try {
      setIsMaintenanceRunning(true);
      
      Alert.alert(
        'تأكيد الصيانة الشاملة',
        'هذا سيقوم بتنظيف شامل للنظام. هل تريد المتابعة؟',
        [
          { text: 'إلغاء', style: 'cancel', onPress: () => setIsMaintenanceRunning(false) },
          {
            text: 'نعم، ابدأ',
            onPress: async () => {
              try {
                const { data, error } = await supabase.functions.invoke('autocomplete-admin-maintenance');
                
                if (error) throw error;
                
                Alert.alert('اكتملت الصيانة', `تمت معالجة ${data.totalProcessed} سجل بنجاح`);
                fetchStats();
              } catch (error) {
                console.error('خطأ في الصيانة:', error);
                Alert.alert('خطأ', 'فشل في تشغيل الصيانة الشاملة');
              } finally {
                setIsMaintenanceRunning(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('خطأ عام في الصيانة:', error);
      setIsMaintenanceRunning(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>جاري تحميل إحصائيات النظام...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.blueCard]}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>إجمالي السجلات</Text>
            <Icon name="storage" size={20} color="rgba(255,255,255,0.8)" />
          </View>
          <Text style={styles.statValue}>{formatNumber(stats?.totalRecords || 0)}</Text>
          <Text style={styles.statLabel}>سجل في النظام</Text>
        </View>

        <View style={[styles.statCard, styles.greenCard]}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>عدد الفئات</Text>
            <Icon name="bar-chart" size={20} color="rgba(255,255,255,0.8)" />
          </View>
          <Text style={styles.statValue}>{formatNumber(stats?.categoriesCount || 0)}</Text>
          <Text style={styles.statLabel}>فئة مختلفة</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.orangeCard]}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>السجلات القديمة</Text>
            <Icon name="schedule" size={20} color="rgba(255,255,255,0.8)" />
          </View>
          <Text style={styles.statValue}>{formatNumber(stats?.oldRecordsCount || 0)}</Text>
          <Text style={styles.statLabel}>تحتاج تنظيف</Text>
        </View>

        <View style={[
          styles.statCard, 
          stats?.oldRecordsCount === 0 ? styles.emeraldCard : styles.yellowCard
        ]}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>حالة النظام</Text>
            <Icon 
              name={stats?.oldRecordsCount === 0 ? "security" : "warning"} 
              size={20} 
              color="rgba(255,255,255,0.8)" 
            />
          </View>
          <Text style={styles.statValue}>
            {stats?.oldRecordsCount === 0 ? 'ممتاز' : 'يحتاج صيانة'}
          </Text>
          <Text style={styles.statLabel}>
            {stats?.oldRecordsCount === 0 ? 'النظام محسّن' : 'يحتاج تنظيف'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'overview' && styles.activeTab]}
        onPress={() => setActiveTab('overview')}
      >
        <Icon name="dashboard" size={18} color={activeTab === 'overview' ? '#3B82F6' : '#6B7280'} />
        <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
          نظرة عامة
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'categories' && styles.activeTab]}
        onPress={() => setActiveTab('categories')}
      >
        <Icon name="bar-chart" size={18} color={activeTab === 'categories' ? '#3B82F6' : '#6B7280'} />
        <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>
          تفصيل الفئات
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'maintenance' && styles.activeTab]}
        onPress={() => setActiveTab('maintenance')}
      >
        <Icon name="settings" size={18} color={activeTab === 'maintenance' ? '#3B82F6' : '#6B7280'} />
        <Text style={[styles.tabText, activeTab === 'maintenance' && styles.activeTabText]}>
          أدوات الصيانة
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <Icon name="trending-up" size={24} color="#3B82F6" />
          <Text style={styles.overviewTitle}>صحة النظام</Text>
        </View>
        
        <View style={styles.efficiencyContainer}>
          <Text style={styles.efficiencyLabel}>كفاءة البيانات</Text>
          <View style={styles.efficiencyValue}>
            <Text style={styles.efficiencyPercentage}>
              {stats && stats.totalRecords > 0 
                ? Math.round(((stats.totalRecords - stats.oldRecordsCount) / stats.totalRecords) * 100) 
                : 0}%
            </Text>
            <View style={[
              styles.efficiencyBadge,
              stats && stats.totalRecords > 0 && 
              ((stats.totalRecords - stats.oldRecordsCount) / stats.totalRecords) * 100 > 80 
                ? styles.excellentBadge : styles.needsImprovementBadge
            ]}>
              <Text style={styles.badgeText}>
                {stats && stats.totalRecords > 0 && 
                 ((stats.totalRecords - stats.oldRecordsCount) / stats.totalRecords) * 100 > 80 
                  ? 'ممتاز' : 'يحتاج تحسين'}
              </Text>
            </View>
          </View>
        </View>

        {stats && stats.oldRecordsCount > 0 && (
          <View style={styles.warningContainer}>
            <View style={styles.warningHeader}>
              <Icon name="warning" size={20} color="#F59E0B" />
              <Text style={styles.warningText}>
                تحذير: يوجد {formatNumber(stats.oldRecordsCount)} سجل قديم
              </Text>
            </View>
            <TouchableOpacity style={styles.quickCleanupButton} onPress={runCleanup}>
              <Icon name="delete" size={16} color="#F59E0B" />
              <Text style={styles.quickCleanupText}>تنظيف سريع</Text>
            </TouchableOpacity>
            <Text style={styles.warningDescription}>
              هذه السجلات لم تُستخدم لأكثر من 6 أشهر وتم استخدامها أقل من 3 مرات
            </Text>
          </View>
        )}

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Icon name="shield" size={20} color="#10B981" />
            <Text style={styles.summaryLabel}>السجلات النشطة</Text>
            <Text style={styles.summaryValue}>
              {formatNumber((stats?.totalRecords || 0) - (stats?.oldRecordsCount || 0))}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Icon name="storage" size={20} color="#3B82F6" />
            <Text style={styles.summaryLabel}>متوسط الاستخدام</Text>
            <Text style={styles.summaryValue}>
              {stats?.categoryBreakdown 
                ? Math.round(stats.categoryBreakdown.reduce((acc, cat) => acc + (cat.avgUsage || 0), 0) / stats.categoryBreakdown.length) || 0
                : 0}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCategoriesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.categoriesHeader}>
        <Text style={styles.categoriesTitle}>تفصيل الفئات</Text>
        <Text style={styles.categoriesSubtitle}>الاستخدام والإحصائيات</Text>
      </View>

      {stats?.categoryBreakdown.map((category, index) => (
        <View key={index} style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <View style={styles.categoryDot} />
            <Text style={styles.categoryName}>{category.category}</Text>
            <View style={[
              styles.categoryBadge,
              category.count > 100 
                ? styles.highUsageBadge 
                : category.count > 50 
                  ? styles.mediumUsageBadge 
                  : styles.lowUsageBadge
            ]}>
              <Text style={styles.categoryBadgeText}>
                {category.count > 100 ? 'مرتفع' : category.count > 50 ? 'متوسط' : 'منخفض'}
              </Text>
            </View>
          </View>

          <View style={styles.categoryStats}>
            <View style={styles.categoryStat}>
              <Text style={styles.categoryStatLabel}>عدد السجلات</Text>
              <Text style={styles.categoryStatValue}>{formatNumber(category.count)}</Text>
            </View>
            <View style={styles.categoryStat}>
              <Text style={styles.categoryStatLabel}>متوسط الاستخدام</Text>
              <Text style={styles.categoryStatValue}>
                {isNaN(category.avgUsage) || !isFinite(category.avgUsage) 
                  ? '0.0' 
                  : category.avgUsage.toFixed(1)}
              </Text>
            </View>
            <View style={styles.categoryStat}>
              <Text style={styles.categoryStatLabel}>الحالة</Text>
              <Text style={[
                styles.categoryStatValue,
                { color: category.count > 100 ? '#EF4444' : category.count > 50 ? '#F59E0B' : '#10B981' }
              ]}>
                {category.count > 100 ? 'يحتاج تقليم' : category.count > 50 ? 'مراقبة' : 'صحي'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.trimButton}>
            <Icon name="delete" size={16} color="#6B7280" />
            <Text style={styles.trimButtonText}>تقليم</Text>
          </TouchableOpacity>
        </View>
      )) || (
        <View style={styles.emptyState}>
          <Icon name="bar-chart" size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>لا توجد فئات محفوظة بعد</Text>
        </View>
      )}
    </View>
  );

  const renderMaintenanceTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.maintenanceCard}>
        <View style={styles.maintenanceHeader}>
          <Icon name="delete" size={24} color="#EF4444" />
          <View>
            <Text style={styles.maintenanceTitle}>تنظيف البيانات القديمة</Text>
            <Text style={styles.maintenanceSubtitle}>حذف السجلات غير المستخدمة</Text>
          </View>
        </View>

        <View style={styles.maintenanceContent}>
          <Text style={styles.maintenanceDescription}>
            حذف السجلات التي لم تُستخدم لأكثر من <Text style={styles.bold}>6 أشهر</Text> والمستخدمة أقل من <Text style={styles.bold}>3 مرات</Text>
          </Text>
          
          <View style={styles.targetRecords}>
            <Text style={styles.targetLabel}>السجلات المستهدفة:</Text>
            <View style={[
              styles.targetBadge,
              stats?.oldRecordsCount === 0 ? styles.successBadge : styles.dangerBadge
            ]}>
              <Text style={styles.targetValue}>{formatNumber(stats?.oldRecordsCount || 0)} سجل</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.cleanupButton} onPress={runCleanup}>
            <Icon name="delete" size={20} color="white" />
            <Text style={styles.cleanupButtonText}>تنظيف سريع</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.maintenanceCard}>
        <View style={styles.maintenanceHeader}>
          <Icon name="settings" size={24} color="#10B981" />
          <View>
            <Text style={styles.maintenanceTitle}>صيانة شاملة</Text>
            <Text style={styles.maintenanceSubtitle}>تحسين شامل لأداء النظام</Text>
          </View>
        </View>

        <View style={styles.maintenanceContent}>
          <Text style={styles.maintenanceDescription}>
            تنظيف شامل يشمل حذف البيانات القديمة وتطبيق حدود الفئات وتحسين فهارس البحث
          </Text>

          <TouchableOpacity 
            style={[styles.maintenanceButton, isMaintenanceRunning && styles.disabledButton]} 
            onPress={runMaintenance}
            disabled={isMaintenanceRunning}
          >
            {isMaintenanceRunning ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="build" size={20} color="white" />
            )}
            <Text style={styles.maintenanceButtonText}>
              {isMaintenanceRunning ? 'جاري التشغيل...' : 'تشغيل الصيانة الشاملة'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>إدارة نظام الإكمال التلقائي</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {renderStatsCards()}
        {renderTabButtons()}
        
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'categories' && renderCategoriesTab()}
        {activeTab === 'maintenance' && renderMaintenanceTab()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  blueCard: {
    backgroundColor: '#3B82F6',
  },
  greenCard: {
    backgroundColor: '#10B981',
  },
  orangeCard: {
    backgroundColor: '#F59E0B',
  },
  yellowCard: {
    backgroundColor: '#F59E0B',
  },
  emeraldCard: {
    backgroundColor: '#10B981',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'right',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  efficiencyContainer: {
    marginBottom: 20,
  },
  efficiencyLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'right',
  },
  efficiencyValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  efficiencyPercentage: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  efficiencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  excellentBadge: {
    backgroundColor: '#D1FAE5',
  },
  needsImprovementBadge: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  warningContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  quickCleanupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: 'white',
    marginBottom: 8,
  },
  quickCleanupText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 6,
  },
  warningDescription: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'right',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  categoriesHeader: {
    marginBottom: 16,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
  },
  categoriesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highUsageBadge: {
    backgroundColor: '#FEE2E2',
  },
  mediumUsageBadge: {
    backgroundColor: '#FEF3C7',
  },
  lowUsageBadge: {
    backgroundColor: '#D1FAE5',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryStat: {
    flex: 1,
    alignItems: 'center',
  },
  categoryStatLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  trimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  trimButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  maintenanceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  maintenanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  maintenanceSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 12,
    marginTop: 2,
  },
  maintenanceContent: {
    alignItems: 'flex-end',
  },
  maintenanceDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 16,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  targetRecords: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  targetLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  targetBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  successBadge: {
    backgroundColor: '#D1FAE5',
  },
  dangerBadge: {
    backgroundColor: '#FEE2E2',
  },
  targetValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  cleanupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  cleanupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  maintenanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  maintenanceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
});

export default AutocompleteAdminScreen;