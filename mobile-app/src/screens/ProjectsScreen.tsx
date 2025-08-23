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
import { useProject } from '../context/ProjectContext';
import type { Project, ProjectWithStats } from '../types';

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const { selectedProjectId, setSelectedProject } = useProject();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

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

  // إضافة مشروع جديد
  const addProject = async () => {
    if (!newProjectName.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المشروع');
      return;
    }

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
        loadProjects();
        Alert.alert('نجح', 'تم إضافة المشروع بنجاح');
      } else {
        Alert.alert('خطأ', 'فشل في إضافة المشروع');
      }
    } catch (error) {
      console.error('خطأ في إضافة المشروع:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة المشروع');
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // بطاقة المشروع
  const ProjectCard = ({ project }: { project: ProjectWithStats }) => (
    <TouchableOpacity
      style={[
        styles.projectCard,
        {
          backgroundColor: colors.surface,
          borderColor: selectedProjectId === project.id ? colors.primary : colors.border,
          borderWidth: selectedProjectId === project.id ? 2 : 1,
        }
      ]}
      onPress={() => {
        setSelectedProject(project.id, project.name);
        Alert.alert('تم الاختيار', `تم اختيار مشروع: ${project.name}`);
      }}
    >
      <View style={styles.projectHeader}>
        <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
        <View style={[styles.statusBadge, { 
          backgroundColor: project.status === 'active' ? colors.success : colors.warning 
        }]}>
          <Text style={styles.statusText}>
            {project.status === 'active' ? 'نشط' : project.status === 'completed' ? 'مكتمل' : 'متوقف'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {project.stats.currentBalance.toLocaleString('ar-SA')}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>الرصيد</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.success }]}>
            {project.stats.totalIncome.toLocaleString('ar-SA')}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>الدخل</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.error }]}>
            {project.stats.totalExpenses.toLocaleString('ar-SA')}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>المصاريف</Text>
        </View>
      </View>

      <View style={styles.projectFooter}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          العمال: {project.stats.totalWorkers} | الأيام: {project.stats.completedDays}
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
        <Text style={[styles.title, { color: colors.text }]}>إدارة المشاريع</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ إضافة مشروع</Text>
        </TouchableOpacity>
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
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="اسم المشروع"
              placeholderTextColor={colors.textSecondary}
              value={newProjectName}
              onChangeText={setNewProjectName}
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
                onPress={addProject}
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
  projectCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
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
});