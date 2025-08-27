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
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ProjectContext } from '../context/ProjectContext';
import { supabase } from '../services/supabaseClient';

const { width } = Dimensions.get('window');

interface DailyExpenseReport {
  date: string;
  workerWages: number;
  materialCosts: number;
  transportation: number;
  miscExpenses: number;
  total: number;
  workersCount: number;
  materialsCount: number;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('SAR', 'ريال');
};

const getCurrentDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getWeekAgo = (): string => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return weekAgo.toISOString().split('T')[0];
};

const DailyExpensesReportScreen: React.FC = () => {
  const { selectedProject } = useContext(ProjectContext);
  const [reportData, setReportData] = useState<DailyExpenseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: getWeekAgo(),
    endDate: getCurrentDate()
  });
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange>(dateRange);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      if (!selectedProject?.id) {
        setReportData([]);
        return;
      }

      const reports: DailyExpenseReport[] = [];
      const currentDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // جلب أجور العمال لهذا اليوم
        const { data: attendance } = await supabase
          .from('worker_attendance')
          .select('paid_amount, worker_id')
          .eq('project_id', selectedProject.id)
          .eq('date', dateStr);

        const workerWages = attendance?.reduce((sum, record) => 
          sum + (parseFloat(record.paid_amount) || 0), 0) || 0;
        const workersCount = attendance?.length || 0;

        // جلب تكاليف المواد (النقدية فقط)
        const { data: materials } = await supabase
          .from('material_purchases')
          .select('total_amount, purchase_type, material_id')
          .eq('project_id', selectedProject.id)
          .eq('purchase_date', dateStr)
          .neq('purchase_type', 'آجل');

        const materialCosts = materials?.reduce((sum, record) => 
          sum + (parseFloat(record.total_amount) || 0), 0) || 0;
        const materialsCount = materials?.length || 0;

        // جلب مصروفات النقل
        const { data: transport } = await supabase
          .from('transportation_expenses')
          .select('amount')
          .eq('project_id', selectedProject.id)
          .eq('date', dateStr);

        const transportation = transport?.reduce((sum, record) => 
          sum + (parseFloat(record.amount) || 0), 0) || 0;

        // جلب المصروفات المتنوعة
        const { data: misc } = await supabase
          .from('worker_misc_expenses')
          .select('amount')
          .eq('project_id', selectedProject.id)
          .eq('date', dateStr);

        const miscExpenses = misc?.reduce((sum, record) => 
          sum + (parseFloat(record.amount) || 0), 0) || 0;

        const total = workerWages + materialCosts + transportation + miscExpenses;

        // إضافة التقرير حتى لو كان المجموع صفر للمراجعة الشاملة
        reports.push({
          date: dateStr,
          workerWages,
          materialCosts,
          transportation,
          miscExpenses,
          total,
          workersCount,
          materialsCount
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      setReportData(reports.reverse()); // الأحدث أولاً
    } catch (error) {
      console.error('خطأ في جلب تقرير المصاريف:', error);
      Alert.alert('خطأ', 'فشل في تحميل تقرير المصاريف اليومية');
      
      // بيانات تجريبية
      setReportData([
        {
          date: getCurrentDate(),
          workerWages: 850,
          materialCosts: 1200,
          transportation: 150,
          miscExpenses: 300,
          total: 2500,
          workersCount: 5,
          materialsCount: 3
        },
        {
          date: '2025-08-22',
          workerWages: 750,
          materialCosts: 900,
          transportation: 100,
          miscExpenses: 200,
          total: 1950,
          workersCount: 4,
          materialsCount: 2
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDateRangeUpdate = () => {
    setDateRange(tempDateRange);
    setShowDateModal(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReportData();
  };

  const calculateTotals = () => {
    return reportData.reduce((totals, report) => ({
      totalWorkerWages: totals.totalWorkerWages + report.workerWages,
      totalMaterialCosts: totals.totalMaterialCosts + report.materialCosts,
      totalTransportation: totals.totalTransportation + report.transportation,
      totalMiscExpenses: totals.totalMiscExpenses + report.miscExpenses,
      grandTotal: totals.grandTotal + report.total,
      totalWorkersCount: totals.totalWorkersCount + report.workersCount,
      totalMaterialsCount: totals.totalMaterialsCount + report.materialsCount
    }), {
      totalWorkerWages: 0,
      totalMaterialCosts: 0,
      totalTransportation: 0,
      totalMiscExpenses: 0,
      grandTotal: 0,
      totalWorkersCount: 0,
      totalMaterialsCount: 0
    });
  };

  const exportReport = () => {
    const totals = calculateTotals();
    
    Alert.alert(
      'تصدير التقرير',
      `سيتم تصدير تقرير المصاريف اليومية للفترة من ${dateRange.startDate} إلى ${dateRange.endDate}\n\nإجمالي المصاريف: ${formatCurrency(totals.grandTotal)}`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تصدير', onPress: () => console.log('تم تصدير التقرير') }
      ]
    );
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedProject, dateRange]);

  if (!selectedProject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="assessment" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>يرجى اختيار مشروع</Text>
          <Text style={styles.emptySubtitle}>اختر مشروعاً لعرض تقرير المصاريف اليومية</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>جاري إنشاء التقرير...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totals = calculateTotals();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>تقرير المصاريف اليومية</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={exportReport} style={styles.headerButton}>
            <Icon name="file-download" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
            <Icon name="refresh" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Project Info & Date Range */}
      <View style={styles.infoContainer}>
        <View style={styles.projectInfo}>
          <Text style={styles.projectLabel}>المشروع:</Text>
          <Text style={styles.projectName}>{selectedProject.name}</Text>
        </View>
        <TouchableOpacity 
          style={styles.dateRangeButton}
          onPress={() => {
            setTempDateRange(dateRange);
            setShowDateModal(true);
          }}
        >
          <Text style={styles.dateRangeText}>
            {dateRange.startDate} إلى {dateRange.endDate}
          </Text>
          <Icon name="date-range" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.totalCard]}>
            <Icon name="account-balance-wallet" size={20} color="white" />
            <Text style={styles.summaryValue}>{formatCurrency(totals.grandTotal)}</Text>
            <Text style={styles.summaryLabel}>إجمالي المصاريف</Text>
          </View>
          <View style={[styles.summaryCard, styles.avgCard]}>
            <Icon name="trending-up" size={20} color="white" />
            <Text style={styles.summaryValue}>
              {reportData.length > 0 ? formatCurrency(totals.grandTotal / reportData.length) : formatCurrency(0)}
            </Text>
            <Text style={styles.summaryLabel}>متوسط يومي</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.workersCard]}>
            <Icon name="people" size={20} color="white" />
            <Text style={styles.summaryValue}>{formatCurrency(totals.totalWorkerWages)}</Text>
            <Text style={styles.summaryLabel}>أجور العمال</Text>
          </View>
          <View style={[styles.summaryCard, styles.materialsCard]}>
            <Icon name="build" size={20} color="white" />
            <Text style={styles.summaryValue}>{formatCurrency(totals.totalMaterialCosts)}</Text>
            <Text style={styles.summaryLabel}>تكاليف المواد</Text>
          </View>
        </View>
      </View>

      {/* Daily Reports */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {reportData.length === 0 ? (
          <View style={styles.emptyReports}>
            <Icon name="assessment" size={48} color="#9CA3AF" />
            <Text style={styles.emptyReportsTitle}>لا توجد بيانات للفترة المحددة</Text>
            <Text style={styles.emptyReportsSubtitle}>
              جرب تحديد فترة زمنية مختلفة أو تأكد من وجود مصاريف مسجلة
            </Text>
          </View>
        ) : (
          reportData.map((report, index) => (
            <View key={report.date} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.reportDate}>
                  <Icon name="event" size={16} color="#3B82F6" />
                  <Text style={styles.reportDateText}>
                    {new Date(report.date).toLocaleDateString('ar-SA', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                <View style={[
                  styles.reportTotal,
                  report.total === 0 ? styles.zeroTotal : styles.nonZeroTotal
                ]}>
                  <Text style={styles.reportTotalText}>{formatCurrency(report.total)}</Text>
                </View>
              </View>

              {report.total > 0 ? (
                <View style={styles.reportDetails}>
                  <View style={styles.expenseRow}>
                    <View style={styles.expenseItem}>
                      <Text style={styles.expenseLabel}>أجور العمال</Text>
                      <Text style={styles.expenseValue}>{formatCurrency(report.workerWages)}</Text>
                      <Text style={styles.expenseCount}>({report.workersCount} عامل)</Text>
                    </View>
                    <View style={styles.expenseItem}>
                      <Text style={styles.expenseLabel}>تكاليف المواد</Text>
                      <Text style={styles.expenseValue}>{formatCurrency(report.materialCosts)}</Text>
                      <Text style={styles.expenseCount}>({report.materialsCount} مادة)</Text>
                    </View>
                  </View>
                  <View style={styles.expenseRow}>
                    <View style={styles.expenseItem}>
                      <Text style={styles.expenseLabel}>النقل</Text>
                      <Text style={styles.expenseValue}>{formatCurrency(report.transportation)}</Text>
                    </View>
                    <View style={styles.expenseItem}>
                      <Text style={styles.expenseLabel}>متنوعة</Text>
                      <Text style={styles.expenseValue}>{formatCurrency(report.miscExpenses)}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.noExpenses}>
                  <Icon name="check-circle" size={16} color="#10B981" />
                  <Text style={styles.noExpensesText}>لا توجد مصاريف في هذا اليوم</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Date Range Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر الفترة الزمنية</Text>
              <TouchableOpacity 
                onPress={() => setShowDateModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateInputs}>
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateInputLabel}>من تاريخ</Text>
                <TextInput
                  style={styles.dateInput}
                  value={tempDateRange.startDate}
                  onChangeText={(text) => setTempDateRange({...tempDateRange, startDate: text})}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateInputLabel}>إلى تاريخ</Text>
                <TextInput
                  style={styles.dateInput}
                  value={tempDateRange.endDate}
                  onChangeText={(text) => setTempDateRange({...tempDateRange, endDate: text})}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={handleDateRangeUpdate}
              >
                <Text style={styles.modalButtonText}>تطبيق</Text>
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
  infoContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  projectInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  dateRangeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    textAlign: 'right',
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
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  totalCard: {
    backgroundColor: '#3B82F6',
  },
  avgCard: {
    backgroundColor: '#10B981',
  },
  workersCard: {
    backgroundColor: '#F59E0B',
  },
  materialsCard: {
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
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyReports: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyReportsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyReportsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportDate: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
    textAlign: 'right',
  },
  reportTotal: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  zeroTotal: {
    backgroundColor: '#F3F4F6',
  },
  nonZeroTotal: {
    backgroundColor: '#EFF6FF',
  },
  reportTotalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  reportDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  expenseItem: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  expenseLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 2,
  },
  expenseValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 1,
  },
  expenseCount: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  noExpenses: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  noExpensesText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 300,
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
  dateInputs: {
    marginBottom: 20,
  },
  dateInputGroup: {
    marginBottom: 16,
  },
  dateInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DailyExpensesReportScreen;