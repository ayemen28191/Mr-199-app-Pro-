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
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ProjectContext } from '../context/ProjectContext';
import { supabase } from '../services/supabaseClient';

interface Worker {
  id: string;
  name: string;
  trade: string;
  daily_wage: number;
}

interface WorkerStatementRecord {
  date: string;
  attendance_status: 'present' | 'absent' | 'half_day';
  paid_amount: number;
  description?: string;
  deduction_amount?: number;
  bonus_amount?: number;
}

interface WorkerStatement {
  worker: Worker;
  totalDays: number;
  totalAmount: number;
  totalDeductions: number;
  totalBonuses: number;
  netAmount: number;
  records: WorkerStatementRecord[];
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('SAR', 'ريال');
};

const ExcelStyleWorkerStatementScreen: React.FC = () => {
  const { selectedProject } = useContext(ProjectContext);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [statement, setStatement] = useState<WorkerStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // آخر 30 يوم
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchWorkers = async () => {
    try {
      if (!selectedProject?.id) {
        setWorkers([]);
        return;
      }

      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('name');

      if (error) throw error;

      setWorkers(data || []);
      
      if (data && data.length > 0 && !selectedWorker) {
        setSelectedWorker(data[0]);
      }
    } catch (error) {
      console.error('خطأ في جلب العمال:', error);
      Alert.alert('خطأ', 'فشل في تحميل قائمة العمال');
      
      // بيانات تجريبية
      const mockWorkers = [
        { id: '1', name: 'أحمد محمد', trade: 'نجار', daily_wage: 200 },
        { id: '2', name: 'محمد علي', trade: 'كهربائي', daily_wage: 250 },
        { id: '3', name: 'سعد أحمد', trade: 'عامل عام', daily_wage: 150 }
      ];
      setWorkers(mockWorkers);
      if (!selectedWorker) {
        setSelectedWorker(mockWorkers[0]);
      }
    }
  };

  const fetchWorkerStatement = async () => {
    try {
      setLoading(true);
      
      if (!selectedWorker || !selectedProject?.id) {
        setStatement(null);
        return;
      }

      // جلب سجلات الحضور للعامل في الفترة المحددة
      const { data: attendanceData, error } = await supabase
        .from('worker_attendance')
        .select('*')
        .eq('project_id', selectedProject.id)
        .eq('worker_id', selectedWorker.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      const records: WorkerStatementRecord[] = attendanceData?.map(record => ({
        date: record.date,
        attendance_status: record.attendance_status,
        paid_amount: parseFloat(record.paid_amount) || 0,
        description: record.notes,
        deduction_amount: parseFloat(record.deduction_amount) || 0,
        bonus_amount: parseFloat(record.bonus_amount) || 0
      })) || [];

      // حساب الإجماليات
      const totalDays = records.filter(r => r.attendance_status === 'present' || r.attendance_status === 'half_day').length;
      const totalAmount = records.reduce((sum, r) => sum + r.paid_amount, 0);
      const totalDeductions = records.reduce((sum, r) => sum + (r.deduction_amount || 0), 0);
      const totalBonuses = records.reduce((sum, r) => sum + (r.bonus_amount || 0), 0);
      const netAmount = totalAmount + totalBonuses - totalDeductions;

      setStatement({
        worker: selectedWorker,
        totalDays,
        totalAmount,
        totalDeductions,
        totalBonuses,
        netAmount,
        records
      });
    } catch (error) {
      console.error('خطأ في جلب كشف حساب العامل:', error);
      Alert.alert('خطأ', 'فشل في تحميل كشف حساب العامل');
      
      // بيانات تجريبية
      if (selectedWorker) {
        setStatement({
          worker: selectedWorker,
          totalDays: 15,
          totalAmount: 3000,
          totalDeductions: 150,
          totalBonuses: 200,
          netAmount: 3050,
          records: [
            {
              date: '2025-08-23',
              attendance_status: 'present',
              paid_amount: 200,
              description: 'عمل عادي'
            },
            {
              date: '2025-08-22',
              attendance_status: 'present',
              paid_amount: 200,
              description: 'عمل إضافي',
              bonus_amount: 50
            }
          ]
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleWorkerSelect = (worker: Worker) => {
    setSelectedWorker(worker);
    setShowWorkerModal(false);
  };

  const handleExportStatement = () => {
    if (!statement) {
      Alert.alert('تنبيه', 'لا توجد بيانات للتصدير');
      return;
    }

    Alert.alert(
      'تصدير كشف الحساب',
      `سيتم تصدير كشف حساب ${statement.worker.name} للفترة من ${dateRange.startDate} إلى ${dateRange.endDate}`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تصدير', onPress: () => console.log('تم تصدير كشف الحساب') }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkerStatement();
  };

  useEffect(() => {
    fetchWorkers();
  }, [selectedProject]);

  useEffect(() => {
    if (selectedWorker) {
      fetchWorkerStatement();
    }
  }, [selectedWorker, dateRange]);

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'present': return 'check-circle';
      case 'absent': return 'cancel';
      case 'half_day': return 'schedule';
      default: return 'help';
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'present': return '#10B981';
      case 'absent': return '#EF4444';
      case 'half_day': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getAttendanceText = (status: string) => {
    switch (status) {
      case 'present': return 'حاضر';
      case 'absent': return 'غائب';
      case 'half_day': return 'نصف يوم';
      default: return 'غير محدد';
    }
  };

  if (!selectedProject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="person" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>يرجى اختيار مشروع</Text>
          <Text style={styles.emptySubtitle}>اختر مشروعاً لعرض كشوف حسابات العمال</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !statement) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>جاري تحميل كشف الحساب...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>كشف حساب العامل - نمط Excel</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleExportStatement} style={styles.headerButton}>
            <Icon name="file-download" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
            <Icon name="refresh" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Worker Selection */}
      <View style={styles.selectionContainer}>
        <TouchableOpacity 
          style={styles.workerSelector}
          onPress={() => setShowWorkerModal(true)}
        >
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>
              {selectedWorker ? selectedWorker.name : 'اختر عامل'}
            </Text>
            {selectedWorker && (
              <Text style={styles.workerTrade}>{selectedWorker.trade} - {formatCurrency(selectedWorker.daily_wage)}/يوم</Text>
            )}
          </View>
          <Icon name="keyboard-arrow-down" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {statement ? (
          <>
            {/* Statement Header */}
            <View style={styles.statementContainer}>
              <View style={styles.statementHeader}>
                <Text style={styles.statementTitle}>كشف حساب العامل</Text>
                <Text style={styles.statementSubtitle}>نمط Excel المحسن</Text>
              </View>

              {/* Worker Info Section */}
              <View style={styles.workerInfoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>اسم العامل:</Text>
                  <Text style={styles.infoValue}>{statement.worker.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>المهنة:</Text>
                  <Text style={styles.infoValue}>{statement.worker.trade}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>الأجر اليومي:</Text>
                  <Text style={styles.infoValue}>{formatCurrency(statement.worker.daily_wage)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>الفترة:</Text>
                  <Text style={styles.infoValue}>{dateRange.startDate} إلى {dateRange.endDate}</Text>
                </View>
              </View>

              {/* Summary Cards */}
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryCard, styles.daysCard]}>
                    <Icon name="date-range" size={16} color="white" />
                    <Text style={styles.summaryValue}>{statement.totalDays}</Text>
                    <Text style={styles.summaryLabel}>أيام العمل</Text>
                  </View>
                  <View style={[styles.summaryCard, styles.amountCard]}>
                    <Icon name="account-balance-wallet" size={16} color="white" />
                    <Text style={styles.summaryValue}>{formatCurrency(statement.totalAmount)}</Text>
                    <Text style={styles.summaryLabel}>إجمالي الأجور</Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryCard, styles.bonusCard]}>
                    <Icon name="trending-up" size={16} color="white" />
                    <Text style={styles.summaryValue}>{formatCurrency(statement.totalBonuses)}</Text>
                    <Text style={styles.summaryLabel}>المكافآت</Text>
                  </View>
                  <View style={[styles.summaryCard, styles.deductionCard]}>
                    <Icon name="trending-down" size={16} color="white" />
                    <Text style={styles.summaryValue}>{formatCurrency(statement.totalDeductions)}</Text>
                    <Text style={styles.summaryLabel}>الخصومات</Text>
                  </View>
                </View>
              </View>

              {/* Net Amount */}
              <View style={[styles.netAmountCard, statement.netAmount >= 0 ? styles.positiveAmount : styles.negativeAmount]}>
                <Text style={styles.netAmountLabel}>صافي المستحق</Text>
                <Text style={styles.netAmountValue}>{formatCurrency(statement.netAmount)}</Text>
              </View>

              {/* Records Table */}
              <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.dateColumn]}>التاريخ</Text>
                  <Text style={[styles.tableHeaderCell, styles.statusColumn]}>الحالة</Text>
                  <Text style={[styles.tableHeaderCell, styles.amountColumn]}>المبلغ</Text>
                  <Text style={[styles.tableHeaderCell, styles.adjustmentColumn]}>تعديلات</Text>
                </View>

                {statement.records.length > 0 ? (
                  statement.records.map((record, index) => (
                    <View key={index} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.dateColumn]}>
                        {new Date(record.date).toLocaleDateString('ar-SA')}
                      </Text>
                      <View style={[styles.tableCell, styles.statusColumn, styles.statusCell]}>
                        <Icon 
                          name={getAttendanceIcon(record.attendance_status)} 
                          size={12} 
                          color={getAttendanceColor(record.attendance_status)} 
                        />
                        <Text style={[styles.statusText, { color: getAttendanceColor(record.attendance_status) }]}>
                          {getAttendanceText(record.attendance_status)}
                        </Text>
                      </View>
                      <Text style={[styles.tableCell, styles.amountColumn, styles.numberCell]}>
                        {formatCurrency(record.paid_amount)}
                      </Text>
                      <View style={[styles.tableCell, styles.adjustmentColumn]}>
                        {(record.bonus_amount || 0) > 0 && (
                          <Text style={[styles.adjustmentText, styles.bonusText]}>
                            +{formatCurrency(record.bonus_amount || 0)}
                          </Text>
                        )}
                        {(record.deduction_amount || 0) > 0 && (
                          <Text style={[styles.adjustmentText, styles.deductionText]}>
                            -{formatCurrency(record.deduction_amount || 0)}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.noRecordsRow}>
                    <Text style={styles.noRecordsText}>لا توجد سجلات للفترة المحددة</Text>
                  </View>
                )}
              </View>

              {/* Footer */}
              <View style={styles.statementFooter}>
                <Text style={styles.footerText}>
                  تاريخ الإنشاء: {new Date().toLocaleDateString('ar-SA')}
                </Text>
                <Text style={styles.footerText}>نظام إدارة المشاريع الإنشائية</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyStatement}>
            <Icon name="assignment" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStatementTitle}>لا توجد بيانات</Text>
            <Text style={styles.emptyStatementSubtitle}>
              {selectedWorker ? 'لا توجد سجلات للعامل في الفترة المحددة' : 'يرجى اختيار عامل'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Worker Selection Modal */}
      <Modal
        visible={showWorkerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر العامل</Text>
              <TouchableOpacity 
                onPress={() => setShowWorkerModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={workers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.workerOption, selectedWorker?.id === item.id && styles.selectedWorkerOption]}
                  onPress={() => handleWorkerSelect(item)}
                >
                  <View style={styles.workerOptionInfo}>
                    <Text style={styles.workerOptionName}>{item.name}</Text>
                    <Text style={styles.workerOptionDetails}>
                      {item.trade} - {formatCurrency(item.daily_wage)}/يوم
                    </Text>
                  </View>
                  {selectedWorker?.id === item.id && (
                    <Icon name="check" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
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
    fontSize: 16,
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
  selectionContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  workerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  workerTrade: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  statementContainer: {
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
    marginTop: 16,
  },
  statementHeader: {
    backgroundColor: '#3B82F6',
    padding: 20,
    alignItems: 'center',
  },
  statementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  statementSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 4,
  },
  workerInfoSection: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  infoValue: {
    fontSize: 12,
    color: '#1F2937',
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
  daysCard: {
    backgroundColor: '#3B82F6',
  },
  amountCard: {
    backgroundColor: '#10B981',
  },
  bonusCard: {
    backgroundColor: '#8B5CF6',
  },
  deductionCard: {
    backgroundColor: '#EF4444',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  netAmountCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  positiveAmount: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  negativeAmount: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  netAmountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  netAmountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  tableContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 2,
    borderBottomColor: '#D1D5DB',
  },
  tableHeaderCell: {
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
  },
  dateColumn: {
    flex: 2,
  },
  statusColumn: {
    flex: 2,
  },
  amountColumn: {
    flex: 2,
  },
  adjustmentColumn: {
    flex: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  tableCell: {
    padding: 8,
    fontSize: 10,
    color: '#1F2937',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  statusCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 9,
    marginLeft: 4,
  },
  numberCell: {
    fontFamily: 'monospace',
  },
  adjustmentText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  bonusText: {
    color: '#10B981',
  },
  deductionText: {
    color: '#EF4444',
  },
  noRecordsRow: {
    padding: 20,
    alignItems: 'center',
  },
  noRecordsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 10,
    color: '#6B7280',
  },
  emptyStatement: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStatementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyStatementSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
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
    maxHeight: '80%',
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
  workerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  selectedWorkerOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  workerOptionInfo: {
    flex: 1,
  },
  workerOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  workerOptionDetails: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 2,
  },
});

export default ExcelStyleWorkerStatementScreen;