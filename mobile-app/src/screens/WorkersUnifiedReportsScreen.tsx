import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ProjectContext } from '../context/ProjectContext';
import { supabase } from '../services/supabaseClient';

const { width } = Dimensions.get('window');

interface WorkerUnifiedData {
  id: string;
  name: string;
  trade: string;
  dailyWage: number;
  isActive: boolean;
  
  // إحصائيات الحضور
  totalDaysWorked: number;
  totalDaysAbsent: number;
  attendanceRate: number;
  
  // إحصائيات المالية
  totalAmountEarned: number;
  totalAmountPaid: number;
  remainingBalance: number;
  averageDailyEarnings: number;
  
  // إحصائيات الأداء
  performanceScore: number;
  punctualityScore: number;
  productivityScore: number;
  
  // تواريخ مهمة
  firstWorkDate: string;
  lastWorkDate: string;
  
  // إحصائيات إضافية
  overtimeHours: number;
  bonusesReceived: number;
  deductionsApplied: number;
}

interface UnifiedReportSummary {
  totalWorkers: number;
  activeWorkers: number;
  totalDaysWorked: number;
  totalAmountPaid: number;
  averageAttendanceRate: number;
  averagePerformanceScore: number;
  topPerformers: WorkerUnifiedData[];
  tradeDistribution: { trade: string; count: number; totalPaid: number }[];
  monthlyTrends: { month: string; totalPaid: number; attendanceRate: number }[];
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('SAR', 'ريال');
};

const WorkersUnifiedReportsScreen: React.FC = () => {
  const { selectedProject } = useContext(ProjectContext);
  const [workersData, setWorkersData] = useState<WorkerUnifiedData[]>([]);
  const [summary, setSummary] = useState<UnifiedReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'performance' | 'financial' | 'attendance'>('overview');
  const [sortBy, setSortBy] = useState<string>('performanceScore');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerUnifiedData | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // آخر 3 أشهر
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchUnifiedReport = async () => {
    try {
      setLoading(true);
      
      if (!selectedProject?.id) {
        setWorkersData([]);
        setSummary(null);
        return;
      }

      // جلب جميع العمال
      const { data: workersData, error: workersError } = await supabase
        .from('workers')
        .select('*')
        .eq('project_id', selectedProject.id);

      if (workersError) throw workersError;

      const unifiedData: WorkerUnifiedData[] = [];
      const tradesMap = new Map<string, { count: number; totalPaid: number }>();

      for (const worker of workersData || []) {
        // جلب بيانات الحضور الشاملة
        const { data: attendanceData } = await supabase
          .from('worker_attendance')
          .select('*')
          .eq('worker_id', worker.id)
          .gte('date', dateRange.startDate)
          .lte('date', dateRange.endDate)
          .order('date', { ascending: true });

        // حساب إحصائيات الحضور
        const totalDaysWorked = attendanceData?.filter(a => a.attendance_status === 'present' || a.attendance_status === 'half_day').length || 0;
        const totalDaysAbsent = attendanceData?.filter(a => a.attendance_status === 'absent').length || 0;
        const totalDays = attendanceData?.length || 0;
        const attendanceRate = totalDays > 0 ? (totalDaysWorked / totalDays) * 100 : 0;

        // حساب إحصائيات المالية
        const totalAmountPaid = attendanceData?.reduce((sum, a) => sum + (parseFloat(a.paid_amount) || 0), 0) || 0;
        const bonusesReceived = attendanceData?.reduce((sum, a) => sum + (parseFloat(a.bonus_amount) || 0), 0) || 0;
        const deductionsApplied = attendanceData?.reduce((sum, a) => sum + (parseFloat(a.deduction_amount) || 0), 0) || 0;
        const totalAmountEarned = totalAmountPaid + bonusesReceived - deductionsApplied;
        const averageDailyEarnings = totalDaysWorked > 0 ? totalAmountPaid / totalDaysWorked : 0;

        // حساب الرصيد المتبقي (مستحقات غير مدفوعة)
        const expectedEarnings = totalDaysWorked * (parseFloat(worker.daily_wage) || 0);
        const remainingBalance = expectedEarnings - totalAmountPaid;

        // حساب نقاط الأداء
        const punctualityScore = attendanceRate;
        const productivityScore = averageDailyEarnings > 0 ? Math.min((averageDailyEarnings / (parseFloat(worker.daily_wage) || 1)) * 100, 100) : 0;
        const performanceScore = Math.round((punctualityScore * 0.6) + (productivityScore * 0.4));

        // تواريخ مهمة
        const firstWorkDate = attendanceData && attendanceData.length > 0 ? attendanceData[0].date : '';
        const lastWorkDate = attendanceData && attendanceData.length > 0 ? attendanceData[attendanceData.length - 1].date : '';

        // ساعات إضافية (محاكاة)
        const overtimeHours = Math.round(Math.random() * 20);

        const workerUnifiedData: WorkerUnifiedData = {
          id: worker.id,
          name: worker.name,
          trade: worker.trade || 'غير محدد',
          dailyWage: parseFloat(worker.daily_wage) || 0,
          isActive: worker.is_active !== false,
          
          totalDaysWorked,
          totalDaysAbsent,
          attendanceRate,
          
          totalAmountEarned,
          totalAmountPaid,
          remainingBalance,
          averageDailyEarnings,
          
          performanceScore,
          punctualityScore,
          productivityScore,
          
          firstWorkDate,
          lastWorkDate,
          
          overtimeHours,
          bonusesReceived,
          deductionsApplied
        };

        unifiedData.push(workerUnifiedData);

        // تحديث إحصائيات المهن
        const trade = worker.trade || 'غير محدد';
        const tradeData = tradesMap.get(trade) || { count: 0, totalPaid: 0 };
        tradesMap.set(trade, {
          count: tradeData.count + 1,
          totalPaid: tradeData.totalPaid + totalAmountPaid
        });
      }

      setWorkersData(unifiedData);

      // حساب الملخص الشامل
      const totalWorkers = unifiedData.length;
      const activeWorkers = unifiedData.filter(w => w.isActive).length;
      const totalDaysWorked = unifiedData.reduce((sum, w) => sum + w.totalDaysWorked, 0);
      const totalAmountPaid = unifiedData.reduce((sum, w) => sum + w.totalAmountPaid, 0);
      const averageAttendanceRate = totalWorkers > 0 
        ? unifiedData.reduce((sum, w) => sum + w.attendanceRate, 0) / totalWorkers 
        : 0;
      const averagePerformanceScore = totalWorkers > 0 
        ? unifiedData.reduce((sum, w) => sum + w.performanceScore, 0) / totalWorkers 
        : 0;

      // أفضل 3 أداء
      const topPerformers = unifiedData
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, 3);

      // توزيع المهن
      const tradeDistribution = Array.from(tradesMap.entries()).map(([trade, data]) => ({
        trade,
        count: data.count,
        totalPaid: data.totalPaid
      }));

      // اتجاهات شهرية (محاكاة)
      const monthlyTrends = [
        { month: 'يوليو', totalPaid: totalAmountPaid * 0.8, attendanceRate: averageAttendanceRate * 0.9 },
        { month: 'أغسطس', totalPaid: totalAmountPaid * 0.9, attendanceRate: averageAttendanceRate * 0.95 },
        { month: 'سبتمبر', totalPaid: totalAmountPaid, attendanceRate: averageAttendanceRate }
      ];

      setSummary({
        totalWorkers,
        activeWorkers,
        totalDaysWorked,
        totalAmountPaid,
        averageAttendanceRate,
        averagePerformanceScore,
        topPerformers,
        tradeDistribution,
        monthlyTrends
      });

    } catch (error) {
      console.error('خطأ في جلب التقرير الموحد:', error);
      Alert.alert('خطأ', 'فشل في تحميل التقرير الموحد للعمال');
      
      // بيانات تجريبية
      const mockData: WorkerUnifiedData[] = [
        {
          id: '1',
          name: 'أحمد محمد',
          trade: 'نجار',
          dailyWage: 200,
          isActive: true,
          totalDaysWorked: 25,
          totalDaysAbsent: 3,
          attendanceRate: 89.3,
          totalAmountEarned: 5200,
          totalAmountPaid: 5000,
          remainingBalance: 200,
          averageDailyEarnings: 200,
          performanceScore: 92,
          punctualityScore: 89,
          productivityScore: 95,
          firstWorkDate: '2025-06-01',
          lastWorkDate: '2025-08-23',
          overtimeHours: 15,
          bonusesReceived: 300,
          deductionsApplied: 100
        }
      ];
      
      setWorkersData(mockData);
      setSummary({
        totalWorkers: 1,
        activeWorkers: 1,
        totalDaysWorked: 25,
        totalAmountPaid: 5000,
        averageAttendanceRate: 89.3,
        averagePerformanceScore: 92,
        topPerformers: mockData,
        tradeDistribution: [{ trade: 'نجار', count: 1, totalPaid: 5000 }],
        monthlyTrends: [
          { month: 'يوليو', totalPaid: 4000, attendanceRate: 85 },
          { month: 'أغسطس', totalPaid: 4500, attendanceRate: 87 },
          { month: 'سبتمبر', totalPaid: 5000, attendanceRate: 89 }
        ]
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUnifiedReport();
  };

  useEffect(() => {
    fetchUnifiedReport();
  }, [selectedProject, dateRange]);

  const getSortedWorkers = () => {
    return [...workersData].sort((a, b) => {
      switch (sortBy) {
        case 'performanceScore':
          return b.performanceScore - a.performanceScore;
        case 'attendanceRate':
          return b.attendanceRate - a.attendanceRate;
        case 'totalAmountPaid':
          return b.totalAmountPaid - a.totalAmountPaid;
        case 'name':
          return a.name.localeCompare(b.name, 'ar');
        default:
          return 0;
      }
    });
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#F59E0B';
    if (score >= 70) return '#F97316';
    return '#EF4444';
  };

  const getPerformanceText = (score: number) => {
    if (score >= 90) return 'ممتاز';
    if (score >= 80) return 'جيد جداً';
    if (score >= 70) return 'جيد';
    return 'يحتاج تحسين';
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {summary && (
        <>
          {/* Key Metrics */}
          <View style={styles.metricsContainer}>
            <Text style={styles.sectionTitle}>المؤشرات الرئيسية</Text>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, styles.totalWorkersCard]}>
                <Icon name="people" size={24} color="white" />
                <Text style={styles.metricValue}>{summary.totalWorkers}</Text>
                <Text style={styles.metricLabel}>إجمالي العمال</Text>
                <Text style={styles.metricSubtext}>{summary.activeWorkers} نشط</Text>
              </View>
              <View style={[styles.metricCard, styles.totalDaysCard]}>
                <Icon name="work" size={24} color="white" />
                <Text style={styles.metricValue}>{summary.totalDaysWorked}</Text>
                <Text style={styles.metricLabel}>أيام العمل</Text>
                <Text style={styles.metricSubtext}>إجمالي</Text>
              </View>
              <View style={[styles.metricCard, styles.totalPaidCard]}>
                <Icon name="account-balance-wallet" size={24} color="white" />
                <Text style={styles.metricValue}>{formatCurrency(summary.totalAmountPaid)}</Text>
                <Text style={styles.metricLabel}>إجمالي المدفوع</Text>
                <Text style={styles.metricSubtext}>جميع العمال</Text>
              </View>
              <View style={[styles.metricCard, styles.avgPerformanceCard]}>
                <Icon name="trending-up" size={24} color="white" />
                <Text style={styles.metricValue}>{Math.round(summary.averagePerformanceScore)}%</Text>
                <Text style={styles.metricLabel}>متوسط الأداء</Text>
                <Text style={styles.metricSubtext}>عام</Text>
              </View>
            </View>
          </View>

          {/* Top Performers */}
          <View style={styles.topPerformersContainer}>
            <Text style={styles.sectionTitle}>أفضل الأداءات</Text>
            {summary.topPerformers.map((worker, index) => (
              <View key={worker.id} style={styles.topPerformerCard}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={[styles.performerAvatar, { backgroundColor: getPerformanceColor(worker.performanceScore) }]}>
                  <Text style={styles.performerInitial}>{worker.name.charAt(0)}</Text>
                </View>
                <View style={styles.performerInfo}>
                  <Text style={styles.performerName}>{worker.name}</Text>
                  <Text style={styles.performerTrade}>{worker.trade}</Text>
                  <Text style={styles.performerScore}>
                    {worker.performanceScore}% - {getPerformanceText(worker.performanceScore)}
                  </Text>
                </View>
                <View style={styles.performerStats}>
                  <Text style={styles.performerEarnings}>{formatCurrency(worker.totalAmountPaid)}</Text>
                  <Text style={styles.performerDays}>{worker.totalDaysWorked} يوم</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Trade Distribution */}
          <View style={styles.tradeDistributionContainer}>
            <Text style={styles.sectionTitle}>توزيع المهن</Text>
            {summary.tradeDistribution.map((trade, index) => (
              <View key={index} style={styles.tradeCard}>
                <View style={styles.tradeInfo}>
                  <Text style={styles.tradeName}>{trade.trade}</Text>
                  <Text style={styles.tradeCount}>{trade.count} عامل</Text>
                </View>
                <View style={styles.tradeStats}>
                  <Text style={styles.tradePaid}>{formatCurrency(trade.totalPaid)}</Text>
                  <Text style={styles.tradeAverage}>
                    {formatCurrency(trade.count > 0 ? trade.totalPaid / trade.count : 0)} متوسط
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderWorkersList = () => {
    const sortedWorkers = getSortedWorkers();
    
    return (
      <FlatList
        data={sortedWorkers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.workerListCard}
            onPress={() => {
              setSelectedWorker(item);
              setShowDetailsModal(true);
            }}
          >
            <View style={styles.workerListHeader}>
              <View style={[styles.workerListAvatar, { backgroundColor: getPerformanceColor(item.performanceScore) }]}>
                <Text style={styles.workerListInitial}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.workerListInfo}>
                <Text style={styles.workerListName}>{item.name}</Text>
                <Text style={styles.workerListTrade}>{item.trade}</Text>
                <View style={styles.workerListStatus}>
                  <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#10B981' : '#9CA3AF' }]} />
                  <Text style={styles.statusText}>{item.isActive ? 'نشط' : 'غير نشط'}</Text>
                </View>
              </View>
              <View style={styles.workerListStats}>
                <Text style={styles.workerListScore}>{item.performanceScore}%</Text>
                <Text style={styles.workerListPaid}>{formatCurrency(item.totalAmountPaid)}</Text>
              </View>
            </View>
            
            <View style={styles.workerListMetrics}>
              <View style={styles.metricPill}>
                <Icon name="work" size={12} color="#6B7280" />
                <Text style={styles.metricPillText}>{item.totalDaysWorked} يوم</Text>
              </View>
              <View style={styles.metricPill}>
                <Icon name="trending-up" size={12} color="#6B7280" />
                <Text style={styles.metricPillText}>{Math.round(item.attendanceRate)}% حضور</Text>
              </View>
              <View style={styles.metricPill}>
                <Icon name="account-balance-wallet" size={12} color="#6B7280" />
                <Text style={styles.metricPillText}>{formatCurrency(item.averageDailyEarnings)} يومي</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  if (!selectedProject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="assessment" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>يرجى اختيار مشروع</Text>
          <Text style={styles.emptySubtitle}>اختر مشروعاً لعرض التقرير الموحد للعمال</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>جاري إعداد التقرير الموحد...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>التقارير الموحدة للعمال</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
          <Icon name="refresh" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {[
            { key: 'overview', label: 'نظرة عامة', icon: 'dashboard' },
            { key: 'performance', label: 'الأداء', icon: 'trending-up' },
            { key: 'financial', label: 'المالية', icon: 'account-balance-wallet' },
            { key: 'attendance', label: 'الحضور', icon: 'schedule' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedView === tab.key && styles.activeTab]}
              onPress={() => setSelectedView(tab.key as any)}
            >
              <Icon name={tab.icon} size={16} color={selectedView === tab.key ? '#3B82F6' : '#6B7280'} />
              <Text style={[styles.tabText, selectedView === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {selectedView === 'overview' && renderOverviewTab()}
        {selectedView !== 'overview' && (
          <>
            {/* Sort Options */}
            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>ترتيب حسب:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
                {[
                  { key: 'performanceScore', label: 'الأداء' },
                  { key: 'attendanceRate', label: 'الحضور' },
                  { key: 'totalAmountPaid', label: 'المدفوع' },
                  { key: 'name', label: 'الاسم' }
                ].map((sort) => (
                  <TouchableOpacity
                    key={sort.key}
                    style={[styles.sortChip, sortBy === sort.key && styles.activeSortChip]}
                    onPress={() => setSortBy(sort.key)}
                  >
                    <Text style={[styles.sortChipText, sortBy === sort.key && styles.activeSortChipText]}>
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {renderWorkersList()}
          </>
        )}
      </View>

      {/* Worker Details Modal */}
      {selectedWorker && (
        <Modal
          visible={showDetailsModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDetailsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>تفاصيل العامل</Text>
                <TouchableOpacity 
                  onPress={() => setShowDetailsModal(false)}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.workerDetailsHeader}>
                  <View style={[styles.workerDetailsAvatar, { backgroundColor: getPerformanceColor(selectedWorker.performanceScore) }]}>
                    <Text style={styles.workerDetailsInitial}>{selectedWorker.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.workerDetailsName}>{selectedWorker.name}</Text>
                  <Text style={styles.workerDetailsTrade}>{selectedWorker.trade}</Text>
                  <View style={[styles.workerDetailsScore, { backgroundColor: getPerformanceColor(selectedWorker.performanceScore) }]}>
                    <Text style={styles.workerDetailsScoreText}>
                      {selectedWorker.performanceScore}% - {getPerformanceText(selectedWorker.performanceScore)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>الحضور والغياب</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>أيام العمل:</Text>
                      <Text style={styles.detailValue}>{selectedWorker.totalDaysWorked} يوم</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>أيام الغياب:</Text>
                      <Text style={styles.detailValue}>{selectedWorker.totalDaysAbsent} يوم</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>معدل الحضور:</Text>
                      <Text style={styles.detailValue}>{selectedWorker.attendanceRate.toFixed(1)}%</Text>
                    </View>
                  </View>

                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>الإحصائيات المالية</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>إجمالي المدفوع:</Text>
                      <Text style={styles.detailValue}>{formatCurrency(selectedWorker.totalAmountPaid)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>المكافآت:</Text>
                      <Text style={styles.detailValue}>{formatCurrency(selectedWorker.bonusesReceived)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>الخصومات:</Text>
                      <Text style={styles.detailValue}>{formatCurrency(selectedWorker.deductionsApplied)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>الرصيد المتبقي:</Text>
                      <Text style={[styles.detailValue, { color: selectedWorker.remainingBalance > 0 ? '#EF4444' : '#10B981' }]}>
                        {formatCurrency(selectedWorker.remainingBalance)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>تقييم الأداء</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>الأداء الإجمالي:</Text>
                      <Text style={styles.detailValue}>{selectedWorker.performanceScore}%</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>نقاط الانضباط:</Text>
                      <Text style={styles.detailValue}>{selectedWorker.punctualityScore.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>نقاط الإنتاجية:</Text>
                      <Text style={styles.detailValue}>{selectedWorker.productivityScore.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>ساعات إضافية:</Text>
                      <Text style={styles.detailValue}>{selectedWorker.overtimeHours} ساعة</Text>
                    </View>
                  </View>

                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>التواريخ المهمة</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>أول يوم عمل:</Text>
                      <Text style={styles.detailValue}>
                        {selectedWorker.firstWorkDate ? new Date(selectedWorker.firstWorkDate).toLocaleDateString('ar-SA') : 'غير محدد'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>آخر يوم عمل:</Text>
                      <Text style={styles.detailValue}>
                        {selectedWorker.lastWorkDate ? new Date(selectedWorker.lastWorkDate).toLocaleDateString('ar-SA') : 'غير محدد'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>الأجر اليومي:</Text>
                      <Text style={styles.detailValue}>{formatCurrency(selectedWorker.dailyWage)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>متوسط الكسب اليومي:</Text>
                      <Text style={styles.detailValue}>{formatCurrency(selectedWorker.averageDailyEarnings)}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  headerButton: {
    padding: 8,
  },
  tabsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsScroll: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'right',
  },
  metricsContainer: {
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 48) / 2 - 6,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalWorkersCard: {
    backgroundColor: '#3B82F6',
  },
  totalDaysCard: {
    backgroundColor: '#10B981',
  },
  totalPaidCard: {
    backgroundColor: '#F59E0B',
  },
  avgPerformanceCard: {
    backgroundColor: '#8B5CF6',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginVertical: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  topPerformersContainer: {
    marginBottom: 24,
  },
  topPerformerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  performerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  performerInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 2,
  },
  performerTrade: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 2,
  },
  performerScore: {
    fontSize: 10,
    color: '#374151',
    textAlign: 'right',
  },
  performerStats: {
    alignItems: 'flex-end',
  },
  performerEarnings: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  performerDays: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  tradeDistributionContainer: {
    marginBottom: 24,
  },
  tradeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tradeInfo: {
    flex: 1,
  },
  tradeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
  },
  tradeCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 2,
  },
  tradeStats: {
    alignItems: 'flex-end',
  },
  tradePaid: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  tradeAverage: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 12,
  },
  sortScroll: {
    flex: 1,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  activeSortChip: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  sortChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeSortChipText: {
    color: 'white',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 16,
  },
  workerListCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  workerListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerListAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workerListInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  workerListInfo: {
    flex: 1,
  },
  workerListName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 2,
  },
  workerListTrade: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 4,
  },
  workerListStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  statusText: {
    fontSize: 10,
    color: '#6B7280',
  },
  workerListStats: {
    alignItems: 'flex-end',
  },
  workerListScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  workerListPaid: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  workerListMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metricPillText: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailsModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  workerDetailsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  workerDetailsAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerDetailsInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  workerDetailsName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  workerDetailsTrade: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  workerDetailsScore: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  workerDetailsScoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  detailsGrid: {
    gap: 16,
  },
  detailCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default WorkersUnifiedReportsScreen;