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
  FlatList,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import { Icons } from '../components/Icons';

interface FundTransfer {
  id: string;
  amount: number;
  senderName: string;
  transferNumber?: string;
  transferType?: string;
  notes?: string;
  date: string;
  isProjectTransfer?: boolean;
  fromProject?: string;
  toProject?: string;
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

interface Project {
  id: string;
  name: string;
}

interface AutocompleteData {
  id: string;
  category: string;
  value: string;
  usageCount: number;
}

export default function DailyExpensesScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'fund' | 'transport' | 'worker' | 'project_transfer'>('fund');
  
  // البيانات الأساسية
  const [fundTransfers, setFundTransfers] = useState<FundTransfer[]>([]);
  const [transportExpenses, setTransportExpenses] = useState<TransportationExpense[]>([]);
  const [workerPayments, setWorkerPayments] = useState<WorkerPayment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [autocompleteData, setAutocompleteData] = useState<AutocompleteData[]>([]);
  const [carriedForward, setCarriedForward] = useState('0');
  const [showProjectTransfers, setShowProjectTransfers] = useState(true);
  
  // نماذج الإدخال المحسنة
  const [fundForm, setFundForm] = useState({
    amount: '',
    senderName: '',
    transferNumber: '',
    transferType: '',
    notes: '',
    isProjectTransfer: false,
    fromProject: '',
    toProject: '',
  });
  
  const [transportForm, setTransportForm] = useState({
    description: '',
    amount: '',
    notes: '',
  });
  
  // حالات التحرير
  const [editingFundId, setEditingFundId] = useState<string | null>(null);
  const [editingTransportId, setEditingTransportId] = useState<string | null>(null);

  // تحميل البيانات المحسنة
  const loadDailyData = async () => {
    if (!selectedProjectId) return;
    
    setLoading(true);
    try {
      // تحميل جميع البيانات بشكل متوازي
      const [
        fundsResponse,
        transportResponse,
        workersResponse,
        projectsResponse,
        autocompleteResponse,
        prevSummaryResponse
      ] = await Promise.all([
        fetch(`/api/projects/${selectedProjectId}/fund-transfers?date=${selectedDate}`),
        fetch(`/api/projects/${selectedProjectId}/transportation-expenses?date=${selectedDate}`),
        fetch(`/api/projects/${selectedProjectId}/attendance?date=${selectedDate}`),
        fetch('/api/projects'),
        fetch('/api/autocomplete'),
        (() => {
          const yesterday = new Date(selectedDate);
          yesterday.setDate(yesterday.getDate() - 1);
          const prevDate = yesterday.toISOString().split('T')[0];
          return fetch(`/api/projects/${selectedProjectId}/daily-summary/${prevDate}`);
        })()
      ]);

      // معالجة الحولات المالية
      if (fundsResponse.ok) {
        const funds = await fundsResponse.json();
        setFundTransfers(funds);
      }
      
      // معالجة مصاريف النقل
      if (transportResponse.ok) {
        const transport = await transportResponse.json();
        setTransportExpenses(transport);
      }
      
      // معالجة رواتب العمال
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

      // معالجة قائمة المشاريع
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      }

      // معالجة بيانات الإكمال التلقائي
      if (autocompleteResponse.ok) {
        const autocompleteRes = await autocompleteResponse.json();
        setAutocompleteData(autocompleteRes);
      }
      
      // معالجة المبلغ المرحل
      if (prevSummaryResponse.ok) {
        const prevSummary = await prevSummaryResponse.json();
        setCarriedForward(String(prevSummary.remainingBalance || 0));
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

  // مكون AutocompleteInput محسن
  const AutocompleteInput: React.FC<{
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    category: string;
    style?: any;
  }> = ({ value, onChangeText, placeholder, category, style }) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
      if (value.length > 1) {
        const filtered = autocompleteData
          .filter(item => 
            item.category === category && 
            item.value.toLowerCase().includes(value.toLowerCase())
          )
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 5)
          .map(item => item.value);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        setShowSuggestions(false);
      }
    }, [value, category, autocompleteData]);

    return (
      <View style={{ position: 'relative' }}>
        <TextInput
          style={[{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 12,
            backgroundColor: colors.surface,
            color: colors.text,
            fontSize: 14,
          }, style]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
        />
        {showSuggestions && (
          <View style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            marginTop: 4,
            maxHeight: 150,
            zIndex: 1000,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}>
            <ScrollView nestedScrollEnabled>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    padding: 12,
                    borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                  onPress={() => {
                    onChangeText(suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 14 }}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  // دوال مساعدة محسنة
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount).replace('ر.س.', '').trim() + ' ر.س';
  };

  const saveAutocompleteValue = async (category: string, value: string) => {
    if (!value || value.trim().length < 2) return;
    
    try {
      const response = await fetch('/api/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          value: value.trim(),
          usageCount: 1
        })
      });
      
      if (response.ok) {
        // تحديث البيانات المحلية
        const existingIndex = autocompleteData.findIndex(
          item => item.category === category && item.value === value.trim()
        );
        
        if (existingIndex >= 0) {
          setAutocompleteData(prev => prev.map((item, index) => 
            index === existingIndex 
              ? { ...item, usageCount: item.usageCount + 1 }
              : item
          ));
        } else {
          setAutocompleteData(prev => [...prev, {
            id: Date.now().toString(),
            category,
            value: value.trim(),
            usageCount: 1
          }]);
        }
      }
    } catch (error) {
      console.error('خطأ في حفظ قيمة الإكمال التلقائي:', error);
    }
  };

  // حساب الإجماليات
  const totalIncome = fundTransfers.reduce((sum, item) => sum + item.amount, 0) + parseFloat(carriedForward);
  const totalExpenses = transportExpenses.reduce((sum, item) => sum + item.amount, 0) + 
                        workerPayments.reduce((sum, item) => sum + item.amount, 0);
  const remainingBalance = totalIncome - totalExpenses;

  // دوال الحفظ والتحرير
  const handleSaveFundTransfer = async () => {
    if (!selectedProjectId || !fundForm.amount || !fundForm.senderName) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      // حفظ قيم الإكمال التلقائي
      await Promise.all([
        saveAutocompleteValue('senderNames', fundForm.senderName),
        saveAutocompleteValue('transferNumbers', fundForm.transferNumber),
        saveAutocompleteValue('transferTypes', fundForm.transferType),
      ]);

      const transferData = {
        ...fundForm,
        amount: parseFloat(fundForm.amount),
        date: selectedDate,
        projectId: selectedProjectId,
      };

      const url = editingFundId 
        ? `/api/projects/${selectedProjectId}/fund-transfers/${editingFundId}`
        : `/api/projects/${selectedProjectId}/fund-transfers`;
      
      const method = editingFundId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
      });

      if (response.ok) {
        Alert.alert('نجح', editingFundId ? 'تم تحديث الحولة' : 'تم إضافة الحولة');
        setFundForm({
          amount: '',
          senderName: '',
          transferNumber: '',
          transferType: '',
          notes: '',
          isProjectTransfer: false,
          fromProject: '',
          toProject: '',
        });
        setEditingFundId(null);
        setModalVisible(false);
        loadDailyData();
      } else {
        throw new Error('فشل في حفظ الحولة');
      }
    } catch (error) {
      console.error('خطأ في حفظ الحولة:', error);
      Alert.alert('خطأ', 'فشل في حفظ الحولة');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTransportExpense = async () => {
    if (!selectedProjectId || !transportForm.description || !transportForm.amount) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      // حفظ قيم الإكمال التلقائي
      await saveAutocompleteValue('transportDescriptions', transportForm.description);

      const expenseData = {
        ...transportForm,
        amount: parseFloat(transportForm.amount),
        date: selectedDate,
        projectId: selectedProjectId,
      };

      const url = editingTransportId 
        ? `/api/projects/${selectedProjectId}/transportation-expenses/${editingTransportId}`
        : `/api/projects/${selectedProjectId}/transportation-expenses`;
      
      const method = editingTransportId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        Alert.alert('نجح', editingTransportId ? 'تم تحديث المصروف' : 'تم إضافة المصروف');
        setTransportForm({
          description: '',
          amount: '',
          notes: '',
        });
        setEditingTransportId(null);
        setModalVisible(false);
        loadDailyData();
      } else {
        throw new Error('فشل في حفظ المصروف');
      }
    } catch (error) {
      console.error('خطأ في حفظ المصروف:', error);
      Alert.alert('خطأ', 'فشل في حفظ المصروف');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFundTransfer = async (id: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذه الحولة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`/api/projects/${selectedProjectId}/fund-transfers/${id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                Alert.alert('تم', 'تم حذف الحولة');
                loadDailyData();
              }
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف الحولة');
            }
          },
        },
      ]
    );
  };

  const handleDeleteTransportExpense = async (id: string) => {
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
              const response = await fetch(`/api/projects/${selectedProjectId}/transportation-expenses/${id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                Alert.alert('تم', 'تم حذف المصروف');
                loadDailyData();
              }
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف المصروف');
            }
          },
        },
      ]
    );
  };

  // فتح نموذج الإدخال
  const openModal = (type: 'fund' | 'transport' | 'worker' | 'project_transfer') => {
    setModalType(type);
    setModalVisible(true);
  };

  // فتح نموذج التحرير
  const editFundTransfer = (transfer: FundTransfer) => {
    setFundForm({
      amount: transfer.amount.toString(),
      senderName: transfer.senderName,
      transferNumber: transfer.transferNumber || '',
      transferType: transfer.transferType || '',
      notes: transfer.notes || '',
      isProjectTransfer: transfer.isProjectTransfer || false,
      fromProject: transfer.fromProject || '',
      toProject: transfer.toProject || '',
    });
    setEditingFundId(transfer.id);
    setModalType('fund');
    setModalVisible(true);
  };

  const editTransportExpense = (expense: TransportationExpense) => {
    setTransportForm({
      description: expense.description,
      amount: expense.amount.toString(),
      notes: expense.notes || '',
    });
    setEditingTransportId(expense.id);
    setModalType('transport');
    setModalVisible(true);
  };

  // مكون ملخص الإحصائيات مطابق للويب
  const ExpenseSummary = () => (
    <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.summaryTitle, { color: colors.text }]}>ملخص اليوم - {selectedDate}</Text>
      
      <View style={styles.summaryGrid}>
        {/* المبلغ المرحل */}
        <View style={[styles.summaryItem, styles.gradientBlue]}>
          <View style={styles.summaryContent}>
            <Icons.ArrowDown size={20} color="white" />
            <View style={styles.summaryText}>
              <Text style={styles.summaryValue}>{formatCurrency(parseFloat(carriedForward))}</Text>
              <Text style={styles.summaryLabel}>مرحل من الأمس</Text>
            </View>
          </View>
        </View>

        {/* إجمالي التوريد */}
        <View style={[styles.summaryItem, styles.gradientGreen]}>
          <View style={styles.summaryContent}>
            <Icons.TrendingUp size={20} color="white" />
            <View style={styles.summaryText}>
              <Text style={styles.summaryValue}>{formatCurrency(totalIncome)}</Text>
              <Text style={styles.summaryLabel}>إجمالي التوريد</Text>
            </View>
          </View>
        </View>

        {/* إجمالي المصاريف */}
        <View style={[styles.summaryItem, styles.gradientRed]}>
          <View style={styles.summaryContent}>
            <Icons.TrendingDown size={20} color="white" />
            <View style={styles.summaryText}>
              <Text style={styles.summaryValue}>{formatCurrency(totalExpenses)}</Text>
              <Text style={styles.summaryLabel}>إجمالي المصاريف</Text>
            </View>
          </View>
        </View>

        {/* المبلغ المتبقي */}
        <View style={[styles.summaryItem, remainingBalance >= 0 ? styles.gradientTeal : styles.gradientOrange]}>
          <View style={styles.summaryContent}>
            <Icons.DollarSign size={20} color="white" />
            <View style={styles.summaryText}>
              <Text style={styles.summaryValue}>{formatCurrency(remainingBalance)}</Text>
              <Text style={styles.summaryLabel}>المتبقي</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // مكون قائمة الحولات المالية
  const FundTransfersList = () => (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Icons.ArrowLeftRight size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>التحويلات المالية</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => openModal('fund')}
        >
          <Icons.Plus size={16} color="white" />
          <Text style={styles.addButtonText}>إضافة</Text>
        </TouchableOpacity>
      </View>

      {fundTransfers.length === 0 ? (
        <View style={styles.emptyState}>
          <Icons.ArrowLeftRight size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>لا توجد تحويلات مالية</Text>
          <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
            أضف أول تحويل مالي لهذا التاريخ
          </Text>
          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
            onPress={() => openModal('fund')}
          >
            <Icons.Plus size={16} color="white" />
            <Text style={styles.emptyStateButtonText}>إضافة تحويل مالي</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={fundTransfers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.listItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.listItemContent}>
                <View style={styles.listItemInfo}>
                  <Text style={[styles.listItemTitle, { color: colors.text }]}>{item.senderName}</Text>
                  <Text style={[styles.listItemAmount, { color: colors.success }]}>
                    {formatCurrency(item.amount)}
                  </Text>
                  {item.transferNumber && (
                    <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                      رقم الحولة: {item.transferNumber}
                    </Text>
                  )}
                  {item.transferType && (
                    <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                      نوع الحولة: {item.transferType}
                    </Text>
                  )}
                </View>
                <View style={styles.listItemActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.info }]}
                    onPress={() => editFundTransfer(item)}
                  >
                    <Icons.Edit size={14} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.error }]}
                    onPress={() => handleDeleteFundTransfer(item.id)}
                  >
                    <Icons.Trash size={14} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );

  // مكون قائمة مصاريف النقل
  const TransportExpensesList = () => (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Icons.Car size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>مصاريف النقل</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => openModal('transport')}
        >
          <Icons.Plus size={16} color="white" />
          <Text style={styles.addButtonText}>إضافة</Text>
        </TouchableOpacity>
      </View>

      {transportExpenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Icons.Car size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>لا توجد مصاريف نقل</Text>
          <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
            أضف أول مصروف نقل لهذا التاريخ
          </Text>
          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
            onPress={() => openModal('transport')}
          >
            <Icons.Plus size={16} color="white" />
            <Text style={styles.emptyStateButtonText}>إضافة مصروف نقل</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transportExpenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.listItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.listItemContent}>
                <View style={styles.listItemInfo}>
                  <Text style={[styles.listItemTitle, { color: colors.text }]}>{item.description}</Text>
                  <Text style={[styles.listItemAmount, { color: colors.error }]}>
                    {formatCurrency(item.amount)}
                  </Text>
                  {item.notes && (
                    <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                      ملاحظات: {item.notes}
                    </Text>
                  )}
                </View>
                <View style={styles.listItemActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.info }]}
                    onPress={() => editTransportExpense(item)}
                  >
                    <Icons.Edit size={14} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.error }]}
                    onPress={() => handleDeleteTransportExpense(item.id)}
                  >
                    <Icons.Trash size={14} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );

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
      {/* شريط العنوان المطور */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>المصاريف اليومية</Text>
        <View style={styles.dateContainer}>
          <Icons.Calendar size={20} color={colors.primary} />
          <TextInput
            style={[styles.dateInput, { 
              backgroundColor: colors.background, 
              color: colors.text,
              borderColor: colors.border 
            }]}
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="التاريخ"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ملخص الإحصائيات مطابق للويب */}
        <ExpenseSummary />

        {/* التحويلات المالية */}
        <FundTransfersList />

        {/* مصاريف النقل */}
        <TransportExpensesList />
      </ScrollView>

      {/* Modal مطور مطابق للويب */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {modalType === 'fund' ? 'إضافة حولة مالية' : 'إضافة مصروف نقل'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Icons.X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {modalType === 'fund' ? (
                <View style={styles.formContainer}>
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>اسم المرسل *</Text>
                    <AutocompleteInput
                      value={fundForm.senderName}
                      onChangeText={(text) => setFundForm(prev => ({ ...prev, senderName: text }))}
                      placeholder="أدخل اسم المرسل"
                      category="senderNames"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>المبلغ *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      value={fundForm.amount}
                      onChangeText={(text) => setFundForm(prev => ({ ...prev, amount: text }))}
                      placeholder="أدخل المبلغ"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>رقم الحولة</Text>
                    <AutocompleteInput
                      value={fundForm.transferNumber}
                      onChangeText={(text) => setFundForm(prev => ({ ...prev, transferNumber: text }))}
                      placeholder="أدخل رقم الحولة"
                      category="transferNumbers"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>نوع الحولة</Text>
                    <AutocompleteInput
                      value={fundForm.transferType}
                      onChangeText={(text) => setFundForm(prev => ({ ...prev, transferType: text }))}
                      placeholder="أدخل نوع الحولة"
                      category="transferTypes"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>ملاحظات</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      value={fundForm.notes}
                      onChangeText={(text) => setFundForm(prev => ({ ...prev, notes: text }))}
                      placeholder="أدخل ملاحظات إضافية"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.formContainer}>
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>وصف المصروف *</Text>
                    <AutocompleteInput
                      value={transportForm.description}
                      onChangeText={(text) => setTransportForm(prev => ({ ...prev, description: text }))}
                      placeholder="أدخل وصف المصروف"
                      category="transportDescriptions"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>المبلغ *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      value={transportForm.amount}
                      onChangeText={(text) => setTransportForm(prev => ({ ...prev, amount: text }))}
                      placeholder="أدخل المبلغ"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>ملاحظات</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      value={transportForm.notes}
                      onChangeText={(text) => setTransportForm(prev => ({ ...prev, notes: text }))}
                      placeholder="أدخل ملاحظات إضافية"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={modalType === 'fund' ? handleSaveFundTransfer : handleSaveTransportExpense}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingFundId || editingTransportId ? 'تحديث' : 'حفظ'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// الـ Styles المطابقة للويب 100%
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minWidth: 120,
    textAlign: 'center',
  },

  // Content styles
  content: {
    flex: 1,
    padding: 16,
  },

  // Summary card styles
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryText: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Gradient colors مطابقة للويب
  gradientBlue: {
    backgroundColor: '#3b82f6',
  },
  gradientGreen: {
    backgroundColor: '#22c55e',
  },
  gradientRed: {
    backgroundColor: '#ef4444',
  },
  gradientTeal: {
    backgroundColor: '#0d9488',
  },
  gradientOrange: {
    backgroundColor: '#f97316',
  },

  // Section card styles
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty state styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // List item styles
  listItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  listItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listItemInfo: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  listItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    maxHeight: 400,
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
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