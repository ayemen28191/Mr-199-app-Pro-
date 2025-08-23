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
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import { formatCurrency, formatDate } from '../lib/utils';
import * as Icons from '../components/Icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import type { 
  Project
} from '../types/schema';

// مخطط التحقق للمشروع
const insertProjectSchema = z.object({
  name: z.string().min(3, 'اسم المشروع يجب أن يكون 3 أحرف على الأقل'),
  status: z.enum(['active', 'completed', 'paused']).default('active'),
  imageUrl: z.string().optional().default(''),
});

type InsertProject = z.infer<typeof insertProjectSchema>;

// استخدام الأنواع الموحدة من shared/schema
interface ProjectStats {
  totalWorkers: number;
  totalExpenses: number;
  totalIncome: number;
  currentBalance: number;
  activeWorkers: number;
  completedDays: number;
  materialPurchases: number;
  lastActivity: string;
}

interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

const ProjectCard = ({ 
  project, 
  onEdit, 
  onDelete, 
  isSelected, 
  onSelect 
}: {
  project: ProjectWithStats;
  onEdit: (project: ProjectWithStats) => void;
  onDelete: (projectId: string) => void;
  isSelected: boolean;
  onSelect: (project: ProjectWithStats) => void;
}) => {
  const { colors } = useTheme();
  
  // حساب النسب المالية
  const financialPercentage = project.stats.totalIncome > 0 
    ? ((project.stats.currentBalance / project.stats.totalIncome) * 100)
    : 0;

  return (
    <TouchableOpacity 
      style={[
        styles.projectCard,
        { 
          backgroundColor: colors.background,
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: isSelected ? 2 : 1,
        }
      ]}
      onPress={() => onSelect(project)}
    >
      {/* صورة المشروع مع overlay */}
      <View style={styles.projectImageContainer}>
        {project.imageUrl ? (
          <Image source={{ uri: project.imageUrl }} style={styles.projectImage} />
        ) : (
          <View style={[styles.projectImagePlaceholder, { backgroundColor: colors.muted }]}>
            <Icons.Building2 size={40} color={colors.textSecondary} />
          </View>
        )}
        
        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          { 
            backgroundColor: project.status === 'active' ? '#10b981' : 
                             project.status === 'completed' ? '#3b82f6' : '#f59e0b'
          }
        ]}>
          <Text style={styles.statusText}>
            {project.status === 'active' ? 'نشط' : 
             project.status === 'completed' ? 'مكتمل' : 'متوقف'}
          </Text>
        </View>
      </View>

      {/* معلومات المشروع */}
      <View style={styles.projectContent}>
        <View style={styles.projectHeader}>
          <Text style={[styles.projectTitle, { color: colors.text }]}>
            {project.name}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
              onPress={() => onEdit(project)}
            >
              <Icons.Edit size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#ef4444' + '20' }]}
              onPress={() => onDelete(project.id)}
            >
              <Icons.Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* إحصائيات مالية في بطاقات ملونة */}
        <View style={styles.financialCards}>
          <View style={[styles.financialCard, { backgroundColor: '#10b981' + '15' }]}>
            <Icons.TrendingUp size={16} color="#10b981" />
            <View style={styles.financialCardContent}>
              <Text style={[styles.financialCardLabel, { color: '#065f46' }]}>الإيرادات</Text>
              <Text style={[styles.financialCardValue, { color: '#065f46' }]}>
                {formatCurrency(project.stats.totalIncome)}
              </Text>
            </View>
          </View>
          
          <View style={[styles.financialCard, { backgroundColor: '#ef4444' + '15' }]}>
            <Icons.TrendingDown size={16} color="#ef4444" />
            <View style={styles.financialCardContent}>
              <Text style={[styles.financialCardLabel, { color: '#991b1b' }]}>المصاريف</Text>
              <Text style={[styles.financialCardValue, { color: '#991b1b' }]}>
                {formatCurrency(project.stats.totalExpenses)}
              </Text>
            </View>
          </View>
          
          <View style={[styles.financialCard, { backgroundColor: colors.primary + '15' }]}>
            <Icons.DollarSign size={16} color={colors.primary} />
            <View style={styles.financialCardContent}>
              <Text style={[styles.financialCardLabel, { color: colors.primary }]}>الرصيد</Text>
              <Text style={[styles.financialCardValue, { color: colors.primary }]}>
                {formatCurrency(project.stats.currentBalance)}
              </Text>
            </View>
          </View>
        </View>

        {/* شبكة إحصائيات 3×1 مطابقة للويب */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Icons.Users size={18} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {project.stats.totalWorkers}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>العمال</Text>
          </View>
          
          <View style={styles.statItem}>
            <Icons.Package size={18} color="#10b981" />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {project.stats.materialPurchases}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>المشتريات</Text>
          </View>
          
          <View style={styles.statItem}>
            <Icons.Calendar size={18} color="#f59e0b" />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {project.stats.completedDays}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>أيام العمل</Text>
          </View>
        </View>

        {/* آخر نشاط */}
        <View style={styles.lastActivity}>
          <Icons.Clock size={14} color={colors.textSecondary} />
          <Text style={[styles.lastActivityText, { color: colors.textSecondary }]}>
            آخر نشاط: {formatDate(project.stats.lastActivity)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const { selectedProjectId, setSelectedProject } = useProject();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null);

  // أشكال React Hook Form مطابقة للويب
  const createForm = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: '',
      status: 'active',
      imageUrl: '',
    },
  });

  const editForm = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: '',
      status: 'active',
      imageUrl: '',
    },
  });

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

  // إضافة مشروع جديد مع React Hook Form
  const onCreateSubmit = async (data: InsertProject) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        createForm.reset();
        setShowAddModal(false);
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

  // تحديث مشروع مع React Hook Form
  const onEditSubmit = async (data: InsertProject) => {
    if (!editingProject) return;
    
    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        editForm.reset();
        setEditingProject(null);
        setShowEditModal(false);
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

  // حذف مشروع مع تأكيد
  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    Alert.alert(
      'حذف المشروع',
      `هل أنت متأكد من حذف المشروع "${project?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                loadProjects();
                Alert.alert('نجح', 'تم حذف المشروع بنجاح');
              } else {
                Alert.alert('خطأ', 'فشل في حذف المشروع');
              }
            } catch (error) {
              console.error('خطأ في حذف المشروع:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف المشروع');
            }
          }
        }
      ]
    );
  };

  // تحديد مشروع
  const handleSelectProject = (project: ProjectWithStats) => {
    setSelectedProject(project.id, project.name);
  };

  // فتح نموذج التعديل
  const handleEditProject = (project: ProjectWithStats) => {
    setEditingProject(project);
    editForm.reset({
      name: project.name,
      status: project.status,
      imageUrl: project.imageUrl || '',
    });
    setShowEditModal(true);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري تحميل المشاريع...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>المشاريع</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Icons.Plus size={20} color="white" />
          <Text style={styles.addButtonText}>إضافة مشروع</Text>
        </TouchableOpacity>
      </View>

      {/* قائمة المشاريع */}
      <ScrollView style={styles.projectsList} showsVerticalScrollIndicator={false}>
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Icons.Building2 size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              لا توجد مشاريع حتى الآن
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
              ابدأ بإضافة مشروع جديد
            </Text>
          </View>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              isSelected={selectedProjectId === project.id}
              onSelect={handleSelectProject}
            />
          ))
        )}
      </ScrollView>

      {/* نموذج إضافة مشروع */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة مشروع جديد</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Icons.X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Controller
              control={createForm.control}
              name="name"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>اسم المشروع</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { 
                        backgroundColor: colors.background,
                        borderColor: error ? '#ef4444' : colors.border,
                        color: colors.text
                      }
                    ]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="أدخل اسم المشروع"
                    placeholderTextColor={colors.textSecondary}
                  />
                  {error && (
                    <Text style={styles.errorText}>{error.message}</Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={createForm.control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>حالة المشروع</Text>
                  <View style={styles.statusSelector}>
                    {(['active', 'completed', 'paused'] as const).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusOption,
                          {
                            backgroundColor: value === status ? colors.primary : colors.background,
                            borderColor: colors.border
                          }
                        ]}
                        onPress={() => onChange(status)}
                      >
                        <Text style={[
                          styles.statusOptionText,
                          { color: value === status ? 'white' : colors.text }
                        ]}>
                          {status === 'active' ? 'نشط' : 
                           status === 'completed' ? 'مكتمل' : 'متوقف'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={createForm.handleSubmit(onCreateSubmit)}
              >
                <Text style={styles.submitButtonText}>إضافة المشروع</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* نموذج تعديل مشروع */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>تعديل المشروع</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Icons.X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Controller
              control={editForm.control}
              name="name"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>اسم المشروع</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { 
                        backgroundColor: colors.background,
                        borderColor: error ? '#ef4444' : colors.border,
                        color: colors.text
                      }
                    ]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="أدخل اسم المشروع"
                    placeholderTextColor={colors.textSecondary}
                  />
                  {error && (
                    <Text style={styles.errorText}>{error.message}</Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={editForm.control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>حالة المشروع</Text>
                  <View style={styles.statusSelector}>
                    {(['active', 'completed', 'paused'] as const).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusOption,
                          {
                            backgroundColor: value === status ? colors.primary : colors.background,
                            borderColor: colors.border
                          }
                        ]}
                        onPress={() => onChange(status)}
                      >
                        <Text style={[
                          styles.statusOptionText,
                          { color: value === status ? 'white' : colors.text }
                        ]}>
                          {status === 'active' ? 'نشط' : 
                           status === 'completed' ? 'مكتمل' : 'متوقف'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={editForm.handleSubmit(onEditSubmit)}
              >
                <Text style={styles.submitButtonText}>حفظ التغييرات</Text>
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
  centered: {
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  projectsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  projectCard: {
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  projectImageContainer: {
    position: 'relative',
    height: 120,
  },
  projectImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  projectImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  projectContent: {
    padding: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  actionButtons: {
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
  financialCards: {
    gap: 8,
    marginBottom: 16,
  },
  financialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  financialCardContent: {
    flex: 1,
  },
  financialCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  financialCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  lastActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastActivityText: {
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'right',
  },
  statusSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});