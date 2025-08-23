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

interface Equipment {
  id: string;
  name: string;
  category: string;
  serialNumber?: string;
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
}

export default function EquipmentManagementScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  
  // الحالات الأساسية
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [movementModalVisible, setMovementModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'equipment' | 'movements'>('equipment');
  
  // البيانات
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [movements, setMovements] = useState<EquipmentMovement[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  
  // نموذج المعدات
  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    category: '',
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: '',
    currentValue: '',
    location: '',
    condition: 'good' as Equipment['condition'],
    status: 'available' as Equipment['status'],
    notes: '',
    warrantyEndDate: '',
  });
  
  // نموذج النقل
  const [movementForm, setMovementForm] = useState({
    toLocation: '',
    moveReason: '',
    movedBy: '',
    notes: '',
  });

  // تحميل البيانات
  const loadData = async () => {
    try {
      setLoading(true);
      
      // تحميل المعدات
      const equipmentResponse = await fetch('/api/equipment');
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json();
        setEquipment(equipmentData);
      }
      
      // تحميل الحركات
      const movementsResponse = await fetch('/api/equipment-movements');
      if (movementsResponse.ok) {
        const movementsData = await movementsResponse.json();
        setMovements(movementsData);
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

  // إضافة معدة جديدة
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

  // إضافة حركة نقل
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
        }),
      });

      if (response.ok) {
        const newMovement = await response.json();
        setMovements(prev => [...prev, newMovement]);
        
        // تحديث موقع المعدة
        const updatedEquipment = { ...selectedEquipment, location: movementForm.toLocation };
        setEquipment(prev => prev.map(eq => eq.id === selectedEquipment.id ? updatedEquipment : eq));
        
        setMovementForm({ toLocation: '', moveReason: '', movedBy: '', notes: '' });
        setMovementModalVisible(false);
        setSelectedEquipment(null);
        Alert.alert('نجح', 'تم تسجيل حركة النقل');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تسجيل الحركة');
    }
  };

  // إعادة تعيين نموذج المعدات
  const resetEquipmentForm = () => {
    setEquipmentForm({
      name: '',
      category: '',
      serialNumber: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: '',
      currentValue: '',
      location: '',
      condition: 'good',
      status: 'available',
      notes: '',
      warrantyEndDate: '',
    });
  };

  // فتح نموذج النقل
  const openMovementModal = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setMovementModalVisible(true);
  };

  // حذف معدة
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

  // الحصول على لون الحالة
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

  // الحصول على لون الوضع
  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'available': return colors.success;
      case 'in_use': return colors.primary;
      case 'maintenance': return colors.warning;
      case 'retired': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

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
      {/* عنوان الشاشة */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>إدارة المعدات</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={[styles.addButtonText, { color: colors.surface }]}>+ إضافة معدة</Text>
        </TouchableOpacity>
      </View>

      {/* التبويبات */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'equipment' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedTab('equipment')}
        >
          <Text style={[styles.tabText, { 
            color: selectedTab === 'equipment' ? colors.surface : colors.text 
          }]}>
            المعدات ({equipment.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'movements' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedTab('movements')}
        >
          <Text style={[styles.tabText, { 
            color: selectedTab === 'movements' ? colors.surface : colors.text 
          }]}>
            الحركات ({movements.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* المحتوى */}
      <ScrollView style={styles.content}>
        {selectedTab === 'equipment' ? (
          // قائمة المعدات
          equipment.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                لا توجد معدات مضافة بعد
              </Text>
            </View>
          ) : (
            equipment.map((item) => (
              <View key={item.id} style={[styles.equipmentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.equipmentName, { color: colors.text }]}>{item.name}</Text>
                  <View style={styles.statusBadges}>
                    <Text style={[styles.statusBadge, { 
                      backgroundColor: getStatusColor(item.status),
                      color: colors.surface
                    }]}>
                      {item.status === 'available' ? 'متاحة' : 
                       item.status === 'in_use' ? 'قيد الاستخدام' : 
                       item.status === 'maintenance' ? 'صيانة' : 'متقاعدة'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.equipmentDetails}>
                  {item.category && (
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      التصنيف: {item.category}
                    </Text>
                  )}
                  {item.location && (
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      الموقع: {item.location}
                    </Text>
                  )}
                  <Text style={[styles.detailText, { color: getConditionColor(item.condition) }]}>
                    الحالة: {item.condition === 'excellent' ? 'ممتازة' : 
                             item.condition === 'good' ? 'جيدة' : 
                             item.condition === 'fair' ? 'مقبولة' : 
                             item.condition === 'poor' ? 'ضعيفة' : 'معطلة'}
                  </Text>
                  {item.serialNumber && (
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      الرقم التسلسلي: {item.serialNumber}
                    </Text>
                  )}
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => openMovementModal(item)}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.surface }]}>نقل</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.error }]}
                    onPress={() => deleteEquipment(item.id)}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.surface }]}>حذف</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          // قائمة الحركات
          movements.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                لا توجد حركات نقل مسجلة
              </Text>
            </View>
          ) : (
            movements.map((movement) => (
              <View key={movement.id} style={[styles.movementCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.movementHeader}>
                  <Text style={[styles.movementEquipment, { color: colors.text }]}>{movement.equipmentName}</Text>
                  <Text style={[styles.movementDate, { color: colors.textSecondary }]}>
                    {new Date(movement.moveDate).toLocaleDateString('ar-SA')}
                  </Text>
                </View>
                
                <View style={styles.movementPath}>
                  <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                    من: {movement.fromLocation || 'غير محدد'}
                  </Text>
                  <Text style={[styles.arrowText, { color: colors.primary }]}>←</Text>
                  <Text style={[styles.locationText, { color: colors.text }]}>
                    إلى: {movement.toLocation}
                  </Text>
                </View>
                
                <Text style={[styles.movementReason, { color: colors.textSecondary }]}>
                  السبب: {movement.moveReason}
                </Text>
                
                {movement.movedBy && (
                  <Text style={[styles.movementBy, { color: colors.textSecondary }]}>
                    بواسطة: {movement.movedBy}
                  </Text>
                )}
              </View>
            ))
          )
        )}
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
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة معدة جديدة</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>اسم المعدة *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={equipmentForm.name}
                  onChangeText={(text) => setEquipmentForm(prev => ({ ...prev, name: text }))}
                  placeholder="اسم المعدة"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>التصنيف</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={equipmentForm.category}
                  onChangeText={(text) => setEquipmentForm(prev => ({ ...prev, category: text }))}
                  placeholder="تصنيف المعدة"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>الرقم التسلسلي</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={equipmentForm.serialNumber}
                  onChangeText={(text) => setEquipmentForm(prev => ({ ...prev, serialNumber: text }))}
                  placeholder="الرقم التسلسلي"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>الموقع الحالي</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={equipmentForm.location}
                  onChangeText={(text) => setEquipmentForm(prev => ({ ...prev, location: text }))}
                  placeholder="الموقع الحالي للمعدة"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>الحالة</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Picker
                      selectedValue={equipmentForm.condition}
                      style={[styles.picker, { color: colors.text }]}
                      onValueChange={(value) => setEquipmentForm(prev => ({ ...prev, condition: value }))}
                    >
                      <Picker.Item label="ممتازة" value="excellent" />
                      <Picker.Item label="جيدة" value="good" />
                      <Picker.Item label="مقبولة" value="fair" />
                      <Picker.Item label="ضعيفة" value="poor" />
                      <Picker.Item label="معطلة" value="broken" />
                    </Picker>
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>الوضع</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Picker
                      selectedValue={equipmentForm.status}
                      style={[styles.picker, { color: colors.text }]}
                      onValueChange={(value) => setEquipmentForm(prev => ({ ...prev, status: value }))}
                    >
                      <Picker.Item label="متاحة" value="available" />
                      <Picker.Item label="قيد الاستخدام" value="in_use" />
                      <Picker.Item label="صيانة" value="maintenance" />
                      <Picker.Item label="متقاعدة" value="retired" />
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>سعر الشراء</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={equipmentForm.purchasePrice}
                    onChangeText={(text) => setEquipmentForm(prev => ({ ...prev, purchasePrice: text }))}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>القيمة الحالية</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={equipmentForm.currentValue}
                    onChangeText={(text) => setEquipmentForm(prev => ({ ...prev, currentValue: text }))}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ملاحظات</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={equipmentForm.notes}
                  onChangeText={(text) => setEquipmentForm(prev => ({ ...prev, notes: text }))}
                  placeholder="ملاحظات إضافية"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={addEquipment}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={[styles.submitButtonText, { color: colors.surface }]}>إضافة</Text>
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
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                نقل المعدة: {selectedEquipment?.name}
              </Text>
              <TouchableOpacity onPress={() => setMovementModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>الموقع الحالي</Text>
                <Text style={[styles.currentLocationText, { color: colors.textSecondary }]}>
                  {selectedEquipment?.location || 'غير محدد'}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>الموقع الجديد *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={movementForm.toLocation}
                  onChangeText={(text) => setMovementForm(prev => ({ ...prev, toLocation: text }))}
                  placeholder="الموقع الجديد"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>سبب النقل</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={movementForm.moveReason}
                  onChangeText={(text) => setMovementForm(prev => ({ ...prev, moveReason: text }))}
                  placeholder="سبب النقل"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>المسؤول عن النقل</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={movementForm.movedBy}
                  onChangeText={(text) => setMovementForm(prev => ({ ...prev, movedBy: text }))}
                  placeholder="اسم المسؤول"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ملاحظات</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={movementForm.notes}
                  onChangeText={(text) => setMovementForm(prev => ({ ...prev, notes: text }))}
                  placeholder="ملاحظات إضافية"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={addMovement}
              >
                <Text style={[styles.submitButtonText, { color: colors.surface }]}>تسجيل النقل</Text>
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
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
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
  equipmentCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadges: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  equipmentDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  movementCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  movementEquipment: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  movementDate: {
    fontSize: 12,
  },
  movementPath: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
  },
  arrowText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  movementReason: {
    fontSize: 14,
    marginBottom: 4,
  },
  movementBy: {
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
  row: {
    flexDirection: 'row',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  currentLocationText: {
    fontSize: 16,
    fontStyle: 'italic',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
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