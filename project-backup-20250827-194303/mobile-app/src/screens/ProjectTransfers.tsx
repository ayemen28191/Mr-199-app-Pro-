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
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import * as Icons from 'lucide-react-native';
import { AutocompleteInput } from '../components/AutocompleteInput';

interface Project {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  currentBalance: number;
  totalBudget: number;
}

interface ProjectTransfer {
  id: string;
  fromProjectId: string;
  fromProjectName: string;
  toProjectId: string;
  toProjectName: string;
  transferType: 'money' | 'materials' | 'equipment' | 'workers';
  amount?: number;
  quantity?: number;
  itemName?: string;
  itemDescription?: string;
  itemCategory?: string;
  transferDate: string;
  transferReason: string;
  transferredBy: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approvedBy?: string;
  approvedDate?: string;
  rejectedBy?: string;
  rejectedDate?: string;
  rejectionReason?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  attachments?: string[];
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
}

interface TransferFilters {
  transferType: 'all' | 'money' | 'materials' | 'equipment' | 'workers';
  status: 'all' | 'pending' | 'approved' | 'rejected' | 'completed';
  priority: 'all' | 'low' | 'medium' | 'high' | 'urgent';
  direction: 'all' | 'outgoing' | 'incoming';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
}

interface TransferStats {
  totalTransfers: number;
  pendingTransfers: number;
  approvedTransfers: number;
  completedTransfers: number;
  totalMoneyTransferred: number;
  totalMaterialsTransferred: number;
  avgApprovalTime: number;
}

export default function ProjectTransfers() {
  const { colors } = useTheme();
  const { selectedProjectId, selectedProject } = useProject();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<ProjectTransfer | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  
  // Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [transfers, setTransfers] = useState<ProjectTransfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<ProjectTransfer[]>([]);
  const [transferStats, setTransferStats] = useState<TransferStats>({
    totalTransfers: 0,
    pendingTransfers: 0,
    approvedTransfers: 0,
    completedTransfers: 0,
    totalMoneyTransferred: 0,
    totalMaterialsTransferred: 0,
    avgApprovalTime: 0,
  });
  
  // Filters
  const [filters, setFilters] = useState<TransferFilters>({
    transferType: 'all',
    status: 'all',
    priority: 'all',
    direction: 'all',
    dateRange: 'all',
  });
  
  // Form
  const [transferForm, setTransferForm] = useState({
    fromProjectId: selectedProjectId || '',
    toProjectId: '',
    transferType: 'money' as ProjectTransfer['transferType'],
    amount: '',
    quantity: '',
    itemName: '',
    itemDescription: '',
    itemCategory: '',
    transferReason: '',
    transferredBy: '',
    notes: '',
    priority: 'medium' as ProjectTransfer['priority'],
    estimatedCompletionDate: '',
  });

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load projects
      const projectsResponse = await fetch('/api/projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.filter((p: Project) => p.isActive));
      }
      
      // Load transfers
      const transfersResponse = await fetch('/api/project-transfers');
      if (transfersResponse.ok) {
        const transfersData = await transfersResponse.json();
        setTransfers(transfersData);
        calculateStats(transfersData);
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
  }, []);

  // Calculate statistics
  const calculateStats = (transfersData: ProjectTransfer[]) => {
    const stats: TransferStats = {
      totalTransfers: transfersData.length,
      pendingTransfers: transfersData.filter(t => t.status === 'pending').length,
      approvedTransfers: transfersData.filter(t => t.status === 'approved').length,
      completedTransfers: transfersData.filter(t => t.status === 'completed').length,
      totalMoneyTransferred: transfersData
        .filter(t => t.transferType === 'money' && t.status === 'completed')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      totalMaterialsTransferred: transfersData
        .filter(t => t.transferType === 'materials' && t.status === 'completed').length,
      avgApprovalTime: 0, // Calculate based on actual data
    };
    
    setTransferStats(stats);
  };

  // Apply filters
  useEffect(() => {
    filterTransfers();
  }, [filters, transfers, selectedProjectId]);

  const filterTransfers = () => {
    let filtered = [...transfers];
    
    // Filter by project
    if (selectedProjectId) {
      switch (filters.direction) {
        case 'outgoing':
          filtered = filtered.filter(t => t.fromProjectId === selectedProjectId);
          break;
        case 'incoming':
          filtered = filtered.filter(t => t.toProjectId === selectedProjectId);
          break;
        default:
          filtered = filtered.filter(t => 
            t.fromProjectId === selectedProjectId || t.toProjectId === selectedProjectId
          );
      }
    }
    
    // Filter by type
    if (filters.transferType !== 'all') {
      filtered = filtered.filter(t => t.transferType === filters.transferType);
    }
    
    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    
    // Filter by priority
    if (filters.priority !== 'all') {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }
    
    // Filter by date
    if (filters.dateRange !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(t => new Date(t.transferDate) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(t => new Date(t.transferDate) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(t => new Date(t.transferDate) >= filterDate);
          break;
      }
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime());
    
    setFilteredTransfers(filtered);
  };

  // Add transfer
  const addTransfer = async () => {
    if (!transferForm.fromProjectId || !transferForm.toProjectId || !transferForm.transferReason) {
      Alert.alert('خطأ', 'يرجى ملء البيانات المطلوبة');
      return;
    }

    if (transferForm.fromProjectId === transferForm.toProjectId) {
      Alert.alert('خطأ', 'لا يمكن التحويل من نفس المشروع إلى نفسه');
      return;
    }

    // Validate based on transfer type
    if (transferForm.transferType === 'money') {
      if (!transferForm.amount || parseFloat(transferForm.amount) <= 0) {
        Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
        return;
      }
      
      // Check if source project has sufficient balance
      const sourceProject = projects.find(p => p.id === transferForm.fromProjectId);
      if (sourceProject && parseFloat(transferForm.amount) > sourceProject.currentBalance) {
        Alert.alert('خطأ', `الرصيد غير كافي. الرصيد المتاح: ${formatCurrency(sourceProject.currentBalance)}`);
        return;
      }
    }

    if (['materials', 'equipment'].includes(transferForm.transferType)) {
      if (!transferForm.itemName || !transferForm.quantity || parseFloat(transferForm.quantity) <= 0) {
        Alert.alert('خطأ', 'يرجى إدخال اسم العنصر والكمية');
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetch('/api/project-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transferForm,
          amount: transferForm.amount ? parseFloat(transferForm.amount) : null,
          quantity: transferForm.quantity ? parseFloat(transferForm.quantity) : null,
          transferDate: new Date().toISOString().split('T')[0],
          status: 'pending',
        }),
      });

      if (response.ok) {
        const newTransfer = await response.json();
        setTransfers(prev => [newTransfer, ...prev]);
        resetTransferForm();
        setModalVisible(false);
        Alert.alert('نجح', 'تم إنشاء طلب التحويل بنجاح، في انتظار الموافقة');
      }
    } catch (error) {
      console.error('خطأ في إضافة التحويل:', error);
      Alert.alert('خطأ', 'فشل في إضافة التحويل');
    } finally {
      setSaving(false);
    }
  };

  // Approve transfer
  const approveTransfer = async (transferId: string) => {
    Alert.alert(
      'تأكيد الموافقة',
      'هل أنت متأكد من الموافقة على هذا التحويل؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'موافقة',
          onPress: async () => {
            try {
              const response = await fetch(`/api/project-transfers/${transferId}/approve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: 'approved',
                  approvedBy: 'مدير المشاريع',
                  approvedDate: new Date().toISOString().split('T')[0],
                }),
              });

              if (response.ok) {
                const updatedTransfer = await response.json();
                setTransfers(prev => prev.map(t => 
                  t.id === transferId ? { ...t, ...updatedTransfer } : t
                ));
                Alert.alert('تمت الموافقة', 'تم اعتماد التحويل وتنفيذه');
              }
            } catch (error) {
              Alert.alert('خطأ', 'فشل في الموافقة على التحويل');
            }
          },
        },
      ]
    );
  };

  // Reject transfer
  const rejectTransfer = async (transferId: string, rejectionReason?: string) => {
    Alert.alert(
      'تأكيد الرفض',
      'هل أنت متأكد من رفض هذا التحويل؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'رفض',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`/api/project-transfers/${transferId}/reject`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: 'rejected',
                  rejectedBy: 'مدير المشاريع',
                  rejectedDate: new Date().toISOString().split('T')[0],
                  rejectionReason: rejectionReason || 'تم الرفض',
                }),
              });
              
              if (response.ok) {
                const updatedTransfer = await response.json();
                setTransfers(prev => prev.map(t => 
                  t.id === transferId ? { ...t, ...updatedTransfer } : t
                ));
                Alert.alert('تم الرفض', 'تم رفض طلب التحويل');
              }
            } catch (error) {
              Alert.alert('خطأ', 'فشل في رفض التحويل');
            }
          },
        },
      ]
    );
  };

  // Complete transfer
  const completeTransfer = async (transferId: string) => {
    try {
      const response = await fetch(`/api/project-transfers/${transferId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          actualCompletionDate: new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        const updatedTransfer = await response.json();
        setTransfers(prev => prev.map(t => 
          t.id === transferId ? { ...t, ...updatedTransfer } : t
        ));
        Alert.alert('تم التنفيذ', 'تم تنفيذ التحويل بنجاح');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تنفيذ التحويل');
    }
  };

  // Reset form
  const resetTransferForm = () => {
    setTransferForm({
      fromProjectId: selectedProjectId || '',
      toProjectId: '',
      transferType: 'money',
      amount: '',
      quantity: '',
      itemName: '',
      itemDescription: '',
      itemCategory: '',
      transferReason: '',
      transferredBy: '',
      notes: '',
      priority: 'medium',
      estimatedCompletionDate: '',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get transfer type name
  const getTransferTypeName = (type: ProjectTransfer['transferType']) => {
    switch (type) {
      case 'money': return 'مالي';
      case 'materials': return 'مواد';
      case 'equipment': return 'معدات';
      case 'workers': return 'عمالة';
      default: return type;
    }
  };

  // Get transfer type icon
  const getTransferTypeIcon = (type: ProjectTransfer['transferType']) => {
    switch (type) {
      case 'money': return 'DollarSign';
      case 'materials': return 'Package';
      case 'equipment': return 'Settings';
      case 'workers': return 'Users';
      default: return 'ArrowRight';
    }
  };

  // Get transfer type color
  const getTransferTypeColor = (type: ProjectTransfer['transferType']) => {
    switch (type) {
      case 'money': return colors.success;
      case 'materials': return colors.warning;
      case 'equipment': return colors.primary;
      case 'workers': return colors.secondary || colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  // Get status color
  const getStatusColor = (status: ProjectTransfer['status']) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'approved': return colors.primary;
      case 'rejected': return colors.error;
      case 'completed': return colors.success;
      default: return colors.textSecondary;
    }
  };

  // Get status text
  const getStatusText = (status: ProjectTransfer['status']) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'approved': return 'معتمد';
      case 'rejected': return 'مرفوض';
      case 'completed': return 'مكتمل';
      default: return 'غير محدد';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: ProjectTransfer['priority']) => {
    switch (priority) {
      case 'low': return colors.textSecondary;
      case 'medium': return colors.warning;
      case 'high': return colors.error;
      case 'urgent': return '#8B0000';
      default: return colors.textSecondary;
    }
  };

  // Get priority text
  const getPriorityText = (priority: ProjectTransfer['priority']) => {
    switch (priority) {
      case 'low': return 'منخفض';
      case 'medium': return 'متوسط';
      case 'high': return 'عالي';
      case 'urgent': return 'عاجل';
      default: return 'غير محدد';
    }
  };

  // Open transfer details
  const openTransferDetails = (transfer: ProjectTransfer) => {
    setSelectedTransfer(transfer);
    setDetailsModalVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري تحميل التحويلات...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header متطور مع Gradient */}
      <LinearGradient
        colors={[colors.primary, colors.secondary || colors.primary]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleSection}>
            <Text style={[styles.pageTitle, { color: colors.surface }]}>تحويلات المشاريع</Text>
            <Text style={[styles.pageSubtitle, { color: colors.surface }]}>
              إدارة وتتبع التحويلات بين المشاريع
            </Text>
          </View>

          {/* إحصائيات سريعة */}
          <View style={styles.quickStatsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.warning + '20' }]}>
              <Icons.Clock size={20} color={colors.warning} />
              <Text style={[styles.statValue, { color: colors.surface }]}>{transferStats.pendingTransfers}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>في الانتظار</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.success + '20' }]}>
              <Icons.CheckCircle size={20} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.surface }]}>{transferStats.completedTransfers}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>مكتمل</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.primary + '20' }]}>
              <Icons.DollarSign size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.surface }]}>{formatCurrency(transferStats.totalMoneyTransferred)}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>مُحول</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.surface + '20' }]}>
              <Icons.Package size={20} color={colors.surface} />
              <Text style={[styles.statValue, { color: colors.surface }]}>{transferStats.totalMaterialsTransferred}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>مواد</Text>
            </View>
          </View>

          {/* أزرار التحكم */}
          <View style={styles.headerActionsContainer}>
            <TouchableOpacity
              style={[styles.headerActionButton, { backgroundColor: colors.surface + '20' }]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Icons.Filter size={18} color={colors.surface} />
              <Text style={[styles.headerActionText, { color: colors.surface }]}>فلاتر</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.headerActionButton, { backgroundColor: colors.surface + '20' }]}
              onPress={() => setModalVisible(true)}
            >
              <Icons.Plus size={18} color={colors.surface} />
              <Text style={[styles.headerActionText, { color: colors.surface }]}>تحويل جديد</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* فلاتر متقدمة */}
      {showFilters && (
        <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>النوع:</Text>
            <View style={styles.filterOptionsContainer}>
              {[
                { key: 'all', label: 'الكل', icon: 'Package' },
                { key: 'money', label: 'مالي', icon: 'DollarSign' },
                { key: 'materials', label: 'مواد', icon: 'Package' },
                { key: 'equipment', label: 'معدات', icon: 'Settings' },
                { key: 'workers', label: 'عمالة', icon: 'Users' }
              ].map((option) => {
                const IconComponent = Icons[option.icon as keyof typeof Icons] as any;
                const isSelected = filters.transferType === option.key;
                
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.filterChip, {
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      borderColor: isSelected ? colors.primary : colors.border
                    }]}
                    onPress={() => setFilters(prev => ({ ...prev, transferType: option.key as any }))}
                  >
                    <IconComponent size={14} color={isSelected ? colors.surface : colors.text} />
                    <Text style={[styles.filterChipText, {
                      color: isSelected ? colors.surface : colors.text
                    }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>الحالة:</Text>
            <View style={styles.filterOptionsContainer}>
              {[
                { key: 'all', label: 'الكل' },
                { key: 'pending', label: 'في الانتظار' },
                { key: 'approved', label: 'معتمد' },
                { key: 'completed', label: 'مكتمل' },
                { key: 'rejected', label: 'مرفوض' }
              ].map((option) => {
                const isSelected = filters.status === option.key;
                
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.filterChip, {
                      backgroundColor: isSelected ? colors.warning : colors.background,
                      borderColor: isSelected ? colors.warning : colors.border
                    }]}
                    onPress={() => setFilters(prev => ({ ...prev, status: option.key as any }))}
                  >
                    <Text style={[styles.filterChipText, {
                      color: isSelected ? colors.surface : colors.text
                    }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>الاتجاه:</Text>
            <View style={styles.filterOptionsContainer}>
              {[
                { key: 'all', label: 'الكل' },
                { key: 'outgoing', label: 'صادر' },
                { key: 'incoming', label: 'وارد' }
              ].map((option) => {
                const isSelected = filters.direction === option.key;
                
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.filterChip, {
                      backgroundColor: isSelected ? colors.success : colors.background,
                      borderColor: isSelected ? colors.success : colors.border
                    }]}
                    onPress={() => setFilters(prev => ({ ...prev, direction: option.key as any }))}
                  >
                    <Text style={[styles.filterChipText, {
                      color: isSelected ? colors.surface : colors.text
                    }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* قائمة التحويلات */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {filteredTransfers.length === 0 ? (
            <View style={[styles.emptyStateContainer, { backgroundColor: colors.surface }]}>
              <Icons.ArrowRightLeft size={80} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>لا توجد تحويلات</Text>
              <Text style={[styles.emptyStateMessage, { color: colors.textSecondary }]}>
                {Object.values(filters).some(filter => filter !== 'all') 
                  ? 'لا توجد تحويلات تطابق معايير البحث' 
                  : 'لم يتم إنشاء تحويلات بعد'}
              </Text>
              
              {!Object.values(filters).some(filter => filter !== 'all') && (
                <TouchableOpacity
                  style={[styles.createFirstButton, { backgroundColor: colors.primary }]}
                  onPress={() => setModalVisible(true)}
                >
                  <Icons.Plus size={20} color={colors.surface} />
                  <Text style={[styles.createFirstButtonText, { color: colors.surface }]}>إنشاء أول تحويل</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredTransfers}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: transfer }: { item: ProjectTransfer }) => {
                const TypeIcon = Icons[getTransferTypeIcon(transfer.transferType) as keyof typeof Icons] as any;
                const isOutgoing = transfer.fromProjectId === selectedProjectId;
                
                return (
                  <TouchableOpacity
                    style={[styles.modernTransferCard, { backgroundColor: colors.surface }]}
                    onPress={() => openTransferDetails(transfer)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.transferCardHeader}>
                      <View style={styles.transferTypeSection}>
                        <View style={[styles.transferTypeIcon, { backgroundColor: getTransferTypeColor(transfer.transferType) + '20' }]}>
                          <TypeIcon size={24} color={getTransferTypeColor(transfer.transferType)} />
                        </View>
                        <View style={styles.transferTypeInfo}>
                          <Text style={[styles.transferTypeName, { color: colors.text }]}>
                            {getTransferTypeName(transfer.transferType)}
                          </Text>
                          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(transfer.priority) + '20' }]}>
                            <Text style={[styles.priorityText, { color: getPriorityColor(transfer.priority) }]}>
                              {getPriorityText(transfer.priority)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.transferStatusSection}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transfer.status) + '20' }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(transfer.status) }]}>
                            {getStatusText(transfer.status)}
                          </Text>
                        </View>
                        <View style={[styles.directionBadge, { backgroundColor: isOutgoing ? colors.error + '15' : colors.success + '15' }]}>
                          <Icons.ArrowRight size={12} color={isOutgoing ? colors.error : colors.success} />
                          <Text style={[styles.directionText, { color: isOutgoing ? colors.error : colors.success }]}>
                            {isOutgoing ? 'صادر' : 'وارد'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.projectsFlow}>
                      <Text style={[styles.projectName, { color: colors.text }]}>
                        {transfer.fromProjectName}
                      </Text>
                      <Icons.ArrowRight size={16} color={colors.primary} />
                      <Text style={[styles.projectName, { color: colors.text }]}>
                        {transfer.toProjectName}
                      </Text>
                    </View>

                    <View style={styles.transferDetails}>
                      {transfer.transferType === 'money' && transfer.amount && (
                        <View style={styles.transferAmount}>
                          <Icons.DollarSign size={16} color={colors.success} />
                          <Text style={[styles.amountText, { color: colors.success }]}>
                            {formatCurrency(transfer.amount)}
                          </Text>
                        </View>
                      )}
                      
                      {['materials', 'equipment'].includes(transfer.transferType) && (
                        <View style={styles.itemDetails}>
                          <Text style={[styles.itemName, { color: colors.text }]}>
                            {transfer.itemName} ({transfer.quantity} وحدة)
                          </Text>
                          {transfer.itemCategory && (
                            <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
                              فئة: {transfer.itemCategory}
                            </Text>
                          )}
                        </View>
                      )}
                      
                      <Text style={[styles.transferReason, { color: colors.textSecondary }]} numberOfLines={2}>
                        {transfer.transferReason}
                      </Text>
                      
                      <View style={styles.transferMeta}>
                        <View style={styles.metaItem}>
                          <Icons.Calendar size={14} color={colors.textSecondary} />
                          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {new Date(transfer.transferDate).toLocaleDateString('ar-SA')}
                          </Text>
                        </View>
                        
                        {transfer.transferredBy && (
                          <View style={styles.metaItem}>
                            <Icons.User size={14} color={colors.textSecondary} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                              {transfer.transferredBy}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {transfer.status === 'pending' && (
                      <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.success + '15', borderColor: colors.success }]}
                          onPress={() => approveTransfer(transfer.id)}
                        >
                          <Icons.Check size={16} color={colors.success} />
                          <Text style={[styles.actionButtonText, { color: colors.success }]}>موافقة</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.error + '15', borderColor: colors.error }]}
                          onPress={() => rejectTransfer(transfer.id)}
                        >
                          <Icons.X size={16} color={colors.error} />
                          <Text style={[styles.actionButtonText, { color: colors.error }]}>رفض</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {transfer.status === 'approved' && (
                      <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                          onPress={() => completeTransfer(transfer.id)}
                        >
                          <Icons.CheckCircle size={16} color={colors.primary} />
                          <Text style={[styles.actionButtonText, { color: colors.primary }]}>تنفيذ</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
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
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>تحويل جديد بين المشاريع</Text>
              <TouchableOpacity onPress={() => {
                resetTransferForm();
                setModalVisible(false);
              }}>
                <Icons.X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* المشاريع */}
              <View style={styles.projectsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>المشاريع</Text>
                
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>من مشروع *</Text>
                    <View style={[styles.selectContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <AutocompleteInput
                        value={projects.find(p => p.id === transferForm.fromProjectId)?.name || ''}
                        onChangeText={(text: string) => {
                          const project = projects.find(p => p.name === text);
                          if (project) {
                            setTransferForm(prev => ({ ...prev, fromProjectId: project.id }));
                          }
                        }}
                        placeholder="اختر المشروع المصدر"
                        category="projects"
                        suggestions={projects.map(p => p.name)}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>إلى مشروع *</Text>
                    <View style={[styles.selectContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <AutocompleteInput
                        value={projects.find(p => p.id === transferForm.toProjectId)?.name || ''}
                        onChangeText={(text: string) => {
                          const project = projects.find(p => p.name === text);
                          if (project) {
                            setTransferForm(prev => ({ ...prev, toProjectId: project.id }));
                          }
                        }}
                        placeholder="اختر المشروع المستهدف"
                        category="projects"
                        suggestions={projects.filter(p => p.id !== transferForm.fromProjectId).map(p => p.name)}
                      />
                    </View>
                  </View>
                </View>

                {/* عرض رصيد المشروع المصدر */}
                {transferForm.fromProjectId && (
                  <View style={[styles.balanceInfo, { backgroundColor: colors.background }]}>
                    <Icons.Wallet size={16} color={colors.primary} />
                    <Text style={[styles.balanceText, { color: colors.text }]}>
                      الرصيد المتاح: {formatCurrency(projects.find(p => p.id === transferForm.fromProjectId)?.currentBalance || 0)}
                    </Text>
                  </View>
                )}
              </View>

              {/* تفاصيل التحويل */}
              <View style={styles.transferDetailsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>تفاصيل التحويل</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>نوع التحويل</Text>
                  <View style={styles.transferTypeGrid}>
                    {[
                      { key: 'money', label: 'مالي', icon: 'DollarSign', color: colors.success },
                      { key: 'materials', label: 'مواد', icon: 'Package', color: colors.warning },
                      { key: 'equipment', label: 'معدات', icon: 'Settings', color: colors.primary },
                      { key: 'workers', label: 'عمالة', icon: 'Users', color: colors.secondary || colors.textSecondary }
                    ].map((type) => {
                      const IconComponent = Icons[type.icon as keyof typeof Icons] as any;
                      const isSelected = transferForm.transferType === type.key;
                      
                      return (
                        <TouchableOpacity
                          key={type.key}
                          style={[styles.transferTypeButton, {
                            backgroundColor: isSelected ? type.color : colors.background,
                            borderColor: isSelected ? type.color : colors.border
                          }]}
                          onPress={() => setTransferForm(prev => ({ ...prev, transferType: type.key as any }))}
                        >
                          <IconComponent size={20} color={isSelected ? colors.surface : type.color} />
                          <Text style={[styles.transferTypeButtonText, {
                            color: isSelected ? colors.surface : colors.text
                          }]}>
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {transferForm.transferType === 'money' && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>المبلغ *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={transferForm.amount}
                      onChangeText={(text: string) => setTransferForm(prev => ({ ...prev, amount: text }))}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                )}

                {['materials', 'equipment'].includes(transferForm.transferType) && (
                  <>
                    <View style={styles.inputRow}>
                      <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>اسم العنصر *</Text>
                        <AutocompleteInput
                          value={transferForm.itemName}
                          onChangeText={(text: string) => setTransferForm(prev => ({ ...prev, itemName: text }))}
                          placeholder="اسم المادة أو المعدة"
                          category={transferForm.transferType === 'materials' ? 'materials' : 'equipment'}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>الكمية *</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                          value={transferForm.quantity}
                          onChangeText={(text: string) => setTransferForm(prev => ({ ...prev, quantity: text }))}
                          placeholder="0"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>الفئة</Text>
                      <AutocompleteInput
                        value={transferForm.itemCategory}
                        onChangeText={(text: string) => setTransferForm(prev => ({ ...prev, itemCategory: text }))}
                        placeholder="فئة العنصر"
                        category={`${transferForm.transferType}_categories`}
                      />
                    </View>
                    
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>وصف العنصر</Text>
                      <TextInput
                        style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={transferForm.itemDescription}
                        onChangeText={(text: string) => setTransferForm(prev => ({ ...prev, itemDescription: text }))}
                        placeholder="وصف تفصيلي (اختياري)"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </>
                )}
              </View>

              {/* معلومات إضافية */}
              <View style={styles.additionalInfoSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>معلومات إضافية</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>سبب التحويل *</Text>
                  <AutocompleteInput
                    value={transferForm.transferReason}
                    onChangeText={(text: string) => setTransferForm(prev => ({ ...prev, transferReason: text }))}
                    placeholder="اذكر سبب التحويل..."
                    category="transfer_reasons"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>المسؤول عن التحويل</Text>
                    <AutocompleteInput
                      value={transferForm.transferredBy}
                      onChangeText={(text: string) => setTransferForm(prev => ({ ...prev, transferredBy: text }))}
                      placeholder="اسم المسؤول"
                      category="transfer_handlers"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>الأولوية</Text>
                    <View style={styles.priorityOptions}>
                      {[
                        { key: 'low', label: 'منخفض', color: colors.textSecondary },
                        { key: 'medium', label: 'متوسط', color: colors.warning },
                        { key: 'high', label: 'عالي', color: colors.error },
                        { key: 'urgent', label: 'عاجل', color: '#8B0000' }
                      ].map((priority) => {
                        const isSelected = transferForm.priority === priority.key;
                        
                        return (
                          <TouchableOpacity
                            key={priority.key}
                            style={[styles.priorityOption, {
                              backgroundColor: isSelected ? priority.color : colors.background,
                              borderColor: isSelected ? priority.color : colors.border
                            }]}
                            onPress={() => setTransferForm(prev => ({ ...prev, priority: priority.key as any }))}
                          >
                            <Text style={[styles.priorityOptionText, {
                              color: isSelected ? colors.surface : colors.text
                            }]}>
                              {priority.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>ملاحظات إضافية</Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={transferForm.notes}
                    onChangeText={(text: string) => setTransferForm(prev => ({ ...prev, notes: text }))}
                    placeholder="ملاحظات أو تفاصيل إضافية..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modernCancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  resetTransferForm();
                  setModalVisible(false);
                }}
              >
                <Icons.X size={18} color={colors.text} />
                <Text style={[styles.modernCancelText, { color: colors.text }]}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modernSaveButton, { backgroundColor: colors.primary }]}
                onPress={addTransfer}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <>
                    <Icons.Send size={18} color={colors.surface} />
                    <Text style={[styles.modernSaveText, { color: colors.surface }]}>إرسال طلب التحويل</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* نموذج تفاصيل التحويل */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>تفاصيل التحويل</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Icons.X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedTransfer && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.transferDetailsContainer}>
                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>نوع التحويل:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {getTransferTypeName(selectedTransfer.transferType)}
                    </Text>
                  </View>
                  
                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>من مشروع:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedTransfer.fromProjectName}
                    </Text>
                  </View>
                  
                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>إلى مشروع:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedTransfer.toProjectName}
                    </Text>
                  </View>
                  
                  {selectedTransfer.amount && (
                    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>المبلغ:</Text>
                      <Text style={[styles.detailValue, { color: colors.success }]}>
                        {formatCurrency(selectedTransfer.amount)}
                      </Text>
                    </View>
                  )}
                  
                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>الحالة:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTransfer.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(selectedTransfer.status) }]}>
                        {getStatusText(selectedTransfer.status)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>الأولوية:</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedTransfer.priority) + '20' }]}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(selectedTransfer.priority) }]}>
                        {getPriorityText(selectedTransfer.priority)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>تاريخ التحويل:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {new Date(selectedTransfer.transferDate).toLocaleDateString('ar-SA')}
                    </Text>
                  </View>
                  
                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>السبب:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedTransfer.transferReason}
                    </Text>
                  </View>
                  
                  {selectedTransfer.notes && (
                    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>ملاحظات:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {selectedTransfer.notes}
                      </Text>
                    </View>
                  )}
                  
                  {selectedTransfer.approvedBy && (
                    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>معتمد بواسطة:</Text>
                      <Text style={[styles.detailValue, { color: colors.success }]}>
                        {selectedTransfer.approvedBy} - {selectedTransfer.approvedDate && new Date(selectedTransfer.approvedDate).toLocaleDateString('ar-SA')}
                      </Text>
                    </View>
                  )}
                  
                  {selectedTransfer.rejectedBy && (
                    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>مرفوض بواسطة:</Text>
                      <Text style={[styles.detailValue, { color: colors.error }]}>
                        {selectedTransfer.rejectedBy} - {selectedTransfer.rejectedDate && new Date(selectedTransfer.rejectedDate).toLocaleDateString('ar-SA')}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* زر الإضافة العائم */}
      <TouchableOpacity
        style={[styles.floatingAddButton, { backgroundColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Icons.Plus size={24} color={colors.surface} />
      </TouchableOpacity>
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
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  
  // Header متطور
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTitleSection: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  
  // إحصائيات سريعة
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  
  // أزرار Header
  headerActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // فلاتر متقدمة
  filtersContainer: {
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  
  // محتوى
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  
  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  createFirstButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // بطاقات التحويل المتطورة
  modernTransferCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  transferCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  transferTypeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transferTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transferTypeInfo: {
    flex: 1,
  },
  transferTypeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transferStatusSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  directionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  
  // تدفق المشاريع
  projectsFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  
  // تفاصيل التحويل
  transferDetails: {
    marginBottom: 16,
  },
  transferAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDetails: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
  },
  transferReason: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  transferMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
  },
  
  // أزرار الإجراءات
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  modalBody: {
    maxHeight: 500,
    paddingHorizontal: 20,
  },
  
  // أقسام النموذج
  projectsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  transferDetailsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  additionalInfoSection: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  
  // حقول الإدخال
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  
  // معلومات الرصيد
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // شبكة أنواع التحويل
  transferTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  transferTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    minWidth: '45%',
  },
  transferTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // خيارات الأولوية
  priorityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // أزرار Modal
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  modernCancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  modernCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modernSaveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  modernSaveText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // تفاصيل التحويل
  transferDetailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  
  // زر الإضافة العائم
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});