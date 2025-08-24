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

interface WorkerMiscExpense {
  id: string;
  workerId: string;
  workerName: string;
  expenseType: 'food' | 'transport' | 'accommodation' | 'medical' | 'tools' | 'other';
  amount: number;
  description: string;
  expenseDate: string;
  receiptNumber?: string;
  notes?: string;
  approvedBy?: string;
  isApproved: boolean;
}

export default function WorkerMiscExpensesScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  
  // الحالات الأساسية
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // البيانات
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [expenses, setExpenses] = useState<WorkerMiscExpense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<WorkerMiscExpense[]>([]);
  
  // فلاتر
  const [filters, setFilters] = useState({
    workerId: '',
    expenseType: '',
    dateFrom: '',
    dateTo: '',
    isApproved: '',
  });
  
  // نموذج المصروف
  const [expenseForm, setExpenseForm] = useState({
    workerId: '',
    expenseType: 'other' as WorkerMiscExpense['expenseType'],
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    notes: '',
  });

  // تحميل البيانات
  const loadData = async () => {
    try {
      setLoading(true);
      
      // تحميل العمال
      const workersResponse = await fetch('/api/workers');
      if (workersResponse.ok) {
        const workersData = await workersResponse.json();
        setWorkers(workersData.filter(w => w.isActive));
      }
      
      // تحميل مصاريف العمال المتنوعة
      const expensesResponse = await fetch(`/api/worker-misc-expenses?projectId=${selectedProjectId || ''}`);
      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();
        setExpenses(expensesData);
        setFilteredExpenses(expensesData);
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

  // تطبيق الفلاتر
  useEffect(() => {
    applyFilters();
  }, [filters, expenses]);

  const applyFilters = () => {
    let filtered = [...expenses];
    
    if (filters.workerId) {
      filtered = filtered.filter(expense => expense.workerId === filters.workerId);
    }
    
    if (filters.expenseType) {
      filtered = filtered.filter(expense => expense.expenseType === filters.expenseType);
    }
    
    if (filters.dateFrom) {
      filtered = filtered.filter(expense => expense.expenseDate >= filters.dateFrom);
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(expense => expense.expenseDate <= filters.dateTo);
    }
    
    if (filters.isApproved !== '') {
      const isApproved = filters.isApproved === 'true';
      filtered = filtered.filter(expense => expense.isApproved === isApproved);
    }
    
    // ترتيب حسب التاريخ (الأحدث أولاً)
    filtered.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
    
    setFilteredExpenses(filtered);
  };

  // إضافة مصروف جديد
  const addExpense = async () => {
    if (!expenseForm.workerId || !expenseForm.amount || !expenseForm.description) {
      Alert.alert('خطأ', 'يرجى ملء البيانات المطلوبة');
      return;
    }

    const amount = parseFloat(expenseForm.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/worker-misc-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseForm,
          amount,
          projectId: selectedProjectId,
          isApproved: false, // المصاريف تحتاج موافقة
        }),
      });

      if (response.ok) {
        const newExpense = await response.json();
        setExpenses(prev => [newExpense, ...prev]);
        resetExpenseForm();
        setModalVisible(false);
        Alert.alert('نجح', 'تم إضافة المصروف بنجاح');
      }
    } catch (error) {
      console.error('خطأ في إضافة المصروف:', error);
      Alert.alert('خطأ', 'فشل في إضافة المصروف');
    } finally {
      setSaving(false);
    }
  };

  // الموافقة على المصروف
  const approveExpense = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/worker-misc-expenses/${expenseId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isApproved: true,
          approvedBy: 'مدير المشروع', // في التطبيق الحقيقي، ستأخذ من المستخدم المسجل دخوله
        }),
      });

      if (response.ok) {
        const updatedExpense = await response.json();
        setExpenses(prev => prev.map(exp => 
          exp.id === expenseId ? { ...exp, isApproved: true, approvedBy: updatedExpense.approvedBy } : exp
        ));
        Alert.alert('تمت الموافقة', 'تم اعتماد المصروف');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في الموافقة على المصروف');
    }
  };

  // حذف المصروف
  const deleteExpense = (expenseId: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا المصروف؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`/api/worker-misc-expenses/${expenseId}`, {
                method: 'DELETE',
              });
              
              if (response.ok) {
                setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
                Alert.alert('تم', 'تم حذف المصروف');
              }
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف المصروف');
            }
          },
        },
      ]
    );
  };

  // إعادة تعيين النموذج
  const resetExpenseForm = () => {
    setExpenseForm({
      workerId: '',
      expenseType: 'other',
      amount: '',
      description: '',
      expenseDate: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      notes: '',
    });
  };

  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    setFilters({
      workerId: '',
      expenseType: '',
      dateFrom: '',
      dateTo: '',
      isApproved: '',
    });
  };

  // تنسيق العملة
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-SA')} ر.س`;
  };

  // الحصول على اسم نوع المصروف
  const getExpenseTypeName = (type: WorkerMiscExpense['expenseType']) => {
    switch (type) {
      case 'food': return 'طعام';
      case 'transport': return 'مواصلات';
      case 'accommodation': return 'سكن';
      case 'medical': return 'طبي';
      case 'tools': return 'أدوات';
      case 'other': return 'أخرى';
      default: return type;
    }
  };

  // الحصول على لون نوع المصروف
  const getExpenseTypeColor = (type: WorkerMiscExpense['expenseType']) => {
    switch (type) {
      case 'food': return '#FF6B6B';
      case 'transport': return '#4ECDC4';
      case 'accommodation': return '#45B7D1';
      case 'medical': return '#FFA726';
      case 'tools': return '#AB47BC';
      case 'other': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  // حساب الإجماليات
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const approvedExpenses = filteredExpenses.filter(exp => exp.isApproved).reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpenses = filteredExpenses.filter(exp => !exp.isApproved).reduce((sum, expense) => sum + expense.amount, 0);

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
        <Text style={[styles.title, { color: colors.text }]}>مصاريف العمال المتنوعة</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>فلتر</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={[styles.actionButtonText, { color: colors.surface }]}>+ إضافة</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ملخص الإحصائيات */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>الإجمالي</Text>
          <Text style={[styles.summaryAmount, { color: colors.primary }]}>
            {formatCurrency(totalExpenses)}
          </Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>معتمد</Text>
          <Text style={[styles.summaryAmount, { color: colors.success }]}>
            {formatCurrency(approvedExpenses)}
          </Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>في الانتظار</Text>
          <Text style={[styles.summaryAmount, { color: colors.warning }]}>
            {formatCurrency(pendingExpenses)}
          </Text>
        </View>
      </View>

      {/* قائمة المصاريف */}
      <ScrollView style={styles.content}>
        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {expenses.length === 0 ? 'لا توجد مصاريف مضافة بعد' : 'لا توجد نتائج مطابقة للفلتر'}
            </Text>
          </View>
        ) : (
          filteredExpenses.map((expense) => (
            <View key={expense.id} style={[styles.expenseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.expenseHeader}>
                <View style={styles.expenseInfo}>
                  <Text style={[styles.workerName, { color: colors.text }]}>{expense.workerName}</Text>
                  <View style={[styles.expenseTypeBadge, { backgroundColor: getExpenseTypeColor(expense.expenseType) }]}>
                    <Text style={[styles.expenseTypeText, { color: colors.surface }]}>
                      {getExpenseTypeName(expense.expenseType)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.expenseAmount, { color: colors.error }]}>
                  {formatCurrency(expense.amount)}
                </Text>
              </View>
              
              <Text style={[styles.expenseDescription, { color: colors.text }]}>
                {expense.description}
              </Text>
              
              <View style={styles.expenseDetails}>
                <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>
                  {new Date(expense.expenseDate).toLocaleDateString('ar-SA')}
                </Text>
                
                {expense.receiptNumber && (
                  <Text style={[styles.receiptNumber, { color: colors.textSecondary }]}>
                    إيصال: {expense.receiptNumber}
                  </Text>
                )}
              </View>
              
              <View style={styles.expenseActions}>
                <View style={styles.approvalStatus}>
                  {expense.isApproved ? (
                    <Text style={[styles.approvedText, { color: colors.success }]}>
                      ✓ معتمد {expense.approvedBy && `بواسطة ${expense.approvedBy}`}
                    </Text>
                  ) : (
                    <Text style={[styles.pendingText, { color: colors.warning }]}>
                      ⏳ في الانتظار
                    </Text>
                  )}
                </View>
                
                <View style={styles.actionButtons}>
                  {!expense.isApproved && (
                    <TouchableOpacity
                      style={[styles.approveButton, { backgroundColor: colors.success }]}
                      onPress={() => approveExpense(expense.id)}
                    >
                      <Text style={[styles.buttonText, { color: colors.surface }]}>اعتماد</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: colors.error }]}
                    onPress={() => deleteExpense(expense.id)}
                  >
                    <Text style={[styles.buttonText, { color: colors.surface }]}>حذف</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* نموذج إضافة مصروف */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة مصروف جديد</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>العامل *</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={expenseForm.workerId}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(value) => setExpenseForm(prev => ({ ...prev, workerId: value }))}
                  >
                    <Picker.Item label="اختر العامل..." value="" />
                    {workers.map((worker) => (
                      <Picker.Item key={worker.id} label={worker.name} value={worker.id} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>نوع المصروف</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={expenseForm.expenseType}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(value) => setExpenseForm(prev => ({ ...prev, expenseType: value }))}
                  >
                    <Picker.Item label="طعام" value="food" />
                    <Picker.Item label="مواصلات" value="transport" />
                    <Picker.Item label="سكن" value="accommodation" />
                    <Picker.Item label="طبي" value="medical" />
                    <Picker.Item label="أدوات" value="tools" />
                    <Picker.Item label="أخرى" value="other" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>المبلغ *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={expenseForm.amount}
                  onChangeText={(text) => setExpenseForm(prev => ({ ...prev, amount: text }))}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>الوصف *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={expenseForm.description}
                  onChangeText={(text) => setExpenseForm(prev => ({ ...prev, description: text }))}
                  placeholder="وصف المصروف"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>تاريخ المصروف</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={expenseForm.expenseDate}
                  onChangeText={(text) => setExpenseForm(prev => ({ ...prev, expenseDate: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>رقم الإيصال</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={expenseForm.receiptNumber}
                  onChangeText={(text) => setExpenseForm(prev => ({ ...prev, receiptNumber: text }))}
                  placeholder="رقم الإيصال (اختياري)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ملاحظات</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={expenseForm.notes}
                  onChangeText={(text) => setExpenseForm(prev => ({ ...prev, notes: text }))}
                  placeholder="ملاحظات إضافية"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={addExpense}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={[styles.submitButtonText, { color: colors.surface }]}>إضافة المصروف</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* نموذج الفلاتر */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>فلترة المصاريف</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>العامل</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={filters.workerId}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, workerId: value }))}
                  >
                    <Picker.Item label="جميع العمال" value="" />
                    {workers.map((worker) => (
                      <Picker.Item key={worker.id} label={worker.name} value={worker.id} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>نوع المصروف</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={filters.expenseType}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, expenseType: value }))}
                  >
                    <Picker.Item label="جميع الأنواع" value="" />
                    <Picker.Item label="طعام" value="food" />
                    <Picker.Item label="مواصلات" value="transport" />
                    <Picker.Item label="سكن" value="accommodation" />
                    <Picker.Item label="طبي" value="medical" />
                    <Picker.Item label="أدوات" value="tools" />
                    <Picker.Item label="أخرى" value="other" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>حالة الاعتماد</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={filters.isApproved}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, isApproved: value }))}
                  >
                    <Picker.Item label="الكل" value="" />
                    <Picker.Item label="معتمد" value="true" />
                    <Picker.Item label="في الانتظار" value="false" />
                  </Picker>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>من تاريخ</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={filters.dateFrom}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, dateFrom: text }))}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>إلى تاريخ</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={filters.dateTo}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, dateTo: text }))}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={[styles.clearButton, { backgroundColor: colors.error }]}
                  onPress={resetFilters}
                >
                  <Text style={[styles.buttonText, { color: colors.surface }]}>إعادة تعيين</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.applyButton, { backgroundColor: colors.primary }]}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={[styles.buttonText, { color: colors.surface }]}>تطبيق</Text>
                </TouchableOpacity>
              </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
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
  expenseCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  expenseInfo: {
    flex: 1,
    marginRight: 12,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  expenseTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  expenseTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  expenseDate: {
    fontSize: 12,
  },
  receiptNumber: {
    fontSize: 12,
  },
  expenseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  approvalStatus: {
    flex: 1,
  },
  approvedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
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
  row: {
    flexDirection: 'row',
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
  filterActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});