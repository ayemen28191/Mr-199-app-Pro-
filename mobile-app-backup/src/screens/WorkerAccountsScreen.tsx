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
  transferMethod: 'cash' | 'bank' | 'hawaleh';
  recipientName?: string;
  recipientPhone?: string;
  transferNumber?: string;
  transferDate: string;
  notes?: string;
}

interface AutocompleteData {
  id: string;
  category: string;
  value: string;
  usageCount: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
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
  
  // البيانات المحسنة
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerBalances, setWorkerBalances] = useState<WorkerBalance[]>([]);
  const [workerTransfers, setWorkerTransfers] = useState<WorkerTransfer[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [autocompleteData, setAutocompleteData] = useState<AutocompleteData[]>([]);
  
  // حالات التصفية والبحث المتقدمة
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'negative' | 'zero'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'earned' | 'paid'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // نموذج التحويل المحسن
  const [transferForm, setTransferForm] = useState({
    workerId: '',
    amount: '',
    transferMethod: 'cash' as WorkerTransfer['transferMethod'],
    recipientName: '',
    recipientPhone: '',
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

  // تحميل البيانات المحسن مع Autocomplete
  const loadData = async () => {
    try {
      setLoading(true);
      
      // تحميل جميع البيانات بالتوازي
      const [workersRes, balancesRes, transfersRes, paymentsRes, projectsRes, autocompleteRes] = await Promise.all([
        fetch('/api/workers'),
        fetch(`/api/worker-balances?projectId=${selectedProjectId || ''}`),
        fetch(`/api/worker-transfers?projectId=${selectedProjectId || ''}`),
        fetch(`/api/worker-payments?projectId=${selectedProjectId || ''}`),
        fetch('/api/projects'),
        fetch('/api/autocomplete-data')
      ]);
      
      if (workersRes.ok) {
        const workersData = await workersRes.json();
        setWorkers(workersData);
      }
      
      if (balancesRes.ok) {
        const balancesData = await balancesRes.json();
        setWorkerBalances(balancesData);
      }
      
      if (transfersRes.ok) {
        const transfersData = await transfersRes.json();
        setWorkerTransfers(transfersData);
      }
      
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPaymentHistory(paymentsData);
      }
      
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      }
      
      if (autocompleteRes.ok) {
        const autocompleteData = await autocompleteRes.json();
        setAutocompleteData(autocompleteData);
      }
      
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      Alert.alert('خطأ', 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };
  
  // حفظ بيانات الإكمال التلقائي
  const saveAutocompleteValue = async (category: string, value: string) => {
    if (!value.trim()) return;
    
    try {
      await fetch('/api/autocomplete-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, value: value.trim() })
      });
    } catch (error) {
      console.warn('فشل في حفظ بيانات الإكمال التلقائي:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  // إضافة تحويل محسن مع حفظ بيانات الإكمال التلقائي
  const addTransfer = async () => {
    if (!transferForm.workerId || !transferForm.amount || !transferForm.recipientName) {
      Alert.alert('خطأ', 'يرجى ملء جميع البيانات المطلوبة');
      return;
    }

    const amount = parseFloat(transferForm.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    setSaving(true);
    try {
      // حفظ بيانات الإكمال التلقائي
      await saveAutocompleteValue('worker_transfer_recipient', transferForm.recipientName);
      if (transferForm.recipientPhone) {
        await saveAutocompleteValue('worker_transfer_phone', transferForm.recipientPhone);
      }
      if (transferForm.transferNumber) {
        await saveAutocompleteValue('worker_transfer_number', transferForm.transferNumber);
      }

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

  // دوال التصفية والبحث المتقدمة
  const getFilteredWorkerBalances = () => {
    let filtered = [...workerBalances];
    
    // تطبيق فلتر البحث
    if (searchTerm) {
      filtered = filtered.filter(balance => 
        balance.workerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // تطبيق فلتر نوع الرصيد
    switch (filterType) {
      case 'positive':
        filtered = filtered.filter(balance => balance.currentBalance > 0);
        break;
      case 'negative':
        filtered = filtered.filter(balance => balance.currentBalance < 0);
        break;
      case 'zero':
        filtered = filtered.filter(balance => balance.currentBalance === 0);
        break;
    }
    
    // تطبيق الترتيب
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.workerName;
          bValue = b.workerName;
          break;
        case 'balance':
          aValue = a.currentBalance;
          bValue = b.currentBalance;
          break;
        case 'earned':
          aValue = a.totalEarned;
          bValue = b.totalEarned;
          break;
        case 'paid':
          aValue = a.totalPaid;
          bValue = b.totalPaid;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  };
  
  // حفظ واسترجاع بيانات الإكمال التلقائي
  const getAutocompleteData = (category: string) => {
    return autocompleteData
      .filter(item => item.category === category)
      .sort((a, b) => b.usageCount - a.usageCount)
      .map(item => item.value);
  };
  
  // إعادة تعيين نموذج التحويل
  const resetTransferForm = () => {
    setTransferForm({
      workerId: '',
      amount: '',
      transferMethod: 'cash',
      recipientName: '',
      recipientPhone: '',
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

  // مكون AutocompleteInput متطور
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
      if (value.length > 0) {
        const filtered = getAutocompleteData(category)
          .filter(item => item.toLowerCase().includes(value.toLowerCase()))
          .slice(0, 5);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        setShowSuggestions(false);
      }
    }, [value, category]);
    
    return (
      <View style={style}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
        />
        {showSuggestions && (
          <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  onChangeText(suggestion);
                  setShowSuggestions(false);
                }}
              >
                <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
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

  const { width } = Dimensions.get('window');
  const filteredBalances = getFilteredWorkerBalances();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header مع Gradient متطور */}
      <View style={[styles.headerGradient, {
        background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.secondary || colors.primary}15 100%)`
      }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleSection}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>💼 حسابات العمال</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
              إدارة الأرصدة والتحويلات المالية
            </Text>
          </View>
          
          {/* بطاقة الإحصائيات السريعة */}
          <View style={styles.quickStatsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>عدد العمال</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>{filteredBalances.length}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>إجمالي الأرصدة</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {formatCurrency(filteredBalances.reduce((sum, b) => sum + b.currentBalance, 0))}
              </Text>
            </View>
          </View>
          
          {/* شريط البحث والتصفية */}
          <View style={styles.searchFilterContainer}>
            <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
              <Icons.Search size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="ابحث في العمال..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: showFilters ? colors.primary : colors.surface }]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Icons.Filter size={20} color={showFilters ? colors.surface : colors.text} />
            </TouchableOpacity>
          </View>
          
          {/* فلاتر متقدمة */}
          {showFilters && (
            <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterRow}>
                  <Text style={[styles.filterLabel, { color: colors.text }]}>نوع الرصيد:</Text>
                  {['all', 'positive', 'negative', 'zero'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.filterChip, {
                        backgroundColor: filterType === type ? colors.primary : colors.background,
                        borderColor: colors.border
                      }]}
                      onPress={() => setFilterType(type as any)}
                    >
                      <Text style={[styles.filterChipText, {
                        color: filterType === type ? colors.surface : colors.text
                      }]}>
                        {type === 'all' ? 'الكل' : 
                         type === 'positive' ? 'موجب' :
                         type === 'negative' ? 'سالب' : 'صفر'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* تبويبات متطورة */}
      <View style={[styles.modernTabContainer, { backgroundColor: colors.surface }]}>
        {[
          { key: 'balances', icon: 'Wallet', label: 'الأرصدة', count: filteredBalances.length },
          { key: 'transfers', icon: 'Send', label: 'التحويلات', count: workerTransfers.length },
          { key: 'payments', icon: 'CreditCard', label: 'المدفوعات', count: paymentHistory.length }
        ].map((tab) => {
          const IconComponent = Icons[tab.icon as keyof typeof Icons] as any;
          const isActive = selectedTab === tab.key;
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.modernTab, {
                backgroundColor: isActive ? colors.primary : 'transparent',
                borderColor: isActive ? colors.primary : colors.border
              }]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <IconComponent size={20} color={isActive ? colors.surface : colors.text} />
              <Text style={[styles.modernTabText, {
                color: isActive ? colors.surface : colors.text
              }]}>
                {tab.label}
              </Text>
              <View style={[styles.tabBadge, {
                backgroundColor: isActive ? colors.surface : colors.primary
              }]}>
                <Text style={[styles.tabBadgeText, {
                  color: isActive ? colors.primary : colors.surface
                }]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* المحتوى المحسن */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'balances' && (
          <View style={styles.contentContainer}>
            {filteredBalances.length === 0 ? (
              <View style={[styles.emptyStateContainer, { backgroundColor: colors.surface }]}>
                <Icons.Users size={80} color={colors.textSecondary} />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>لا توجد بيانات</Text>
                <Text style={[styles.emptyStateMessage, { color: colors.textSecondary }]}>
                  {searchTerm || filterType !== 'all' ? 'لا توجد نتائج للبحث أو التصفية' : 'لم يتم إضافة عمال بعد'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredBalances}
                keyExtractor={(item) => item.workerId}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: balance }) => (
                  <View style={[styles.modernBalanceCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.balanceCardHeader}>
                      <View style={styles.workerInfoSection}>
                        <View style={[styles.workerAvatar, { backgroundColor: colors.primary + '20' }]}>
                          <Icons.User size={24} color={colors.primary} />
                        </View>
                        <View style={styles.workerDetails}>
                          <Text style={[styles.modernWorkerName, { color: colors.text }]}>{balance.workerName}</Text>
                          <Text style={[styles.workerRole, { color: colors.textSecondary }]}>
                            {workers.find(w => w.id === balance.workerId)?.type || 'غير محدد'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.balanceSection}>
                        <Text style={[styles.modernCurrentBalance, { color: getBalanceColor(balance.currentBalance) }]}>
                          {formatCurrency(balance.currentBalance)}
                        </Text>
                        <Text style={[styles.balanceStatus, { color: colors.textSecondary }]}>الرصيد الحالي</Text>
                      </View>
                    </View>
                    
                    <View style={styles.balanceStatsGrid}>
                      <View style={[styles.statItem, { borderRightColor: colors.border }]}>
                        <Icons.TrendingUp size={18} color={colors.success} />
                        <Text style={[styles.statAmount, { color: colors.success }]}>
                          {formatCurrency(balance.totalEarned)}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>إجمالي المكتسب</Text>
                      </View>
                      
                      <View style={styles.statItem}>
                        <Icons.TrendingDown size={18} color={colors.error} />
                        <Text style={[styles.statAmount, { color: colors.error }]}>
                          {formatCurrency(balance.totalPaid)}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>إجمالي المدفوع</Text>
                      </View>
                    </View>
                    
                    {balance.lastPaymentDate && (
                      <View style={[styles.lastPaymentInfo, { backgroundColor: colors.background }]}>
                        <Icons.Calendar size={16} color={colors.textSecondary} />
                        <Text style={[styles.lastPaymentText, { color: colors.textSecondary }]}>
                          آخر دفعة: {new Date(balance.lastPaymentDate).toLocaleDateString('ar-SA')}
                        </Text>
                      </View>
                    )}

                    <View style={styles.modernBalanceActions}>
                      <TouchableOpacity
                        style={[styles.modernActionButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                        onPress={() => {
                          const worker = workers.find(w => w.id === balance.workerId);
                          if (worker) openTransferModal(worker);
                        }}
                      >
                        <Icons.Send size={18} color={colors.primary} />
                        <Text style={[styles.modernActionText, { color: colors.primary }]}>تحويل مالي</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.modernActionButton, { backgroundColor: colors.success + '15', borderColor: colors.success }]}
                        onPress={() => {
                          const worker = workers.find(w => w.id === balance.workerId);
                          if (worker) openPaymentModal(worker);
                        }}
                      >
                        <Icons.CreditCard size={18} color={colors.success} />
                        <Text style={[styles.modernActionText, { color: colors.success }]}>دفع مباشر</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
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
                <Text style={[styles.label, { color: colors.text }]}>طريقة التحويل</Text>
                <View style={styles.transferMethodContainer}>
                  {[
                    { key: 'cash', label: 'نقدي', icon: 'Banknote' },
                    { key: 'bank', label: 'بنكي', icon: 'Building' },
                    { key: 'hawaleh', label: 'حوالة', icon: 'Send' }
                  ].map((method) => {
                    const IconComponent = Icons[method.icon as keyof typeof Icons] as any;
                    const isSelected = transferForm.transferMethod === method.key;
                    
                    return (
                      <TouchableOpacity
                        key={method.key}
                        style={[styles.transferMethodButton, {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border
                        }]}
                        onPress={() => setTransferForm(prev => ({ ...prev, transferMethod: method.key as any }))}
                      >
                        <IconComponent size={20} color={isSelected ? colors.surface : colors.text} />
                        <Text style={[styles.transferMethodText, {
                          color: isSelected ? colors.surface : colors.text
                        }]}>
                          {method.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>اسم المستلم *</Text>
                <AutocompleteInput
                  value={transferForm.recipientName}
                  onChangeText={(text) => setTransferForm(prev => ({ ...prev, recipientName: text }))}
                  placeholder="اسم المستلم"
                  category="worker_transfer_recipient"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>رقم هاتف المستلم</Text>
                <AutocompleteInput
                  value={transferForm.recipientPhone}
                  onChangeText={(text) => setTransferForm(prev => ({ ...prev, recipientPhone: text }))}
                  placeholder="رقم الهاتف (اختياري)"
                  category="worker_transfer_phone"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>رقم التحويل</Text>
                <AutocompleteInput
                  value={transferForm.transferNumber}
                  onChangeText={(text) => setTransferForm(prev => ({ ...prev, transferNumber: text }))}
                  placeholder="رقم التحويل (اختياري)"
                  category="worker_transfer_number"
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
      
      {/* Floating Action Buttons */}
      <View style={styles.floatingActions}>
        <TouchableOpacity
          style={[styles.floatingButton, styles.secondaryFab, { backgroundColor: colors.success }]}
          onPress={() => openPaymentModal()}
        >
          <Icons.CreditCard size={24} color={colors.surface} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.floatingButton, styles.primaryFab, { backgroundColor: colors.primary }]}
          onPress={() => openTransferModal()}
        >
          <Icons.Send size={24} color={colors.surface} />
        </TouchableOpacity>
      </View>
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