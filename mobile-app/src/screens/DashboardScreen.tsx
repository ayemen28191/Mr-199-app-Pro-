import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import supabase from '../services/supabaseClient';
import type { ProjectWithStats } from '../types';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  // تحميل المشاريع مع الإحصائيات
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

  useEffect(() => {
    loadProjects();
  }, []);

  // بطاقة الإحصائيات
  const StatCard = ({ title, value, color }: { title: string; value: string | number; color: string }) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );

  // بطاقة المشروع
  const ProjectCard = ({ project }: { project: ProjectWithStats }) => (
    <TouchableOpacity
      style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* الإحصائيات العامة */}
      <View style={styles.statsContainer}>
        <StatCard
          title="إجمالي المشاريع"
          value={projects.length}
          color={colors.primary}
        />
        <StatCard
          title="المشاريع النشطة"
          value={projects.filter(p => p.status === 'active').length}
          color={colors.success}
        />
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          title="إجمالي الدخل"
          value={`${projects.reduce((sum, p) => sum + p.stats.totalIncome, 0).toLocaleString('ar-SA')} ر.س`}
          color={colors.success}
        />
        <StatCard
          title="إجمالي المصاريف"
          value={`${projects.reduce((sum, p) => sum + p.stats.totalExpenses, 0).toLocaleString('ar-SA')} ر.س`}
          color={colors.error}
        />
      </View>

      {/* المشاريع */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>المشاريع</Text>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
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
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});