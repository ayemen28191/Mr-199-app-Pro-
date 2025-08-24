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

interface DetailedTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense' | 'deferred' | 'transfer_from_project';
  category: string;
  amount: number;
  description: string;
  details: {
    paidTo?: string;
    paymentMethod?: string;
    receiptNumber?: string;
    workerTrade?: string;
    materialUnit?: string;
    quantity?: number;
    unitPrice?: number;
    supplierName?: string;
    notes?: string;
  };
}

interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  totalDeferred: number;
  balance: number;
  transactionCount: number;
  averageTransaction: number;
  categorySummary: { [key: string]: number };
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('SAR', 'ريال');
};

const ProjectTransactionsPage: React.FC = () => {
  const { selectedProject } = useContext(ProjectContext);
  const [transactions, setTransactions] = useState<DetailedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showDateModal, setShowDateModal] = useState(false);

  const fetchDetailedTransactions = async () => {
    try {
      setLoading(true);
      
      if (!selectedProject?.id) {
        setTransactions([]);
        return;
      }

      const allTransactions: DetailedTransaction[] = [];

      // جلب تحويلات العهدة (دخل)
      const { data: fundTransfers } = await supabase
        .from('fund_transfers')
        .select('*')
        .eq('project_id', selectedProject.id)
        .gte('transfer_date', dateRange.startDate)
        .lte('transfer_date', dateRange.endDate)
        .order('transfer_date', { ascending: false });

      fundTransfers?.forEach((transfer: any) => {
        allTransactions.push({
          id: `fund-${transfer.id}`,
          date: transfer.transfer_date,
          type: 'income',
          category: 'تحويل عهدة',
          amount: parseFloat(transfer.amount) || 0,
          description: `تحويل عهدة من ${transfer.sender_name || 'غير محدد'}`,
          details: {
            paidTo: transfer.sender_name,
            paymentMethod: transfer.transfer_method || 'تحويل بنكي',
            receiptNumber: transfer.reference_number,
            notes: transfer.notes
          }
        });
      });

      // جلب أجور العمال مع التفاصيل
      const { data: workerWages } = await supabase
        .from('worker_attendance')
        .select(`
          *,
          workers!inner(name, trade, daily_wage)
        `)
        .eq('project_id', selectedProject.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date', { ascending: false });

      workerWages?.forEach((wage: any) => {
        const amount = parseFloat(wage.paid_amount) || 0;
        if (amount > 0) {
          allTransactions.push({
            id: `wage-${wage.id}`,
            date: wage.date,
            type: 'expense',
            category: 'أجور العمال',
            amount: amount,
            description: `أجور ${wage.workers?.name || 'عامل غير معروف'} - ${wage.attendance_status === 'present' ? 'يوم كامل' : wage.attendance_status === 'half_day' ? 'نصف يوم' : 'غائب'}`,
            details: {
              paidTo: wage.workers?.name,
              workerTrade: wage.workers?.trade,
              paymentMethod: 'نقدي',
              notes: wage.notes,
              unitPrice: wage.workers?.daily_wage
            }
          });
        }
      });

      // جلب مشتريات المواد مع تفاصيل شاملة
      const { data: materials } = await supabase
        .from('material_purchases')
        .select(`
          *,
          materials!inner(name, unit),
          suppliers(name, contact_phone)
        `)
        .eq('project_id', selectedProject.id)
        .gte('purchase_date', dateRange.startDate)
        .lte('purchase_date', dateRange.endDate)
        .order('purchase_date', { ascending: false });

      materials?.forEach((material: any) => {
        const isDeferred = material.purchase_type === 'آجل';
        allTransactions.push({
          id: `material-${material.id}`,
          date: material.purchase_date,
          type: isDeferred ? 'deferred' : 'expense',
          category: isDeferred ? 'مشتريات آجلة' : 'مشتريات المواد',
          amount: parseFloat(material.total_amount) || 0,
          description: `مشتريات ${material.materials?.name || 'مادة غير محددة'} - ${material.quantity || 0} ${material.materials?.unit || 'وحدة'}`,
          details: {
            supplierName: material.suppliers?.name,
            materialUnit: material.materials?.unit,
            quantity: material.quantity,
            unitPrice: parseFloat(material.unit_price) || 0,
            paymentMethod: material.payment_method || 'نقدي',
            receiptNumber: material.invoice_number,
            notes: material.notes
          }
        });
      });

      // جلب مصروفات النقل
      const { data: transportation } = await supabase
        .from('transportation_expenses')
        .select('*')
        .eq('project_id', selectedProject.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date', { ascending: false });

      transportation?.forEach((transport: any) => {
        allTransactions.push({
          id: `transport-${transport.id}`,
          date: transport.date,
          type: 'expense',
          category: 'مصروفات النقل',
          amount: parseFloat(transport.amount) || 0,
          description: `نقل - ${transport.description || 'مصروف نقل'}`,
          details: {
            paidTo: transport.driver_name,
            paymentMethod: 'نقدي',
            notes: transport.notes
          }
        });
      });

      // جلب المصروفات المتنوعة
      const { data: miscExpenses } = await supabase
        .from('worker_misc_expenses')
        .select('*')
        .eq('project_id', selectedProject.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date', { ascending: false });

      miscExpenses?.forEach((misc: any) => {
        allTransactions.push({
          id: `misc-${misc.id}`,
          date: misc.date,
          type: 'expense',
          category: 'مصروفات متنوعة',
          amount: parseFloat(misc.amount) || 0,
          description: `متنوع - ${misc.description || misc.worker_name || 'مصروف متنوع'}`,
          details: {
            paidTo: misc.worker_name,
            paymentMethod: 'نقدي',
            notes: misc.notes
          }
        });
      });

      // ترتيب المعاملات حسب التاريخ والمبلغ
      const sortedTransactions = allTransactions
        .filter(t => t.date && !isNaN(new Date(t.date).getTime()))
        .sort((a, b) => {
          const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
          return dateComparison !== 0 ? dateComparison : b.amount - a.amount;
        });

      setTransactions(sortedTransactions);
    } catch (error) {
      console.error('خطأ في جلب المعاملات المفصلة:', error);
      Alert.alert('خطأ', 'فشل في تحميل معاملات المشروع المفصلة');
      
      // بيانات تجريبية
      setTransactions([
        {
          id: '1',
          date: '2025-08-23',
          type: 'income',
          category: 'تحويل عهدة',
          amount: 10000,
          description: 'تحويل عهدة من إدارة المشروع',
          details: {
            paidTo: 'إدارة المشروع',
            paymentMethod: 'تحويل بنكي',
            receiptNumber: 'TR-001'
          }
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // تطبيق الفلاتر والبحث
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        t.details.paidTo?.toLowerCase().includes(searchLower) ||
        t.details.supplierName?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [transactions, filterType, searchTerm]);

  // حساب الملخص
  const summary = useMemo((): TransactionSummary => {
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalDeferred = filteredTransactions.filter(t => t.type === 'deferred').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;
    const transactionCount = filteredTransactions.length;
    const averageTransaction = transactionCount > 0 ? (totalIncome + totalExpenses + totalDeferred) / transactionCount : 0;

    const categorySummary: { [key: string]: number } = {};
    filteredTransactions.forEach(t => {
      categorySummary[t.category] = (categorySummary[t.category] || 0) + t.amount;
    });

    return {
      totalIncome,
      totalExpenses,
      totalDeferred,
      balance,
      transactionCount,
      averageTransaction,
      categorySummary
    };
  }, [filteredTransactions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetailedTransactions();
  };

  useEffect(() => {
    fetchDetailedTransactions();
  }, [selectedProject, dateRange]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income': return 'trending-up';
      case 'expense': return 'trending-down';
      case 'deferred': return 'schedule';
      default: return 'payment';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'income': return '#10B981';
      case 'expense': return '#EF4444';
      case 'deferred': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const renderTransaction = ({ item }: { item: DetailedTransaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionMainInfo}>
          <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(item.type) + '20' }]}>
            <Icon name={getTransactionIcon(item.type)} size={16} color={getTransactionColor(item.type)} />
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionDescription}>{item.description}</Text>
            <Text style={styles.transactionCategory}>{item.category}</Text>
            <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString('ar-SA')}</Text>
          </View>
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[styles.amountText, { color: getTransactionColor(item.type) }]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
      </View>

      {/* Transaction Details */}
      <View style={styles.transactionExtendedDetails}>
        {item.details.paidTo && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>المدفوع إلى:</Text>
            <Text style={styles.detailValue}>{item.details.paidTo}</Text>
          </View>
        )}
        {item.details.supplierName && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>المورد:</Text>
            <Text style={styles.detailValue}>{item.details.supplierName}</Text>
          </View>
        )}
        {item.details.quantity && item.details.unitPrice && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>التفاصيل:</Text>
            <Text style={styles.detailValue}>
              {item.details.quantity} {item.details.materialUnit || 'وحدة'} × {formatCurrency(item.details.unitPrice)}
            </Text>
          </View>
        )}
        {item.details.paymentMethod && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>طريقة الدفع:</Text>
            <Text style={styles.detailValue}>{item.details.paymentMethod}</Text>
          </View>
        )}
        {item.details.receiptNumber && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>رقم الإيصال:</Text>
            <Text style={styles.detailValue}>{item.details.receiptNumber}</Text>
          </View>
        )}
        {item.details.notes && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ملاحظات:</Text>
            <Text style={styles.detailValue}>{item.details.notes}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (!selectedProject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="account-balance" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>يرجى اختيار مشروع</Text>
          <Text style={styles.emptySubtitle}>اختر مشروعاً لعرض المعاملات المفصلة</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>جاري تحميل المعاملات المفصلة...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>معاملات المشروع المفصلة</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowDateModal(true)} style={styles.headerButton}>
            <Icon name="date-range" size={20} color="#6B7280" />
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
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Icon name="trending-up" size={16} color="white" />
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalIncome)}</Text>
            <Text style={styles.summaryLabel}>إجمالي الدخل</Text>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Icon name="trending-down" size={16} color="white" />
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalExpenses)}</Text>
            <Text style={styles.summaryLabel}>إجمالي المصاريف</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, summary.balance >= 0 ? styles.balancePositiveCard : styles.balanceNegativeCard]}>
            <Icon name="account-balance-wallet" size={16} color="white" />
            <Text style={styles.summaryValue}>{formatCurrency(summary.balance)}</Text>
            <Text style={styles.summaryLabel}>الرصيد</Text>
          </View>
          <View style={[styles.summaryCard, styles.countCard]}>
            <Icon name="receipt" size={16} color="white" />
            <Text style={styles.summaryValue}>{summary.transactionCount}</Text>
            <Text style={styles.summaryLabel}>العمليات</Text>
          </View>
        </View>
      </View>

      {/* Project Info */}
      <View style={styles.projectInfo}>
        <Text style={styles.projectName}>{selectedProject.name}</Text>
        <Text style={styles.dateRangeText}>
          {dateRange.startDate} إلى {dateRange.endDate}
        </Text>
      </View>

      {/* Transactions List */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>تفاصيل المعاملات</Text>
          <Text style={styles.transactionCount}>{filteredTransactions.length} معاملة</Text>
        </View>

        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyTransactions}>
            <Icon name="receipt" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTransactionsTitle}>لا توجد معاملات</Text>
            <Text style={styles.emptyTransactionsSubtitle}>
              لا توجد معاملات مطابقة للفلاتر المحددة
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
              <Text style={styles.modalTitle}>تصفية المعاملات</Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>نوع المعاملة</Text>
              {[
                { value: 'all', label: 'جميع المعاملات' },
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
                placeholder="ابحث في الوصف، المورد، أو المدفوع إليه..."
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
                  value={dateRange.startDate}
                  onChangeText={(text) => setDateRange({...dateRange, startDate: text})}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateInputLabel}>إلى تاريخ</Text>
                <TextInput
                  style={styles.dateInput}
                  value={dateRange.endDate}
                  onChangeText={(text) => setDateRange({...dateRange, endDate: text})}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowDateModal(false)}
            >
              <Text style={styles.modalButtonText}>تطبيق</Text>
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
  countCard: {
    backgroundColor: '#8B5CF6',
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
  projectInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  projectName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
  },
  dateRangeText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 2,
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
  },
  listContent: {
    paddingBottom: 16,
  },
  transactionCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionMainInfo: {
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
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 2,
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
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  transactionExtendedDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 10,
    color: '#1F2937',
    flex: 2,
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
});

export default ProjectTransactionsPage;