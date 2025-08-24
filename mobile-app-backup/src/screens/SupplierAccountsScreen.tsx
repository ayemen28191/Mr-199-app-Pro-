import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Picker,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';

interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  notes?: string;
}

interface SupplierBalance {
  supplierId: string;
  supplierName: string;
  totalPurchases: number;
  totalPaid: number;
  currentBalance: number;
  lastTransactionDate?: string;
}

interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  checkNumber?: string;
  notes?: string;
}

interface SupplierTransaction {
  id: string;
  supplierId: string;
  type: 'purchase' | 'payment';
  amount: number;
  date: string;
  description: string;
  invoiceNumber?: string;
}

export default function SupplierAccountsScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  
  // الحالات الأساسية
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'balances' | 'payments' | 'transactions'>('balances');
  
  // البيانات
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierBalances, setSupplierBalances] = useState<SupplierBalance[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  // نموذج الدفعة
  const [paymentForm, setPaymentForm] = useState({
    supplierId: '',
    amount: '',
    paymentMethod: 'cash',
    checkNumber: '',
    notes: '',
  });

  // تحميل البيانات
  const loadData = async () => {
    try {
      setLoading(true);
      
      // تحميل الموردين
      const suppliersResponse = await fetch('/api/suppliers');
      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json();
        setSuppliers(suppliersData);
      }
      
      // تحميل أرصدة الموردين
      const balancesResponse = await fetch(`/api/supplier-balances?projectId=${selectedProjectId || ''}`);
      if (balancesResponse.ok) {
        const balancesData = await balancesResponse.json();
        setSupplierBalances(balancesData);
      }
      
      // تحميل دفعات الموردين
      const paymentsResponse = await fetch(`/api/supplier-payments?projectId=${selectedProjectId || ''}`);
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setSupplierPayments(paymentsData);
      }
      
      // تحميل معاملات الموردين
      const transactionsResponse = await fetch(`/api/supplier-transactions?projectId=${selectedProjectId || ''}`);
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setSupplierTransactions(transactionsData);
      }
      
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      Alert.alert('خطأ', 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  // إضافة دفعة جديدة
  const addPayment = async () => {
    if (!paymentForm.supplierId || !paymentForm.amount) {
      Alert.alert('خطأ', 'يرجى ملء البيانات المطلوبة');
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/supplier-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentForm,
          amount,
          projectId: selectedProjectId,
          paymentDate: new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        const newPayment = await response.json();
        setSupplierPayments(prev => [...prev, newPayment]);
        
        // تحديث رصيد المورد
        setSupplierBalances(prev => prev.map(balance => 
          balance.supplierId === paymentForm.supplierId 
            ? { 
                ...balance, 
                totalPaid: balance.totalPaid + amount,
                currentBalance: balance.currentBalance - amount,
                lastTransactionDate: new Date().toISOString().split('T')[0]
              }
            : balance
        ));
        
        resetPaymentForm();
        setPaymentModalVisible(false);
        Alert.alert('نجح', 'تم تسجيل الدفعة بنجاح');
      }
    } catch (error) {
      console.error('خطأ في تسجيل الدفعة:', error);
      Alert.alert('خطأ', 'فشل في تسجيل الدفعة');
    } finally {
      setSaving(false);
    }
  };

  // إعادة تعيين نموذج الدفع
  const resetPaymentForm = () => {
    setPaymentForm({
      supplierId: '',
      amount: '',
      paymentMethod: 'cash',
      checkNumber: '',
      notes: '',
    });
  };

  // فتح نموذج الدفعة
  const openPaymentModal = (supplier?: Supplier) => {
    if (supplier) {
      setPaymentForm(prev => ({ ...prev, supplierId: supplier.id }));
      setSelectedSupplier(supplier);
    }
    setPaymentModalVisible(true);
  };

  // عرض معاملات المورد
  const viewSupplierTransactions = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setTransactionModalVisible(true);
  };

  // تنسيق العملة
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-SA')} ر.س`;
  };

  // الحصول على لون الرصيد
  const getBalanceColor = (balance: number) => {
    if (balance > 0) return colors.error; // المورد له دين علينا
    if (balance < 0) return colors.success; // دفعنا أكثر مما اشترينا
    return colors.textSecondary;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري تحميل حسابات الموردين...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* عنوان الشاشة */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>حسابات الموردين</Text>
        <TouchableOpacity
          style={[styles.addPaymentButton, { backgroundColor: colors.primary }]}
          onPress={() => openPaymentModal()}
        >
          <Text style={[styles.addPaymentText, { color: colors.surface }]}>+ دفعة</Text>
        </TouchableOpacity>
      </View>

      {/* التبويبات */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'balances' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedTab('balances')}
        >
          <Text style={[styles.tabText, { 
            color: selectedTab === 'balances' ? colors.surface : colors.text 
          }]}>
            الأرصدة
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'payments' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedTab('payments')}
        >
          <Text style={[styles.tabText, { 
            color: selectedTab === 'payments' ? colors.surface : colors.text 
          }]}>
            الدفعات ({supplierPayments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'transactions' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedTab('transactions')}
        >
          <Text style={[styles.tabText, { 
            color: selectedTab === 'transactions' ? colors.surface : colors.text 
          }]}>
            المعاملات
          </Text>
        </TouchableOpacity>
      </View>

      {/* المحتوى */}
      <ScrollView style={styles.content}>
        {selectedTab === 'balances' && (
          <View>
            {supplierBalances.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  لا توجد أرصدة موردين
                </Text>
              </View>
            ) : (
              supplierBalances.map((balance) => (
                <View key={balance.supplierId} style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.balanceHeader}>
                    <Text style={[styles.supplierName, { color: colors.text }]}>{balance.supplierName}</Text>
                    <Text style={[styles.currentBalance, { color: getBalanceColor(balance.currentBalance) }]}>
                      {formatCurrency(Math.abs(balance.currentBalance))}
                    </Text>
                  </View>
                  
                  <View style={styles.balanceDetails}>
                    <View style={styles.balanceRow}>
                      <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>إجمالي المشتريات:</Text>
                      <Text style={[styles.balanceValue, { color: colors.error }]}>
                        {formatCurrency(balance.totalPurchases)}
                      </Text>
                    </View>
                    
                    <View style={styles.balanceRow}>
                      <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>إجمالي المدفوع:</Text>
                      <Text style={[styles.balanceValue, { color: colors.success }]}>
                        {formatCurrency(balance.totalPaid)}
                      </Text>
                    </View>
                    
                    <View style={[styles.balanceRow, styles.debtRow]}>
                      <Text style={[styles.balanceLabel, styles.debtLabel, { color: colors.text }]}>
                        {balance.currentBalance > 0 ? 'المستحق لنا:' : balance.currentBalance < 0 ? 'المستحق للمورد:' : 'لا يوجد مستحقات'}
                      </Text>
                      <Text style={[styles.balanceValue, styles.debtValue, { 
                        color: getBalanceColor(balance.currentBalance) 
                      }]}>
                        {balance.currentBalance !== 0 ? formatCurrency(Math.abs(balance.currentBalance)) : ''}
                      </Text>
                    </View>
                    
                    {balance.lastTransactionDate && (
                      <View style={styles.balanceRow}>
                        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>آخر معاملة:</Text>
                        <Text style={[styles.balanceValue, { color: colors.text }]}>
                          {new Date(balance.lastTransactionDate).toLocaleDateString('ar-SA')}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.balanceActions}>
                    <TouchableOpacity
                      style={[styles.miniActionButton, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        const supplier = suppliers.find(s => s.id === balance.supplierId);
                        if (supplier) openPaymentModal(supplier);
                      }}
                    >
                      <Text style={[styles.miniActionText, { color: colors.surface }]}>دفع</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.miniActionButton, { backgroundColor: colors.secondary }]}
                      onPress={() => {
                        const supplier = suppliers.find(s => s.id === balance.supplierId);
                        if (supplier) viewSupplierTransactions(supplier);
                      }}
                    >
                      <Text style={[styles.miniActionText, { color: colors.text }]}>المعاملات</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {selectedTab === 'payments' && (
          <View>
            {supplierPayments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  لا توجد دفعات مسجلة
                </Text>
              </View>
            ) : (
              supplierPayments.map((payment) => (
                <View key={payment.id} style={[styles.paymentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.paymentHeader}>
                    <Text style={[styles.paymentSupplier, { color: colors.text }]}>{payment.supplierName}</Text>
                    <Text style={[styles.paymentAmount, { color: colors.success }]}>
                      {formatCurrency(payment.amount)}
                    </Text>
                  </View>
                  
                  <View style={styles.paymentDetails}>
                    <View style={styles.paymentRow}>
                      <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>طريقة الدفع:</Text>
                      <Text style={[styles.paymentValue, { color: colors.text }]}>
                        {payment.paymentMethod === 'cash' ? 'نقد' : 
                         payment.paymentMethod === 'bank' ? 'تحويل بنكي' :
                         payment.paymentMethod === 'check' ? 'شيك' : payment.paymentMethod}
                      </Text>
                    </View>
                    
                    <View style={styles.paymentRow}>
                      <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>التاريخ:</Text>
                      <Text style={[styles.paymentValue, { color: colors.text }]}>
                        {new Date(payment.paymentDate).toLocaleDateString('ar-SA')}
                      </Text>
                    </View>
                    
                    {payment.checkNumber && (
                      <View style={styles.paymentRow}>
                        <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>رقم الشيك:</Text>
                        <Text style={[styles.paymentValue, { color: colors.text }]}>{payment.checkNumber}</Text>
                      </View>
                    )}
                    
                    {payment.notes && (
                      <Text style={[styles.paymentNotes, { color: colors.textSecondary }]}>
                        {payment.notes}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {selectedTab === 'transactions' && (
          <View>
            {supplierTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  لا توجد معاملات مسجلة
                </Text>
              </View>
            ) : (
              supplierTransactions.map((transaction) => (
                <View key={transaction.id} style={[styles.transactionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.transactionHeader}>
                    <Text style={[styles.transactionDescription, { color: colors.text }]}>
                      {transaction.description}
                    </Text>
                    <Text style={[styles.transactionAmount, { 
                      color: transaction.type === 'purchase' ? colors.error : colors.success 
                    }]}>
                      {transaction.type === 'purchase' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionType, { color: colors.textSecondary }]}>
                      {transaction.type === 'purchase' ? 'شراء' : 'دفعة'}
                    </Text>
                    
                    <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                      {new Date(transaction.date).toLocaleDateString('ar-SA')}
                    </Text>
                    
                    {transaction.invoiceNumber && (
                      <Text style={[styles.transactionInvoice, { color: colors.textSecondary }]}>
                        فاتورة: {transaction.invoiceNumber}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* نموذج إضافة دفعة */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                دفعة جديدة للمورد{selectedSupplier && ` - ${selectedSupplier.name}`}
              </Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {!selectedSupplier && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>اختر المورد *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Picker
                      selectedValue={paymentForm.supplierId}
                      style={[styles.picker, { color: colors.text }]}
                      onValueChange={(value) => setPaymentForm(prev => ({ ...prev, supplierId: value }))}
                    >
                      <Picker.Item label="اختر المورد..." value="" />
                      {suppliers.map((supplier) => (
                        <Picker.Item key={supplier.id} label={supplier.name} value={supplier.id} />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>المبلغ *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={paymentForm.amount}
                  onChangeText={(text) => setPaymentForm(prev => ({ ...prev, amount: text }))}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>طريقة الدفع</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={paymentForm.paymentMethod}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(value) => setPaymentForm(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <Picker.Item label="نقد" value="cash" />
                    <Picker.Item label="تحويل بنكي" value="bank" />
                    <Picker.Item label="شيك" value="check" />
                  </Picker>
                </View>
              </View>

              {paymentForm.paymentMethod === 'check' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>رقم الشيك</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={paymentForm.checkNumber}
                    onChangeText={(text) => setPaymentForm(prev => ({ ...prev, checkNumber: text }))}
                    placeholder="رقم الشيك"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ملاحظات</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={paymentForm.notes}
                  onChangeText={(text) => setPaymentForm(prev => ({ ...prev, notes: text }))}
                  placeholder="ملاحظات الدفعة"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={addPayment}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={[styles.submitButtonText, { color: colors.surface }]}>تسجيل الدفعة</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* نموذج معاملات المورد */}
      <Modal
        visible={transactionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTransactionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                معاملات المورد: {selectedSupplier?.name}
              </Text>
              <TouchableOpacity onPress={() => setTransactionModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {supplierTransactions
                .filter(t => {
                  const supplier = suppliers.find(s => s.name === selectedSupplier?.name);
                  return supplier && t.supplierId === supplier.id;
                })
                .map((transaction) => (
                <View key={transaction.id} style={[styles.modalTransactionCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.transactionHeader}>
                    <Text style={[styles.transactionDescription, { color: colors.text }]}>
                      {transaction.description}
                    </Text>
                    <Text style={[styles.transactionAmount, { 
                      color: transaction.type === 'purchase' ? colors.error : colors.success 
                    }]}>
                      {transaction.type === 'purchase' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                  
                  <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                    {new Date(transaction.date).toLocaleDateString('ar-SA')}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addPaymentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addPaymentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  balanceCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  currentBalance: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceDetails: {
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  debtRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 8,
    paddingTop: 8,
  },
  debtLabel: {
    fontWeight: 'bold',
  },
  debtValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  balanceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  miniActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  miniActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentSupplier: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentDetails: {
    gap: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentNotes: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  transactionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  transactionType: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionInvoice: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    maxHeight: '90%',
    borderRadius: 16,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  modalActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalTransactionCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
});