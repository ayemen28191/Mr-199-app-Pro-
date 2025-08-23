import React, { useState, useEffect, useContext, useMemo } from 'react';
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

interface Project {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense' | 'deferred' | 'transfer_from_project';
  category: string;
  amount: number;
  description: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('SAR', 'ريال');
};

const ProjectTransactionsSimple: React.FC = () => {
  const { selectedProject, projects } = useContext(ProjectContext);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      if (!selectedProject?.id) {
        setTransactions([]);
        return;
      }

      const allTransactions: Transaction[] = [];

      // جلب تحويلات العهدة العادية (دخل)
      const { data: fundTransfers } = await supabase
        .from('fund_transfers')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('transfer_date', { ascending: false });

      fundTransfers?.forEach((transfer: any) => {
        if (transfer.transfer_date && transfer.amount && !isNaN(parseFloat(transfer.amount))) {
          allTransactions.push({
            id: `fund-${transfer.id}`,
            date: transfer.transfer_date,
            type: 'income',
            category: 'تحويل عهدة',
            amount: parseFloat(transfer.amount),
            description: `من: ${transfer.sender_name || 'غير محدد'}`
          });
        }
      });

      // جلب أجور العمال (مصروف)
      const { data: workerAttendance } = await supabase
        .from('worker_attendance')
        .select(`
          *,
          workers!inner(name)
        `)
        .eq('project_id', selectedProject.id)
        .order('date', { ascending: false });

      workerAttendance?.forEach((attendance: any) => {
        if (attendance.date && attendance.paid_amount !== null) {
          const amount = parseFloat(attendance.paid_amount) || 0;
          allTransactions.push({
            id: `wage-${attendance.id}`,
            date: attendance.date,
            type: 'expense',
            category: 'أجور العمال',
            amount: amount,
            description: `${attendance.workers?.name || 'عامل غير معروف'}${amount === 0 ? ' (لم يُدفع)' : ''}`
          });
        }
      });

      // جلب مشتريات المواد
      const { data: materialPurchases } = await supabase
        .from('material_purchases')
        .select(`
          *,
          materials!inner(name)
        `)
        .eq('project_id', selectedProject.id)
        .order('purchase_date', { ascending: false });

      materialPurchases?.forEach((purchase: any) => {
        if (purchase.purchase_date && purchase.total_amount && !isNaN(parseFloat(purchase.total_amount))) {
          const isDeferred = purchase.purchase_type === 'آجل';
          allTransactions.push({
            id: `material-${purchase.id}`,
            date: purchase.purchase_date,
            type: isDeferred ? 'deferred' : 'expense',
            category: isDeferred ? 'مشتريات آجلة' : 'مشتريات المواد',
            amount: parseFloat(purchase.total_amount),
            description: `مادة: ${purchase.materials?.name || 'غير محدد'}${isDeferred ? ' (آجل)' : ''}`
          });
        }
      });

      // جلب مصروفات النقل
      const { data: transportExpenses } = await supabase
        .from('transportation_expenses')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('date', { ascending: false });

      transportExpenses?.forEach((expense: any) => {
        if (expense.date && expense.amount && !isNaN(parseFloat(expense.amount))) {
          allTransactions.push({
            id: `transport-${expense.id}`,
            date: expense.date,
            type: 'expense',
            category: 'مصروفات النقل',
            amount: parseFloat(expense.amount),
            description: `نقل: ${expense.description || 'غير محدد'}`
          });
        }
      });

      // جلب المصروفات المتنوعة
      const { data: miscExpenses } = await supabase
        .from('worker_misc_expenses')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('date', { ascending: false });

      miscExpenses?.forEach((expense: any) => {
        if (expense.date && expense.amount && !isNaN(parseFloat(expense.amount))) {
          allTransactions.push({
            id: `misc-${expense.id}`,
            date: expense.date,
            type: 'expense',
            category: 'مصروفات متنوعة',
            amount: parseFloat(expense.amount),
            description: `متنوع: ${expense.description || expense.worker_name || 'غير محدد'}`
          });
        }
      });

      // ترتيب المعاملات حسب التاريخ
      const sortedTransactions = allTransactions
        .filter(t => t.date && !isNaN(new Date(t.date).getTime()))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(sortedTransactions);
    } catch (error) {
      console.error('خطأ في جلب المعاملات:', error);
      Alert.alert('خطأ', 'فشل في تحميل معاملات المشروع');
      
      // بيانات تجريبية
      setTransactions([
        {
          id: '1',
          date: '2025-08-23',
          type: 'income',
          category: 'تحويل عهدة',
          amount: 5000,
          description: 'من: إدارة المشروع'
        },
        {
          id: '2',
          date: '2025-08-23',
          type: 'expense',
          category: 'أجور العمال',
          amount: 850,
          description: 'أحمد محمد - نجار'
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // تطبيق الفلاتر
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [transactions, filterType, searchTerm]);

  // حساب الإجماليات
  const totals = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const transferFromProject = filteredTransactions.filter(t => t.type === 'transfer_from_project').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const deferred = filteredTransactions.filter(t => t.type === 'deferred').reduce((sum, t) => sum + t.amount, 0);
    
    const totalIncome = income + transferFromProject;
    
    return { 
      income,
      transferFromProject,
      totalIncome,
      expenses,
      deferred,
      balance: totalIncome - expenses
    };
  }, [filteredTransactions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedProject]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income': return 'trending-up';
      case 'transfer_from_project': return 'business';
      case 'expense': return 'trending-down';
      case 'deferred': return 'schedule';
      default: return 'help';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'income': return '#10B981';
      case 'transfer_from_project': return '#0891B2';
      case 'expense': return '#EF4444';
      case 'deferred': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(item.type) + '20' }]}>
            <Icon name={getTransactionIcon(item.type)} size={16} color={getTransactionColor(item.type)} />
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionCategory}>{item.category}</Text>
            <Text style={styles.transactionDescription} numberOfLines={2}>{item.description}</Text>
            <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString('ar-SA')}</Text>
          </View>
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[styles.amountText, { color: getTransactionColor(item.type) }]}>
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
          <Icon name="account-balance" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>يرجى اختيار مشروع</Text>
          <Text style={styles.emptySubtitle}>اختر مشروعاً لعرض المعاملات المالية</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>جاري تحميل المعاملات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>معاملات المشروع - {selectedProject.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.headerButton}>
            <Icon name="filter-list" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
            <Icon name="refresh" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.incomeCard]}>
            <Icon name="trending-up" size={20} color="white" />
            <Text style={styles.statValue}>{formatCurrency(totals.totalIncome)}</Text>
            <Text style={styles.statLabel}>إجمالي الدخل</Text>
          </View>
          <View style={[styles.statCard, styles.expenseCard]}>
            <Icon name="trending-down" size={20} color="white" />
            <Text style={styles.statValue}>{formatCurrency(totals.expenses)}</Text>
            <Text style={styles.statLabel}>إجمالي المصاريف</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, totals.balance >= 0 ? styles.balancePositiveCard : styles.balanceNegativeCard]}>
            <Icon name="account-balance-wallet" size={20} color="white" />
            <Text style={styles.statValue}>{formatCurrency(totals.balance)}</Text>
            <Text style={styles.statLabel}>الرصيد النهائي</Text>
          </View>
          <View style={[styles.statCard, styles.deferredCard]}>
            <Icon name="schedule" size={20} color="white" />
            <Text style={styles.statValue}>{formatCurrency(totals.deferred)}</Text>
            <Text style={styles.statLabel}>المشتريات الآجلة</Text>
          </View>
        </View>
      </View>

      {/* Transactions List */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>سجل العمليات</Text>
          <Text style={styles.transactionCount}>{filteredTransactions.length} عملية</Text>
        </View>

        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyTransactions}>
            <Icon name="receipt" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTransactionsTitle}>لا توجد عمليات مالية</Text>
            <Text style={styles.emptyTransactionsSubtitle}>
              {selectedProject ? 'هذا المشروع لا يحتوي على عمليات مالية مسجلة بعد' : 'يرجى اختيار مشروع لعرض العمليات المالية'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTransactions}
            renderItem={renderTransaction}
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
              <Text style={styles.modalTitle}>تصفية العمليات</Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>نوع العملية</Text>
              {[
                { value: 'all', label: 'جميع العمليات' },
                { value: 'income', label: 'الدخل فقط' },
                { value: 'expense', label: 'المصاريف فقط' },
                { value: 'deferred', label: 'المشتريات الآجلة' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.filterOption, filterType === option.value && styles.selectedFilterOption]}
                  onPress={() => setFilterType(option.value)}
                >
                  <Text style={[styles.filterOptionText, filterType === option.value && styles.selectedFilterOptionText]}>
                    {option.label}
                  </Text>
                  {filterType === option.value && <Icon name="check" size={20} color="#3B82F6" />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>البحث</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="ابحث في الوصف..."
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.modalButtonText}>تطبيق الفلاتر</Text>
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  incomeCard: {
    backgroundColor: '#10B981',
  },
  expenseCard: {
    backgroundColor: '#EF4444',
  },
  balancePositiveCard: {
    backgroundColor: '#3B82F6',
  },
  balanceNegativeCard: {
    backgroundColor: '#F59E0B',
  },
  deferredCard: {
    backgroundColor: '#8B5CF6',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  transactionCount: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTransactionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyTransactionsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 16,
  },
  transactionCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
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
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  selectedFilterOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  selectedFilterOptionText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlign: 'right',
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

export default ProjectTransactionsSimple;