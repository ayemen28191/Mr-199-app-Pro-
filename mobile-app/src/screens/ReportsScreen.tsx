import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Picker,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';

interface ReportSummary {
  totalProjects: number;
  activeProjects: number;
  totalWorkers: number;
  activeWorkers: number;
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  totalPurchases: number;
  totalEquipment: number;
}

interface ProjectReport {
  id: string;
  name: string;
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  totalWorkers: string;
  completedDays: string;
  materialPurchases: string;
  lastActivity: string;
}

interface WorkerReport {
  id: string;
  name: string;
  type: string;
  totalDays: number;
  totalEarnings: number;
  averageDailyWage: number;
  lastWorkDate: string;
}

export default function ReportsScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  
  // الحالات الأساسية
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<'summary' | 'projects' | 'workers' | 'expenses'>('summary');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  
  // البيانات
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [projectReports, setProjectReports] = useState<ProjectReport[]>([]);
  const [workerReports, setWorkerReports] = useState<WorkerReport[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);

  // تحميل البيانات حسب نوع التقرير
  const loadReportData = async () => {
    try {
      setLoading(true);
      
      switch (selectedReport) {
        case 'summary':
          await loadSummaryReport();
          break;
        case 'projects':
          await loadProjectsReport();
          break;
        case 'workers':
          await loadWorkersReport();
          break;
        case 'expenses':
          await loadExpensesReport();
          break;
      }
    } catch (error) {
      console.error('خطأ في تحميل التقرير:', error);
      Alert.alert('خطأ', 'فشل في تحميل بيانات التقرير');
    } finally {
      setLoading(false);
    }
  };

  // تحميل تقرير الملخص العام
  const loadSummaryReport = async () => {
    try {
      const response = await fetch(`/api/reports/summary?range=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('خطأ في تحميل تقرير الملخص:', error);
    }
  };

  // تحميل تقرير المشاريع
  const loadProjectsReport = async () => {
    try {
      const response = await fetch(`/api/reports/projects?range=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setProjectReports(data);
      }
    } catch (error) {
      console.error('خطأ في تحميل تقرير المشاريع:', error);
    }
  };

  // تحميل تقرير العمال
  const loadWorkersReport = async () => {
    try {
      const response = await fetch(`/api/reports/workers?range=${dateRange}&projectId=${selectedProjectId || ''}`);
      if (response.ok) {
        const data = await response.json();
        setWorkerReports(data);
      }
    } catch (error) {
      console.error('خطأ في تحميل تقرير العمال:', error);
    }
  };

  // تحميل تقرير المصاريف
  const loadExpensesReport = async () => {
    try {
      const response = await fetch(`/api/reports/expenses?range=${dateRange}&projectId=${selectedProjectId || ''}`);
      if (response.ok) {
        const data = await response.json();
        setExpensesByCategory(data);
      }
    } catch (error) {
      console.error('خطأ في تحميل تقرير المصاريف:', error);
    }
  };

  // تصدير التقرير
  const exportReport = async (format: 'excel' | 'pdf') => {
    try {
      Alert.alert('جاري التصدير', `جاري تصدير التقرير بتنسيق ${format.toUpperCase()}...`);
      
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: selectedReport,
          dateRange: dateRange,
          format: format,
          projectId: selectedProjectId,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        // في التطبيق الحقيقي، ستحتاج لمكتبة مثل react-native-fs لحفظ الملف
        Alert.alert('نجح التصدير', `تم تصدير التقرير بنجاح`);
      } else {
        throw new Error('فشل في التصدير');
      }
    } catch (error) {
      console.error('خطأ في تصدير التقرير:', error);
      Alert.alert('خطأ', 'فشل في تصدير التقرير');
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedReport, dateRange, selectedProjectId]);

  // تنسيق العملة
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-SA')} ر.س`;
  };

  // رندر بطاقة الإحصائية
  const StatCard = ({ title, value, color, suffix = '' }: { 
    title: string; 
    value: string | number; 
    color: string; 
    suffix?: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}{suffix}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري تحميل التقرير...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* عنوان الشاشة */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>التقارير</Text>
        <View style={styles.exportButtons}>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: colors.success }]}
            onPress={() => exportReport('excel')}
          >
            <Text style={[styles.exportButtonText, { color: colors.surface }]}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: colors.error }]}
            onPress={() => exportReport('pdf')}
          >
            <Text style={[styles.exportButtonText, { color: colors.surface }]}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* فلاتر التقرير */}
      <View style={styles.filters}>
        <View style={[styles.filterGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>نوع التقرير</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Picker
              selectedValue={selectedReport}
              style={[styles.picker, { color: colors.text }]}
              onValueChange={(value) => setSelectedReport(value)}
            >
              <Picker.Item label="الملخص العام" value="summary" />
              <Picker.Item label="تقرير المشاريع" value="projects" />
              <Picker.Item label="تقرير العمال" value="workers" />
              <Picker.Item label="تقرير المصاريف" value="expenses" />
            </Picker>
          </View>
        </View>

        <View style={[styles.filterGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>الفترة الزمنية</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Picker
              selectedValue={dateRange}
              style={[styles.picker, { color: colors.text }]}
              onValueChange={(value) => setDateRange(value)}
            >
              <Picker.Item label="اليوم" value="today" />
              <Picker.Item label="الأسبوع" value="week" />
              <Picker.Item label="الشهر" value="month" />
              <Picker.Item label="السنة" value="year" />
              <Picker.Item label="جميع البيانات" value="all" />
            </Picker>
          </View>
        </View>
      </View>

      {/* محتوى التقرير */}
      <ScrollView style={styles.content}>
        {selectedReport === 'summary' && summary && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>الملخص العام</Text>
            
            <View style={styles.statsGrid}>
              <StatCard
                title="إجمالي المشاريع"
                value={summary.totalProjects}
                color={colors.primary}
              />
              <StatCard
                title="المشاريع النشطة"
                value={summary.activeProjects}
                color={colors.success}
              />
              <StatCard
                title="إجمالي العمال"
                value={summary.totalWorkers}
                color={colors.warning}
              />
              <StatCard
                title="العمال النشطين"
                value={summary.activeWorkers}
                color={colors.success}
              />
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                title="إجمالي الدخل"
                value={formatCurrency(summary.totalIncome)}
                color={colors.success}
              />
              <StatCard
                title="إجمالي المصاريف"
                value={formatCurrency(summary.totalExpenses)}
                color={colors.error}
              />
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                title="الرصيد الحالي"
                value={formatCurrency(summary.currentBalance)}
                color={summary.currentBalance >= 0 ? colors.success : colors.error}
              />
              <StatCard
                title="المشتريات"
                value={summary.totalPurchases}
                color={colors.primary}
              />
            </View>
          </View>
        )}

        {selectedReport === 'projects' && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>تقرير المشاريع</Text>
            
            {projectReports.map((project) => (
              <View key={project.id} style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{project.name}</Text>
                
                <View style={styles.cardStats}>
                  <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>إجمالي الدخل:</Text>
                    <Text style={[styles.statValue, { color: colors.success }]}>
                      {formatCurrency(project.totalIncome)}
                    </Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>إجمالي المصاريف:</Text>
                    <Text style={[styles.statValue, { color: colors.error }]}>
                      {formatCurrency(project.totalExpenses)}
                    </Text>
                  </View>
                  
                  <View style={[styles.statRow, styles.totalRow]}>
                    <Text style={[styles.statLabel, styles.totalLabel, { color: colors.text }]}>الرصيد الحالي:</Text>
                    <Text style={[styles.statValue, styles.totalValue, { 
                      color: project.currentBalance >= 0 ? colors.success : colors.error 
                    }]}>
                      {formatCurrency(project.currentBalance)}
                    </Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>إجمالي العمال:</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{project.totalWorkers}</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>الأيام المكتملة:</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{project.completedDays}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedReport === 'workers' && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>تقرير العمال</Text>
            
            {workerReports.map((worker) => (
              <View key={worker.id} style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.workerCardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{worker.name}</Text>
                  <Text style={[styles.workerType, { color: colors.textSecondary }]}>{worker.type}</Text>
                </View>
                
                <View style={styles.cardStats}>
                  <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>إجمالي أيام العمل:</Text>
                    <Text style={[styles.statValue, { color: colors.primary }]}>{worker.totalDays} يوم</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>إجمالي الأرباح:</Text>
                    <Text style={[styles.statValue, { color: colors.success }]}>
                      {formatCurrency(worker.totalEarnings)}
                    </Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>متوسط الأجر اليومي:</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {formatCurrency(worker.averageDailyWage)}
                    </Text>
                  </View>
                  
                  {worker.lastWorkDate && (
                    <View style={styles.statRow}>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>آخر يوم عمل:</Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {new Date(worker.lastWorkDate).toLocaleDateString('ar-SA')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedReport === 'expenses' && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>تقرير المصاريف بالتصنيفات</Text>
            
            {expensesByCategory.map((category, index) => (
              <View key={index} style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{category.name}</Text>
                
                <View style={styles.cardStats}>
                  <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>إجمالي المبلغ:</Text>
                    <Text style={[styles.statValue, { color: colors.error }]}>
                      {formatCurrency(category.totalAmount)}
                    </Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>عدد العمليات:</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{category.count}</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>متوسط المبلغ:</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {formatCurrency(category.averageAmount)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  exportButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  reportCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    flex: 1,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  workerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerType: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});