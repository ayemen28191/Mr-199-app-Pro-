import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import { StatsCard, StatsGrid } from '../components/StatsCard';
import { FloatingActionButton } from '../components/FloatingActionButton';
import ProjectSelector from '../components/ProjectSelector';
import QuickActions from '../components/QuickActions';
import * as Icons from '../components/Icons';
import { formatCurrency } from '../lib/utils';
import { Analytics } from '../utils/analytics';

const { width } = Dimensions.get('window');

import type { 
  Project, 
  Worker, 
  AutocompleteData as WorkerType,
  DailyExpenseSummary
} from '../types/schema';
import { DashboardStats } from '../services/api';

interface ProjectStats {
  totalWorkers: string;
  totalExpenses: number;
  totalIncome: number;
  currentBalance: number;
  activeWorkers: string;
  completedDays: string;
  materialPurchases: string;
  lastActivity: string;
}

interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { selectedProjectId, setSelectedProject } = useProject();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [workerTypes, setWorkerTypes] = useState<WorkerType[]>([]);

  // تتبع دخول المستخدم لشاشة Dashboard
  useEffect(() => {
    Analytics.logScreenView('Dashboard', {
      selected_project: selectedProjectId,
      timestamp: new Date().toISOString()
    });
  }, [selectedProjectId]);
  
  // نماذج إضافة العامل والمشروع
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAddTypeDialog, setShowAddTypeDialog] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  
  const [workerData, setWorkerData] = useState({
    name: '',
    phone: '',
    type: '',
    dailyWage: ''
  });

  const [projectData, setProjectData] = useState({
    name: '',
    status: 'active',
    description: ''
  });

  // دالة مساعدة لحفظ القيم في autocomplete_data - مطابقة للويب
  const saveAutocompleteValue = async (category: string, value: string | null | undefined) => {
    if (!value || typeof value !== 'string' || !value.trim()) return;
    try {
      const API_BASE = __DEV__ ? 'http://localhost:5000' : 'https://your-production-domain.com';
      const response = await fetch(`${API_BASE}/api/autocomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category, 
          value: value.trim() 
        })
      });
      if (!response.ok) {
        console.log(`Failed to save autocomplete value for ${category}`);
      }
    } catch (error) {
      console.log(`Failed to save autocomplete value for ${category}:`, error);
    }
  };

  // تحميل المشاريع مع الإحصائيات
  const loadProjects = useCallback(async () => {
    try {
      // استخدام عنوان API الكامل للتطبيق المحمول
      const API_BASE = __DEV__ ? 'http://localhost:5000' : 'https://your-production-domain.com';
      const response = await fetch(`${API_BASE}/api/projects/with-stats`);
      if (response.ok) {
        const projectsData = await response.json();
        setProjects(projectsData);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('خطأ في تحميل المشاريع:', error);
      Alert.alert('خطأ', 'فشل في تحميل المشاريع - تأكد من اتصال الشبكة');
    } finally {
      setLoading(false);
    }
  }, []);

  // تحميل أنواع العمال
  const loadWorkerTypes = useCallback(async () => {
    try {
      const API_BASE = __DEV__ ? 'http://localhost:5000' : 'https://your-production-domain.com';
      const response = await fetch(`${API_BASE}/api/worker-types`);
      if (response.ok) {
        const typesData = await response.json();
        setWorkerTypes(typesData);
      }
    } catch (error) {
      console.error('خطأ في تحميل أنواع العمال:', error);
    }
  }, []);

  // إضافة عامل جديد - مطابق للويب 100%
  const addWorker = async () => {
    if (!workerData.name.trim() || !workerData.type || !workerData.dailyWage) {
      Alert.alert('خطأ', 'يرجى ملء جميع البيانات المطلوبة');
      return;
    }

    const parsedWage = parseFloat(workerData.dailyWage);
    
    if (isNaN(parsedWage) || parsedWage <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح للأجر اليومي');
      return;
    }

    try {
      // حفظ القيم في autocomplete_data قبل العملية الأساسية
      await Promise.all([
        saveAutocompleteValue('workerNames', workerData.name),
        saveAutocompleteValue('workerTypes', workerData.type)
      ]);

      const API_BASE = __DEV__ ? 'http://localhost:5000' : 'https://your-production-domain.com';
      const response = await fetch(`${API_BASE}/api/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workerData.name.trim(),
          phone: workerData.phone || null,
          type: workerData.type,
          dailyWage: parsedWage.toString(),
          isActive: true,
        })
      });

      if (response.ok) {
        Alert.alert('نجح الحفظ', 'تم إضافة العامل بنجاح');
        setShowWorkerModal(false);
        setWorkerData({ name: '', phone: '', type: '', dailyWage: '' });
        loadProjects(); // إعادة تحميل للحصول على الإحصائيات المحدثة
        loadWorkerTypes(); // إعادة تحميل أنواع العمال
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'فشل في إضافة العامل');
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إضافة العامل');
    }
  };

  // إضافة مشروع جديد - مطابق للويب 100%
  const addProject = async () => {
    if (!projectData.name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المشروع');
      return;
    }

    try {
      // حفظ القيم في autocomplete_data قبل العملية الأساسية
      await Promise.all([
        saveAutocompleteValue('projectNames', projectData.name),
        saveAutocompleteValue('projectDescriptions', projectData.description)
      ]);

      const API_BASE = __DEV__ ? 'http://localhost:5000' : 'https://your-production-domain.com';
      const response = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectData.name.trim(),
          status: projectData.status,
          imageUrl: projectData.description ? projectData.description : null
        })
      });

      if (response.ok) {
        Alert.alert('نجح الحفظ', 'تم إضافة المشروع بنجاح');
        setShowProjectModal(false);
        setProjectData({ name: '', status: 'active', description: '' });
        loadProjects();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'فشل في إضافة المشروع');
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إضافة المشروع');
    }
  };

  // إضافة نوع عامل جديد - مطابق للويب 100%
  const addWorkerType = async () => {
    if (!newTypeName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم نوع العامل');
      return;
    }

    try {
      // حفظ قيم أنواع العمال في autocomplete_data
      await saveAutocompleteValue('workerTypes', newTypeName.trim());
      
      const API_BASE = __DEV__ ? 'http://localhost:5000' : 'https://your-production-domain.com';
      const response = await fetch(`${API_BASE}/api/worker-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTypeName.trim() })
      });

      if (response.ok) {
        const newType = await response.json();
        Alert.alert('تم الحفظ', 'تم إضافة نوع العامل بنجاح');
        setWorkerData({...workerData, type: newType.name});
        setNewTypeName('');
        setShowAddTypeDialog(false);
        loadWorkerTypes();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'فشل في إضافة نوع العامل');
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إضافة نوع العامل');
    }
  };

  useEffect(() => {
    loadProjects();
    loadWorkerTypes();
  }, [loadProjects, loadWorkerTypes]);

  // حساب الإحصائيات العامة
  const generalStats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalIncome: projects.reduce((sum, p) => sum + p.stats.totalIncome, 0),
    totalExpenses: projects.reduce((sum, p) => sum + p.stats.totalExpenses, 0),
    currentBalance: projects.reduce((sum, p) => sum + p.stats.currentBalance, 0),
    totalWorkers: projects.reduce((sum, p) => sum + parseInt(p.stats.totalWorkers), 0),
    activeWorkers: projects.reduce((sum, p) => sum + parseInt(p.stats.activeWorkers), 0),
  };

  // إعدادات الزر العائم
  const floatingActions = [
    {
      icon: <Icons.User size={24} color="#ffffff" />,
      label: 'إضافة عامل',
      onPress: () => setShowWorkerModal(true),
      color: colors.success,
    },
    {
      icon: <Icons.FolderPlus size={24} color="#ffffff" />,
      label: 'إضافة مشروع',
      onPress: () => setShowProjectModal(true),
      color: colors.primary,
    },
  ];

  // بطاقة المشروع مطابقة للويب
  const ProjectCard = ({ project }: { project: ProjectWithStats }) => (
    <TouchableOpacity
      style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => setSelectedProject(project.id, project.name)}
    >
      <View style={styles.projectHeader}>
        <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
        <View style={[styles.statusBadge, { 
          backgroundColor: project.status === 'active' ? colors.success : 
                          project.status === 'completed' ? colors.primary : colors.warning 
        }]}>
          <Text style={styles.statusText}>
            {project.status === 'active' ? 'نشط' : 
             project.status === 'completed' ? 'مكتمل' : 'متوقف'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {project.stats.currentBalance.toLocaleString('ar-SA')} ر.س
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>الرصيد الحالي</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.success }]}>
            {project.stats.totalWorkers}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>العمال</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.warning }]}>
            {project.stats.completedDays}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>الأيام</Text>
        </View>
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* اختيار المشروع - مطابق للويب */}
        <ProjectSelector
          selectedProjectId={selectedProjectId}
          onProjectChange={(projectId, projectName) => setSelectedProject(projectId, projectName)}
          projects={projects}
        />

        {/* إحصائيات المشروع المحدد - مطابق للويب */}
        {selectedProjectId && (() => {
          const selectedProject = projects.find(p => p.id === selectedProjectId);
          return selectedProject && (
          <View style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.projectHeader}>
              <Text style={[styles.projectTitle, { color: colors.text }]}>{selectedProject.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                <Text style={styles.statusText}>نشط</Text>
              </View>
            </View>

            {/* إحصائيات المشروع مع gradients متقدمة مطابقة للويب 100% */}
            <View style={styles.statsGridContainer}>
              {/* التوريد - أزرق */}
              <View style={[styles.statCardAdvanced, styles.gradientBlue]}>
                <View style={styles.statContent}>
                  <View style={styles.statIconContainer}>
                    <Icons.TrendingUp size={20} color="white" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statValueAdvanced}>
                      {formatCurrency(selectedProject.stats?.totalIncome || 0)}
                    </Text>
                    <Text style={styles.statLabelAdvanced}>إجمالي التوريد</Text>
                  </View>
                </View>
              </View>

              {/* المنصرف - أحمر */}
              <View style={[styles.statCardAdvanced, styles.gradientRed]}>
                <View style={styles.statContent}>
                  <View style={styles.statIconContainer}>
                    <Icons.TrendingDown size={20} color="white" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statValueAdvanced}>
                      {formatCurrency(selectedProject.stats?.totalExpenses || 0)}
                    </Text>
                    <Text style={styles.statLabelAdvanced}>إجمالي المنصرف</Text>
                  </View>
                </View>
              </View>

              {/* الرصيد الحالي - أخضر */}
              <View style={[styles.statCardAdvanced, styles.gradientGreen]}>
                <View style={styles.statContent}>
                  <View style={styles.statIconContainer}>
                    <Icons.DollarSign size={20} color="white" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statValueAdvanced}>
                      {formatCurrency(selectedProject.stats?.currentBalance || 0)}
                    </Text>
                    <Text style={styles.statLabelAdvanced}>المتبقي الحالي</Text>
                  </View>
                </View>
              </View>

              {/* العمال النشطين - بنفسجي */}
              <View style={[styles.statCardAdvanced, styles.gradientPurple]}>
                <View style={styles.statContent}>
                  <View style={styles.statIconContainer}>
                    <Icons.UserCheck size={20} color="white" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statValueAdvanced}>
                      {selectedProject.stats?.activeWorkers || "0"}
                    </Text>
                    <Text style={styles.statLabelAdvanced}>العمال النشطين</Text>
                  </View>
                </View>
              </View>

              {/* أيام العمل - كحلي */}
              <View style={[styles.statCardAdvanced, styles.gradientTeal]}>
                <View style={styles.statContent}>
                  <View style={styles.statIconContainer}>
                    <Icons.Calendar size={20} color="white" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statValueAdvanced}>
                      {selectedProject.stats?.completedDays || "0"}
                    </Text>
                    <Text style={styles.statLabelAdvanced}>أيام العمل المكتملة</Text>
                  </View>
                </View>
              </View>

              {/* مشتريات المواد - زهري */}
              <View style={[styles.statCardAdvanced, styles.gradientIndigo]}>
                <View style={styles.statContent}>
                  <View style={styles.statIconContainer}>
                    <Icons.Package size={20} color="white" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statValueAdvanced}>
                      {selectedProject.stats?.materialPurchases || "0"}
                    </Text>
                    <Text style={styles.statLabelAdvanced}>مشتريات المواد</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )})()}

        {/* الإجراءات السريعة - مطابق للويب */}
        <QuickActions onNavigate={(route) => console.log('Navigate to:', route)} />

        {/* مساحة إضافية للزر العائم */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* الزر العائم مطابق للويب */}
      <FloatingActionButton actions={floatingActions} />

      {/* نموذج إضافة عامل */}
      <Modal
        visible={showWorkerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWorkerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة عامل جديد</Text>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="اسم العامل"
              value={workerData.name}
              onChangeText={(text: string) => setWorkerData({...workerData, name: text})}
            />
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="رقم الهاتف (اختياري)"
              value={workerData.phone}
              onChangeText={(text: string) => setWorkerData({...workerData, phone: text})}
            />
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="نوع العمل"
              value={workerData.type}
              onChangeText={(text: string) => setWorkerData({...workerData, type: text})}
            />
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="الأجر اليومي"
              value={workerData.dailyWage}
              onChangeText={(text: string) => setWorkerData({...workerData, dailyWage: text})}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={addWorker}
              >
                <Text style={styles.buttonText}>حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.border }]}
                onPress={() => setShowWorkerModal(false)}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* نموذج إضافة مشروع */}
      <Modal
        visible={showProjectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة مشروع جديد</Text>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="اسم المشروع"
              value={projectData.name}
              onChangeText={(text: string) => setProjectData({...projectData, name: text})}
            />
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="وصف المشروع (اختياري)"
              value={projectData.description}
              onChangeText={(text: string) => setProjectData({...projectData, description: text})}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={addProject}
              >
                <Text style={styles.buttonText}>حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.border }]}
                onPress={() => setShowProjectModal(false)}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>إلغاء</Text>
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
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'right',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  projectCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -6,
  },
  
  // Styles جديدة للـ Dashboard مطابقة للويب
  statsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 12,
  },
  statCardAdvanced: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  gradientBlue: {
    backgroundColor: '#3b82f6',
  },
  gradientRed: {
    backgroundColor: '#ef4444',
  },
  gradientGreen: {
    backgroundColor: '#22c55e',
  },
  gradientPurple: {
    backgroundColor: '#8b5cf6',
  },
  gradientTeal: {
    backgroundColor: '#0d9488',
  },
  gradientIndigo: {
    backgroundColor: '#4338ca',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValueAdvanced: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  statLabelAdvanced: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});