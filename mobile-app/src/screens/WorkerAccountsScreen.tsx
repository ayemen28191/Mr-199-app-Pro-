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

interface Worker {
  id: string;
  name: string;
  type: string;
  dailyWage: string;
  isActive: boolean;
  phone?: string;
}

interface WorkerBalance {
  workerId: string;
  workerName: string;
  totalEarned: number;
  totalPaid: number;
  currentBalance: number;
  lastPaymentDate?: string;
}

interface WorkerTransfer {
  id: string;
  workerId: string;
  workerName: string;
  amount: number;
  transferType: 'family_transfer' | 'personal_payment' | 'advance_payment' | 'bonus';
  recipientName?: string;
  transferNumber?: string;
  transferDate: string;
  notes?: string;
}

interface PaymentHistory {
  id: string;
  workerId: string;
  amount: number;
  paymentDate: string;
  paymentType: 'attendance' | 'transfer' | 'bonus' | 'advance';
  description?: string;
}

export default function WorkerAccountsScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  
  // الحالات الأساسية
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'balances' | 'transfers' | 'payments'>('balances');
  
  // البيانات
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerBalances, setWorkerBalances] = useState<WorkerBalance[]>([]);
  const [workerTransfers, setWorkerTransfers] = useState<WorkerTransfer[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  
  // نموذج التحويل
  const [transferForm, setTransferForm] = useState({
    workerId: '',
    amount: '',
    transferType: 'family_transfer' as WorkerTransfer['transferType'],
    recipientName: '',
    transferNumber: '',
    notes: '',
  });
  
  // نموذج الدفع
  const [paymentForm, setPaymentForm] = useState({
    workerId: '',
    amount: '',
    paymentType: 'personal_payment' as 'personal_payment' | 'advance_payment' | 'bonus',
    description: '',
  });

  // تحميل البيانات
  const loadData = async () => {
    try {
      setLoading(true);
      
      // تحميل العمال
      const workersResponse = await fetch('/api/workers');
      if (workersResponse.ok) {
        const workersData = await workersResponse.json();
        setWorkers(workersData);
      }
      
      // تحميل أرصدة العمال
      const balancesResponse = await fetch(`/api/worker-balances?projectId=${selectedProjectId || ''}`);
      if (balancesResponse.ok) {
        const balancesData = await balancesResponse.json();
        setWorkerBalances(balancesData);
      }
      
      // تحميل تحويلات العمال
      const transfersResponse = await fetch(`/api/worker-transfers?projectId=${selectedProjectId || ''}`);
      if (transfersResponse.ok) {
        const transfersData = await transfersResponse.json();
        setWorkerTransfers(transfersData);
      }
      
      // تحميل تاريخ الدفعات
      const paymentsResponse = await fetch(`/api/worker-payments?projectId=${selectedProjectId || ''}`);
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPaymentHistory(paymentsData);
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

  // إضافة تحويل جديد
  const addTransfer = async () => {
    if (!transferForm.workerId || !transferForm.amount) {
      Alert.alert('خطأ', 'يرجى ملء البيانات المطلوبة');
      return;
    }

    const amount = parseFloat(transferForm.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/worker-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transferForm,
          amount,
          projectId: selectedProjectId,
          transferDate: new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        const newTransfer = await response.json();
        setWorkerTransfers(prev => [...prev, newTransfer]);
        
        // تحديث رصيد العامل
        setWorkerBalances(prev => prev.map(balance => 
          balance.workerId === transferForm.workerId 
            ? { ...balance, currentBalance: balance.currentBalance - amount }
            : balance
        ));
        
        resetTransferForm();
        setModalVisible(false);
        Alert.alert('نجح', 'تم إضافة التحويل بنجاح');
      }
    } catch (error) {
      console.error('خطأ في إضافة التحويل:', error);
      Alert.alert('خطأ', 'فشل في إضافة التحويل');
    } finally {
      setSaving(false);
    }
  };

  // إضافة دفعة شخصية
  const addPayment = async () => {
    if (!paymentForm.workerId || !paymentForm.amount) {
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
      const response = await fetch('/api/worker-payments', {
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
        setPaymentHistory(prev => [...prev, newPayment]);
        
        // تحديث رصيد العامل
        const balanceChange = paymentForm.paymentType === 'advance_payment' ? -amount : amount;
        setWorkerBalances(prev => prev.map(balance => 
          balance.workerId === paymentForm.workerId 
            ? { ...balance, currentBalance: balance.currentBalance + balanceChange, totalPaid: balance.totalPaid + amount }
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

  // إعادة تعيين نموذج التحويل
  const resetTransferForm = () => {
    setTransferForm({
      workerId: '',
      amount: '',
      transferType: 'family_transfer',
      recipientName: '',
      transferNumber: '',
      notes: '',
    });
  };

  // إعادة تعيين نموذج الدفع
  const resetPaymentForm = () => {
    setPaymentForm({
      workerId: '',
      amount: '',
      paymentType: 'personal_payment',
      description: '',
    });
  };

  // فتح نموذج التحويل
  const openTransferModal = (worker?: Worker) => {
    if (worker) {
      setTransferForm(prev => ({ ...prev, workerId: worker.id }));
      setSelectedWorker(worker);
    }
    setModalVisible(true);
  };

  // فتح نموذج الدفع
  const openPaymentModal = (worker?: Worker) => {
    if (worker) {
      setPaymentForm(prev => ({ ...prev, workerId: worker.id }));
      setSelectedWorker(worker);
    }
    setPaymentModalVisible(true);
  };

  // تنسيق العملة
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-SA')} ر.س`;
  };

  // الحصول على لون الرصيد
  const getBalanceColor = (balance: number) => {
    if (balance > 0) return colors.success;
    if (balance < 0) return colors.error;
    return colors.textSecondary;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري تحميل حسابات العمال...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* عنوان الشاشة */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>حسابات العمال</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => openTransferModal()}
          >
            <Text style={[styles.actionButtonText, { color: colors.surface }]}>تحويل</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={() => openPaymentModal()}
          >
            <Text style={[styles.actionButtonText, { color: colors.surface }]}>دفع</Text>
          </TouchableOpacity>
        </View>
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
          style={[styles.tab, selectedTab === 'transfers' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedTab('transfers')}
        >
          <Text style={[styles.tabText, { 
            color: selectedTab === 'transfers' ? colors.surface : colors.text 
          }]}>
            التحويلات ({workerTransfers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'payments' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedTab('payments')}
        >
          <Text style={[styles.tabText, { 
            color: selectedTab === 'payments' ? colors.surface : colors.text 
          }]}>
            المدفوعات ({paymentHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* المحتوى */}
      <ScrollView style={styles.content}>
        {selectedTab === 'balances' && (
          <View>
            {workerBalances.map((balance) => (
              <View key={balance.workerId} style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.balanceHeader}>
                  <Text style={[styles.workerName, { color: colors.text }]}>{balance.workerName}</Text>
                  <Text style={[styles.currentBalance, { color: getBalanceColor(balance.currentBalance) }]}>
                    {formatCurrency(balance.currentBalance)}
                  </Text>
                </View>
                
                <View style={styles.balanceDetails}>
                  <View style={styles.balanceRow}>
                    <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>إجمالي المكتسب:</Text>
                    <Text style={[styles.balanceValue, { color: colors.success }]}>
                      {formatCurrency(balance.totalEarned)}
                    </Text>
                  </View>
                  
                  <View style={styles.balanceRow}>
                    <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>إجمالي المدفوع:</Text>
                    <Text style={[styles.balanceValue, { color: colors.error }]}>
                      {formatCurrency(balance.totalPaid)}
                    </Text>
                  </View>
                  
                  {balance.lastPaymentDate && (
                    <View style={styles.balanceRow}>
                      <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>آخر دفعة:</Text>
                      <Text style={[styles.balanceValue, { color: colors.text }]}>
                        {new Date(balance.lastPaymentDate).toLocaleDateString('ar-SA')}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.balanceActions}>
                  <TouchableOpacity
                    style={[styles.miniActionButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      const worker = workers.find(w => w.id === balance.workerId);
                      if (worker) openTransferModal(worker);
                    }}
                  >
                    <Text style={[styles.miniActionText, { color: colors.surface }]}>تحويل</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.miniActionButton, { backgroundColor: colors.success }]}
                    onPress={() => {
                      const worker = workers.find(w => w.id === balance.workerId);
                      if (worker) openPaymentModal(worker);
                    }}
                  >
                    <Text style={[styles.miniActionText, { color: colors.surface }]}>دفع</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedTab === 'transfers' && (
          <View>
            {workerTransfers.map((transfer) => (
              <View key={transfer.id} style={[styles.transferCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.transferHeader}>
                  <Text style={[styles.transferWorker, { color: colors.text }]}>{transfer.workerName}</Text>
                  <Text style={[styles.transferAmount, { color: colors.error }]}>
                    -{formatCurrency(transfer.amount)}
                  </Text>
                </View>
                
                <View style={styles.transferDetails}>
                  <Text style={[styles.transferType, { color: colors.textSecondary }]}>
                    {transfer.transferType === 'family_transfer' ? 'تحويل عائلة' :
                     transfer.transferType === 'personal_payment' ? 'دفعة شخصية' :
                     transfer.transferType === 'advance_payment' ? 'سلفة' : 'مكافأة'}
                  </Text>
                  
                  <Text style={[styles.transferDate, { color: colors.textSecondary }]}>
                    {new Date(transfer.transferDate).toLocaleDateString('ar-SA')}
                  </Text>
                  
                  {transfer.recipientName && (
                    <Text style={[styles.transferRecipient, { color: colors.text }]}>
                      المستلم: {transfer.recipientName}
                    </Text>
                  )}
                  
                  {transfer.transferNumber && (
                    <Text style={[styles.transferNumber, { color: colors.textSecondary }]}>
                      رقم التحويل: {transfer.transferNumber}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedTab === 'payments' && (
          <View>
            {paymentHistory.map((payment) => (
              <View key={payment.id} style={[styles.paymentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.paymentHeader}>
                  <Text style={[styles.paymentWorker, { color: colors.text }]}>
                    {workers.find(w => w.id === payment.workerId)?.name || 'غير معروف'}
                  </Text>
                  <Text style={[styles.paymentAmount, { 
                    color: payment.paymentType === 'advance' ? colors.error : colors.success 
                  }]}>
                    {payment.paymentType === 'advance' ? '-' : '+'}
                    {formatCurrency(payment.amount)}
                  </Text>
                </View>
                
                <View style={styles.paymentDetails}>
                  <Text style={[styles.paymentType, { color: colors.textSecondary }]}>
                    {payment.paymentType === 'attendance' ? 'أجر حضور' :
                     payment.paymentType === 'transfer' ? 'تحويل' :
                     payment.paymentType === 'bonus' ? 'مكافأة' : 'سلفة'}
                  </Text>
                  
                  <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>
                    {new Date(payment.paymentDate).toLocaleDateString('ar-SA')}
                  </Text>
                  
                  {payment.description && (
                    <Text style={[styles.paymentDescription, { color: colors.text }]}>
                      {payment.description}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* نموذج إضافة تحويل */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                تحويل جديد{selectedWorker && ` - ${selectedWorker.name}`}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {!selectedWorker && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>اختر العامل *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Picker
                      selectedValue={transferForm.workerId}
                      style={[styles.picker, { color: colors.text }]}
                      onValueChange={(value) => setTransferForm(prev => ({ ...prev, workerId: value }))}
                    >
                      <Picker.Item label="اختر العامل..." value="" />
                      {workers.map((worker) => (
                        <Picker.Item key={worker.id} label={worker.name} value={worker.id} />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>المبلغ *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={transferForm.amount}
                  onChangeText={(text) => setTransferForm(prev => ({ ...prev, amount: text }))}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>نوع التحويل</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={transferForm.transferType}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(value) => setTransferForm(prev => ({ ...prev, transferType: value }))}
                  >
                    <Picker.Item label="تحويل عائلة" value="family_transfer" />
                    <Picker.Item label="دفعة شخصية" value="personal_payment" />
                    <Picker.Item label="سلفة" value="advance_payment" />
                    <Picker.Item label="مكافأة" value="bonus" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>اسم المستلم</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={transferForm.recipientName}
                  onChangeText={(text) => setTransferForm(prev => ({ ...prev, recipientName: text }))}
                  placeholder="اسم المستلم (اختياري)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>رقم التحويل</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={transferForm.transferNumber}
                  onChangeText={(text) => setTransferForm(prev => ({ ...prev, transferNumber: text }))}
                  placeholder="رقم التحويل (اختياري)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ملاحظات</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={transferForm.notes}
                  onChangeText={(text) => setTransferForm(prev => ({ ...prev, notes: text }))}
                  placeholder="ملاحظات إضافية"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={addTransfer}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={[styles.submitButtonText, { color: colors.surface }]}>إضافة التحويل</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                دفعة جديدة{selectedWorker && ` - ${selectedWorker.name}`}
              </Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {!selectedWorker && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>اختر العامل *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Picker
                      selectedValue={paymentForm.workerId}
                      style={[styles.picker, { color: colors.text }]}
                      onValueChange={(value) => setPaymentForm(prev => ({ ...prev, workerId: value }))}
                    >
                      <Picker.Item label="اختر العامل..." value="" />
                      {workers.map((worker) => (
                        <Picker.Item key={worker.id} label={worker.name} value={worker.id} />
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
                <Text style={[styles.label, { color: colors.text }]}>نوع الدفعة</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={paymentForm.paymentType}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(value) => setPaymentForm(prev => ({ ...prev, paymentType: value }))}
                  >
                    <Picker.Item label="دفعة شخصية" value="personal_payment" />
                    <Picker.Item label="سلفة" value="advance_payment" />
                    <Picker.Item label="مكافأة" value="bonus" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>الوصف</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={paymentForm.description}
                  onChangeText={(text) => setPaymentForm(prev => ({ ...prev, description: text }))}
                  placeholder="وصف الدفعة"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.success }]}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
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
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
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
  transferCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transferWorker: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transferAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transferDetails: {
    gap: 4,
  },
  transferType: {
    fontSize: 14,
    fontWeight: '600',
  },
  transferDate: {
    fontSize: 12,
  },
  transferRecipient: {
    fontSize: 14,
  },
  transferNumber: {
    fontSize: 12,
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
  paymentWorker: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentDetails: {
    gap: 4,
  },
  paymentType: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentDate: {
    fontSize: 12,
  },
  paymentDescription: {
    fontSize: 14,
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
});