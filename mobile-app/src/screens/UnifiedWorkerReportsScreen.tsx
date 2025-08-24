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
  TextInput,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';

interface WorkerUnifiedReport {
  workerId: string;
  workerName: string;
  workerType: string;
  dailyWage: number;
  totalWorkDays: number;
  totalEarnings: number;
  totalPaidAmount: number;
  totalTransfers: number;
  totalMiscExpenses: number;
  currentBalance: number;
  lastWorkDate?: string;
  lastPaymentDate?: string;
  averageWorkDaysPerWeek: number;
  workEfficiencyRating: number;
}

interface ProjectSummary {
  totalWorkers: number;
  activeWorkers: number;
  totalWorkDays: number;
  totalEarnings: number;
  totalPaidAmount: number;
  totalTransfers: number;
  totalMiscExpenses: number;
  totalBalance: number;
}

export default function UnifiedWorkerReportsScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  
  // الحالات الأساسية
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
  const [selectedWorkerType, setSelectedWorkerType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'earnings' | 'days' | 'balance'>('earnings');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // البيانات
  const [workerReports, setWorkerReports] = useState<WorkerUnifiedReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<WorkerUnifiedReport[]>([]);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [workerTypes, setWorkerTypes] = useState<string[]>([]);

  // تحميل البيانات
  const loadData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        projectId: selectedProjectId || '',
        period: selectedPeriod,
        workerType: selectedWorkerType === 'all' ? '' : selectedWorkerType,
      });
      
      // تحميل التقارير الموحدة للعمال
      const reportsResponse = await fetch(`/api/worker-unified-reports?${params}`);
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setWorkerReports(reportsData.reports);
        setProjectSummary(reportsData.summary);
        
        // استخراج أنواع العمال
        const types = [...new Set(reportsData.reports.map((r: WorkerUnifiedReport) => r.workerType))];
        setWorkerTypes(types);
      }
      
    } catch (error) {
      console.error('خطأ في تحميل التقارير:', error);
      Alert.alert('خطأ', 'فشل في تحميل التقارير');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId, selectedPeriod, selectedWorkerType]);

  // تطبيق الفلاتر والترتيب
  useEffect(() => {
    applyFiltersAndSorting();
  }, [workerReports, searchQuery, sortBy, sortOrder]);

  const applyFiltersAndSorting = () => {
    let filtered = [...workerReports];
    
    // فلترة بالبحث
    if (searchQuery.trim()) {
      filtered = filtered.filter(report => 
        report.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.workerType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // ترتيب البيانات
    filtered.sort((a, b) => {
      let valueA: number;
      let valueB: number;
      
      switch (sortBy) {
        case 'name':
          return sortOrder === 'asc' 
            ? a.workerName.localeCompare(b.workerName, 'ar')
            : b.workerName.localeCompare(a.workerName, 'ar');
        case 'earnings':
          valueA = a.totalEarnings;
          valueB = b.totalEarnings;
          break;
        case 'days':
          valueA = a.totalWorkDays;
          valueB = b.totalWorkDays;
          break;
        case 'balance':
          valueA = a.currentBalance;
          valueB = b.currentBalance;
          break;
        default:
          valueA = a.totalEarnings;
          valueB = b.totalEarnings;
      }
      
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });
    
    setFilteredReports(filtered);
  };

  // تصدير التقرير
  const exportReport = async (format: 'excel' | 'pdf') => {
    try {
      Alert.alert('جاري التصدير', `جاري تصدير التقرير بتنسيق ${format.toUpperCase()}...`);
      
      const response = await fetch('/api/worker-unified-reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          period: selectedPeriod,
          workerType: selectedWorkerType,
          format: format,
          sortBy: sortBy,
          sortOrder: sortOrder,
        }),
      });

      if (response.ok) {
        Alert.alert('نجح التصدير', `تم تصدير التقرير بنجاح`);
      } else {
        throw new Error('فشل في التصدير');
      }
    } catch (error) {
      console.error('خطأ في تصدير التقرير:', error);
      Alert.alert('خطأ', 'فشل في تصدير التقرير');
    }
  };

  // تنسيق العملة
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-SA')} ر.س`;
  };

  // الحصول على لون الرصيد
  const getBalanceColor = (balance: number) => {
    if (balance > 0) return colors.success;
    if (balance < 0) return colors.error;
    return colors.textSecondary;
  };

  // الحصول على تقييم الكفاءة
  const getEfficiencyRating = (rating: number) => {
    if (rating >= 90) return { text: 'ممتاز', color: colors.success };
    if (rating >= 75) return { text: 'جيد جداً', color: colors.primary };
    if (rating >= 60) return { text: 'جيد', color: colors.warning };
    if (rating >= 40) return { text: 'مقبول', color: colors.error };
    return { text: 'ضعيف', color: '#8B0000' };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري تحميل التقارير الموحدة...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* عنوان الشاشة */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>التقارير الموحدة للعمال</Text>
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

      {/* الفلاتر والتحكم */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <View style={[styles.filterGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>الفترة</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Picker
                selectedValue={selectedPeriod}
                style={[styles.picker, { color: colors.text }]}
                onValueChange={(value) => setSelectedPeriod(value)}
              >
                <Picker.Item label="أسبوع" value="week" />
                <Picker.Item label="شهر" value="month" />
                <Picker.Item label="ربع سنة" value="quarter" />
                <Picker.Item label="سنة" value="year" />
                <Picker.Item label="جميع الفترات" value="all" />
              </Picker>
            </View>
          </View>
          
          <View style={[styles.filterGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>نوع العامل</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Picker
                selectedValue={selectedWorkerType}
                style={[styles.picker, { color: colors.text }]}
                onValueChange={(value) => setSelectedWorkerType(value)}
              >
                <Picker.Item label="جميع الأنواع" value="all" />
                {workerTypes.map((type) => (
                  <Picker.Item key={type} label={type} value={type} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
        
        <View style={styles.searchAndSortContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="البحث بالاسم أو النوع..."
            placeholderTextColor={colors.textSecondary}
          />
          
          <View style={styles.sortControls}>
            <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Picker
                selectedValue={sortBy}
                style={[styles.sortPicker, { color: colors.text }]}
                onValueChange={(value) => setSortBy(value)}
              >
                <Picker.Item label="الأرباح" value="earnings" />
                <Picker.Item label="الأيام" value="days" />
                <Picker.Item label="الرصيد" value="balance" />
                <Picker.Item label="الاسم" value="name" />
              </Picker>
            </View>
            
            <TouchableOpacity
              style={[styles.sortOrderButton, { backgroundColor: colors.primary }]}
              onPress={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              <Text style={[styles.sortOrderText, { color: colors.surface }]}>
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ملخص المشروع */}
      {projectSummary && (
        <View style={[styles.summaryContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>ملخص المشروع</Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {projectSummary.totalWorkers}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>إجمالي العمال</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {projectSummary.activeWorkers}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>العمال النشطين</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>
                {projectSummary.totalWorkDays}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>أيام العمل</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: getBalanceColor(projectSummary.totalBalance) }]}>
                {formatCurrency(projectSummary.totalBalance)}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>إجمالي الرصيد</Text>
            </View>
          </View>
        </View>
      )}

      {/* قائمة التقارير */}
      <ScrollView style={styles.content}>
        {filteredReports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لا توجد تقارير للفترة المحددة
            </Text>
          </View>
        ) : (
          filteredReports.map((report) => {
            const efficiency = getEfficiencyRating(report.workEfficiencyRating);
            
            return (
              <View key={report.workerId} style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.reportHeader}>
                  <View style={styles.workerInfo}>
                    <Text style={[styles.workerName, { color: colors.text }]}>{report.workerName}</Text>
                    <Text style={[styles.workerType, { color: colors.textSecondary }]}>
                      {report.workerType} • {formatCurrency(report.dailyWage)}/يوم
                    </Text>
                  </View>
                  
                  <View style={styles.balanceInfo}>
                    <Text style={[styles.currentBalance, { color: getBalanceColor(report.currentBalance) }]}>
                      {formatCurrency(report.currentBalance)}
                    </Text>
                    <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>الرصيد الحالي</Text>
                  </View>
                </View>

                <View style={styles.reportStats}>
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.primary }]}>{report.totalWorkDays}</Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>أيام العمل</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.success }]}>
                        {formatCurrency(report.totalEarnings)}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>إجمالي الأرباح</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.error }]}>
                        {formatCurrency(report.totalPaidAmount)}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>إجمالي المدفوع</Text>
                    </View>
                  </View>
                  
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.warning }]}>
                        {formatCurrency(report.totalTransfers)}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>التحويلات</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.error }]}>
                        {formatCurrency(report.totalMiscExpenses)}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>مصاريف متنوعة</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: efficiency.color }]}>
                        {efficiency.text}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>الكفاءة</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.reportFooter}>
                  <Text style={[styles.workFrequency, { color: colors.textSecondary }]}>
                    معدل العمل: {report.averageWorkDaysPerWeek.toFixed(1)} أيام/أسبوع
                  </Text>
                  
                  {report.lastWorkDate && (
                    <Text style={[styles.lastActivity, { color: colors.textSecondary }]}>
                      آخر عمل: {new Date(report.lastWorkDate).toLocaleDateString('ar-SA')}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
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
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
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
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
  },
  searchAndSortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  },
  sortControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortPicker: {
    height: 36,
    width: 80,
  },
  sortOrderButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortOrderText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    textAlign: 'center',
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
  reportCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  workerType: {
    fontSize: 12,
  },
  balanceInfo: {
    alignItems: 'flex-end',
  },
  currentBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  balanceLabel: {
    fontSize: 11,
  },
  reportStats: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  workFrequency: {
    fontSize: 11,
  },
  lastActivity: {
    fontSize: 11,
  },
});