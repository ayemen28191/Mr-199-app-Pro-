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
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ProjectContext } from '../context/ProjectContext';
import { supabase } from '../services/supabaseClient';

interface WorkerFilterCriteria {
  trade?: string;
  minDailyWage?: number;
  maxDailyWage?: number;
  attendanceRate?: number;
  lastWorkDate?: string;
  isActive?: boolean;
}

interface WorkerReportData {
  id: string;
  name: string;
  trade: string;
  dailyWage: number;
  totalDaysWorked: number;
  totalAmountPaid: number;
  attendanceRate: number;
  lastWorkDate: string;
  averageDailyEarnings: number;
  isActive: boolean;
  performanceScore: number;
}

interface ReportSummary {
  totalWorkers: number;
  totalDaysWorked: number;
  totalAmountPaid: number;
  averageAttendanceRate: number;
  topPerformer: WorkerReportData | null;
  tradeDistribution: { [trade: string]: number };
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('SAR', 'ريال');
};

const WorkersFilterReportScreen: React.FC = () => {
  const { selectedProject } = useContext(ProjectContext);
  const [workers, setWorkers] = useState<WorkerReportData[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<WorkerReportData[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<WorkerFilterCriteria>({});
  const [tempFilters, setTempFilters] = useState<WorkerFilterCriteria>({});
  const [trades, setTrades] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchWorkersReport = async () => {
    try {
      setLoading(true);
      
      if (!selectedProject?.id) {
        setWorkers([]);
        setFilteredWorkers([]);
        setSummary(null);
        return;
      }

      // جلب قائمة العمال
      const { data: workersData, error: workersError } = await supabase
        .from('workers')
        .select('*')
        .eq('project_id', selectedProject.id);

      if (workersError) throw workersError;

      const reportData: WorkerReportData[] = [];
      const tradesSet = new Set<string>();

      for (const worker of workersData || []) {
        // جلب بيانات الحضور للعامل في الفترة المحددة
        const { data: attendanceData } = await supabase
          .from('worker_attendance')
          .select('*')
          .eq('worker_id', worker.id)
          .gte('date', dateRange.startDate)
          .lte('date', dateRange.endDate);

        const totalDaysWorked = attendanceData?.filter(a => a.attendance_status === 'present' || a.attendance_status === 'half_day').length || 0;
        const totalAmountPaid = attendanceData?.reduce((sum, a) => sum + (parseFloat(a.paid_amount) || 0), 0) || 0;
        const totalDays = attendanceData?.length || 0;
        const attendanceRate = totalDays > 0 ? (totalDaysWorked / totalDays) * 100 : 0;
        const lastWorkDate = attendanceData && attendanceData.length > 0 
          ? attendanceData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
          : '';
        const averageDailyEarnings = totalDaysWorked > 0 ? totalAmountPaid / totalDaysWorked : 0;
        
        // حساب نقاط الأداء (مبني على الحضور والإنتاجية)
        const performanceScore = Math.round((attendanceRate * 0.6) + (averageDailyEarnings / (worker.daily_wage || 1) * 100 * 0.4));

        tradesSet.add(worker.trade || 'غير محدد');

        reportData.push({
          id: worker.id,
          name: worker.name,
          trade: worker.trade || 'غير محدد',
          dailyWage: parseFloat(worker.daily_wage) || 0,
          totalDaysWorked,
          totalAmountPaid,
          attendanceRate,
          lastWorkDate,
          averageDailyEarnings,
          isActive: worker.is_active !== false,
          performanceScore
        });
      }

      setWorkers(reportData);
      setTrades(Array.from(tradesSet).sort());
      
      // تطبيق الفلاتر
      applyFilters(reportData);
    } catch (error) {
      console.error('خطأ في جلب تقرير العمال:', error);
      Alert.alert('خطأ', 'فشل في تحميل تقرير العمال');
      
      // بيانات تجريبية
      const mockData: WorkerReportData[] = [
        {
          id: '1',
          name: 'أحمد محمد',
          trade: 'نجار',
          dailyWage: 200,
          totalDaysWorked: 18,
          totalAmountPaid: 3600,
          attendanceRate: 90,
          lastWorkDate: '2025-08-22',
          averageDailyEarnings: 200,
          isActive: true,
          performanceScore: 92
        },
        {
          id: '2',
          name: 'محمد علي',
          trade: 'كهربائي',
          dailyWage: 250,
          totalDaysWorked: 15,
          totalAmountPaid: 3750,
          attendanceRate: 83,
          lastWorkDate: '2025-08-21',
          averageDailyEarnings: 250,
          isActive: true,
          performanceScore: 88
        }
      ];
      
      setWorkers(mockData);
      setTrades(['نجار', 'كهربائي', 'عامل عام']);
      applyFilters(mockData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (data: WorkerReportData[] = workers) => {
    let filtered = [...data];

    // فلتر المهنة
    if (filters.trade) {
      filtered = filtered.filter(w => w.trade === filters.trade);
    }

    // فلتر الأجر اليومي
    if (filters.minDailyWage) {
      filtered = filtered.filter(w => w.dailyWage >= filters.minDailyWage!);
    }
    if (filters.maxDailyWage) {
      filtered = filtered.filter(w => w.dailyWage <= filters.maxDailyWage!);
    }

    // فلتر معدل الحضور
    if (filters.attendanceRate) {
      filtered = filtered.filter(w => w.attendanceRate >= filters.attendanceRate!);
    }

    // فلتر الحالة النشطة
    if (filters.isActive !== undefined) {
      filtered = filtered.filter(w => w.isActive === filters.isActive);
    }

    setFilteredWorkers(filtered);

    // حساب الملخص
    const totalWorkers = filtered.length;
    const totalDaysWorked = filtered.reduce((sum, w) => sum + w.totalDaysWorked, 0);
    const totalAmountPaid = filtered.reduce((sum, w) => sum + w.totalAmountPaid, 0);
    const averageAttendanceRate = totalWorkers > 0 
      ? filtered.reduce((sum, w) => sum + w.attendanceRate, 0) / totalWorkers 
      : 0;
    const topPerformer = filtered.length > 0 
      ? filtered.reduce((top, current) => current.performanceScore > top.performanceScore ? current : top)
      : null;

    // توزيع المهن
    const tradeDistribution: { [trade: string]: number } = {};
    filtered.forEach(worker => {
      tradeDistribution[worker.trade] = (tradeDistribution[worker.trade] || 0) + 1;
    });

    setSummary({
      totalWorkers,
      totalDaysWorked,
      totalAmountPaid,
      averageAttendanceRate,
      topPerformer,
      tradeDistribution
    });
  };

  const resetFilters = () => {
    setFilters({});
    setTempFilters({});
    applyFilters();
  };

  const exportReport = () => {
    Alert.alert(
      'تصدير التقرير',
      `سيتم تصدير تقرير العمال المفلتر (${filteredWorkers.length} عامل) للفترة من ${dateRange.startDate} إلى ${dateRange.endDate}`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تصدير', onPress: () => console.log('تم تصدير تقرير العمال') }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkersReport();
  };

  useEffect(() => {
    fetchWorkersReport();
  }, [selectedProject, dateRange]);

  useEffect(() => {
    applyFilters();
  }, [filters]);

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

  const renderWorker = ({ item }: { item: WorkerReportData }) => (
    <View style={styles.workerCard}>
      <View style={styles.workerHeader}>
        <View style={styles.workerMainInfo}>
          <View style={[styles.workerAvatar, { backgroundColor: getPerformanceColor(item.performanceScore) }]}>
            <Text style={styles.workerInitial}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.workerDetails}>
            <Text style={styles.workerName}>{item.name}</Text>
            <Text style={styles.workerTrade}>{item.trade}</Text>
            <View style={styles.workerStatus}>
              <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#10B981' : '#9CA3AF' }]} />
              <Text style={styles.statusText}>{item.isActive ? 'نشط' : 'غير نشط'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.workerStats}>
          <Text style={styles.statValue}>{formatCurrency(item.totalAmountPaid)}</Text>
          <Text style={styles.statLabel}>إجمالي المكتسب</Text>
          <View style={[styles.performanceBadge, { backgroundColor: getPerformanceColor(item.performanceScore) }]}>
            <Text style={styles.performanceText}>{getPerformanceText(item.performanceScore)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.workerMetrics}>
        <View style={styles.metricItem}>
          <Icon name="work" size={16} color="#6B7280" />
          <Text style={styles.metricLabel}>أيام العمل</Text>
          <Text style={styles.metricValue}>{item.totalDaysWorked} يوم</Text>
        </View>
        <View style={styles.metricItem}>
          <Icon name="trending-up" size={16} color="#6B7280" />
          <Text style={styles.metricLabel}>معدل الحضور</Text>
          <Text style={styles.metricValue}>{Math.round(item.attendanceRate)}%</Text>
        </View>
        <View style={styles.metricItem}>
          <Icon name="attach-money" size={16} color="#6B7280" />
          <Text style={styles.metricLabel}>متوسط يومي</Text>
          <Text style={styles.metricValue}>{formatCurrency(item.averageDailyEarnings)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Icon name="schedule" size={16} color="#6B7280" />
          <Text style={styles.metricLabel}>آخر عمل</Text>
          <Text style={styles.metricValue}>
            {item.lastWorkDate ? new Date(item.lastWorkDate).toLocaleDateString('ar-SA') : 'لا يوجد'}
          </Text>
        </View>
      </View>
    </View>
  );

  if (!selectedProject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="people" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>يرجى اختيار مشروع</Text>
          <Text style={styles.emptySubtitle}>اختر مشروعاً لعرض تقرير العمال المفلتر</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>جاري إعداد تقرير العمال...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>تقرير تصفية العمال</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={exportReport} style={styles.headerButton}>
            <Icon name="file-download" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.headerButton}>
            <Icon name="filter-list" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
            <Icon name="refresh" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Dashboard */}
      {summary && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.workersCard]}>
              <Icon name="people" size={16} color="white" />
              <Text style={styles.summaryValue}>{summary.totalWorkers}</Text>
              <Text style={styles.summaryLabel}>إجمالي العمال</Text>
            </View>
            <View style={[styles.summaryCard, styles.daysCard]}>
              <Icon name="work" size={16} color="white" />
              <Text style={styles.summaryValue}>{summary.totalDaysWorked}</Text>
              <Text style={styles.summaryLabel}>أيام العمل</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.amountCard]}>
              <Icon name="account-balance-wallet" size={16} color="white" />
              <Text style={styles.summaryValue}>{formatCurrency(summary.totalAmountPaid)}</Text>
              <Text style={styles.summaryLabel}>إجمالي المدفوع</Text>
            </View>
            <View style={[styles.summaryCard, styles.attendanceCard]}>
              <Icon name="trending-up" size={16} color="white" />
              <Text style={styles.summaryValue}>{Math.round(summary.averageAttendanceRate)}%</Text>
              <Text style={styles.summaryLabel}>متوسط الحضور</Text>
            </View>
          </View>
        </View>
      )}

      {/* Active Filters */}
      {Object.keys(filters).length > 0 && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>الفلاتر النشطة:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {filters.trade && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>المهنة: {filters.trade}</Text>
              </View>
            )}
            {filters.minDailyWage && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>الحد الأدنى: {formatCurrency(filters.minDailyWage)}</Text>
              </View>
            )}
            {filters.maxDailyWage && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>الحد الأعلى: {formatCurrency(filters.maxDailyWage)}</Text>
              </View>
            )}
            {filters.attendanceRate && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>الحضور: {filters.attendanceRate}%+</Text>
              </View>
            )}
            {filters.isActive !== undefined && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{filters.isActive ? 'نشط فقط' : 'غير نشط فقط'}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.resetFiltersButton} onPress={resetFilters}>
              <Icon name="clear" size={14} color="#EF4444" />
              <Text style={styles.resetFiltersText}>مسح الكل</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Workers List */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>قائمة العمال المفلترة</Text>
          <Text style={styles.workerCount}>{filteredWorkers.length} عامل</Text>
        </View>

        {filteredWorkers.length === 0 ? (
          <View style={styles.emptyWorkers}>
            <Icon name="people" size={48} color="#9CA3AF" />
            <Text style={styles.emptyWorkersTitle}>لا توجد عمال</Text>
            <Text style={styles.emptyWorkersSubtitle}>
              لا توجد عمال مطابقين للفلاتر المحددة
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredWorkers}
            renderItem={renderWorker}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>فلترة العمال</Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Trade Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>المهنة</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tradeScroll}>
                  <TouchableOpacity
                    style={[styles.tradeChip, !tempFilters.trade && styles.selectedTradeChip]}
                    onPress={() => setTempFilters({...tempFilters, trade: undefined})}
                  >
                    <Text style={[styles.tradeChipText, !tempFilters.trade && styles.selectedTradeChipText]}>
                      الكل
                    </Text>
                  </TouchableOpacity>
                  {trades.map((trade) => (
                    <TouchableOpacity
                      key={trade}
                      style={[styles.tradeChip, tempFilters.trade === trade && styles.selectedTradeChip]}
                      onPress={() => setTempFilters({...tempFilters, trade})}
                    >
                      <Text style={[styles.tradeChipText, tempFilters.trade === trade && styles.selectedTradeChipText]}>
                        {trade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Wage Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>نطاق الأجر اليومي</Text>
                <View style={styles.wageInputs}>
                  <TextInput
                    style={styles.wageInput}
                    placeholder="الحد الأدنى"
                    value={tempFilters.minDailyWage?.toString() || ''}
                    onChangeText={(text) => setTempFilters({...tempFilters, minDailyWage: text ? parseFloat(text) : undefined})}
                    keyboardType="numeric"
                  />
                  <Text style={styles.toText}>إلى</Text>
                  <TextInput
                    style={styles.wageInput}
                    placeholder="الحد الأعلى"
                    value={tempFilters.maxDailyWage?.toString() || ''}
                    onChangeText={(text) => setTempFilters({...tempFilters, maxDailyWage: text ? parseFloat(text) : undefined})}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Attendance Rate */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>الحد الأدنى لمعدل الحضور (%)</Text>
                <TextInput
                  style={styles.attendanceInput}
                  placeholder="أدخل النسبة المئوية"
                  value={tempFilters.attendanceRate?.toString() || ''}
                  onChangeText={(text) => setTempFilters({...tempFilters, attendanceRate: text ? parseFloat(text) : undefined})}
                  keyboardType="numeric"
                />
              </View>

              {/* Active Status */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>الحالة</Text>
                <View style={styles.statusOptions}>
                  <TouchableOpacity
                    style={[styles.statusOption, tempFilters.isActive === undefined && styles.selectedStatusOption]}
                    onPress={() => setTempFilters({...tempFilters, isActive: undefined})}
                  >
                    <Text style={[styles.statusOptionText, tempFilters.isActive === undefined && styles.selectedStatusOptionText]}>
                      الكل
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusOption, tempFilters.isActive === true && styles.selectedStatusOption]}
                    onPress={() => setTempFilters({...tempFilters, isActive: true})}
                  >
                    <Text style={[styles.statusOptionText, tempFilters.isActive === true && styles.selectedStatusOptionText]}>
                      نشط فقط
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusOption, tempFilters.isActive === false && styles.selectedStatusOption]}
                    onPress={() => setTempFilters({...tempFilters, isActive: false})}
                  >
                    <Text style={[styles.statusOptionText, tempFilters.isActive === false && styles.selectedStatusOptionText]}>
                      غير نشط فقط
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => setTempFilters({})}
              >
                <Text style={styles.resetButtonText}>مسح الفلاتر</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => {
                  setFilters(tempFilters);
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.applyButtonText}>تطبيق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  summaryContainer: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  workersCard: {
    backgroundColor: '#3B82F6',
  },
  daysCard: {
    backgroundColor: '#10B981',
  },
  amountCard: {
    backgroundColor: '#F59E0B',
  },
  attendanceCard: {
    backgroundColor: '#8B5CF6',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
  },
  filtersTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
    textAlign: 'right',
  },
  filtersScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '500',
  },
  resetFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  resetFiltersText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 4,
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  workerCount: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyWorkers: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyWorkersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyWorkersSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  workerCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workerMainInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  workerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workerInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 2,
  },
  workerTrade: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 4,
  },
  workerStatus: {
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
  workerStats: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 6,
  },
  performanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  performanceText: {
    fontSize: 9,
    color: 'white',
    fontWeight: '600',
  },
  workerMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
    textAlign: 'right',
  },
  metricValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
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
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'right',
  },
  tradeScroll: {
    marginBottom: 8,
  },
  tradeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectedTradeChip: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  tradeChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedTradeChipText: {
    color: 'white',
    fontWeight: '600',
  },
  wageInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  toText: {
    fontSize: 14,
    color: '#6B7280',
  },
  attendanceInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  selectedStatusOption: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedStatusOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

export default WorkersFilterReportScreen;