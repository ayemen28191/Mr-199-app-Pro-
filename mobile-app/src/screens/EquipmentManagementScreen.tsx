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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import * as Icons from 'lucide-react-native';
import { AutocompleteInput } from '../components/AutocompleteInput';

interface Equipment {
  id: string;
  name: string;
  category: string;
  serialNumber?: string;
  qrCode?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  location?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'broken';
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  notes?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  warrantyEndDate?: string;
  maintenanceSchedule?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  responsiblePerson?: string;
  images?: string[];
}

interface EquipmentMovement {
  id: string;
  equipmentId: string;
  equipmentName: string;
  fromLocation?: string;
  toLocation: string;
  moveDate: string;
  moveReason: string;
  movedBy: string;
  notes?: string;
  projectId?: string;
}

interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  maintenanceDate: string;
  maintenanceType: 'preventive' | 'corrective' | 'inspection' | 'repair';
  description: string;
  cost?: number;
  performedBy: string;
  nextScheduledDate?: string;
  partsReplaced?: string[];
  downtime?: number; // in hours
  notes?: string;
}

interface EquipmentStats {
  totalEquipment: number;
  availableEquipment: number;
  inUseEquipment: number;
  maintenanceEquipment: number;
  totalValue: number;
  upcomingMaintenance: number;
  overdueMaintenanceCount: number;
}

export default function EquipmentManagementScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [movementModalVisible, setMovementModalVisible] = useState(false);
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'equipment' | 'movements' | 'maintenance'>('equipment');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'available' | 'in_use' | 'maintenance' | 'retired'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  // Data
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [movements, setMovements] = useState<EquipmentMovement[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  
  // Equipment form
  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    category: '',
    serialNumber: '',
    qrCode: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: '',
    currentValue: '',
    location: '',
    condition: 'good' as Equipment['condition'],
    status: 'available' as Equipment['status'],
    notes: '',
    warrantyEndDate: '',
    maintenanceSchedule: 'monthly' as Equipment['maintenanceSchedule'],
    responsiblePerson: '',
  });
  
  // Movement form
  const [movementForm, setMovementForm] = useState({
    toLocation: '',
    moveReason: '',
    movedBy: '',
    notes: '',
  });

  // Maintenance form
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenanceType: 'preventive' as MaintenanceRecord['maintenanceType'],
    description: '',
    cost: '',
    performedBy: '',
    nextScheduledDate: '',
    partsReplaced: '',
    downtime: '',
    notes: '',
  });

  // Calculate stats
  const calculateStats = (): EquipmentStats => {
    const available = equipment.filter(eq => eq.status === 'available').length;
    const inUse = equipment.filter(eq => eq.status === 'in_use').length;
    const maintenance = equipment.filter(eq => eq.status === 'maintenance').length;
    
    const totalValue = equipment.reduce((sum, eq) => sum + (eq.currentValue || eq.purchasePrice || 0), 0);
    
    const today = new Date();
    const upcomingMaintenance = equipment.filter(eq => {
      if (!eq.nextMaintenanceDate) return false;
      const nextDate = new Date(eq.nextMaintenanceDate);
      const daysDiff = (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff <= 7; // Next 7 days
    }).length;

    const overdueMaintenanceCount = equipment.filter(eq => {
      if (!eq.nextMaintenanceDate) return false;
      const nextDate = new Date(eq.nextMaintenanceDate);
      return nextDate < today;
    }).length;

    return {
      totalEquipment: equipment.length,
      availableEquipment: available,
      inUseEquipment: inUse,
      maintenanceEquipment: maintenance,
      totalValue,
      upcomingMaintenance,
      overdueMaintenanceCount,
    };
  };

  // Filter equipment
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.serialNumber && item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    switch (filterType) {
      case 'available':
        return item.status === 'available';
      case 'in_use':
        return item.status === 'in_use';
      case 'maintenance':
        return item.status === 'maintenance';
      case 'retired':
        return item.status === 'retired';
      default:
        return true;
    }
  });

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load equipment
      const equipmentResponse = await fetch('/api/equipment');
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json();
        setEquipment(equipmentData);
      }
      
      // Load movements
      const movementsResponse = await fetch('/api/equipment-movements');
      if (movementsResponse.ok) {
        const movementsData = await movementsResponse.json();
        setMovements(movementsData);
      }

      // Load maintenance records
      const maintenanceResponse = await fetch('/api/equipment-maintenance');
      if (maintenanceResponse.ok) {
        const maintenanceData = await maintenanceResponse.json();
        setMaintenanceRecords(maintenanceData);
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

  // Add equipment
  const addEquipment = async () => {
    if (!equipmentForm.name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المعدة');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...equipmentForm,
          purchasePrice: equipmentForm.purchasePrice ? parseFloat(equipmentForm.purchasePrice) : null,
          currentValue: equipmentForm.currentValue ? parseFloat(equipmentForm.currentValue) : null,
        }),
      });

      if (response.ok) {
        const newEquipment = await response.json();
        setEquipment(prev => [...prev, newEquipment]);
        resetEquipmentForm();
        setModalVisible(false);
        Alert.alert('نجح', 'تم إضافة المعدة بنجاح');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إضافة المعدة');
    } finally {
      setSaving(false);
    }
  };

  // Add movement
  const addMovement = async () => {
    if (!selectedEquipment || !movementForm.toLocation.trim()) {
      Alert.alert('خطأ', 'يرجى ملء البيانات المطلوبة');
      return;
    }

    try {
      const response = await fetch('/api/equipment-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: selectedEquipment.id,
          equipmentName: selectedEquipment.name,
          fromLocation: selectedEquipment.location,
          toLocation: movementForm.toLocation,
          moveDate: new Date().toISOString().split('T')[0],
          moveReason: movementForm.moveReason,
          movedBy: movementForm.movedBy,
          notes: movementForm.notes,
          projectId: selectedProjectId,
        }),
      });

      if (response.ok) {
        const newMovement = await response.json();
        setMovements(prev => [...prev, newMovement]);
        
        // Update equipment location
        const updatedEquipment = { ...selectedEquipment, location: movementForm.toLocation };
        setEquipment(prev => prev.map(eq => eq.id === selectedEquipment.id ? updatedEquipment : eq));
        
        resetMovementForm();
        setMovementModalVisible(false);
        setSelectedEquipment(null);
        Alert.alert('نجح', 'تم تسجيل حركة النقل');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تسجيل الحركة');
    }
  };

  // Add maintenance record
  const addMaintenanceRecord = async () => {
    if (!selectedEquipment || !maintenanceForm.description.trim()) {
      Alert.alert('خطأ', 'يرجى ملء البيانات المطلوبة');
      return;
    }

    try {
      const response = await fetch('/api/equipment-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: selectedEquipment.id,
          equipmentName: selectedEquipment.name,
          maintenanceDate: new Date().toISOString().split('T')[0],
          maintenanceType: maintenanceForm.maintenanceType,
          description: maintenanceForm.description,
          cost: maintenanceForm.cost ? parseFloat(maintenanceForm.cost) : null,
          performedBy: maintenanceForm.performedBy,
          nextScheduledDate: maintenanceForm.nextScheduledDate || null,
          partsReplaced: maintenanceForm.partsReplaced ? maintenanceForm.partsReplaced.split(',').map(p => p.trim()) : [],
          downtime: maintenanceForm.downtime ? parseFloat(maintenanceForm.downtime) : null,
          notes: maintenanceForm.notes,
        }),
      });

      if (response.ok) {
        const newRecord = await response.json();
        setMaintenanceRecords(prev => [...prev, newRecord]);
        
        // Update equipment last maintenance date
        const updatedEquipment = { 
          ...selectedEquipment, 
          lastMaintenanceDate: new Date().toISOString().split('T')[0],
          nextMaintenanceDate: maintenanceForm.nextScheduledDate || undefined
        };
        setEquipment(prev => prev.map(eq => eq.id === selectedEquipment.id ? updatedEquipment : eq));
        
        resetMaintenanceForm();
        setMaintenanceModalVisible(false);
        setSelectedEquipment(null);
        Alert.alert('نجح', 'تم تسجيل سجل الصيانة');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تسجيل الصيانة');
    }
  };

  // Reset forms
  const resetEquipmentForm = () => {
    setEquipmentForm({
      name: '',
      category: '',
      serialNumber: '',
      qrCode: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: '',
      currentValue: '',
      location: '',
      condition: 'good',
      status: 'available',
      notes: '',
      warrantyEndDate: '',
      maintenanceSchedule: 'monthly',
      responsiblePerson: '',
    });
  };

  const resetMovementForm = () => {
    setMovementForm({
      toLocation: '',
      moveReason: '',
      movedBy: '',
      notes: '',
    });
  };

  const resetMaintenanceForm = () => {
    setMaintenanceForm({
      maintenanceType: 'preventive',
      description: '',
      cost: '',
      performedBy: '',
      nextScheduledDate: '',
      partsReplaced: '',
      downtime: '',
      notes: '',
    });
  };

  // Open modals
  const openMovementModal = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setMovementModalVisible(true);
  };

  const openMaintenanceModal = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setMaintenanceModalVisible(true);
  };

  // Generate QR Code (placeholder function)
  const generateQRCode = (equipment: Equipment) => {
    const qrData = `${equipment.id}|${equipment.name}|${equipment.serialNumber || ''}`;
    // In real implementation, generate actual QR code
    Alert.alert('رمز QR', `تم إنشاء رمز QR للمعدة: ${equipment.name}`);
  };

  // Delete equipment
  const deleteEquipment = (equipmentId: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذه المعدة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`/api/equipment/${equipmentId}`, {
                method: 'DELETE',
              });
              
              if (response.ok) {
                setEquipment(prev => prev.filter(eq => eq.id !== equipmentId));
                Alert.alert('تم', 'تم حذف المعدة');
              }
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف المعدة');
            }
          },
        },
      ]
    );
  };

  // Get condition color
  const getConditionColor = (condition: Equipment['condition']) => {
    switch (condition) {
      case 'excellent': return colors.success;
      case 'good': return colors.primary;
      case 'fair': return colors.warning;
      case 'poor': return colors.error;
      case 'broken': return '#8B0000';
      default: return colors.textSecondary;
    }
  };

  // Get status color
  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'available': return colors.success;
      case 'in_use': return colors.primary;
      case 'maintenance': return colors.warning;
      case 'retired': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  // Get maintenance type icon
  const getMaintenanceTypeIcon = (type: MaintenanceRecord['maintenanceType']) => {
    switch (type) {
      case 'preventive': return 'Shield';
      case 'corrective': return 'Wrench';
      case 'inspection': return 'Search';
      case 'repair': return 'Tool';
      default: return 'Settings';
    }
  };

  // Get equipment status text
  const getStatusText = (status: Equipment['status']) => {
    switch (status) {
      case 'available': return 'متاحة';
      case 'in_use': return 'قيد الاستخدام';
      case 'maintenance': return 'صيانة';
      case 'retired': return 'متقاعدة';
      default: return 'غير محدد';
    }
  };

  // Get condition text
  const getConditionText = (condition: Equipment['condition']) => {
    switch (condition) {
      case 'excellent': return 'ممتازة';
      case 'good': return 'جيدة';
      case 'fair': return 'مقبولة';
      case 'poor': return 'ضعيفة';
      case 'broken': return 'معطلة';
      default: return 'غير محدد';
    }
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

  const stats = calculateStats();

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري تحميل المعدات...</Text>
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
            <Text style={[styles.pageTitle, { color: colors.surface }]}>إدارة المعدات</Text>
            <Text style={[styles.pageSubtitle, { color: colors.surface }]}>
              تتبع وصيانة جميع المعدات والأجهزة
            </Text>
          </View>

          {/* إحصائيات سريعة */}
          <View style={styles.quickStatsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.success + '20' }]}>
              <Icons.CheckCircle size={20} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.surface }]}>{stats.availableEquipment}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>متاحة</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.primary + '20' }]}>
              <Icons.Play size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.surface }]}>{stats.inUseEquipment}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>قيد الاستخدام</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.warning + '20' }]}>
              <Icons.Settings size={20} color={colors.warning} />
              <Text style={[styles.statValue, { color: colors.surface }]}>{stats.maintenanceEquipment}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>صيانة</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.surface + '20' }]}>
              <Icons.DollarSign size={20} color={colors.surface} />
              <Text style={[styles.statValue, { color: colors.surface }]}>{formatCurrency(stats.totalValue)}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>القيمة</Text>
            </View>
          </View>

          {/* تنبيهات الصيانة */}
          {(stats.upcomingMaintenance > 0 || stats.overdueMaintenanceCount > 0) && (
            <View style={styles.alertsContainer}>
              {stats.overdueMaintenanceCount > 0 && (
                <View style={[styles.alertCard, { backgroundColor: colors.error + '20' }]}>
                  <Icons.AlertTriangle size={16} color={colors.error} />
                  <Text style={[styles.alertText, { color: colors.surface }]}>
                    {stats.overdueMaintenanceCount} معدة تحتاج صيانة فورية
                  </Text>
                </View>
              )}
              
              {stats.upcomingMaintenance > 0 && (
                <View style={[styles.alertCard, { backgroundColor: colors.warning + '20' }]}>
                  <Icons.Clock size={16} color={colors.warning} />
                  <Text style={[styles.alertText, { color: colors.surface }]}>
                    {stats.upcomingMaintenance} معدة تحتاج صيانة هذا الأسبوع
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </LinearGradient>

      {/* بحث وفلاتر */}
      <View style={[styles.searchFilterContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.searchContainer}>
          <Icons.Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="البحث عن معدة..."
            placeholderTextColor={colors.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.background }]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Icons.Filter size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowQRScanner(true)}
        >
          <Icons.QrCode size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>

      {/* فلاتر متقدمة */}
      {showFilters && (
        <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>الحالة:</Text>
            {[
              { key: 'all', label: 'الكل', icon: 'Package' },
              { key: 'available', label: 'متاحة', icon: 'CheckCircle' },
              { key: 'in_use', label: 'قيد الاستخدام', icon: 'Play' },
              { key: 'maintenance', label: 'صيانة', icon: 'Settings' },
              { key: 'retired', label: 'متقاعدة', icon: 'Archive' }
            ].map((filter) => {
              const IconComponent = Icons[filter.icon as keyof typeof Icons] as any;
              const isSelected = filterType === filter.key;
              
              return (
                <TouchableOpacity
                  key={filter.key}
                  style={[styles.filterChip, {
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border
                  }]}
                  onPress={() => setFilterType(filter.key as any)}
                >
                  <IconComponent size={14} color={isSelected ? colors.surface : colors.text} />
                  <Text style={[styles.filterChipText, {
                    color: isSelected ? colors.surface : colors.text
                  }]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* تبويبات متطورة */}
      <View style={[styles.modernTabContainer, { backgroundColor: colors.surface }]}>
        {[
          { key: 'equipment', icon: 'Package', label: 'المعدات', count: filteredEquipment.length },
          { key: 'movements', icon: 'Move', label: 'الحركات', count: movements.length },
          { key: 'maintenance', icon: 'Settings', label: 'الصيانة', count: maintenanceRecords.length }
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

      {/* المحتوى */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {selectedTab === 'equipment' && (
            filteredEquipment.length === 0 ? (
              <View style={[styles.emptyStateContainer, { backgroundColor: colors.surface }]}>
                <Icons.Package size={80} color={colors.textSecondary} />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>لا توجد معدات</Text>
                <Text style={[styles.emptyStateMessage, { color: colors.textSecondary }]}>
                  {searchTerm || filterType !== 'all' ? 'لا توجد نتائج للبحث أو التصفية' : 'لم يتم إضافة معدات بعد'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredEquipment}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: equipment }: { item: Equipment }) => (
                  <View style={[styles.modernEquipmentCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.equipmentCardHeader}>
                      <View style={styles.equipmentInfoSection}>
                        <View style={[styles.equipmentIcon, { backgroundColor: getStatusColor(equipment.status) + '20' }]}>
                          <Icons.Package size={24} color={getStatusColor(equipment.status)} />
                        </View>
                        <View style={styles.equipmentDetails}>
                          <Text style={[styles.modernEquipmentName, { color: colors.text }]}>{equipment.name}</Text>
                          <Text style={[styles.equipmentCategory, { color: colors.textSecondary }]}>
                            {equipment.category} {equipment.serialNumber && `• ${equipment.serialNumber}`}
                          </Text>
                          {equipment.location && (
                            <View style={styles.locationInfo}>
                              <Icons.MapPin size={14} color={colors.textSecondary} />
                              <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                                {equipment.location}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.statusSection}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(equipment.status) + '20' }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(equipment.status) }]}>
                            {getStatusText(equipment.status)}
                          </Text>
                        </View>
                        <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(equipment.condition) + '20' }]}>
                          <Text style={[styles.conditionText, { color: getConditionColor(equipment.condition) }]}>
                            {getConditionText(equipment.condition)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {(equipment.purchasePrice || equipment.currentValue) && (
                      <View style={styles.valueInfo}>
                        {equipment.purchasePrice && (
                          <View style={styles.valueItem}>
                            <Icons.ShoppingCart size={16} color={colors.textSecondary} />
                            <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>شراء:</Text>
                            <Text style={[styles.valueAmount, { color: colors.text }]}>
                              {formatCurrency(equipment.purchasePrice)}
                            </Text>
                          </View>
                        )}
                        
                        {equipment.currentValue && (
                          <View style={styles.valueItem}>
                            <Icons.TrendingUp size={16} color={colors.textSecondary} />
                            <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>حالي:</Text>
                            <Text style={[styles.valueAmount, { color: colors.text }]}>
                              {formatCurrency(equipment.currentValue)}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {equipment.nextMaintenanceDate && (
                      <View style={[styles.maintenanceAlert, { 
                        backgroundColor: new Date(equipment.nextMaintenanceDate) < new Date() ? colors.error + '15' : colors.warning + '15' 
                      }]}>
                        <Icons.Calendar size={16} color={new Date(equipment.nextMaintenanceDate) < new Date() ? colors.error : colors.warning} />
                        <Text style={[styles.maintenanceText, { 
                          color: new Date(equipment.nextMaintenanceDate) < new Date() ? colors.error : colors.warning 
                        }]}>
                          صيانة: {new Date(equipment.nextMaintenanceDate).toLocaleDateString('ar-SA')}
                        </Text>
                      </View>
                    )}

                    <View style={styles.equipmentActions}>
                      <TouchableOpacity
                        style={[styles.modernActionButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                        onPress={() => openMovementModal(equipment)}
                      >
                        <Icons.Move size={18} color={colors.primary} />
                        <Text style={[styles.modernActionText, { color: colors.primary }]}>نقل</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.modernActionButton, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}
                        onPress={() => openMaintenanceModal(equipment)}
                      >
                        <Icons.Settings size={18} color={colors.warning} />
                        <Text style={[styles.modernActionText, { color: colors.warning }]}>صيانة</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.modernActionButton, { backgroundColor: colors.textSecondary + '15', borderColor: colors.textSecondary }]}
                        onPress={() => generateQRCode(equipment)}
                      >
                        <Icons.QrCode size={18} color={colors.textSecondary} />
                        <Text style={[styles.modernActionText, { color: colors.textSecondary }]}>QR</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )
          )}

          {selectedTab === 'movements' && (
            movements.length === 0 ? (
              <View style={[styles.emptyStateContainer, { backgroundColor: colors.surface }]}>
                <Icons.Move size={80} color={colors.textSecondary} />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>لا توجد حركات</Text>
                <Text style={[styles.emptyStateMessage, { color: colors.textSecondary }]}>
                  لم يتم تسجيل حركات نقل للمعدات
                </Text>
              </View>
            ) : (
              <FlatList
                data={movements}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: movement }: { item: EquipmentMovement }) => (
                  <View style={[styles.modernMovementCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.movementHeader}>
                      <View style={styles.movementInfoSection}>
                        <View style={[styles.movementIcon, { backgroundColor: colors.primary + '20' }]}>
                          <Icons.Move size={24} color={colors.primary} />
                        </View>
                        <View>
                          <Text style={[styles.movementEquipmentName, { color: colors.text }]}>
                            {movement.equipmentName}
                          </Text>
                          <Text style={[styles.movementDate, { color: colors.textSecondary }]}>
                            {new Date(movement.moveDate).toLocaleDateString('ar-SA')}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.movementPath}>
                        <Text style={[styles.fromLocation, { color: colors.textSecondary }]}>
                          {movement.fromLocation || 'غير محدد'}
                        </Text>
                        <Icons.ArrowRight size={16} color={colors.primary} />
                        <Text style={[styles.toLocation, { color: colors.text }]}>
                          {movement.toLocation}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.movementDetails}>
                      <Text style={[styles.movementReason, { color: colors.textSecondary }]}>
                        السبب: {movement.moveReason}
                      </Text>
                      
                      {movement.movedBy && (
                        <Text style={[styles.movedBy, { color: colors.textSecondary }]}>
                          بواسطة: {movement.movedBy}
                        </Text>
                      )}
                      
                      {movement.notes && (
                        <Text style={[styles.movementNotes, { color: colors.textSecondary }]}>
                          ملاحظات: {movement.notes}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              />
            )
          )}

          {selectedTab === 'maintenance' && (
            maintenanceRecords.length === 0 ? (
              <View style={[styles.emptyStateContainer, { backgroundColor: colors.surface }]}>
                <Icons.Settings size={80} color={colors.textSecondary} />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>لا توجد سجلات صيانة</Text>
                <Text style={[styles.emptyStateMessage, { color: colors.textSecondary }]}>
                  لم يتم تسجيل سجلات صيانة للمعدات
                </Text>
              </View>
            ) : (
              <FlatList
                data={maintenanceRecords}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: record }: { item: MaintenanceRecord }) => {
                  const IconComponent = Icons[getMaintenanceTypeIcon(record.maintenanceType) as keyof typeof Icons] as any;
                  
                  return (
                    <View style={[styles.modernMaintenanceCard, { backgroundColor: colors.surface }]}>
                      <View style={styles.maintenanceHeader}>
                        <View style={styles.maintenanceInfoSection}>
                          <View style={[styles.maintenanceIcon, { backgroundColor: colors.warning + '20' }]}>
                            <IconComponent size={24} color={colors.warning} />
                          </View>
                          <View>
                            <Text style={[styles.maintenanceEquipmentName, { color: colors.text }]}>
                              {record.equipmentName}
                            </Text>
                            <Text style={[styles.maintenanceDate, { color: colors.textSecondary }]}>
                              {new Date(record.maintenanceDate).toLocaleDateString('ar-SA')}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={[styles.maintenanceTypeBadge, { backgroundColor: colors.warning + '20' }]}>
                          <Text style={[styles.maintenanceTypeText, { color: colors.warning }]}>
                            {record.maintenanceType === 'preventive' ? 'وقائية' :
                             record.maintenanceType === 'corrective' ? 'تصحيحية' :
                             record.maintenanceType === 'inspection' ? 'فحص' : 'إصلاح'}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={[styles.maintenanceDescription, { color: colors.text }]}>
                        {record.description}
                      </Text>
                      
                      <View style={styles.maintenanceDetails}>
                        {record.performedBy && (
                          <View style={styles.maintenanceDetailItem}>
                            <Icons.User size={14} color={colors.textSecondary} />
                            <Text style={[styles.maintenanceDetailText, { color: colors.textSecondary }]}>
                              {record.performedBy}
                            </Text>
                          </View>
                        )}
                        
                        {record.cost && (
                          <View style={styles.maintenanceDetailItem}>
                            <Icons.DollarSign size={14} color={colors.textSecondary} />
                            <Text style={[styles.maintenanceDetailText, { color: colors.textSecondary }]}>
                              {formatCurrency(record.cost)}
                            </Text>
                          </View>
                        )}
                        
                        {record.downtime && (
                          <View style={styles.maintenanceDetailItem}>
                            <Icons.Clock size={14} color={colors.textSecondary} />
                            <Text style={[styles.maintenanceDetailText, { color: colors.textSecondary }]}>
                              {record.downtime} ساعة توقف
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      {record.nextScheduledDate && (
                        <View style={[styles.nextMaintenanceInfo, { backgroundColor: colors.primary + '15' }]}>
                          <Icons.Calendar size={16} color={colors.primary} />
                          <Text style={[styles.nextMaintenanceText, { color: colors.primary }]}>
                            الصيانة التالية: {new Date(record.nextScheduledDate).toLocaleDateString('ar-SA')}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                }}
              />
            )
          )}
        </View>
      </ScrollView>

      {/* نموذج إضافة معدة */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة معدة جديدة</Text>
              <TouchableOpacity onPress={() => {
                resetEquipmentForm();
                setModalVisible(false);
              }}>
                <Icons.X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.basicInfoSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>المعلومات الأساسية</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>اسم المعدة *</Text>
                  <AutocompleteInput
                    value={equipmentForm.name}
                    onChangeText={(text: string) => setEquipmentForm(prev => ({ ...prev, name: text }))}
                    placeholder="اسم المعدة"
                    category="equipment_names"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>التصنيف</Text>
                  <AutocompleteInput
                    value={equipmentForm.category}
                    onChangeText={(text: string) => setEquipmentForm(prev => ({ ...prev, category: text }))}
                    placeholder="تصنيف المعدة"
                    category="equipment_categories"
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>الرقم التسلسلي</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={equipmentForm.serialNumber}
                      onChangeText={(text: string) => setEquipmentForm(prev => ({ ...prev, serialNumber: text }))}
                      placeholder="الرقم التسلسلي"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>رمز QR</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={equipmentForm.qrCode}
                      onChangeText={(text: string) => setEquipmentForm(prev => ({ ...prev, qrCode: text }))}
                      placeholder="رمز QR"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>الموقع الحالي</Text>
                  <AutocompleteInput
                    value={equipmentForm.location}
                    onChangeText={(text: string) => setEquipmentForm(prev => ({ ...prev, location: text }))}
                    placeholder="الموقع الحالي للمعدة"
                    category="equipment_locations"
                  />
                </View>
              </View>

              <View style={styles.statusSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>الحالة والوضع</Text>
                
                <View style={styles.statusGrid}>
                  <View style={styles.statusItem}>
                    <Text style={[styles.label, { color: colors.text }]}>الحالة</Text>
                    <View style={styles.statusOptions}>
                      {[
                        { key: 'excellent', label: 'ممتازة', color: colors.success },
                        { key: 'good', label: 'جيدة', color: colors.primary },
                        { key: 'fair', label: 'مقبولة', color: colors.warning },
                        { key: 'poor', label: 'ضعيفة', color: colors.error },
                        { key: 'broken', label: 'معطلة', color: '#8B0000' }
                      ].map((option) => {
                        const isSelected = equipmentForm.condition === option.key;
                        return (
                          <TouchableOpacity
                            key={option.key}
                            style={[styles.statusOption, {
                              backgroundColor: isSelected ? option.color : colors.background,
                              borderColor: isSelected ? option.color : colors.border
                            }]}
                            onPress={() => setEquipmentForm(prev => ({ ...prev, condition: option.key as any }))}
                          >
                            <Text style={[styles.statusOptionText, {
                              color: isSelected ? colors.surface : colors.text
                            }]}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.statusItem}>
                    <Text style={[styles.label, { color: colors.text }]}>الوضع</Text>
                    <View style={styles.statusOptions}>
                      {[
                        { key: 'available', label: 'متاحة', color: colors.success },
                        { key: 'in_use', label: 'قيد الاستخدام', color: colors.primary },
                        { key: 'maintenance', label: 'صيانة', color: colors.warning },
                        { key: 'retired', label: 'متقاعدة', color: colors.textSecondary }
                      ].map((option) => {
                        const isSelected = equipmentForm.status === option.key;
                        return (
                          <TouchableOpacity
                            key={option.key}
                            style={[styles.statusOption, {
                              backgroundColor: isSelected ? option.color : colors.background,
                              borderColor: isSelected ? option.color : colors.border
                            }]}
                            onPress={() => setEquipmentForm(prev => ({ ...prev, status: option.key as any }))}
                          >
                            <Text style={[styles.statusOptionText, {
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
              </View>

              <View style={styles.financialSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>المعلومات المالية</Text>
                
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>سعر الشراء</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={equipmentForm.purchasePrice}
                      onChangeText={(text: string) => setEquipmentForm(prev => ({ ...prev, purchasePrice: text }))}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>القيمة الحالية</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={equipmentForm.currentValue}
                      onChangeText={(text: string) => setEquipmentForm(prev => ({ ...prev, currentValue: text }))}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.maintenanceSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>إعدادات الصيانة</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>جدولة الصيانة</Text>
                  <View style={styles.scheduleOptions}>
                    {[
                      { key: 'weekly', label: 'أسبوعياً' },
                      { key: 'monthly', label: 'شهرياً' },
                      { key: 'quarterly', label: 'ربع سنوي' },
                      { key: 'yearly', label: 'سنوياً' }
                    ].map((option) => {
                      const isSelected = equipmentForm.maintenanceSchedule === option.key;
                      return (
                        <TouchableOpacity
                          key={option.key}
                          style={[styles.scheduleOption, {
                            backgroundColor: isSelected ? colors.primary : colors.background,
                            borderColor: isSelected ? colors.primary : colors.border
                          }]}
                          onPress={() => setEquipmentForm(prev => ({ ...prev, maintenanceSchedule: option.key as any }))}
                        >
                          <Text style={[styles.scheduleOptionText, {
                            color: isSelected ? colors.surface : colors.text
                          }]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>الشخص المسؤول</Text>
                  <AutocompleteInput
                    value={equipmentForm.responsiblePerson}
                    onChangeText={(text: string) => setEquipmentForm(prev => ({ ...prev, responsiblePerson: text }))}
                    placeholder="الشخص المسؤول عن المعدة"
                    category="equipment_responsible_persons"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ملاحظات</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={equipmentForm.notes}
                  onChangeText={(text: string) => setEquipmentForm(prev => ({ ...prev, notes: text }))}
                  placeholder="ملاحظات إضافية"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modernCancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  resetEquipmentForm();
                  setModalVisible(false);
                }}
              >
                <Icons.X size={18} color={colors.text} />
                <Text style={[styles.modernCancelText, { color: colors.text }]}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modernSaveButton, { backgroundColor: colors.primary }]}
                onPress={addEquipment}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <>
                    <Icons.Check size={18} color={colors.surface} />
                    <Text style={[styles.modernSaveText, { color: colors.surface }]}>إضافة المعدة</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* نموذج نقل المعدة */}
      <Modal
        visible={movementModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMovementModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                نقل معدة: {selectedEquipment?.name}
              </Text>
              <TouchableOpacity onPress={() => {
                resetMovementForm();
                setMovementModalVisible(false);
                setSelectedEquipment(null);
              }}>
                <Icons.X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>الموقع الحالي</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textSecondary, borderColor: colors.border }]}
                  value={selectedEquipment?.location || 'غير محدد'}
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>الموقع الجديد *</Text>
                <AutocompleteInput
                  value={movementForm.toLocation}
                  onChangeText={(text: string) => setMovementForm(prev => ({ ...prev, toLocation: text }))}
                  placeholder="الموقع الجديد للمعدة"
                  category="equipment_locations"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>سبب النقل</Text>
                <AutocompleteInput
                  value={movementForm.moveReason}
                  onChangeText={(text: string) => setMovementForm(prev => ({ ...prev, moveReason: text }))}
                  placeholder="سبب نقل المعدة"
                  category="equipment_move_reasons"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>المسؤول عن النقل</Text>
                <AutocompleteInput
                  value={movementForm.movedBy}
                  onChangeText={(text: string) => setMovementForm(prev => ({ ...prev, movedBy: text }))}
                  placeholder="الشخص المسؤول عن النقل"
                  category="equipment_movers"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ملاحظات</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={movementForm.notes}
                  onChangeText={(text: string) => setMovementForm(prev => ({ ...prev, notes: text }))}
                  placeholder="ملاحظات إضافية"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modernCancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  resetMovementForm();
                  setMovementModalVisible(false);
                  setSelectedEquipment(null);
                }}
              >
                <Icons.X size={18} color={colors.text} />
                <Text style={[styles.modernCancelText, { color: colors.text }]}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modernSaveButton, { backgroundColor: colors.primary }]}
                onPress={addMovement}
              >
                <Icons.Move size={18} color={colors.surface} />
                <Text style={[styles.modernSaveText, { color: colors.surface }]}>تسجيل النقل</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* نموذج الصيانة */}
      <Modal
        visible={maintenanceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMaintenanceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                سجل صيانة: {selectedEquipment?.name}
              </Text>
              <TouchableOpacity onPress={() => {
                resetMaintenanceForm();
                setMaintenanceModalVisible(false);
                setSelectedEquipment(null);
              }}>
                <Icons.X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>نوع الصيانة</Text>
                <View style={styles.maintenanceTypeGrid}>
                  {[
                    { key: 'preventive', label: 'وقائية', icon: 'Shield' },
                    { key: 'corrective', label: 'تصحيحية', icon: 'Wrench' },
                    { key: 'inspection', label: 'فحص', icon: 'Search' },
                    { key: 'repair', label: 'إصلاح', icon: 'Tool' }
                  ].map((type) => {
                    const IconComponent = Icons[type.icon as keyof typeof Icons] as any;
                    const isSelected = maintenanceForm.maintenanceType === type.key;
                    
                    return (
                      <TouchableOpacity
                        key={type.key}
                        style={[styles.maintenanceTypeButton, {
                          backgroundColor: isSelected ? colors.warning : colors.background,
                          borderColor: isSelected ? colors.warning : colors.border
                        }]}
                        onPress={() => setMaintenanceForm(prev => ({ ...prev, maintenanceType: type.key as any }))}
                      >
                        <IconComponent size={20} color={isSelected ? colors.surface : colors.text} />
                        <Text style={[styles.maintenanceTypeButtonText, {
                          color: isSelected ? colors.surface : colors.text
                        }]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>وصف الصيانة *</Text>
                <AutocompleteInput
                  value={maintenanceForm.description}
                  onChangeText={(text: string) => setMaintenanceForm(prev => ({ ...prev, description: text }))}
                  placeholder="وصف تفصيلي للصيانة المنجزة"
                  category="equipment_maintenance_descriptions"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>التكلفة</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={maintenanceForm.cost}
                    onChangeText={(text: string) => setMaintenanceForm(prev => ({ ...prev, cost: text }))}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>ساعات التوقف</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={maintenanceForm.downtime}
                    onChangeText={(text: string) => setMaintenanceForm(prev => ({ ...prev, downtime: text }))}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>المنفذ</Text>
                <AutocompleteInput
                  value={maintenanceForm.performedBy}
                  onChangeText={(text: string) => setMaintenanceForm(prev => ({ ...prev, performedBy: text }))}
                  placeholder="الشخص الذي نفذ الصيانة"
                  category="equipment_maintenance_technicians"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>القطع المستبدلة</Text>
                <AutocompleteInput
                  value={maintenanceForm.partsReplaced}
                  onChangeText={(text: string) => setMaintenanceForm(prev => ({ ...prev, partsReplaced: text }))}
                  placeholder="القطع المستبدلة (مفصولة بفاصلة)"
                  category="equipment_parts"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>تاريخ الصيانة التالية</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={maintenanceForm.nextScheduledDate}
                  onChangeText={(text: string) => setMaintenanceForm(prev => ({ ...prev, nextScheduledDate: text }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ملاحظات</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={maintenanceForm.notes}
                  onChangeText={(text: string) => setMaintenanceForm(prev => ({ ...prev, notes: text }))}
                  placeholder="ملاحظات إضافية"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modernCancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  resetMaintenanceForm();
                  setMaintenanceModalVisible(false);
                  setSelectedEquipment(null);
                }}
              >
                <Icons.X size={18} color={colors.text} />
                <Text style={[styles.modernCancelText, { color: colors.text }]}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modernSaveButton, { backgroundColor: colors.warning }]}
                onPress={addMaintenanceRecord}
              >
                <Icons.Settings size={18} color={colors.surface} />
                <Text style={[styles.modernSaveText, { color: colors.surface }]}>تسجيل الصيانة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  
  // تنبيهات الصيانة
  alertsContainer: {
    gap: 8,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // بحث وفلاتر
  searchFilterContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  filterButton: {
    padding: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  scanButton: {
    padding: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
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
  
  // تبويبات متطورة
  modernTabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -10,
    marginBottom: 20,
    borderRadius: 12,
    padding: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  modernTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  modernTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
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
  },
  
  // Modern Equipment Cards
  modernEquipmentCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  equipmentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  equipmentInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  equipmentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  equipmentDetails: {
    flex: 1,
  },
  modernEquipmentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  equipmentCategory: {
    fontSize: 14,
    marginBottom: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
  },
  
  statusSection: {
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
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // معلومات القيمة
  valueInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueLabel: {
    fontSize: 12,
  },
  valueAmount: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // تنبيه الصيانة
  maintenanceAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  maintenanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // أزرار المعدات
  equipmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modernActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  modernActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Modern Movement Cards
  modernMovementCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  movementInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  movementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  movementEquipmentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  movementDate: {
    fontSize: 12,
  },
  movementPath: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fromLocation: {
    fontSize: 12,
  },
  toLocation: {
    fontSize: 12,
    fontWeight: '600',
  },
  movementDetails: {
    gap: 8,
  },
  movementReason: {
    fontSize: 14,
  },
  movedBy: {
    fontSize: 14,
  },
  movementNotes: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  
  // Modern Maintenance Cards
  modernMaintenanceCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  maintenanceInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  maintenanceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  maintenanceEquipmentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  maintenanceDate: {
    fontSize: 12,
  },
  maintenanceTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  maintenanceTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  maintenanceDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  maintenanceDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  maintenanceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  maintenanceDetailText: {
    fontSize: 12,
  },
  nextMaintenanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  nextMaintenanceText: {
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
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  modalBody: {
    maxHeight: 500,
    paddingHorizontal: 20,
  },
  
  // أقسام النموذج
  basicInfoSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  statusSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  financialSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  maintenanceSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
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
    fontSize: 16,
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
  
  // خيارات الحالة والوضع
  statusGrid: {
    gap: 16,
  },
  statusItem: {
    marginBottom: 16,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // خيارات الجدولة
  scheduleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  scheduleOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // خيارات نوع الصيانة
  maintenanceTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  maintenanceTypeButton: {
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
  maintenanceTypeButtonText: {
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
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  modernCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modernSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  modernSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
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