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
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatDate } from '../lib/utils';
import * as Icons from '../components/Icons';
import type { Worker } from '../types/schema';

export default function WorkersScreen() {
  const { colors } = useTheme();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [newWorker, setNewWorker] = useState({
    name: '',
    type: '',
    dailyWage: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    type: '',
    dailyWage: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // فلاتر متقدمة مطابقة للويب
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // تحميل العمال
  const loadWorkers = async () => {
    try {
      const API_BASE = __DEV__ ? 'http://localhost:5000' : 'https://your-production-domain.com';
      const response = await fetch(`${API_BASE}/api/workers`);
      if (response.ok) {
        const workersData = await response.json();
        setWorkers(workersData);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('خطأ في تحميل العمال:', error);
      Alert.alert('خطأ', 'فشل في تحميل العمال - تأكد من اتصال الشبكة');
    } finally {
      setLoading(false);
    }
  };

  // التحقق من النموذج مطابق للويب
  const validateWorkerForm = (data: {name: string, type: string, dailyWage: string}) => {
    const errors: {[key: string]: string} = {};
    if (!data.name.trim()) {
      errors.name = 'اسم العامل مطلوب';
    }
    if (data.name.trim().length < 2) {
      errors.name = 'اسم العامل يجب أن يكون حرفين على الأقل';
    }
    if (!data.type.trim()) {
      errors.type = 'نوع العمل مطلوب';
    }
    if (!data.dailyWage.trim()) {
      errors.dailyWage = 'الأجر اليومي مطلوب';
    } else if (isNaN(parseFloat(data.dailyWage)) || parseFloat(data.dailyWage) <= 0) {
      errors.dailyWage = 'يجب أن يكون الأجر رقم موجب';
    }
    return errors;
  };

  // إضافة عامل جديد مع validation
  const addWorker = async () => {
    const errors = validateWorkerForm(newWorker);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      Alert.alert('خطأ في النموذج', 'يرجى تصحيح الأخطاء');
      return;
    }
    setFormErrors({});

    try {
      const API_BASE = __DEV__ ? 'http://localhost:5000' : 'https://your-production-domain.com';
      const response = await fetch(`${API_BASE}/api/workers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newWorker.name.trim(),
          type: newWorker.type.trim(),
          dailyWage: parseFloat(newWorker.dailyWage).toString(),
          isActive: true,
        }),
      });

      if (response.ok) {
        setNewWorker({ name: '', type: '', dailyWage: '' });
        setShowAddModal(false);
        setFormErrors({});
        loadWorkers();
        Alert.alert('نجح', 'تم إضافة العامل بنجاح');
      } else {
        const errorData = await response.json();
        Alert.alert('خطأ', errorData.message || 'فشل في إضافة العامل');
      }
    } catch (error) {
      console.error('خطأ في إضافة العامل:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة العامل');
    }
  };

  // حفظ تعديل العامل مطابق للويب
  const saveWorkerEdit = async () => {
    if (!editingWorker) return;
    
    const errors = validateWorkerForm(editForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      Alert.alert('خطأ في النموذج', 'يرجى تصحيح الأخطاء');
      return;
    }

    try {
      const API_BASE = __DEV__ ? 'http://localhost:5000' : 'https://your-production-domain.com';
      const response = await fetch(`${API_BASE}/api/workers/${editingWorker.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          type: editForm.type.trim(),
          dailyWage: parseFloat(editForm.dailyWage).toString(),
          isActive: editForm.isActive,
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingWorker(null);
        setFormErrors({});
        loadWorkers();
        Alert.alert('نجح', 'تم تحديث بيانات العامل بنجاح');
      } else {
        const errorData = await response.json();
        Alert.alert('خطأ', errorData.message || 'فشل في تحديث العامل');
      }
    } catch (error) {
      console.error('خطأ في تحديث العامل:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث العامل');
    }
  };
  
  // حساب الإحصائيات مطابق للويب
  const calculateStats = () => {
    return {
      total: workers.length,
      active: workers.filter(w => w.isActive).length,
      inactive: workers.filter(w => !w.isActive).length,
      avgWage: workers.length > 0 ? workers.reduce((sum, w) => sum + parseFloat(w.dailyWage.toString()), 0) / workers.length : 0
    };
  };

  // فلترة العمال مطابقة للويب
  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worker.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && worker.isActive) ||
                         (statusFilter === 'inactive' && !worker.isActive);
    const matchesType = typeFilter === 'all' || worker.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  useEffect(() => {
    loadWorkers();
  }, []);

  // بطاقة العامل - مطابقة للويب 100%
  const WorkerCard = ({ worker }: { worker: Worker }) => {
    const handleEdit = () => {
      setEditingWorker(worker);
      setEditForm({
        name: worker.name,
        type: worker.type,
        dailyWage: worker.dailyWage.toString(),
        isActive: worker.isActive
      });
      setShowEditModal(true);
    };

    const handleDelete = async () => {
      Alert.alert(
        'تأكيد الحذف',
        `هل أنت متأكد من حذف العامل "${worker.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`,
        [
          { text: 'إلغاء', style: 'cancel' },
          { 
            text: 'حذف', 
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await fetch(`/api/workers/${worker.id}`, {
                  method: 'DELETE'
                });
                if (response.ok) {
                  Alert.alert('تم بنجاح', 'تم حذف العامل بنجاح');
                  loadWorkers();
                } else {
                  Alert.alert('خطأ', 'فشل في حذف العامل');
                }
              } catch (error) {
                Alert.alert('خطأ', 'حدث خطأ في حذف العامل');
              }
            }
          }
        ]
      );
    };

    const handleToggleStatus = async () => {
      const action = worker.isActive ? 'إيقاف' : 'تفعيل';
      Alert.alert(
        `${action} العامل`,
        `هل تريد ${action} العامل "${worker.name}"؟`,
        [
          { text: 'إلغاء', style: 'cancel' },
          { 
            text: action, 
            onPress: async () => {
              try {
                const response = await fetch(`/api/workers/${worker.id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    isActive: !worker.isActive
                  }),
                });
                if (response.ok) {
                  Alert.alert('تم بنجاح', `تم ${action} العامل بنجاح`);
                  loadWorkers();
                } else {
                  Alert.alert('خطأ', 'فشل في تحديث حالة العامل');
                }
              } catch (error) {
                Alert.alert('خطأ', 'حدث خطأ في تحديث الحالة');
              }
            }
          }
        ]
      );
    };

    const getInitials = (name: string) => {
      return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
    };

    return (
      <View style={[
        styles.workerCard, 
        { backgroundColor: colors.surface },
        worker.isActive 
          ? { borderRightColor: '#22c55e', borderRightWidth: 4 }
          : { borderRightColor: '#ef4444', borderRightWidth: 4 }
      ]}>
        {/* العنوان مع الصورة والأزرار */}
        <View style={styles.workerHeader}>
          <View style={styles.workerMainInfo}>
            {/* صورة دائرية بـ gradient */}
            <View style={[
              styles.avatarContainer, 
              worker.isActive 
                ? { backgroundColor: '#3b82f6' }
                : { backgroundColor: '#6b7280' }
            ]}>
              <Text style={styles.avatarText}>{getInitials(worker.name)}</Text>
            </View>
            
            <View style={styles.workerInfo}>
              <Text style={[styles.workerName, { color: colors.text }]}>{worker.name}</Text>
              <View style={styles.badgesRow}>
                {/* Badge الحالة */}
                <View style={[
                  styles.badge,
                  worker.isActive 
                    ? { backgroundColor: '#dcfce7' }
                    : { backgroundColor: '#fecaca' }
                ]}>
                  <Text style={[
                    styles.badgeText,
                    worker.isActive 
                      ? { color: '#15803d' }
                      : { color: '#dc2626' }
                  ]}>
                    {worker.isActive ? 'نشط' : 'غير نشط'}
                  </Text>
                </View>
                
                {/* Badge نوع العمل */}
                <View style={[styles.badge, styles.typeBadge, { borderColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                    {worker.type}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* أزرار التعديل والحذف */}
          <View style={styles.actionButtonsHeader}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.editBtn]}
              onPress={handleEdit}
            >
              <Icons.Edit size={16} color="#2563eb" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={handleDelete}
            >
              <Icons.Trash size={16} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* المعلومات المالية وتاريخ التسجيل */}
        <View style={styles.workerDetails}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Icons.DollarSign size={16} color="#16a34a" />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>الأجر اليومي</Text>
              </View>
              <Text style={[styles.detailValue, { color: '#16a34a' }]}>
                {formatCurrency(parseFloat(worker.dailyWage.toString()))}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Icons.Calendar size={16} color="#2563eb" />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>تاريخ التسجيل</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatDate(worker.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* الشريط السفلي مع زر التفعيل ومعرف العامل */}
        <View style={[styles.workerFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity 
            style={[
              styles.toggleBtn,
              worker.isActive 
                ? { backgroundColor: '#fecaca' }
                : { backgroundColor: '#dcfce7' }
            ]}
            onPress={handleToggleStatus}
          >
            <Icons.Activity size={14} color={worker.isActive ? '#dc2626' : '#16a34a'} />
            <Text style={[
              styles.toggleText,
              { color: worker.isActive ? '#dc2626' : '#16a34a' }
            ]}>
              {worker.isActive ? 'إيقاف' : 'تفعيل'}
            </Text>
          </TouchableOpacity>

          <View style={styles.workerIdContainer}>
            <Icons.User size={12} color={colors.textSecondary} />
            <Text style={[styles.workerId, { color: colors.textSecondary }]}>
              ID: {worker.id.slice(-8)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري التحميل...</Text>
      </View>
    );
  }

  // حساب الإحصائيات للعرض
  const stats = calculateStats();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* عنوان الصفحة مع زر الإضافة */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>إدارة العمال</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ إضافة عامل</Text>
        </TouchableOpacity>
      </View>

      {/* شبكة الإحصائيات مطابقة للويب 100% */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.blueGradient]}>
          <View style={styles.statContent}>
            <View style={styles.statIconContainer}>
              <Icons.UserCheck size={20} color="#2563eb" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statTitle, { color: colors.text }]}>إجمالي العمال</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.statCard, styles.greenGradient]}>
          <View style={styles.statContent}>
            <View style={styles.statIconContainer}>
              <Icons.Activity size={20} color="#16a34a" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statTitle, { color: colors.text }]}>عمال نشطون</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.active}</Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.statCard, stats.inactive > 0 ? styles.redGradient : styles.grayGradient]}>
          <View style={styles.statContent}>
            <View style={styles.statIconContainer}>
              <Icons.User size={20} color={stats.inactive > 0 ? "#dc2626" : "#6b7280"} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statTitle, { color: colors.text }]}>عمال غير نشطين</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.inactive}</Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.statCard, styles.purpleGradient]}>
          <View style={styles.statContent}>
            <View style={styles.statIconContainer}>
              <Icons.DollarSign size={20} color="#7c3aed" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statTitle, { color: colors.text }]}>متوسط الأجر</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(stats.avgWage)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* شريط البحث والفلترة مطابق للويب 100% */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Icons.Search size={16} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="ابحث عن عامل..."
            placeholderTextColor={colors.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
            textAlign="right"
          />
        </View>
        
        <View style={styles.filterButtons}>
          {['all', 'active', 'inactive'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                { borderColor: colors.border },
                statusFilter === status ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface }
              ]}
              onPress={() => setStatusFilter(status as any)}
            >
              <Text style={[
                styles.filterButtonText,
                { color: statusFilter === status ? '#fff' : colors.text }
              ]}>
                {status === 'all' ? 'الكل' : status === 'active' ? 'نشط' : 'غير نشط'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* قائمة العمال مع الفلترة */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredWorkers.length > 0 ? (
          filteredWorkers.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icons.UserCheck size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchTerm ? 'لا يوجد عمال يطابقون البحث' : 'لا يوجد عمال بعد'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* مودال إضافة عامل */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة عامل جديد</Text>
            
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                formErrors.name ? styles.inputError : {}
              ]}
              placeholder="اسم العامل"
              placeholderTextColor={colors.textSecondary}
              value={newWorker.name}
              onChangeText={(text: string) => setNewWorker({...newWorker, name: text})}
              textAlign="right"
            />
            {formErrors.name && (
              <Text style={[styles.errorText, { color: '#dc2626' }]}>{formErrors.name}</Text>
            )}

            <TextInput
              style={[
                styles.input, 
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                formErrors.type ? styles.inputError : {}
              ]}
              placeholder="نوع العمل (مثل: عامل، معلم، مساعد)"
              placeholderTextColor={colors.textSecondary}
              value={newWorker.type}
              onChangeText={(text: string) => setNewWorker({...newWorker, type: text})}
              textAlign="right"
            />
            {formErrors.type && (
              <Text style={[styles.errorText, { color: '#dc2626' }]}>{formErrors.type}</Text>
            )}

            <TextInput
              style={[
                styles.input, 
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                formErrors.dailyWage ? styles.inputError : {}
              ]}
              placeholder="الأجر اليومي"
              placeholderTextColor={colors.textSecondary}
              value={newWorker.dailyWage}
              onChangeText={(text: string) => setNewWorker({...newWorker, dailyWage: text})}
              keyboardType="numeric"
              textAlign="right"
            />
            {formErrors.dailyWage && (
              <Text style={[styles.errorText, { color: '#dc2626' }]}>{formErrors.dailyWage}</Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  setShowAddModal(false);
                  setFormErrors({});
                  setNewWorker({ name: '', type: '', dailyWage: '' });
                }}
              >
                <Text style={[styles.buttonText, { color: colors.textSecondary }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={addWorker}
              >
                <Text style={[styles.buttonText, { color: 'white' }]}>إضافة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* مودال تعديل العامل مطابق للويب 100% */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>تعديل بيانات العامل</Text>
            
            {/* اسم العامل */}
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>اسم العامل</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  formErrors.name ? styles.inputError : {}
                ]}
                placeholder="اسم العامل"
                placeholderTextColor={colors.textSecondary}
                value={editForm.name}
                onChangeText={(text: string) => setEditForm({...editForm, name: text})}
                textAlign="right"
              />
              {formErrors.name && (
                <Text style={[styles.errorText, { color: '#dc2626' }]}>{formErrors.name}</Text>
              )}
            </View>

            {/* نوع العمل */}
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>نوع العمل</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  formErrors.type ? styles.inputError : {}
                ]}
                placeholder="نوع العمل"
                placeholderTextColor={colors.textSecondary}
                value={editForm.type}
                onChangeText={(text: string) => setEditForm({...editForm, type: text})}
                textAlign="right"
              />
              {formErrors.type && (
                <Text style={[styles.errorText, { color: '#dc2626' }]}>{formErrors.type}</Text>
              )}
            </View>

            {/* الأجر اليومي */}
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>الأجر اليومي</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  formErrors.dailyWage ? styles.inputError : {}
                ]}
                placeholder="الأجر اليومي"
                placeholderTextColor={colors.textSecondary}
                value={editForm.dailyWage}
                onChangeText={(text: string) => setEditForm({...editForm, dailyWage: text})}
                keyboardType="numeric"
                textAlign="right"
              />
              {formErrors.dailyWage && (
                <Text style={[styles.errorText, { color: '#dc2626' }]}>{formErrors.dailyWage}</Text>
              )}
            </View>

            {/* حالة العامل */}
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>حالة العامل</Text>
              <View style={styles.statusButtons}>
                {[{value: true, label: 'نشط'}, {value: false, label: 'غير نشط'}].map((status) => (
                  <TouchableOpacity
                    key={status.value.toString()}
                    style={[
                      styles.statusButton,
                      { borderColor: colors.border },
                      editForm.isActive === status.value ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface }
                    ]}
                    onPress={() => setEditForm({...editForm, isActive: status.value})}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      { color: editForm.isActive === status.value ? '#fff' : colors.text }
                    ]}>{status.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingWorker(null);
                  setFormErrors({});
                }}
              >
                <Text style={[styles.buttonText, { color: colors.textSecondary }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={saveWorkerEdit}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>حفظ التعديلات</Text>
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
    padding: 16,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  workerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  workerType: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  workerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 8,
  },
  wageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  wageLabel: {
    fontSize: 14,
  },
  wageAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  joinDate: {
    fontSize: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  confirmButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Gradient styles مطابقة للويب 100%
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statCardNew: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    minHeight: 80,
  },
  blueGradient: {
    backgroundColor: '#dbeafe',
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  greenGradient: {
    backgroundColor: '#dcfce7',
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  redGradient: {
    backgroundColor: '#fecaca',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  grayGradient: {
    backgroundColor: '#f3f4f6',
    borderLeftWidth: 4,
    borderLeftColor: '#6b7280',
  },
  purpleGradient: {
    backgroundColor: '#f3e8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTextContainer: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Filter styles مطابقة للويب 100%
  filtersContainer: {
    marginBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    textAlign: 'right',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Form styles مطابقة للويب 100%
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  inputError: {
    borderColor: '#dc2626',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  
  // Styles إضافية للتصميم الجديد المطابق للويب
  workerMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadge: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButtonsHeader: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: '#eff6ff',
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
  },
  workerDetails: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 11,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workerIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workerId: {
    fontSize: 11,
  },
});