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
import type { Supplier } from '../types';

export default function SuppliersScreen() {
  const { colors } = useTheme();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    paymentTerms: 'نقد',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    paymentTerms: 'نقد',
    isActive: true,
    address: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // فلاتر متقدمة مطابقة للويب
  const [searchTerm, setSearchTerm] = useState('');

  // تحميل الموردين
  const loadSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      if (response.ok) {
        const suppliersData = await response.json();
        setSuppliers(suppliersData);
      }
    } catch (error) {
      console.error('خطأ في تحميل الموردين:', error);
      Alert.alert('خطأ', 'فشل في تحميل الموردين');
    } finally {
      setLoading(false);
    }
  };

  // التحقق من النموذج مطابق للويب
  const validateSupplierForm = (data: {name: string, contactPerson?: string, phone?: string}) => {
    const errors: {[key: string]: string} = {};
    if (!data.name.trim()) {
      errors.name = 'اسم المورد مطلوب';
    }
    if (data.name.trim().length < 2) {
      errors.name = 'اسم المورد يجب أن يكون حرفين على الأقل';
    }
    if (data.phone && data.phone.trim() && !/^[0-9+\-\s()]+$/.test(data.phone.trim())) {
      errors.phone = 'رقم هاتف غير صحيح';
    }
    return errors;
  };

  // إضافة مورد جديد مع validation
  const addSupplier = async () => {
    const errors = validateSupplierForm(newSupplier);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      Alert.alert('خطأ في النموذج', 'يرجى تصحيح الأخطاء');
      return;
    }
    setFormErrors({});

    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSupplier.name.trim(),
          contactPerson: newSupplier.contactPerson.trim() || undefined,
          phone: newSupplier.phone.trim() || undefined,
          paymentTerms: newSupplier.paymentTerms,
          isActive: true,
        }),
      });

      if (response.ok) {
        setNewSupplier({ name: '', contactPerson: '', phone: '', paymentTerms: 'نقد' });
        setShowAddModal(false);
        setFormErrors({});
        loadSuppliers();
        Alert.alert('نجح', 'تم إضافة المورد بنجاح');
      } else {
        const errorData = await response.json();
        Alert.alert('خطأ', errorData.message || 'فشل في إضافة المورد');
      }
    } catch (error) {
      console.error('خطأ في إضافة المورد:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة المورد');
    }
  };

  // حفظ تعديل المورد مطابق للويب
  const saveSupplierEdit = async () => {
    if (!editingSupplier) return;
    
    const errors = validateSupplierForm(editForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      Alert.alert('خطأ في النموذج', 'يرجى تصحيح الأخطاء');
      return;
    }

    try {
      const response = await fetch(`/api/suppliers/${editingSupplier.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          contactPerson: editForm.contactPerson.trim() || undefined,
          phone: editForm.phone.trim() || undefined,
          paymentTerms: editForm.paymentTerms,
          isActive: editForm.isActive,
          address: editForm.address.trim() || undefined,
          notes: editForm.notes.trim() || undefined,
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingSupplier(null);
        setFormErrors({});
        loadSuppliers();
        Alert.alert('نجح', 'تم تحديث بيانات المورد بنجاح');
      } else {
        const errorData = await response.json();
        Alert.alert('خطأ', errorData.message || 'فشل في تحديث المورد');
      }
    } catch (error) {
      console.error('خطأ في تحديث المورد:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث المورد');
    }
  };
  
  // حساب الإحصائيات مطابق للويب
  const calculateStats = () => {
    return {
      total: suppliers.length,
      active: suppliers.filter(s => s.isActive).length,
      inactive: suppliers.filter(s => !s.isActive).length,
      totalDebt: suppliers.reduce((sum, s) => sum + (parseFloat(s.totalDebt?.toString() || '0') || 0), 0)
    };
  };

  // فلترة الموردين مطابقة للويب
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (supplier.phone && supplier.phone.includes(searchTerm));
    return matchesSearch;
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  // بطاقة المورد - مطابقة للويب 100%
  const SupplierCard = ({ supplier }: { supplier: Supplier }) => {
    const handleEdit = () => {
      setEditingSupplier(supplier);
      setEditForm({
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        paymentTerms: supplier.paymentTerms || 'نقد',
        isActive: supplier.isActive,
        address: supplier.address || '',
        notes: supplier.notes || ''
      });
      setShowEditModal(true);
    };

    const handleDelete = async () => {
      Alert.alert(
        'تأكيد الحذف',
        `هل أنت متأكد من حذف المورد "${supplier.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`,
        [
          { text: 'إلغاء', style: 'cancel' },
          { 
            text: 'حذف', 
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await fetch(`/api/suppliers/${supplier.id}`, {
                  method: 'DELETE'
                });
                if (response.ok) {
                  Alert.alert('تم بنجاح', 'تم حذف المورد بنجاح');
                  loadSuppliers();
                } else {
                  Alert.alert('خطأ', 'فشل في حذف المورد');
                }
              } catch (error) {
                Alert.alert('خطأ', 'حدث خطأ في حذف المورد');
              }
            }
          }
        ]
      );
    };

    const getInitials = (name: string) => {
      return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
    };

    const getDebtColor = () => {
      const debt = parseFloat(supplier.totalDebt || '0');
      if (debt > 0) return '#dc2626'; // أحمر للدين
      if (debt < 0) return '#16a34a'; // أخضر للرصيد الإيجابي
      return colors.textSecondary; // رمادي للصفر
    };

    return (
      <View style={[
        styles.supplierCard, 
        { backgroundColor: colors.surface },
        supplier.isActive 
          ? { borderRightColor: '#22c55e', borderRightWidth: 4 }
          : { borderRightColor: '#ef4444', borderRightWidth: 4 }
      ]}>
        {/* العنوان مع الأيقونة والأزرار */}
        <View style={styles.supplierHeader}>
          <View style={styles.supplierMainInfo}>
            {/* أيقونة المبنى للمورد */}
            <View style={[
              styles.supplierIconContainer, 
              supplier.isActive 
                ? { backgroundColor: '#3b82f6' }
                : { backgroundColor: '#6b7280' }
            ]}>
              <Icons.Building size={20} color="white" />
            </View>
            
            <View style={styles.supplierInfo}>
              <Text style={[styles.supplierName, { color: colors.text }]}>{supplier.name}</Text>
              <View style={styles.badgesRow}>
                {/* Badge الحالة */}
                <View style={[
                  styles.badge,
                  supplier.isActive 
                    ? { backgroundColor: '#dcfce7' }
                    : { backgroundColor: '#fecaca' }
                ]}>
                  <Text style={[
                    styles.badgeText,
                    supplier.isActive 
                      ? { color: '#15803d' }
                      : { color: '#dc2626' }
                  ]}>
                    {supplier.isActive ? 'نشط' : 'غير نشط'}
                  </Text>
                </View>
                
                {/* Badge شروط الدفع */}
                <View style={[styles.badge, styles.paymentBadge, { borderColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                    {supplier.paymentTerms}
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

        {/* المعلومات التفصيلية */}
        <View style={styles.supplierDetails}>
          <View style={styles.detailsGrid}>
            {/* الشخص المسؤول */}
            {supplier.contactPerson && (
              <View style={styles.detailItem}>
                <View style={styles.detailHeader}>
                  <Icons.User size={16} color="#6b7280" />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>الشخص المسؤول</Text>
                </View>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {supplier.contactPerson}
                </Text>
              </View>
            )}

            {/* رقم الهاتف */}
            {supplier.phone && (
              <View style={styles.detailItem}>
                <View style={styles.detailHeader}>
                  <Icons.Phone size={16} color="#16a34a" />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>رقم الهاتف</Text>
                </View>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {supplier.phone}
                </Text>
              </View>
            )}
          </View>

          {/* المديونية */}
          <View style={[styles.debtCard, { backgroundColor: '#f8fafc' }]}>
            <View style={styles.debtHeader}>
              <Icons.CreditCard size={16} color={getDebtColor()} />
              <Text style={[styles.debtLabel, { color: colors.textSecondary }]}>إجمالي المديونية</Text>
            </View>
            <Text style={[styles.debtValue, { color: getDebtColor() }]}>
              {formatCurrency(parseFloat(supplier.totalDebt || '0'))}
            </Text>
          </View>
        </View>

        {/* الشريط السفلي مع معرف المورد */}
        <View style={[styles.supplierFooter, { borderTopColor: colors.border }]}>
          <View style={styles.supplierIdContainer}>
            <Icons.Hash size={12} color={colors.textSecondary} />
            <Text style={[styles.supplierId, { color: colors.textSecondary }]}>
              ID: {supplier.id.slice(-8)}
            </Text>
          </View>

          {supplier.createdAt && (
            <View style={styles.dateContainer}>
              <Icons.Calendar size={12} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {formatDate(supplier.createdAt)}
              </Text>
            </View>
          )}
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* عنوان الصفحة مع زر الإضافة */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>إدارة الموردين</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ إضافة مورد</Text>
        </TouchableOpacity>
      </View>

      {/* الإحصائيات */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.text }]}>{suppliers.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>إجمالي الموردين</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.success }]}>
            {suppliers.filter(s => s.isActive).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>الموردين النشطون</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.error }]}>
            {suppliers.reduce((sum, s) => sum + parseFloat(s.totalDebt), 0).toLocaleString('ar-SA')}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>إجمالي المديونية</Text>
        </View>
      </View>

      {/* قائمة الموردين */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {suppliers.map((supplier) => (
          <SupplierCard key={supplier.id} supplier={supplier} />
        ))}
      </ScrollView>

      {/* مودال إضافة مورد */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة مورد جديد</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="اسم المورد *"
              placeholderTextColor={colors.textSecondary}
              value={newSupplier.name}
              onChangeText={(text: string) => setNewSupplier({...newSupplier, name: text})}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="الشخص المسؤول"
              placeholderTextColor={colors.textSecondary}
              value={newSupplier.contactPerson}
              onChangeText={(text: string) => setNewSupplier({...newSupplier, contactPerson: text})}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="رقم الهاتف"
              placeholderTextColor={colors.textSecondary}
              value={newSupplier.phone}
              onChangeText={(text: string) => setNewSupplier({...newSupplier, phone: text})}
              keyboardType="phone-pad"
              textAlign="right"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.surface }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.buttonText, { color: colors.textSecondary }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={addSupplier}
              >
                <Text style={[styles.buttonText, { color: 'white' }]}>إضافة</Text>
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  supplierCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  contactPerson: {
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
  supplierDetails: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  supplierFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  phone: {
    fontSize: 14,
    marginBottom: 4,
  },
  paymentTerms: {
    fontSize: 14,
    fontWeight: '500',
  },
  debtInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 8,
  },
  debtLabel: {
    fontSize: 14,
  },
  debtAmount: {
    fontSize: 14,
    fontWeight: 'bold',
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
  
  // Styles إضافية للتصميم الجديد المطابق للويب
  supplierMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  supplierIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
  paymentBadge: {
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
  detailsGrid: {
    gap: 8,
    marginBottom: 12,
  },
  detailItem: {
    marginBottom: 8,
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
    fontWeight: '600',
  },
  debtCard: {
    padding: 12,
    borderRadius: 8,
  },
  debtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  debtValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  supplierIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  supplierId: {
    fontSize: 11,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
  },
});