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

interface Project {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
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
  transferDate: string;
  transferReason: string;
  transferredBy: string;
  notes?: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedDate?: string;
}

export default function ProjectTransfersScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  
  // الحالات الأساسية
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'outgoing' | 'incoming' | 'all'>('all');
  
  // البيانات
  const [projects, setProjects] = useState<Project[]>([]);
  const [transfers, setTransfers] = useState<ProjectTransfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<ProjectTransfer[]>([]);
  
  // نموذج التحويل
  const [transferForm, setTransferForm] = useState({
    fromProjectId: selectedProjectId || '',
    toProjectId: '',
    transferType: 'money' as ProjectTransfer['transferType'],
    amount: '',
    quantity: '',
    itemName: '',
    itemDescription: '',
    transferReason: '',
    transferredBy: '',
    notes: '',
  });

  // تحميل البيانات
  const loadData = async () => {
    try {
      setLoading(true);
      
      // تحميل المشاريع
      const projectsResponse = await fetch('/api/projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.filter(p => p.isActive));
      }
      
      // تحميل التحويلات
      const transfersResponse = await fetch('/api/project-transfers');
      if (transfersResponse.ok) {
        const transfersData = await transfersResponse.json();
        setTransfers(transfersData);
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

  // تطبيق فلترة التبويبات
  useEffect(() => {
    filterTransfers();
  }, [selectedTab, transfers, selectedProjectId]);

  const filterTransfers = () => {
    let filtered = [...transfers];
    
    if (selectedProjectId) {
      switch (selectedTab) {
        case 'outgoing':
          filtered = filtered.filter(t => t.fromProjectId === selectedProjectId);
          break;
        case 'incoming':
          filtered = filtered.filter(t => t.toProjectId === selectedProjectId);
          break;
        case 'all':
          filtered = filtered.filter(t => 
            t.fromProjectId === selectedProjectId || t.toProjectId === selectedProjectId
          );
          break;
      }
    }
    
    // ترتيب حسب التاريخ (الأحدث أولاً)
    filtered.sort((a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime());
    
    setFilteredTransfers(filtered);
  };

  // إضافة تحويل جديد
  const addTransfer = async () => {
    if (!transferForm.fromProjectId || !transferForm.toProjectId || !transferForm.transferReason) {
      Alert.alert('خطأ', 'يرجى ملء البيانات المطلوبة');
      return;
    }

    if (transferForm.fromProjectId === transferForm.toProjectId) {
      Alert.alert('خطأ', 'لا يمكن التحويل من نفس المشروع إلى نفسه');
      return;
    }

    // التحقق من البيانات حسب نوع التحويل
    if (transferForm.transferType === 'money' && (!transferForm.amount || parseFloat(transferForm.amount) <= 0)) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
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
          isApproved: false, // التحويلات تحتاج موافقة
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

  // الموافقة على التحويل
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
                  isApproved: true,
                  approvedBy: 'مدير المشاريع', // في التطبيق الحقيقي، ستأخذ من المستخدم المسجل دخوله
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

  // رفض التحويل
  const rejectTransfer = async (transferId: string) => {
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
              const response = await fetch(`/api/project-transfers/${transferId}`, {
                method: 'DELETE',
              });
              
              if (response.ok) {
                setTransfers(prev => prev.filter(t => t.id !== transferId));
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

  // إعادة تعيين النموذج
  const resetTransferForm = () => {
    setTransferForm({
      fromProjectId: selectedProjectId || '',
      toProjectId: '',
      transferType: 'money',
      amount: '',
      quantity: '',
      itemName: '',
      itemDescription: '',
      transferReason: '',
      transferredBy: '',
      notes: '',
    });
  };

  // تنسيق العملة
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-SA')} ر.س`;
  };

  // الحصول على اسم نوع التحويل
  const getTransferTypeName = (type: ProjectTransfer['transferType']) => {
    switch (type) {
      case 'money': return 'مالي';
      case 'materials': return 'مواد';
      case 'equipment': return 'معدات';
      case 'workers': return 'عمالة';
      default: return type;
    }
  };

  // الحصول على لون نوع التحويل
  const getTransferTypeColor = (type: ProjectTransfer['transferType']) => {
    switch (type) {
      case 'money': return colors.success;
      case 'materials': return colors.warning;
      case 'equipment': return colors.primary;
      case 'workers': return colors.secondary;
      default: return colors.textSecondary;
    }
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
      {/* عنوان الشاشة */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>تحويلات المشاريع</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={[styles.addButtonText, { color: colors.surface }]}>+ تحويل جديد</Text>
        </TouchableOpacity>
      </View>

      {/* التبويبات */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, { 
            color: selectedTab === 'all' ? colors.surface : colors.text 
          }]}>
            جميع التحويلات
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'outgoing' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedTab('outgoing')}
        >
          <Text style={[styles.tabText, { 
            color: selectedTab === 'outgoing' ? colors.surface : colors.text 
          }]}>
            صادر
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'incoming' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedTab('incoming')}
        >
          <Text style={[styles.tabText, { 
            color: selectedTab === 'incoming' ? colors.surface : colors.text 
          }]}>
            وارد
          </Text>
        </TouchableOpacity>
      </View>

      {/* قائمة التحويلات */}
      <ScrollView style={styles.content}>
        {filteredTransfers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لا توجد تحويلات
            </Text>
          </View>
        ) : (
          filteredTransfers.map((transfer) => (
            <View key={transfer.id} style={[styles.transferCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.transferHeader}>
                <View style={styles.transferInfo}>
                  <View style={styles.projectsFlow}>
                    <Text style={[styles.projectName, { color: colors.text }]}>
                      {transfer.fromProjectName}
                    </Text>
                    <Text style={[styles.arrowText, { color: colors.primary }]}>→</Text>
                    <Text style={[styles.projectName, { color: colors.text }]}>
                      {transfer.toProjectName}
                    </Text>
                  </View>
                  
                  <View style={[styles.transferTypeBadge, { backgroundColor: getTransferTypeColor(transfer.transferType) }]}>
                    <Text style={[styles.transferTypeText, { color: colors.surface }]}>
                      {getTransferTypeName(transfer.transferType)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.transferDetails}>
                {transfer.transferType === 'money' && transfer.amount && (
                  <Text style={[styles.transferAmount, { color: colors.success }]}>
                    المبلغ: {formatCurrency(transfer.amount)}
                  </Text>
                )}
                
                {['materials', 'equipment'].includes(transfer.transferType) && (
                  <View>
                    <Text style={[styles.itemName, { color: colors.text }]}>
                      {transfer.itemName} ({transfer.quantity} وحدة)
                    </Text>
                    {transfer.itemDescription && (
                      <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                        {transfer.itemDescription}
                      </Text>
                    )}
                  </View>
                )}
                
                <Text style={[styles.transferReason, { color: colors.text }]}>
                  السبب: {transfer.transferReason}
                </Text>
                
                <View style={styles.transferMeta}>
                  <Text style={[styles.transferDate, { color: colors.textSecondary }]}>
                    {new Date(transfer.transferDate).toLocaleDateString('ar-SA')}
                  </Text>
                  <Text style={[styles.transferredBy, { color: colors.textSecondary }]}>
                    بواسطة: {transfer.transferredBy}
                  </Text>
                </View>
              </View>
              
              <View style={styles.transferActions}>
                <View style={styles.approvalStatus}>
                  {transfer.isApproved ? (
                    <Text style={[styles.approvedText, { color: colors.success }]}>
                      ✓ تم التنفيذ {transfer.approvedBy && `بواسطة ${transfer.approvedBy}`}
                    </Text>
                  ) : (
                    <Text style={[styles.pendingText, { color: colors.warning }]}>
                      ⏳ في الانتظار
                    </Text>
                  )}
                </View>
                
                {!transfer.isApproved && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.approveButton, { backgroundColor: colors.success }]}
                      onPress={() => approveTransfer(transfer.id)}
                    >
                      <Text style={[styles.buttonText, { color: colors.surface }]}>موافقة</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.rejectButton, { backgroundColor: colors.error }]}
                      onPress={() => rejectTransfer(transfer.id)}
                    >
                      <Text style={[styles.buttonText, { color: colors.surface }]}>رفض</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>تحويل جديد بين المشاريع</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>من مشروع *</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={transferForm.fromProjectId}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(value) => setTransferForm(prev => ({ ...prev, fromProjectId: value }))}
                  >
                    <Picker.Item label="اختر المشروع المصدر..." value="" />
                    {projects.map((project) => (
                      <Picker.Item key={project.id} label={project.name} value={project.id} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>إلى مشروع *</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={transferForm.toProjectId}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(value) => setTransferForm(prev => ({ ...prev, toProjectId: value }))}
                  >
                    <Picker.Item label="اختر المشروع المستهدف..." value="" />
                    {projects
                      .filter(p => p.id !== transferForm.fromProjectId)
                      .map((project) => (
                        <Picker.Item key={project.id} label={project.name} value={project.id} />
                      ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>نوع التحويل</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={transferForm.transferType}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(value) => setTransferForm(prev => ({ ...prev, transferType: value }))}
                  >
                    <Picker.Item label="تحويل مالي" value="money" />
                    <Picker.Item label="تحويل مواد" value="materials" />
                    <Picker.Item label="تحويل معدات" value="equipment" />
                    <Picker.Item label="تحويل عمالة" value="workers" />
                  </Picker>
                </View>
              </View>

              {transferForm.transferType === 'money' && (
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
              )}

              {['materials', 'equipment'].includes(transferForm.transferType) && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>اسم العنصر *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={transferForm.itemName}
                      onChangeText={(text) => setTransferForm(prev => ({ ...prev, itemName: text }))}
                      placeholder="اسم المادة أو المعدة"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>الكمية *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={transferForm.quantity}
                      onChangeText={(text) => setTransferForm(prev => ({ ...prev, quantity: text }))}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>وصف العنصر</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={transferForm.itemDescription}
                      onChangeText={(text) => setTransferForm(prev => ({ ...prev, itemDescription: text }))}
                      placeholder="وصف تفصيلي (اختياري)"
                    />
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>سبب التحويل *</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={transferForm.transferReason}
                  onChangeText={(text) => setTransferForm(prev => ({ ...prev, transferReason: text }))}
                  placeholder="اذكر سبب التحويل..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>طلب التحويل من</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={transferForm.transferredBy}
                  onChangeText={(text) => setTransferForm(prev => ({ ...prev, transferredBy: text }))}
                  placeholder="اسم مقدم الطلب"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ملاحظات إضافية</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={transferForm.notes}
                  onChangeText={(text) => setTransferForm(prev => ({ ...prev, notes: text }))}
                  placeholder="ملاحظات إضافية (اختياري)"
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
                  <Text style={[styles.submitButtonText, { color: colors.surface }]}>إنشاء طلب التحويل</Text>
                )}
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
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
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
  transferCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transferHeader: {
    marginBottom: 12,
  },
  transferInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectsFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 100,
  },
  arrowText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  transferTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  transferTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  transferDetails: {
    marginBottom: 12,
  },
  transferAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    marginBottom: 4,
  },
  transferReason: {
    fontSize: 14,
    marginBottom: 8,
  },
  transferMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transferDate: {
    fontSize: 12,
  },
  transferredBy: {
    fontSize: 12,
  },
  transferActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  approvalStatus: {
    flex: 1,
  },
  approvedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rejectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonText: {
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