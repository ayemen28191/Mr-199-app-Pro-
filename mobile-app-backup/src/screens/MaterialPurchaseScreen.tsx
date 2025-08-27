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
  notes?: string;
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
  invoicePhoto?: string;
}

interface AutocompleteData {
  id: string;
  category: string;
  value: string;
  usageCount: number;
}

export default function MaterialPurchaseScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  
  // الحالات الأساسية المحسنة
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'purchase' | 'supplier'>('purchase');
  
  // البيانات الأساسية
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<MaterialPurchase[]>([]);
  const [autocompleteData, setAutocompleteData] = useState<AutocompleteData[]>([]);
  
  // حالات التحرير
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  
  // نموذج المشتريات المحسن
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
    invoicePhoto: '',
  });
  
  // نموذج إضافة مورد محسن
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    paymentTerms: 'نقد',
    notes: '',
  });

  // تحميل البيانات الأساسية المحسن
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // تحميل جميع البيانات بشكل متوازي
      const [
        materialsResponse,
        suppliersResponse,
        purchasesResponse,
        autocompleteResponse
      ] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/suppliers'),
        selectedProjectId ? fetch(`/api/projects/${selectedProjectId}/material-purchases`) : Promise.resolve({ ok: false }),
        fetch('/api/autocomplete')
      ]);

      // معالجة المواد
      if (materialsResponse.ok) {
        const materialsData = await materialsResponse.json();
        setMaterials(materialsData);
      }
      
      // معالجة الموردين
      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json();
        setSuppliers(suppliersData);
      }
      
      // معالجة المشتريات
      if (purchasesResponse.ok) {
        const purchasesData = await purchasesResponse.json();
        setPurchases(purchasesData);
      }

      // معالجة بيانات الإكمال التلقائي
      if (autocompleteResponse.ok) {
        const autocompleteRes = await autocompleteResponse.json();
        setAutocompleteData(autocompleteRes);
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

  // مكون AutocompleteInput مطابق للويب
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

  // دوال الحفظ والتحرير المطورة
  const handleSavePurchase = async () => {
    if (!selectedProjectId || !purchaseForm.materialName || !purchaseForm.quantity || !purchaseForm.unitPrice || !purchaseForm.supplierName) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      // حفظ قيم الإكمال التلقائي
      await Promise.all([
        saveAutocompleteValue('materialNames', purchaseForm.materialName),
        saveAutocompleteValue('materialCategories', purchaseForm.category),
        saveAutocompleteValue('materialUnits', purchaseForm.unit),
        saveAutocompleteValue('supplierNames', purchaseForm.supplierName),
        saveAutocompleteValue('invoiceNumbers', purchaseForm.invoiceNumber),
      ]);

      const purchaseData = {
        ...purchaseForm,
        quantity: parseFloat(purchaseForm.quantity),
        unitPrice: parseFloat(purchaseForm.unitPrice),
        totalAmount: parseFloat(purchaseForm.quantity) * parseFloat(purchaseForm.unitPrice),
        projectId: selectedProjectId,
      };

      const url = editingPurchaseId 
        ? `/api/projects/${selectedProjectId}/material-purchases/${editingPurchaseId}`
        : `/api/projects/${selectedProjectId}/material-purchases`;
      
      const method = editingPurchaseId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseData),
      });

      if (response.ok) {
        Alert.alert('نجح', editingPurchaseId ? 'تم تحديث المشتريات' : 'تم إضافة المشتريات');
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
          invoicePhoto: '',
        });
        setEditingPurchaseId(null);
        setModalVisible(false);
        loadInitialData();
      } else {
        throw new Error('فشل في حفظ المشتريات');
      }
    } catch (error) {
      console.error('خطأ في حفظ المشتريات:', error);
      Alert.alert('خطأ', 'فشل في حفظ المشتريات');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSupplier = async () => {
    if (!supplierForm.name) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المورد');
      return;
    }

    setSaving(true);
    try {
      // حفظ قيم الإكمال التلقائي
      await Promise.all([
        saveAutocompleteValue('supplierNames', supplierForm.name),
        saveAutocompleteValue('supplierContactPersons', supplierForm.contactPerson),
        saveAutocompleteValue('supplierPhones', supplierForm.phone),
        saveAutocompleteValue('supplierAddresses', supplierForm.address),
        saveAutocompleteValue('supplierPaymentTerms', supplierForm.paymentTerms),
      ]);

      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm),
      });

      if (response.ok) {
        const newSupplier = await response.json();
        setSuppliers(prev => [...prev, newSupplier]);
        setPurchaseForm(prev => ({ ...prev, supplierName: supplierForm.name }));
        Alert.alert('نجح', 'تم إضافة المورد بنجاح');
        setSupplierForm({
          name: '',
          contactPerson: '',
          phone: '',
          address: '',
          paymentTerms: 'نقد',
          notes: '',
        });
        setSupplierModalVisible(false);
      } else {
        throw new Error('فشل في إضافة المورد');
      }
    } catch (error) {
      console.error('خطأ في إضافة المورد:', error);
      Alert.alert('خطأ', 'فشل في إضافة المورد');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePurchase = async (id: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذه المشتريات؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`/api/projects/${selectedProjectId}/material-purchases/${id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                Alert.alert('تم', 'تم حذف المشتريات');
                loadInitialData();
              }
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف المشتريات');
            }
          },
        },
      ]
    );
  };

  // فتح نماذج الإدخال
  const openModal = (type: 'purchase' | 'supplier') => {
    setModalType(type);
    if (type === 'purchase') {
      setModalVisible(true);
    } else {
      setSupplierModalVisible(true);
    }
  };

  const editPurchase = (purchase: MaterialPurchase) => {
    setPurchaseForm({
      materialName: purchase.materialName,
      category: purchase.category,
      unit: purchase.unit,
      quantity: purchase.quantity.toString(),
      unitPrice: purchase.unitPrice.toString(),
      supplierName: purchase.supplierName,
      paymentType: purchase.paymentType,
      invoiceNumber: purchase.invoiceNumber || '',
      invoiceDate: purchase.invoiceDate,
      purchaseDate: purchase.purchaseDate,
      notes: purchase.notes || '',
      invoicePhoto: purchase.invoicePhoto || '',
    });
    setEditingPurchaseId(purchase.id);
    setModalVisible(true);
  };

  // حساب الإجماليات
  const totalPurchaseAmount = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
  const totalItems = purchases.length;

  // حالة التحميل
  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري تحميل بيانات شراء المواد...</Text>
      </View>
    );
  }

  // مكون قائمة المشتريات
  const PurchasesList = () => {
    if (purchases.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icons.Package size={64} color={colors.textSecondary} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>لا توجد مشتريات مواد</Text>
          <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
            ابدأ بإضافة مشتريات المواد لمشروعك
          </Text>
          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
            onPress={() => openModal('purchase')}
          >
            <Icons.Plus size={20} color="white" />
            <Text style={styles.emptyStateButtonText}>إضافة مشتريات مواد</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        {purchases.map((purchase) => (
          <View key={purchase.id} style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.listItemContent}>
              <View style={styles.listItemInfo}>
                <Text style={[styles.listItemTitle, { color: colors.text }]}>{purchase.materialName}</Text>
                <Text style={[styles.listItemAmount, { color: colors.primary }]}>
                  {formatCurrency(purchase.totalAmount)}
                </Text>
                <View style={styles.listItemDetails}>
                  <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                    {purchase.quantity} {purchase.unit} × {formatCurrency(purchase.unitPrice)}
                  </Text>
                  <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                    المورد: {purchase.supplierName}
                  </Text>
                </View>
              </View>
              <View style={styles.listItemActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => editPurchase(purchase)}
                >
                  <Icons.Edit size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.error }]}
                  onPress={() => handleDeletePurchase(purchase.id)}
                >
                  <Icons.Trash size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* الرأس مع العنوان والإحصائيات */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>شراء المواد</Text>
        
        {/* كارت الملخص مع Gradients */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>ملخص المشتريات</Text>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryItem, styles.gradientBlue]}>
              <View style={styles.summaryContent}>
                <View style={styles.summaryText}>
                  <Text style={styles.summaryValue}>{totalItems}</Text>
                  <Text style={styles.summaryLabel}>إجمالي المشتريات</Text>
                </View>
                <Icons.Package size={24} color="white" style={{ opacity: 0.8 }} />
              </View>
            </View>
            
            <View style={[styles.summaryItem, styles.gradientGreen]}>
              <View style={styles.summaryContent}>
                <View style={styles.summaryText}>
                  <Text style={styles.summaryValue}>{formatCurrency(totalPurchaseAmount)}</Text>
                  <Text style={styles.summaryLabel}>القيمة الإجمالية</Text>
                </View>
                <Icons.DollarSign size={24} color="white" style={{ opacity: 0.8 }} />
              </View>
            </View>
          </View>
        </View>

        {/* أزرار الإجراءات */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
            onPress={() => openModal('purchase')}
          >
            <Icons.Plus size={20} color="white" />
            <Text style={styles.primaryActionButtonText}>إضافة مشتريات</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.secondaryActionButton, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={() => openModal('supplier')}
          >
            <Icons.Users size={20} color={colors.text} />
            <Text style={[styles.secondaryActionButtonText, { color: colors.text }]}>إضافة مورد</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* المحتوى الرئيسي */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icons.ShoppingCart size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>قائمة المشتريات</Text>
            </View>
          </View>
          
          <PurchasesList />
        </View>
      </ScrollView>

      {/* Modal متطور للمشتريات مطابق للويب */}
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
                {editingPurchaseId ? 'تحرير مشتريات المواد' : 'إضافة مشتريات مواد'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Icons.X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formContainer}>
                {/* اسم المادة مع AutocompleteInput */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>اسم المادة *</Text>
                  <AutocompleteInput
                    value={purchaseForm.materialName}
                    onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, materialName: text }))}
                    placeholder="أدخل اسم المادة"
                    category="materialNames"
                  />
                </View>

                {/* صف التصنيف والوحدة */}
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>التصنيف</Text>
                    <AutocompleteInput
                      value={purchaseForm.category}
                      onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, category: text }))}
                      placeholder="تصنيف المادة"
                      category="materialCategories"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>الوحدة</Text>
                    <AutocompleteInput
                      value={purchaseForm.unit}
                      onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, unit: text }))}
                      placeholder="الوحدة"
                      category="materialUnits"
                    />
                  </View>
                </View>

                {/* صف الكمية وسعر الوحدة */}
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>الكمية *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      value={purchaseForm.quantity}
                      onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, quantity: text }))}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>سعر الوحدة *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      value={purchaseForm.unitPrice}
                      onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, unitPrice: text }))}
                      placeholder="0.00"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* عرض المبلغ الإجمالي */}
                {purchaseForm.quantity && purchaseForm.unitPrice && (
                  <View style={[styles.totalAmountCard, { backgroundColor: colors.primary, opacity: 0.1 }]}>
                    <Text style={[styles.totalAmountLabel, { color: colors.text }]}>المبلغ الإجمالي</Text>
                    <Text style={[styles.totalAmountValue, { color: colors.primary }]}>
                      {formatCurrency(parseFloat(purchaseForm.quantity || '0') * parseFloat(purchaseForm.unitPrice || '0'))}
                    </Text>
                  </View>
                )}

                {/* المورد مع زر الإضافة */}
                <View style={styles.formGroup}>
                  <View style={styles.supplierHeader}>
                    <Text style={[styles.label, { color: colors.text }]}>المورد *</Text>
                    <TouchableOpacity
                      style={[styles.addSupplierButton, { backgroundColor: colors.secondary }]}
                      onPress={() => openModal('supplier')}
                    >
                      <Icons.Plus size={16} color={colors.text} />
                      <Text style={[styles.addSupplierText, { color: colors.text }]}>إضافة مورد</Text>
                    </TouchableOpacity>
                  </View>
                  <AutocompleteInput
                    value={purchaseForm.supplierName}
                    onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, supplierName: text }))}
                    placeholder="اختر أو أدخل اسم المورد"
                    category="supplierNames"
                  />
                </View>

                {/* نوع الدفع */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>نوع الدفع</Text>
                  <View style={styles.paymentTypeRow}>
                    {['نقد', 'آجل', 'بنك', 'شيك'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.paymentTypeButton,
                          {
                            backgroundColor: purchaseForm.paymentType === type ? colors.primary : colors.background,
                            borderColor: colors.border,
                          }
                        ]}
                        onPress={() => setPurchaseForm(prev => ({ ...prev, paymentType: type }))}
                      >
                        <Text style={[
                          styles.paymentTypeText,
                          { color: purchaseForm.paymentType === type ? 'white' : colors.text }
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* رقم الفاتورة */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>رقم الفاتورة</Text>
                  <AutocompleteInput
                    value={purchaseForm.invoiceNumber}
                    onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, invoiceNumber: text }))}
                    placeholder="رقم الفاتورة"
                    category="invoiceNumbers"
                  />
                </View>

                {/* صف التواريخ */}
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>تاريخ الشراء</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      value={purchaseForm.purchaseDate}
                      onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, purchaseDate: text }))}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>تاريخ الفاتورة</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      value={purchaseForm.invoiceDate}
                      onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, invoiceDate: text }))}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>

                {/* الملاحظات */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>ملاحظات</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={purchaseForm.notes}
                    onChangeText={(text) => setPurchaseForm(prev => ({ ...prev, notes: text }))}
                    placeholder="أدخل ملاحظات إضافية"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
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
                onPress={handleSavePurchase}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingPurchaseId ? 'تحديث' : 'حفظ'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal متطور للموردين */}
      <Modal
        visible={supplierModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSupplierModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة مورد جديد</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSupplierModalVisible(false)}
              >
                <Icons.X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>اسم المورد *</Text>
                  <AutocompleteInput
                    value={supplierForm.name}
                    onChangeText={(text) => setSupplierForm(prev => ({ ...prev, name: text }))}
                    placeholder="أدخل اسم المورد"
                    category="supplierNames"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>اسم المسؤول</Text>
                  <AutocompleteInput
                    value={supplierForm.contactPerson}
                    onChangeText={(text) => setSupplierForm(prev => ({ ...prev, contactPerson: text }))}
                    placeholder="اسم المسؤول"
                    category="supplierContactPersons"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>رقم الهاتف</Text>
                  <AutocompleteInput
                    value={supplierForm.phone}
                    onChangeText={(text) => setSupplierForm(prev => ({ ...prev, phone: text }))}
                    placeholder="رقم الهاتف"
                    category="supplierPhones"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>العنوان</Text>
                  <AutocompleteInput
                    value={supplierForm.address}
                    onChangeText={(text) => setSupplierForm(prev => ({ ...prev, address: text }))}
                    placeholder="العنوان"
                    category="supplierAddresses"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>شروط الدفع</Text>
                  <AutocompleteInput
                    value={supplierForm.paymentTerms}
                    onChangeText={(text) => setSupplierForm(prev => ({ ...prev, paymentTerms: text }))}
                    placeholder="شروط الدفع"
                    category="supplierPaymentTerms"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>ملاحظات</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={supplierForm.notes}
                    onChangeText={(text) => setSupplierForm(prev => ({ ...prev, notes: text }))}
                    placeholder="ملاحظات إضافية"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setSupplierModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveSupplier}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>حفظ المورد</Text>
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
  
  // Header styles مطابق للويب
  header: {
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
    textAlign: 'center',
    marginBottom: 16,
  },

  // Summary card styles مع gradients
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
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
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

  // Action buttons styles
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  primaryActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Content styles
  content: {
    flex: 1,
    padding: 16,
  },

  // Section card styles
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
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
    marginRight: 12,
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
  listItemDetails: {
    marginTop: 4,
  },
  listItemSubtitle: {
    fontSize: 12,
    marginBottom: 2,
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

  // Modal styles متطور
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
    maxHeight: '90%',
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
    maxHeight: 500,
  },

  // Form styles متطور
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
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

  // Supplier form styles
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addSupplierButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addSupplierText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Payment type styles
  paymentTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  paymentTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  paymentTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Total amount card
  totalAmountCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmountLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalAmountValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal footer styles
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
  
  // Header styles مطابق للويب
  header: {
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
    textAlign: 'center',
    marginBottom: 16,
  },

  // Summary card styles مع gradients
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
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
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

  // Action buttons styles
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  primaryActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Content styles
  content: {
    flex: 1,
    padding: 16,
  },

  // Section card styles
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
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
    marginRight: 12,
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
  listItemDetails: {
    marginTop: 4,
  },
  listItemSubtitle: {
    fontSize: 12,
    marginBottom: 2,
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

  // Modal styles متطور
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
    maxHeight: '90%',
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
    maxHeight: 500,
  },

  // Form styles متطور
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
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

  // Supplier form styles
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addSupplierButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addSupplierText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Payment type styles
  paymentTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  paymentTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  paymentTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Total amount card
  totalAmountCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmountLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalAmountValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal footer styles
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