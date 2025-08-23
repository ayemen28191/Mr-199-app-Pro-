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
import type { Supplier } from '../types';

export default function SuppliersScreen() {
  const { colors } = useTheme();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    paymentTerms: 'نقد',
  });

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

  // إضافة مورد جديد
  const addSupplier = async () => {
    if (!newSupplier.name.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المورد');
      return;
    }

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
        loadSuppliers();
        Alert.alert('نجح', 'تم إضافة المورد بنجاح');
      } else {
        Alert.alert('خطأ', 'فشل في إضافة المورد');
      }
    } catch (error) {
      console.error('خطأ في إضافة المورد:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة المورد');
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // بطاقة المورد
  const SupplierCard = ({ supplier }: { supplier: Supplier }) => (
    <TouchableOpacity
      style={[styles.supplierCard, { 
        backgroundColor: colors.surface, 
        borderColor: colors.border,
        opacity: supplier.isActive ? 1 : 0.7,
      }]}
    >
      <View style={styles.supplierHeader}>
        <View style={styles.supplierInfo}>
          <Text style={[styles.supplierName, { color: colors.text }]}>{supplier.name}</Text>
          {supplier.contactPerson && (
            <Text style={[styles.contactPerson, { color: colors.textSecondary }]}>
              {supplier.contactPerson}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: supplier.isActive ? colors.success : colors.warning 
        }]}>
          <Text style={styles.statusText}>
            {supplier.isActive ? 'نشط' : 'غير نشط'}
          </Text>
        </View>
      </View>

      <View style={styles.supplierDetails}>
        {supplier.phone && (
          <Text style={[styles.phone, { color: colors.textSecondary }]}>
            📞 {supplier.phone}
          </Text>
        )}
        <Text style={[styles.paymentTerms, { color: colors.primary }]}>
          شروط الدفع: {supplier.paymentTerms}
        </Text>
      </View>

      <View style={styles.debtInfo}>
        <Text style={[styles.debtLabel, { color: colors.textSecondary }]}>إجمالي المديونية:</Text>
        <Text style={[styles.debtAmount, { 
          color: parseFloat(supplier.totalDebt) > 0 ? colors.error : colors.success 
        }]}>
          {parseFloat(supplier.totalDebt).toLocaleString('ar-SA')} ر.س
        </Text>
      </View>
    </TouchableOpacity>
  );

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
              onChangeText={(text) => setNewSupplier({...newSupplier, name: text})}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="الشخص المسؤول"
              placeholderTextColor={colors.textSecondary}
              value={newSupplier.contactPerson}
              onChangeText={(text) => setNewSupplier({...newSupplier, contactPerson: text})}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="رقم الهاتف"
              placeholderTextColor={colors.textSecondary}
              value={newSupplier.phone}
              onChangeText={(text) => setNewSupplier({...newSupplier, phone: text})}
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
    marginBottom: 8,
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
});