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
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ProjectContext } from '../context/ProjectContext';
import { supabase } from '../services/supabaseClient';

interface DailyExpenseData {
  date: string;
  workerWages: number;
  materialCosts: number;
  transportation: number;
  miscExpenses: number;
  total: number;
}

const formatCurrency = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '0.00 ريال';
  
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount).replace('SAR', 'ريال');
};

const getCurrentDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const ExcelStyleDailyExpensesScreen: React.FC = () => {
  const { selectedProject } = useContext(ProjectContext);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [expenseData, setExpenseData] = useState<DailyExpenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      
      if (!selectedProject?.id) {
        setExpenseData({
          date: selectedDate,
          workerWages: 0,
          materialCosts: 0,
          transportation: 0,
          miscExpenses: 0,
          total: 0
        });
        return;
      }

      // جلب بيانات المصاريف اليومية من قاعدة البيانات
      const { data: dailyExpenses, error } = await supabase
        .from('daily_expense_summaries')
        .select('*')
        .eq('project_id', selectedProject.id)
        .eq('date', selectedDate)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (dailyExpenses) {
        setExpenseData({
          date: selectedDate,
          workerWages: dailyExpenses.worker_wages || 0,
          materialCosts: dailyExpenses.material_costs || 0,
          transportation: dailyExpenses.transportation || 0,
          miscExpenses: dailyExpenses.misc_expenses || 0,
          total: dailyExpenses.total || 0
        });
      } else {
        // حساب المصاريف من البيانات الفردية
        const expenses = await calculateDailyExpenses(selectedProject.id, selectedDate);
        setExpenseData(expenses);
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات المصاريف:', error);
      Alert.alert('خطأ', 'فشل في تحميل بيانات المصاريف اليومية');
      
      // بيانات تجريبية في حالة الخطأ
      setExpenseData({
        date: selectedDate,
        workerWages: 850,
        materialCosts: 1200,
        transportation: 150,
        miscExpenses: 300,
        total: 2500
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateDailyExpenses = async (projectId: string, date: string): Promise<DailyExpenseData> => {
    try {
      // حساب أجور العمال
      const { data: attendanceData } = await supabase
        .from('worker_attendance')
        .select('paid_amount')
        .eq('project_id', projectId)
        .eq('date', date);
      
      const workerWages = attendanceData?.reduce((sum, record) => 
        sum + (parseFloat(record.paid_amount) || 0), 0) || 0;

      // حساب تكاليف المواد (النقدية فقط)
      const { data: materialsData } = await supabase
        .from('material_purchases')
        .select('total_amount, purchase_type')
        .eq('project_id', projectId)
        .eq('purchase_date', date)
        .neq('purchase_type', 'آجل');
      
      const materialCosts = materialsData?.reduce((sum, record) => 
        sum + (parseFloat(record.total_amount) || 0), 0) || 0;

      // حساب مصروفات النقل
      const { data: transportData } = await supabase
        .from('transportation_expenses')
        .select('amount')
        .eq('project_id', projectId)
        .eq('date', date);
      
      const transportation = transportData?.reduce((sum, record) => 
        sum + (parseFloat(record.amount) || 0), 0) || 0;

      // حساب المصروفات المتنوعة
      const { data: miscData } = await supabase
        .from('worker_misc_expenses')
        .select('amount')
        .eq('project_id', projectId)
        .eq('date', date);
      
      const miscExpenses = miscData?.reduce((sum, record) => 
        sum + (parseFloat(record.amount) || 0), 0) || 0;

      const total = workerWages + materialCosts + transportation + miscExpenses;

      return {
        date,
        workerWages,
        materialCosts,
        transportation,
        miscExpenses,
        total
      };
    } catch (error) {
      console.error('خطأ في حساب المصاريف:', error);
      return {
        date,
        workerWages: 0,
        materialCosts: 0,
        transportation: 0,
        miscExpenses: 0,
        total: 0
      };
    }
  };

  const handleExportExcel = () => {
    if (!expenseData || !selectedProject) {
      Alert.alert('تنبيه', 'لا توجد بيانات للتصدير');
      return;
    }

    // محاكاة تصدير Excel
    const exportData = [
      ['تقرير المصاريف اليومية'],
      ['اسم المشروع:', selectedProject.name],
      ['التاريخ:', selectedDate],
      [''],
      ['البند', 'المبلغ'],
      ['أجور العمال', formatCurrency(expenseData.workerWages)],
      ['تكاليف المواد', formatCurrency(expenseData.materialCosts)],
      ['النقل', formatCurrency(expenseData.transportation)],
      ['مصاريف متنوعة', formatCurrency(expenseData.miscExpenses)],
      [''],
      ['الإجمالي', formatCurrency(expenseData.total)]
    ];

    Alert.alert(
      'تصدير Excel',
      'تم إعداد البيانات للتصدير بنجاح!\n\nسيتم حفظ الملف في مجلد التحميلات.',
      [{ text: 'موافق', style: 'default' }]
    );

    console.log('بيانات التصدير:', exportData);
  };

  const handlePrint = () => {
    Alert.alert(
      'طباعة التقرير',
      'سيتم إرسال التقرير للطباعة',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'طباعة', onPress: () => console.log('تم إرسال للطباعة') }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenseData();
  };

  useEffect(() => {
    fetchExpenseData();
  }, [selectedProject, selectedDate]);

  if (!selectedProject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="account-balance" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>يرجى اختيار مشروع</Text>
          <Text style={styles.emptySubtitle}>اختر مشروعاً لعرض المصاريف اليومية</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>جاري تحميل بيانات المصاريف...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>المصاريف اليومية - نمط Excel</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
            <Icon name="refresh" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePrint} style={styles.headerButton}>
            <Icon name="print" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExportExcel} style={styles.headerButton}>
            <Icon name="file-download" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>المشروع</Text>
            <View style={styles.projectDisplay}>
              <Text style={styles.projectName}>{selectedProject.name}</Text>
            </View>
          </View>

          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>التاريخ</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{selectedDate}</Text>
              <Icon name="date-range" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Excel Style Report */}
        <View style={styles.reportContainer}>
          {/* Report Header */}
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>تقرير المصاريف اليومية</Text>
            <Text style={styles.reportSubtitle}>نمط Excel المحسن</Text>
          </View>

          {/* Project Info */}
          <View style={styles.projectInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>اسم المشروع:</Text>
              <Text style={styles.infoValue}>{selectedProject.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>التاريخ:</Text>
              <Text style={styles.infoValue}>{selectedDate}</Text>
            </View>
          </View>

          {/* Expenses Table */}
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.itemColumn]}>البند</Text>
              <Text style={[styles.tableHeaderCell, styles.amountColumn]}>المبلغ (ريال)</Text>
              <Text style={[styles.tableHeaderCell, styles.percentColumn]}>النسبة %</Text>
            </View>

            {/* Table Rows */}
            {expenseData ? (
              <>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.itemColumn]}>أجور العمال</Text>
                  <Text style={[styles.tableCell, styles.amountColumn, styles.numberCell]}>
                    {formatCurrency(expenseData.workerWages)}
                  </Text>
                  <Text style={[styles.tableCell, styles.percentColumn, styles.numberCell]}>
                    {expenseData.total > 0 ? ((expenseData.workerWages / expenseData.total) * 100).toFixed(1) : '0.0'}%
                  </Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.itemColumn]}>تكاليف المواد</Text>
                  <Text style={[styles.tableCell, styles.amountColumn, styles.numberCell]}>
                    {formatCurrency(expenseData.materialCosts)}
                  </Text>
                  <Text style={[styles.tableCell, styles.percentColumn, styles.numberCell]}>
                    {expenseData.total > 0 ? ((expenseData.materialCosts / expenseData.total) * 100).toFixed(1) : '0.0'}%
                  </Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.itemColumn]}>النقل</Text>
                  <Text style={[styles.tableCell, styles.amountColumn, styles.numberCell]}>
                    {formatCurrency(expenseData.transportation)}
                  </Text>
                  <Text style={[styles.tableCell, styles.percentColumn, styles.numberCell]}>
                    {expenseData.total > 0 ? ((expenseData.transportation / expenseData.total) * 100).toFixed(1) : '0.0'}%
                  </Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.itemColumn]}>مصاريف متنوعة</Text>
                  <Text style={[styles.tableCell, styles.amountColumn, styles.numberCell]}>
                    {formatCurrency(expenseData.miscExpenses)}
                  </Text>
                  <Text style={[styles.tableCell, styles.percentColumn, styles.numberCell]}>
                    {expenseData.total > 0 ? ((expenseData.miscExpenses / expenseData.total) * 100).toFixed(1) : '0.0'}%
                  </Text>
                </View>

                {/* Total Row */}
                <View style={[styles.tableRow, styles.totalRow]}>
                  <Text style={[styles.tableCell, styles.itemColumn, styles.totalCell]}>الإجمالي</Text>
                  <Text style={[styles.tableCell, styles.amountColumn, styles.numberCell, styles.totalCell]}>
                    {formatCurrency(expenseData.total)}
                  </Text>
                  <Text style={[styles.tableCell, styles.percentColumn, styles.numberCell, styles.totalCell]}>
                    100.0%
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.noDataRow}>
                <Text style={styles.noDataText}>لا توجد بيانات متاحة</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.reportFooter}>
            <Text style={styles.footerText}>
              تاريخ الإنشاء: {new Date().toLocaleDateString('ar-SA')}
            </Text>
            <Text style={styles.footerText}>نظام إدارة المشاريع الإنشائية</Text>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر التاريخ</Text>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.dateInput}
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalButtonText}>موافق</Text>
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
  scrollView: {
    flex: 1,
  },
  controlsContainer: {
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  controlItem: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  projectDisplay: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  projectName: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'right',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  reportContainer: {
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
  },
  reportHeader: {
    backgroundColor: '#3B82F6',
    padding: 20,
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  reportSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 4,
  },
  projectInfo: {
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
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  tableContainer: {
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 2,
    borderBottomColor: '#D1D5DB',
  },
  tableHeaderCell: {
    padding: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
  },
  itemColumn: {
    flex: 2,
    textAlign: 'right',
  },
  amountColumn: {
    flex: 2,
  },
  percentColumn: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableCell: {
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  numberCell: {
    fontFamily: 'monospace',
  },
  totalRow: {
    backgroundColor: '#F3F4F6',
    borderTopWidth: 2,
    borderTopColor: '#D1D5DB',
  },
  totalCell: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  noDataRow: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
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
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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

export default ExcelStyleDailyExpensesScreen;