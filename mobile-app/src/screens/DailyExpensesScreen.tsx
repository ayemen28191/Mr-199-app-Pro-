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
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';

interface FundTransfer {
  id: string;
  amount: number;
  senderName: string;
  transferNumber?: string;
  transferType?: string;
  notes?: string;
  date: string;
}

interface TransportationExpense {
  id: string;
  description: string;
  amount: number;
  notes?: string;
  date: string;
}

interface WorkerPayment {
  id: string;
  workerName: string;
  amount: number;
  workDescription?: string;
  date: string;
}

export default function DailyExpensesScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'fund' | 'transport' | 'worker'>('fund');
  
  // البيانات
  const [fundTransfers, setFundTransfers] = useState<FundTransfer[]>([]);
  const [transportExpenses, setTransportExpenses] = useState<TransportationExpense[]>([]);
  const [workerPayments, setWorkerPayments] = useState<WorkerPayment[]>([]);
  const [carriedForward, setCarriedForward] = useState(0);
  
  // نماذج الإدخال
  const [fundForm, setFundForm] = useState({
    amount: '',
    senderName: '',
    transferNumber: '',
    transferType: '',
    notes: '',
  });
  
  const [transportForm, setTransportForm] = useState({
    description: '',
    amount: '',
    notes: '',
  });

  // تحميل البيانات
  const loadDailyData = async () => {
    if (!selectedProjectId) return;
    
    setLoading(true);
    try {
      // تحميل الحولات المالية
      const fundsResponse = await fetch(`/api/projects/${selectedProjectId}/fund-transfers?date=${selectedDate}`);
      if (fundsResponse.ok) {
        const funds = await fundsResponse.json();
        setFundTransfers(funds);
      }
      
      // تحميل مصاريف النقل
      const transportResponse = await fetch(`/api/projects/${selectedProjectId}/transportation-expenses?date=${selectedDate}`);
      if (transportResponse.ok) {
        const transport = await transportResponse.json();
        setTransportExpenses(transport);
      }
      
      // تحميل رواتب العمال للتاريخ المحدد
      const workersResponse = await fetch(`/api/projects/${selectedProjectId}/attendance?date=${selectedDate}`);
      if (workersResponse.ok) {
        const workers = await workersResponse.json();
        setWorkerPayments(workers.map((w: any) => ({
          id: w.id,
          workerName: w.workerName,
          amount: parseFloat(w.paidAmount || '0'),
          workDescription: w.workDescription,
          date: w.date,
        })));
      }
      
      // حساب المبلغ المرحل (مبسط)
      const yesterday = new Date(selectedDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const prevDate = yesterday.toISOString().split('T')[0];
      
      const prevSummaryResponse = await fetch(`/api/projects/${selectedProjectId}/daily-summary/${prevDate}`);
      if (prevSummaryResponse.ok) {
        const prevSummary = await prevSummaryResponse.json();
        setCarriedForward(prevSummary.remainingBalance || 0);
      }
      
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      Alert.alert('خطأ', 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailyData();
  }, [selectedProjectId, selectedDate]);

  // حساب الإجماليات
  const totalIncome = fundTransfers.reduce((sum, item) => sum + item.amount, 0) + carriedForward;
  const totalExpenses = transportExpenses.reduce((sum, item) => sum + item.amount, 0) + 
                       workerPayments.reduce((sum, item) => sum + item.amount, 0);
  const remainingBalance = totalIncome - totalExpenses;

  // فتح نموذج الإدخال
  const openModal = (type: 'fund' | 'transport' | 'worker') => {
    setModalType(type);
    setModalVisible(true);
  };

  // إضافة حولة مالية
  const addFundTransfer = async () => {
    if (!fundForm.amount || !fundForm.senderName) {
      Alert.alert('خطأ', 'يرجى ملء البيانات المطلوبة');
      return;
    }
    
    try {
      const response = await fetch('/api/fund-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fundForm,
          amount: parseFloat(fundForm.amount),
          projectId: selectedProjectId,
          date: selectedDate,
        }),
      });
      
      if (response.ok) {
        const newTransfer = await response.json();
        setFundTransfers(prev => [...prev, newTransfer]);
        setFundForm({ amount: '', senderName: '', transferNumber: '', transferType: '', notes: '' });
        setModalVisible(false);
        Alert.alert('نجح', 'تم إضافة الحولة المالية');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إضافة الحولة');
    }
  };

  // إضافة مصروف نقل
  const addTransportExpense = async () => {
    if (!transportForm.description || !transportForm.amount) {
      Alert.alert('خطأ', 'يرجى ملء البيانات المطلوبة');
      return;
    }
    
    try {
      const response = await fetch('/api/transportation-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transportForm,
          amount: parseFloat(transportForm.amount),
          projectId: selectedProjectId,
          date: selectedDate,
        }),
      });
      
      if (response.ok) {
        const newExpense = await response.json();
        setTransportExpenses(prev => [...prev, newExpense]);
        setTransportForm({ description: '', amount: '', notes: '' });
        setModalVisible(false);
        Alert.alert('نجح', 'تم إضافة مصروف النقل');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إضافة المصروف');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري تحميل المصاريف...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* عنوان الشاشة */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>المصاريف اليومية</Text>
        <TextInput
          style={[styles.dateInput, { 
            backgroundColor: colors.surface, 
            color: colors.text,
            borderColor: colors.border 
          }]}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="التاريخ"
        />
      </View>

      <ScrollView style={styles.content}>
        {/* ملخص المالي */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>الملخص المالي</Text>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>المرحل من أمس</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {carriedForward.toLocaleString('ar-SA')} ر.س
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>إجمالي الدخل</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {totalIncome.toLocaleString('ar-SA')} ر.س
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>إجمالي المصاريف</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              {totalExpenses.toLocaleString('ar-SA')} ر.س
            </Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.summaryLabel, styles.totalLabel, { color: colors.text }]}>المتبقي</Text>
            <Text style={[styles.summaryValue, styles.totalValue, { 
              color: remainingBalance >= 0 ? colors.success : colors.error 
            }]}>
              {remainingBalance.toLocaleString('ar-SA')} ر.س
            </Text>
          </View>
        </View>

        {/* الحولات المالية */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>الحولات المالية</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => openModal('fund')}
            >
              <Text style={[styles.addButtonText, { color: colors.surface }]}>+</Text>
            </TouchableOpacity>
          </View>
          
          {fundTransfers.map((transfer) => (
            <View key={transfer.id} style={[styles.itemCard, { borderColor: colors.border }]}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{transfer.senderName}</Text>
                <Text style={[styles.itemAmount, { color: colors.success }]}>
                  +{transfer.amount.toLocaleString('ar-SA')} ر.س
                </Text>
              </View>
              {transfer.transferNumber && (
                <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                  رقم الحولة: {transfer.transferNumber}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* مصاريف النقل */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>مصاريف النقل</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => openModal('transport')}
            >
              <Text style={[styles.addButtonText, { color: colors.surface }]}>+</Text>
            </TouchableOpacity>
          </View>
          
          {transportExpenses.map((expense) => (
            <View key={expense.id} style={[styles.itemCard, { borderColor: colors.border }]}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{expense.description}</Text>
                <Text style={[styles.itemAmount, { color: colors.error }]}>
                  -{expense.amount.toLocaleString('ar-SA')} ر.س
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* رواتب العمال */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>رواتب العمال</Text>
          
          {workerPayments.map((payment) => (
            <View key={payment.id} style={[styles.itemCard, { borderColor: colors.border }]}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{payment.workerName}</Text>
                <Text style={[styles.itemAmount, { color: colors.error }]}>
                  -{payment.amount.toLocaleString('ar-SA')} ر.س
                </Text>
              </View>
              {payment.workDescription && (
                <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                  {payment.workDescription}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* النماذج المنبثقة */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {modalType === 'fund' && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة حولة مالية</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>المبلغ *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={fundForm.amount}
                      onChangeText={(text) => setFundForm(prev => ({ ...prev, amount: text }))}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>اسم المُحيل *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={fundForm.senderName}
                      onChangeText={(text) => setFundForm(prev => ({ ...prev, senderName: text }))}
                      placeholder="اسم المُحيل"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>رقم الحولة</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={fundForm.transferNumber}
                      onChangeText={(text) => setFundForm(prev => ({ ...prev, transferNumber: text }))}
                      placeholder="رقم الحولة"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>نوع الحولة</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={fundForm.transferType}
                      onChangeText={(text) => setFundForm(prev => ({ ...prev, transferType: text }))}
                      placeholder="بنك، كاش، إلخ"
                    />
                  </View>
                </ScrollView>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={addFundTransfer}
                  >
                    <Text style={[styles.submitButtonText, { color: colors.surface }]}>إضافة</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            
            {modalType === 'transport' && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة مصروف نقل</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>الوصف *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={transportForm.description}
                      onChangeText={(text) => setTransportForm(prev => ({ ...prev, description: text }))}
                      placeholder="وصف المصروف"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>المبلغ *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={transportForm.amount}
                      onChangeText={(text) => setTransportForm(prev => ({ ...prev, amount: text }))}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>ملاحظات</Text>
                    <TextInput
                      style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={transportForm.notes}
                      onChangeText={(text) => setTransportForm(prev => ({ ...prev, notes: text }))}
                      placeholder="ملاحظات إضافية"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </ScrollView>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={addTransportExpense}
                  >
                    <Text style={[styles.submitButtonText, { color: colors.surface }]}>إضافة</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemCard: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
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