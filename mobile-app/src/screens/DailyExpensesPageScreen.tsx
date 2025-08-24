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

interface DailyExpenseEntry {
  id: string;
  date: string;
  category: 'worker_wages' | 'materials' | 'transportation' | 'miscellaneous';
  description: string;
  amount: number;
  paidTo?: string;
  paymentMethod?: 'cash' | 'bank_transfer' | 'check';
  receiptNumber?: string;
}

interface DailySummary {
  date: string;
  totalWorkerWages: number;
  totalMaterials: number;
  totalTransportation: number;
  totalMiscellaneous: number;
  grandTotal: number;
  entriesCount: number;
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

const DailyExpensesPageScreen: React.FC = () => {
  const { selectedProject } = useContext(ProjectContext);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [expenses, setExpenses] = useState<DailyExpenseEntry[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchDailyExpenses = async () => {
    try {
      setLoading(true);
      
      if (!selectedProject?.id) {
        setExpenses([]);
        setSummary(null);
        return;
      }

      const allExpenses: DailyExpenseEntry[] = [];

      // جلب أجور العمال
      const { data: workerWages } = await supabase
        .from('worker_attendance')
        .select(`
          *,
          workers!inner(name)
        `)
        .eq('project_id', selectedProject.id)
        .eq('date', selectedDate);

      workerWages?.forEach((wage: any) => {
        const amount = parseFloat(wage.paid_amount) || 0;
        if (amount > 0) {
          allExpenses.push({
            id: `wage-${wage.id}`,
            date: selectedDate,
            category: 'worker_wages',
            description: `أجور - ${wage.workers?.name || 'عامل غير معروف'}`,
            amount: amount,
            paidTo: wage.workers?.name,
            paymentMethod: 'cash'
          });
        }
      });

      // جلب مشتريات المواد (النقدية فقط)
      const { data: materials } = await supabase
        .from('material_purchases')
        .select(`
          *,
          materials!inner(name),
          suppliers(name)
        `)
        .eq('project_id', selectedProject.id)
        .eq('purchase_date', selectedDate)
        .neq('purchase_type', 'آجل');

      materials?.forEach((material: any) => {
        allExpenses.push({
          id: `material-${material.id}`,
          date: selectedDate,
          category: 'materials',
          description: `مواد - ${material.materials?.name || 'مادة غير محددة'}`,
          amount: parseFloat(material.total_amount) || 0,
          paidTo: material.suppliers?.name || 'مورد غير محدد',
          paymentMethod: material.payment_method || 'cash',
          receiptNumber: material.invoice_number
        });
      });

      // جلب مصروفات النقل
      const { data: transportation } = await supabase
        .from('transportation_expenses')
        .select('*')
        .eq('project_id', selectedProject.id)
        .eq('date', selectedDate);

      transportation?.forEach((transport: any) => {
        allExpenses.push({
          id: `transport-${transport.id}`,
          date: selectedDate,
          category: 'transportation',
          description: `نقل - ${transport.description || 'مصروف نقل'}`,
          amount: parseFloat(transport.amount) || 0,
          paidTo: transport.driver_name || 'سائق غير محدد',
          paymentMethod: 'cash'
        });
      });

      // جلب المصروفات المتنوعة
      const { data: miscellaneous } = await supabase
        .from('worker_misc_expenses')
        .select('*')
        .eq('project_id', selectedProject.id)
        .eq('date', selectedDate);

      miscellaneous?.forEach((misc: any) => {
        allExpenses.push({
          id: `misc-${misc.id}`,
          date: selectedDate,
          category: 'miscellaneous',
          description: `متنوع - ${misc.description || misc.worker_name || 'مصروف متنوع'}`,
          amount: parseFloat(misc.amount) || 0,
          paidTo: misc.worker_name || 'غير محدد',
          paymentMethod: 'cash'
        });
      });

      // ترتيب المصروفات حسب المبلغ
      const sortedExpenses = allExpenses.sort((a, b) => b.amount - a.amount);
      setExpenses(sortedExpenses);

      // حساب الملخص
      const totalWorkerWages = allExpenses.filter(e => e.category === 'worker_wages').reduce((sum, e) => sum + e.amount, 0);
      const totalMaterials = allExpenses.filter(e => e.category === 'materials').reduce((sum, e) => sum + e.amount, 0);
      const totalTransportation = allExpenses.filter(e => e.category === 'transportation').reduce((sum, e) => sum + e.amount, 0);
      const totalMiscellaneous = allExpenses.filter(e => e.category === 'miscellaneous').reduce((sum, e) => sum + e.amount, 0);
      const grandTotal = totalWorkerWages + totalMaterials + totalTransportation + totalMiscellaneous;

      setSummary({
        date: selectedDate,
        totalWorkerWages,
        totalMaterials,
        totalTransportation,
        totalMiscellaneous,
        grandTotal,
        entriesCount: allExpenses.length
      });

    } catch (error) {
      console.error('خطأ في جلب المصروفات اليومية:', error);
      Alert.alert('خطأ', 'فشل في تحميل المصروفات اليومية');
      
      // بيانات تجريبية
      const mockExpenses: DailyExpenseEntry[] = [
        {
          id: '1',
          date: selectedDate,
          category: 'worker_wages',
          description: 'أجور - أحمد محمد',
          amount: 200,
          paidTo: 'أحمد محمد',
          paymentMethod: 'cash'
        },
        {
          id: '2',
          date: selectedDate,
          category: 'materials',
          description: 'مواد - أسمنت',
          amount: 500,
          paidTo: 'مورد الأسمنت',
          paymentMethod: 'cash'
        }
      ];
      setExpenses(mockExpenses);
      setSummary({
        date: selectedDate,
        totalWorkerWages: 200,
        totalMaterials: 500,
        totalTransportation: 0,
        totalMiscellaneous: 0,
        grandTotal: 700,
        entriesCount: 2
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDailyExpenses();
  };

  useEffect(() => {
    fetchDailyExpenses();
  }, [selectedProject, selectedDate]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'worker_wages': return 'people';
      case 'materials': return 'build';
      case 'transportation': return 'local-shipping';
      case 'miscellaneous': return 'receipt';
      default: return 'payment';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'worker_wages': return '#3B82F6';
      case 'materials': return '#10B981';
      case 'transportation': return '#F59E0B';
      case 'miscellaneous': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'worker_wages': return 'أجور العمال';
      case 'materials': return 'المواد';
      case 'transportation': return 'النقل';
      case 'miscellaneous': return 'متنوعة';
      default: return 'غير محدد';
    }
  };

  const getPaymentMethodText = (method?: string) => {
    switch (method) {
      case 'cash': return 'نقدي';
      case 'bank_transfer': return 'تحويل بنكي';
      case 'check': return 'شيك';
      default: return 'نقدي';
    }
  };

  const filteredExpenses = filterCategory === 'all' 
    ? expenses 
    : expenses.filter(expense => expense.category === filterCategory);

  const renderExpense = ({ item }: { item: DailyExpenseEntry }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
            <Icon name={getCategoryIcon(item.category)} size={16} color={getCategoryColor(item.category)} />
          </View>
          <View style={styles.expenseDetails}>
            <Text style={styles.expenseDescription}>{item.description}</Text>
            <Text style={styles.expenseCategory}>{getCategoryName(item.category)}</Text>
            <View style={styles.expenseMetadata}>
              <Text style={styles.metadataText}>إلى: {item.paidTo || 'غير محدد'}</Text>
              <Text style={styles.metadataText}>الطريقة: {getPaymentMethodText(item.paymentMethod)}</Text>
              {item.receiptNumber && (
                <Text style={styles.metadataText}>إيصال: {item.receiptNumber}</Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.expenseAmount}>
          <Text style={[styles.amountText, { color: getCategoryColor(item.category) }]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
      </View>
    </View>
  );

  if (!selectedProject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="receipt" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>يرجى اختيار مشروع</Text>
          <Text style={styles.emptySubtitle}>اختر مشروعاً لعرض المصروفات اليومية</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>جاري تحميل المصروفات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>صفحة المصروفات اليومية</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
          <Icon name="refresh" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlRow}>
          <View style={styles.projectInfo}>
            <Text style={styles.projectLabel}>المشروع:</Text>
            <Text style={styles.projectName}>{selectedProject.name}</Text>
          </View>
        </View>
        
        <View style={styles.controlRow}>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{selectedDate}</Text>
            <Icon name="date-range" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => {/* Show filter modal */}}
          >
            <Icon name="filter-list" size={20} color="#6B7280" />
            <Text style={styles.filterText}>تصفية</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Cards */}
      {summary && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.totalCard]}>
              <Icon name="account-balance-wallet" size={16} color="white" />
              <Text style={styles.summaryValue}>{formatCurrency(summary.grandTotal)}</Text>
              <Text style={styles.summaryLabel}>الإجمالي</Text>
            </View>
            <View style={[styles.summaryCard, styles.entriesCard]}>
              <Icon name="receipt" size={16} color="white" />
              <Text style={styles.summaryValue}>{summary.entriesCount}</Text>
              <Text style={styles.summaryLabel}>العمليات</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.workersCard]}>
              <Icon name="people" size={16} color="white" />
              <Text style={styles.summaryValue}>{formatCurrency(summary.totalWorkerWages)}</Text>
              <Text style={styles.summaryLabel}>الأجور</Text>
            </View>
            <View style={[styles.summaryCard, styles.materialsCard]}>
              <Icon name="build" size={16} color="white" />
              <Text style={styles.summaryValue}>{formatCurrency(summary.totalMaterials)}</Text>
              <Text style={styles.summaryLabel}>المواد</Text>
            </View>
          </View>
        </View>
      )}

      {/* Expenses List */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>تفاصيل المصروفات</Text>
          <Text style={styles.expenseCount}>{filteredExpenses.length} مصروف</Text>
        </View>

        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyExpenses}>
            <Icon name="receipt" size={48} color="#9CA3AF" />
            <Text style={styles.emptyExpensesTitle}>لا توجد مصروفات</Text>
            <Text style={styles.emptyExpensesSubtitle}>
              لا توجد مصروفات مسجلة لهذا التاريخ
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredExpenses}
            renderItem={renderExpense}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

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
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.modalButtonText}>موافق</Text>
            </TouchableOpacity>
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
  headerButton: {
    padding: 8,
  },
  controlsContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  projectName: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    textAlign: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
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
  totalCard: {
    backgroundColor: '#3B82F6',
  },
  entriesCard: {
    backgroundColor: '#8B5CF6',
  },
  workersCard: {
    backgroundColor: '#F59E0B',
  },
  materialsCard: {
    backgroundColor: '#10B981',
  },
  summaryValue: {
    fontSize: 12,
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
  expenseCount: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyExpenses: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyExpensesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyExpensesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  expenseCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 6,
  },
  expenseMetadata: {
    gap: 2,
  },
  metadataText: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
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
  modalButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DailyExpensesPageScreen;