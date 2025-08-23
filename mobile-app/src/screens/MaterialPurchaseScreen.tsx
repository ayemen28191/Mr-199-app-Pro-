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

interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
}

interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
}

interface MaterialPurchase {
  id: string;
  materialName: string;
  category: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  supplierName: string;
  paymentType: string;
  invoiceNumber?: string;
  invoiceDate: string;
  purchaseDate: string;
  notes?: string;
}

export default function MaterialPurchaseScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  
  // الحالات الأساسية
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  
  // البيانات
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<MaterialPurchase[]>([]);
  
  // نموذج المشتريات
  const [purchaseForm, setPurchaseForm] = useState({
    materialName: '',
    category: '',
    unit: '',
    quantity: '',
    unitPrice: '',
    supplierName: '',
    paymentType: 'نقد',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  
  // نموذج إضافة مورد
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    paymentTerms: 'نقد',
    notes: '',
  });

  // تحميل البيانات الأساسية
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // تحميل المواد
      const materialsResponse = await fetch('/api/materials');
      if (materialsResponse.ok) {
        const materialsData = await materialsResponse.json();
        setMaterials(materialsData);
      }
      
      // تحميل الموردين
      const suppliersResponse = await fetch('/api/suppliers');
      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json();
        setSuppliers(suppliersData);
      }
      
      // تحميل المشتريات
      if (selectedProjectId) {
        const purchasesResponse = await fetch(`/api/projects/${selectedProjectId}/material-purchases`);
        if (purchasesResponse.ok) {
          const purchasesData = await purchasesResponse.json();
          setPurchases(purchasesData);
        }
      }
      
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      Alert.alert('خطأ', 'فشل في تحميل البيانات الأساسية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [selectedProjectId]);

  // حفظ قيمة في الإكمال التلقائي
  const saveAutocompleteValue = async (category: string, value: string) => {
    if (!value || value.trim().length < 2) return;
    
    try {
      await fetch('/api/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, value: value.trim() }),
      });
    } catch (error) {
      console.log(`Failed to save autocomplete value for ${category}:`, error);
    }
  };

  // إضافة مورد جديد
  const addSupplier = async () => {
    if (!supplierForm.name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المورد');
      return;
    }
    
    try {
      // حفظ قيم الإكمال التلقائي
      await Promise.all([
        saveAutocompleteValue('supplier_name', supplierForm.name),
        saveAutocompleteValue('supplier_contact_person', supplierForm.contactPerson),
        saveAutocompleteValue('supplier_phone', supplierForm.phone),
        saveAutocompleteValue('supplier_address', supplierForm.address),
        saveAutocompleteValue('supplier_payment_terms', supplierForm.paymentTerms),
      ]);

      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm),
      });

      if (response.ok) {
        const newSupplier = await response.json();
        setSuppliers(prev => [...prev, newSupplier]);
        setPurchaseForm(prev => ({ ...prev, supplierName: newSupplier.name }));
        setSupplierForm({ name: '', contactPerson: '', phone: '', address: '', paymentTerms: 'نقد', notes: '' });
        setSupplierModalVisible(false);
        Alert.alert('نجح', 'تم إضافة المورد بنجاح');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إضافة المورد');
    }
  };

  // إضافة مشتروات جديدة
  const addPurchase = async () => {
    if (!selectedProjectId) {
      Alert.alert('خطأ', 'يرجى اختيار مشروع أولاً');
      return;
    }

    if (!purchaseForm.materialName || !purchaseForm.quantity || !purchaseForm.unitPrice) {
      Alert.alert('خطأ', 'يرجى ملء البيانات المطلوبة');
      return;
    }

    const quantity = parseFloat(purchaseForm.quantity);
    const unitPrice = parseFloat(purchaseForm.unitPrice);
    
    if (isNaN(quantity) || isNaN(unitPrice) || quantity <= 0 || unitPrice <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال كمية وسعر صحيحين');
      return;
    }

    setSaving(true);
    try {
      // حفظ قيم الإكمال التلقائي
      await Promise.all([
        saveAutocompleteValue('material_names', purchaseForm.materialName),
        saveAutocompleteValue('material_categories', purchaseForm.category),
        saveAutocompleteValue('material_units', purchaseForm.unit),
        saveAutocompleteValue('supplier_names', purchaseForm.supplierName),
        saveAutocompleteValue('invoice_numbers', purchaseForm.invoiceNumber),
        saveAutocompleteValue('purchase_notes', purchaseForm.notes),
      ]);

      // إنشاء أو تحديث المادة
      let material = materials.find(m => m.name.toLowerCase() === purchaseForm.materialName.toLowerCase());
      if (!material) {
        const materialResponse = await fetch('/api/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: purchaseForm.materialName,
            category: purchaseForm.category || 'عام',
            unit: purchaseForm.unit || 'قطعة',
            description: purchaseForm.notes,
          }),
        });
        
        if (materialResponse.ok) {
          material = await materialResponse.json();
          setMaterials(prev => [...prev, material!]);
        }
      }

      // إضافة المشتروات
      const purchaseData = {
        projectId: selectedProjectId,
        materialId: material?.id,
        materialName: purchaseForm.materialName,
        category: purchaseForm.category || 'عام',
        unit: purchaseForm.unit || 'قطعة',
        quantity: quantity,
        unitPrice: unitPrice,
        totalAmount: quantity * unitPrice,
        supplierName: purchaseForm.supplierName,
        paymentType: purchaseForm.paymentType,
        invoiceNumber: purchaseForm.invoiceNumber,
        invoiceDate: purchaseForm.invoiceDate,
        purchaseDate: purchaseForm.purchaseDate,
        notes: purchaseForm.notes,
      };

      const response = await fetch('/api/material-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseData),
      });

      if (response.ok) {
        const newPurchase = await response.json();
        setPurchases(prev => [...prev, newPurchase]);
        
        // إعادة تعيين النموذج
        setPurchaseForm({
          materialName: '',
          category: '',
          unit: '',
          quantity: '',
          unitPrice: '',
          supplierName: '',
          paymentType: 'نقد',
          invoiceNumber: '',
          invoiceDate: new Date().toISOString().split('T')[0],
          purchaseDate: new Date().toISOString().split('T')[0],
          notes: '',
        });
        
        setModalVisible(false);
        Alert.alert('نجح', 'تم إضافة المشتروات بنجاح');
      }
    } catch (error) {
      console.error('خطأ في إضافة المشتروات:', error);
      Alert.alert('خطأ', 'فشل في إضافة المشتروات');
    } finally {
      setSaving(false);
    }
  };

  // حذف مشتروات
  const deletePurchase = (purchaseId: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذه المشتروات؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`/api/material-purchases/${purchaseId}`, {
                method: 'DELETE',
              });
              
              if (response.ok) {
                setPurchases(prev => prev.filter(p => p.id !== purchaseId));
                Alert.alert('تم', 'تم حذف المشتروات');
              }
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف المشتروات');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري تحميل البيانات...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* عنوان الشاشة */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>شراء المواد</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={[styles.addButtonText, { color: colors.surface }]}>+ إضافة مشتروات</Text>
        </TouchableOpacity>
      </View>

      {/* قائمة المشتروات */}
      <ScrollView style={styles.content}>
        {purchases.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لا توجد مشتروات مضافة بعد
            </Text>
          </View>
        ) : (
          purchases.map((purchase) => (
            <View key={purchase.id} style={[styles.purchaseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.purchaseHeader}>
                <Text style={[styles.materialName, { color: colors.text }]}>{purchase.materialName}</Text>
                <Text style={[styles.totalAmount, { color: colors.primary }]}>
                  {purchase.totalAmount.toLocaleString('ar-SA')} ر.س
                </Text>
              </View>
              
              <View style={styles.purchaseDetails}>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  الكمية: {purchase.quantity} {purchase.unit} × {purchase.unitPrice} ر.س
                </Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  المورد: {purchase.supplierName}
                </Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  التاريخ: {new Date(purchase.purchaseDate).toLocaleDateString('ar-SA')}
                </Text>
                {purchase.invoiceNumber && (
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    رقم الفاتورة: {purchase.invoiceNumber}
                  </Text>
                )}
              </View>

              <View style={styles.purchaseActions}>
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.error }]}
                  onPress={() => deletePurchase(purchase.id)}
                >
                  <Text style={[styles.deleteButtonText, { color: colors.surface }]}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* نموذج إضافة مشتروات */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة مشتروات جديدة</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* اسم المادة */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>اسم المادة *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={purchaseForm.materialName}
                  onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, materialName: text }))}
                  placeholder="اسم المادة"
                />
              </View>

              {/* التصنيف */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>التصنيف</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={purchaseForm.category}
                  onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, category: text }))}
                  placeholder="تصنيف المادة"
                />
              </View>

              {/* الوحدة */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>الوحدة</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={purchaseForm.unit}
                  onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, unit: text }))}
                  placeholder="قطعة، كيس، متر، إلخ"
                />
              </View>

              {/* الكمية والسعر */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>الكمية *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={purchaseForm.quantity}
                    onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, quantity: text }))}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>سعر الوحدة *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={purchaseForm.unitPrice}
                    onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, unitPrice: text }))}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* المورد */}
              <View style={styles.inputGroup}>
                <View style={styles.supplierHeader}>
                  <Text style={[styles.label, { color: colors.text }]}>المورد</Text>
                  <TouchableOpacity
                    style={[styles.addSupplierButton, { backgroundColor: colors.secondary }]}
                    onPress={() => setSupplierModalVisible(true)}
                  >
                    <Text style={[styles.addSupplierText, { color: colors.text }]}>+ مورد جديد</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={purchaseForm.supplierName}
                  onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, supplierName: text }))}
                  placeholder="اسم المورد"
                />
              </View>

              {/* نوع الدفع */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>نوع الدفع</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={purchaseForm.paymentType}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(value) => setPurchaseForm(prev => ({ ...prev, paymentType: value }))}
                  >
                    <Picker.Item label="نقد" value="نقد" />
                    <Picker.Item label="آجل" value="آجل" />
                    <Picker.Item label="بنك" value="بنك" />
                    <Picker.Item label="شيك" value="شيك" />
                  </Picker>
                </View>
              </View>

              {/* رقم الفاتورة */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>رقم الفاتورة</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={purchaseForm.invoiceNumber}
                  onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, invoiceNumber: text }))}
                  placeholder="رقم الفاتورة"
                />
              </View>

              {/* التواريخ */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>تاريخ الشراء</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={purchaseForm.purchaseDate}
                    onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, purchaseDate: text }))}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>تاريخ الفاتورة</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={purchaseForm.invoiceDate}
                    onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, invoiceDate: text }))}
                  />
                </View>
              </View>

              {/* الملاحظات */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ملاحظات</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={purchaseForm.notes}
                  onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, notes: text }))}
                  placeholder="ملاحظات إضافية"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* الإجمالي */}
              {purchaseForm.quantity && purchaseForm.unitPrice && (
                <View style={[styles.totalSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>الإجمالي:</Text>
                  <Text style={[styles.totalValue, { color: colors.primary }]}>
                    {(parseFloat(purchaseForm.quantity || '0') * parseFloat(purchaseForm.unitPrice || '0')).toLocaleString('ar-SA')} ر.س
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={addPurchase}
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

      {/* نموذج إضافة مورد */}
      <Modal
        visible={supplierModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSupplierModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة مورد جديد</Text>
              <TouchableOpacity onPress={() => setSupplierModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>اسم المورد *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={supplierForm.name}
                  onChangeText={(text) => setSupplierForm(prev => ({ ...prev, name: text }))}
                  placeholder="اسم المورد"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>الشخص المسؤول</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={supplierForm.contactPerson}
                  onChangeText={(text) => setSupplierForm(prev => ({ ...prev, contactPerson: text }))}
                  placeholder="اسم الشخص المسؤول"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>رقم الهاتف</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={supplierForm.phone}
                  onChangeText={(text) => setSupplierForm(prev => ({ ...prev, phone: text }))}
                  placeholder="رقم الهاتف"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>العنوان</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={supplierForm.address}
                  onChangeText={(text) => setSupplierForm(prev => ({ ...prev, address: text }))}
                  placeholder="عنوان المورد"
                  multiline
                  numberOfLines={2}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={addSupplier}
              >
                <Text style={[styles.submitButtonText, { color: colors.surface }]}>إضافة المورد</Text>
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
  purchaseCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  materialName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  purchaseDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  purchaseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
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
  row: {
    flexDirection: 'row',
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addSupplierButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addSupplierText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
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