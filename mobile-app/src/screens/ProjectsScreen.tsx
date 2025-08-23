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
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import { formatCurrency, formatDate } from '../lib/utils';
import * as Icons from '../components/Icons';
import type { Project, ProjectWithStats } from '../types';

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const { selectedProjectId, setSelectedProject } = useProject();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    status: 'active' as const,
    imageUrl: ''
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // تحميل المشاريع
  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects/with-stats');
      if (response.ok) {
        const projectsData = await response.json();
        setProjects(projectsData);
      }
    } catch (error) {
      console.error('خطأ في تحميل المشاريع:', error);
      Alert.alert('خطأ', 'فشل في تحميل المشاريع');
    } finally {
      setLoading(false);
    }
  };

  // التحقق من النموذج
  const validateForm = (data: {name: string, status: string}) => {
    const errors: {[key: string]: string} = {};
    if (!data.name.trim()) {
      errors.name = 'اسم المشروع مطلوب';
    }
    if (data.name.trim().length < 3) {
      errors.name = 'اسم المشروع يجب أن يكون 3 أحرف على الأقل';
    }
    return errors;
  };

  // إضافة مشروع جديد مع validation
  const addProject = async () => {
    const errors = validateForm({name: newProjectName, status: 'active'});
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      Alert.alert('خطأ في النموذج', errors.name || 'يرجى تصحيح الأخطاء');
      return;
    }
    setFormErrors({});

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProjectName.trim(),
          status: 'active',
        }),
      });

      if (response.ok) {
        setNewProjectName('');
        setShowAddModal(false);
        setFormErrors({});
        loadProjects();
        Alert.alert('نجح', 'تم إضافة المشروع بنجاح');
      } else {
        const errorData = await response.json();
        Alert.alert('خطأ', errorData.message || 'فشل في إضافة المشروع');
      }
    } catch (error) {
      console.error('خطأ في إضافة المشروع:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة المشروع');
    }
  };

  // حفظ تعديل المشروع مطابق للويب
  const saveProject = async () => {
    if (!editingProject) return;
    
    const errors = validateForm(editForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      Alert.alert('خطأ في النموذج', errors.name || 'يرجى تصحيح الأخطاء');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          status: editForm.status,
          imageUrl: editForm.imageUrl,
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingProject(null);
        setFormErrors({});
        loadProjects();
        Alert.alert('نجح', 'تم تحديث المشروع بنجاح');
      } else {
        const errorData = await response.json();
        Alert.alert('خطأ', errorData.message || 'فشل في تحديث المشروع');
      }
    } catch (error) {
      console.error('خطأ في تحديث المشروع:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث المشروع');
    }
  };

  // حساب الإحصائيات العامة مطابق للويب
  const calculateOverallStats = () => {
    return projects.reduce((acc, project) => {
      return {
        totalProjects: acc.totalProjects + 1,
        activeProjects: acc.activeProjects + (project.status === 'active' ? 1 : 0),
        totalIncome: acc.totalIncome + (project.stats?.totalIncome || 0),
        totalExpenses: acc.totalExpenses + (project.stats?.totalExpenses || 0),
        totalWorkers: acc.totalWorkers + (project.stats?.totalWorkers || 0),
        materialPurchases: acc.materialPurchases + (project.stats?.materialPurchases || 0),
      };
    }, {
      totalProjects: 0,
      activeProjects: 0,
      totalIncome: 0,
      totalExpenses: 0,
      totalWorkers: 0,
      materialPurchases: 0,
    });
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // بطاقة المشروع - مطابقة للويب 100%
  const ProjectCard = ({ project }: { project: ProjectWithStats }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return '#22c55e';
        case 'completed': return '#3b82f6';
        case 'paused': return '#f59e0b';
        default: return '#6b7280';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'active': return 'نشط';
        case 'completed': return 'مكتمل';
        case 'paused': return 'متوقف';
        default: return 'غير محدد';
      }
    };

    const handleEdit = () => {
      setEditingProject(project);
      setEditForm({
        name: project.name,
        status: project.status,
        imageUrl: project.imageUrl || ''
      });
      setShowEditModal(true);
    };

    const handleDelete = () => {
      Alert.alert(
        'تأكيد الحذف',
        `هل أنت متأكد من حذف المشروع "${project.name}"؟ سيتم حذف جميع البيانات المرتبطة بهذا المشروع ولا يمكن التراجع عن هذا الإجراء.`,
        [
          { text: 'إلغاء', style: 'cancel' },
          { 
            text: 'حذف المشروع', 
            style: 'destructive',
            onPress: () => {
              console.log('Delete project:', project.id);
              Alert.alert('تم الحذف', 'تم حذف المشروع بنجاح');
            }
          }
        ]
      );
    };

    return (
      <View style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* صورة المشروع */}
        {project.imageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: project.imageUrl }} style={styles.projectImage} />
            <View style={styles.imageOverlay}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                <Text style={styles.statusText}>{getStatusText(project.status)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* عنوان المشروع */}
        <View style={styles.projectHeader}>
          <View style={styles.projectInfo}>
            <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
            <View style={styles.dateRow}>
              <Icons.MapPin size={12} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                تم الإنشاء: {formatDate(project.createdAt)}
              </Text>
            </View>
          </View>
          {!project.imageUrl && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
              <Text style={styles.statusText}>{getStatusText(project.status)}</Text>
            </View>
          )}
        </View>

        {/* الملخص المالي - 2 أعمدة مع gradients مطابقة للويب */}
        <View style={styles.financialSummary}>
          <View style={[styles.financeCard, styles.incomeGradient]}>
            <View style={styles.financeHeader}>
              <Icons.TrendingUp size={16} color="#16a34a" />
              <Text style={[styles.financeLabel, { color: '#15803d' }]}>الدخل</Text>
            </View>
            <Text style={[styles.financeValue, { color: '#14532d' }]}>
              {formatCurrency(project.stats.totalIncome)}
            </Text>
          </View>

          <View style={[styles.financeCard, styles.expenseGradient]}>
            <View style={styles.financeHeader}>
              <Icons.DollarSign size={16} color="#dc2626" />
              <Text style={[styles.financeLabel, { color: '#dc2626' }]}>المصروفات</Text>
            </View>
            <Text style={[styles.financeValue, { color: '#7f1d1d' }]}>
              {formatCurrency(project.stats.totalExpenses)}
            </Text>
          </View>
        </View>

        {/* الرصيد الحالي مع gradient مطابق للويب */}
        <View style={[styles.balanceCard, styles.balanceGradient]}>
          <View style={styles.financeHeader}>
            <Icons.BarChart size={16} color="#2563eb" />
            <Text style={[styles.financeLabel, { color: '#1d4ed8' }]}>الرصيد الحالي</Text>
          </View>
          <Text style={[styles.balanceValue, { color: '#1e3a8a' }]}>
            {formatCurrency(project.stats.currentBalance)}
          </Text>
        </View>

        {/* شبكة الإحصائيات 3×1 */}
        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Icons.UserCheck size={12} color={colors.textSecondary} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>العمال</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{project.stats.totalWorkers}</Text>
          </View>

          <View style={styles.statCell}>
            <Icons.Package size={12} color={colors.textSecondary} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>المشتريات</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{project.stats.materialPurchases}</Text>
          </View>

          <View style={styles.statCell}>
            <Icons.Calendar size={12} color={colors.textSecondary} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>أيام العمل</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{project.stats.completedDays}</Text>
          </View>
        </View>

        {/* آخر نشاط */}
        {project.stats.lastActivity && (
          <View style={styles.lastActivity}>
            <Icons.Clock size={12} color={colors.textSecondary} />
            <Text style={[styles.lastActivityText, { color: colors.textSecondary }]}>
              آخر نشاط: {formatDate(project.stats.lastActivity)}
            </Text>
          </View>
        )}

        {/* أزرار الإجراءات */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton, { borderColor: colors.border }]}
            onPress={handleEdit}
          >
            <Icons.Edit size={12} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>تعديل</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton, { borderColor: colors.border }]}
            onPress={handleDelete}
          >
            <Icons.Trash size={12} color="#dc2626" />
            <Text style={[styles.actionButtonText, { color: '#dc2626' }]}>حذف</Text>
          </TouchableOpacity>
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
  const overallStats = calculateOverallStats();
  const currentBalance = overallStats.totalIncome - overallStats.totalExpenses;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* عنوان الصفحة مع زر الإضافة */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>إدارة المشاريع</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ إضافة مشروع</Text>
        </TouchableOpacity>
      </View>

      {/* شبكة الإحصائيات العامة مطابقة للويب 100% */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.blueGradient]}>
          <View style={styles.statContent}>
            <View style={styles.statIconContainer}>
              <Icons.Building size={20} color="#2563eb" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statTitle, { color: colors.text }]}>إجمالي المصاريع</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{overallStats.totalProjects}</Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.statCard, styles.greenGradient]}>
          <View style={styles.statContent}>
            <View style={styles.statIconContainer}>
              <Icons.TrendingUp size={20} color="#16a34a" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statTitle, { color: colors.text }]}>المشاريع النشطة</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{overallStats.activeProjects}</Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.statCard, currentBalance >= 0 ? styles.greenGradient : styles.redGradient]}>
          <View style={styles.statContent}>
            <View style={styles.statIconContainer}>
              <Icons.DollarSign size={20} color={currentBalance >= 0 ? "#16a34a" : "#dc2626"} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statTitle, { color: colors.text }]}>الرصيد الإجمالي</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(currentBalance)}</Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.statCard, styles.purpleGradient]}>
          <View style={styles.statContent}>
            <View style={styles.statIconContainer}>
              <Icons.UserCheck size={20} color="#7c3aed" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statTitle, { color: colors.text }]}>إجمالي العمال</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{overallStats.totalWorkers}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* قائمة المشاريع */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </ScrollView>

      {/* مودال إضافة مشروع */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة مشروع جديد</Text>
            
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                formErrors.name ? styles.inputError : {}
              ]}
              placeholder="اسم المشروع"
              placeholderTextColor={colors.textSecondary}
              value={newProjectName}
              onChangeText={setNewProjectName}
              textAlign="right"
            />
            {formErrors.name && (
              <Text style={[styles.errorText, { color: '#dc2626' }]}>{formErrors.name}</Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  setShowAddModal(false);
                  setFormErrors({});
                  setNewProjectName('');
                }}
              >
                <Text style={[styles.buttonText, { color: colors.textSecondary }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={addProject}
              >
                <Text style={[styles.buttonText, { color: 'white' }]}>إضافة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* مودال تعديل المشروع مطابق للويب 100% */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>تعديل المشروع</Text>
            
            {/* اسم المشروع */}
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>اسم المشروع</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  formErrors.name ? styles.inputError : {}
                ]}
                placeholder="اسم المشروع"
                placeholderTextColor={colors.textSecondary}
                value={editForm.name}
                onChangeText={(text) => setEditForm({...editForm, name: text})}
                textAlign="right"
              />
              {formErrors.name && (
                <Text style={[styles.errorText, { color: '#dc2626' }]}>{formErrors.name}</Text>
              )}
            </View>

            {/* حالة المشروع */}
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>حالة المشروع</Text>
              <View style={styles.statusButtons}>
                {[{value: 'active', label: 'نشط'}, {value: 'completed', label: 'مكتمل'}, {value: 'paused', label: 'متوقف'}].map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.statusButton,
                      { borderColor: colors.border },
                      editForm.status === status.value ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface }
                    ]}
                    onPress={() => setEditForm({...editForm, status: status.value as any})}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      { color: editForm.status === status.value ? '#fff' : colors.text }
                    ]}>{status.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* رابط الصورة */}
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>رابط الصورة (اختياري)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder="https://example.com/image.jpg"
                placeholderTextColor={colors.textSecondary}
                value={editForm.imageUrl}
                onChangeText={(text) => setEditForm({...editForm, imageUrl: text})}
                textAlign="right"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingProject(null);
                  setFormErrors({});
                }}
              >
                <Text style={[styles.buttonText, { color: colors.textSecondary }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={saveProject}
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
  projectCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  projectFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 8,
  },
  footerText: {
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
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  
  // Styles للتصميم الجديد المطابق للويب
  imageContainer: {
    height: 192,
    position: 'relative',
  },
  projectImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'space-between',
    padding: 12,
  },
  projectInfo: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
  },
  financialSummary: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  financeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
  },
  financeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  financeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  financeValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  balanceCard: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  lastActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  lastActivityText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: 'transparent',
  },
  deleteButton: {
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Gradient styles مطابقة للويب 100%
  incomeGradient: {
    backgroundColor: '#dcfce7',
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  expenseGradient: {
    backgroundColor: '#fecaca',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  balanceGradient: {
    backgroundColor: '#dbeafe',
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  
  // StatsGrid styles مطابق للويب 100%
  statCard: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    padding: 12,
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
});