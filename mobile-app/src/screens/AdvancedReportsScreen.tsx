import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Share,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import * as Icons from 'lucide-react-native';
import { AutocompleteInput } from '../components/AutocompleteInput';

interface ProjectMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  completionPercentage: number;
  workerProductivity: number;
  materialEfficiency: number;
  equipmentUtilization: number;
  costPerSquareMeter: number;
  budgetVariance: number;
  scheduleVariance: number;
}

interface TimeAnalysis {
  totalDays: number;
  workingDays: number;
  averageDailyProgress: number;
  estimatedCompletion: string;
  delayDays: number;
  seasonalTrends: Array<{
    period: string;
    productivity: number;
    expenses: number;
    revenue: number;
  }>;
  milestones: Array<{
    name: string;
    plannedDate: string;
    actualDate?: string;
    status: 'completed' | 'on_track' | 'delayed' | 'at_risk';
  }>;
}

interface FinancialBreakdown {
  materialCosts: number;
  laborCosts: number;
  equipmentCosts: number;
  miscExpenses: number;
  overheadCosts: number;
  transportationCosts: number;
  profitLoss: number;
  cashFlow: Array<{
    date: string;
    income: number;
    expenses: number;
    balance: number;
  }>;
}

interface WorkerAnalytics {
  totalWorkers: number;
  averageAttendance: number;
  productivityScore: number;
  totalWages: number;
  averageDailyWage: number;
  topPerformers: Array<{
    id: string;
    name: string;
    efficiency: number;
    totalEarnings: number;
    attendanceRate: number;
    skillLevel: string;
  }>;
  skillDistribution: Array<{
    skill: string;
    count: number;
    averageWage: number;
    efficiency: number;
  }>;
  attendanceTrends: Array<{
    date: string;
    presentCount: number;
    totalCount: number;
    percentage: number;
  }>;
}

interface MaterialAnalytics {
  totalPurchases: number;
  totalQuantity: number;
  averagePrice: number;
  wastePercentage: number;
  costEfficiency: number;
  topSuppliers: Array<{
    id: string;
    name: string;
    totalPurchases: number;
    totalAmount: number;
    reliability: number;
    qualityScore: number;
  }>;
  materialUsage: Array<{
    id: string;
    material: string;
    quantity: number;
    cost: number;
    efficiency: number;
    category: string;
  }>;
  priceHistory: Array<{
    date: string;
    averagePrice: number;
    totalSpent: number;
  }>;
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  budgetRisk: 'low' | 'medium' | 'high';
  timelineRisk: 'low' | 'medium' | 'high';
  qualityRisk: 'low' | 'medium' | 'high';
  resourceRisk: 'low' | 'medium' | 'high';
  weatherRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
  criticalIssues: Array<{
    id: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
    impact: string;
    solution: string;
    priority: number;
    assignedTo?: string;
  }>;
  riskHistory: Array<{
    date: string;
    riskLevel: number;
    mainConcerns: string[];
  }>;
}

interface AdvancedReport {
  id: string;
  projectId: string;
  projectName: string;
  generatedAt: string;
  reportPeriod: {
    startDate: string;
    endDate: string;
    type: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  };
  projectMetrics: ProjectMetrics;
  timeAnalysis: TimeAnalysis;
  financialBreakdown: FinancialBreakdown;
  workerAnalytics: WorkerAnalytics;
  materialAnalytics: MaterialAnalytics;
  riskAssessment: RiskAssessment;
}

interface ReportFilters {
  period: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  compareMode: 'none' | 'previous' | 'budget' | 'target';
  reportType: 'overview' | 'financial' | 'worker' | 'material' | 'risk' | 'timeline';
  startDate?: string;
  endDate?: string;
  includeCharts: boolean;
  includeDetails: boolean;
}

export default function AdvancedReportsScreen() {
  const { colors } = useTheme();
  const { selectedProjectId, selectedProject } = useProject();
  
  // State
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportFilters['reportType']>('overview');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState<ReportFilters>({
    period: 'month',
    compareMode: 'none',
    reportType: 'overview',
    includeCharts: true,
    includeDetails: true,
  });
  
  // Data
  const [reportData, setReportData] = useState<AdvancedReport | null>(null);
  const [comparisonData, setComparisonData] = useState<AdvancedReport | null>(null);
  const [reportHistory, setReportHistory] = useState<AdvancedReport[]>([]);

  // Load advanced report
  const loadAdvancedReport = async () => {
    if (!selectedProjectId) {
      Alert.alert('تنبيه', 'يرجى اختيار مشروع أولاً');
      return;
    }
    
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        projectId: selectedProjectId,
        period: filters.period,
        compareMode: filters.compareMode,
        startDate: filters.startDate || '',
        endDate: filters.endDate || '',
      });
      
      const response = await fetch(`/api/advanced-reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data.current);
        if (data.comparison) {
          setComparisonData(data.comparison);
        }
        if (data.history) {
          setReportHistory(data.history);
        }
      }
      
    } catch (error) {
      console.error('خطأ في تحميل التقارير المتقدمة:', error);
      Alert.alert('خطأ', 'فشل في تحميل التقارير المتقدمة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvancedReport();
  }, [selectedProjectId, filters.period, filters.compareMode]);

  // Export report
  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!reportData) return;
    
    try {
      setExporting(true);
      Alert.alert('جاري التصدير', `جاري إعداد التقرير بتنسيق ${format.toUpperCase()}...`);
      
      const response = await fetch('/api/advanced-reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: reportData.id,
          projectId: selectedProjectId,
          format: format,
          filters: filters,
          includeCharts: filters.includeCharts,
          includeDetails: filters.includeDetails,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert('نجح التصدير', `تم تصدير التقرير بنجاح. رقم المرجع: ${result.exportId}`);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تصدير التقرير');
    } finally {
      setExporting(false);
    }
  };

  // Print report
  const printReport = async () => {
    if (!reportData) return;
    
    try {
      Alert.alert('جاري الطباعة', 'جاري إعداد التقرير للطباعة...');
      
      const response = await fetch('/api/advanced-reports/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: reportData.id,
          projectId: selectedProjectId,
          reportType: selectedReport,
          filters: filters,
        }),
      });

      if (response.ok) {
        Alert.alert('جاهز للطباعة', 'تم إعداد التقرير وإرساله لطابعة الشبكة');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في طباعة التقرير');
    }
  };

  // Share report
  const shareReport = async () => {
    if (!reportData) return;
    
    try {
      setSharing(true);
      const shareContent = {
        title: `تقرير متقدم - ${selectedProject?.name}`,
        message: `تقرير متقدم للمشروع: ${selectedProject?.name}\nالفترة: ${reportData.reportPeriod.startDate} - ${reportData.reportPeriod.endDate}\n\nإجمالي الإيرادات: ${formatCurrency(reportData.projectMetrics.totalRevenue)}\nإجمالي المصاريف: ${formatCurrency(reportData.projectMetrics.totalExpenses)}\nالربح الصافي: ${formatCurrency(reportData.projectMetrics.netProfit)}\nنسبة الإنجاز: ${formatPercentage(reportData.projectMetrics.completionPercentage)}`,
      };

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Share.share(shareContent);
      } else {
        Alert.alert('المشاركة', shareContent.message);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في مشاركة التقرير');
    } finally {
      setSharing(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Get risk color
  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return colors.success;
      case 'medium': return colors.warning;
      case 'high': return colors.error;
      default: return colors.textSecondary;
    }
  };

  // Get risk text
  const getRiskText = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'منخفض';
      case 'medium': return 'متوسط';
      case 'high': return 'مرتفع';
      default: return 'غير محدد';
    }
  };

  // Get milestone status color
  const getMilestoneStatusColor = (status: TimeAnalysis['milestones'][0]['status']) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'on_track': return colors.primary;
      case 'delayed': return colors.error;
      case 'at_risk': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  // Get milestone status text
  const getMilestoneStatusText = (status: TimeAnalysis['milestones'][0]['status']) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'on_track': return 'في المسار';
      case 'delayed': return 'متأخر';
      case 'at_risk': return 'في خطر';
      default: return 'غير محدد';
    }
  };

  // Render pie chart
  const renderPieChart = (data: Array<{label: string, value: number, color: string}>) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.pieChartContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.pieSegment}>
              <View style={[styles.pieColor, { backgroundColor: item.color }]} />
              <Text style={[styles.pieValue, { color: colors.text }]}>
                {formatPercentage((item.value / total) * 100)}
              </Text>
            </View>
          ))}
        </View>
        
        <View style={styles.chartLegend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                {formatCurrency(item.value)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render bar chart
  const renderBarChart = (data: Array<{label: string, value: number}>) => {
    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <View style={styles.barChartContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.barItem}>
            <View style={styles.barContainer}>
              <View style={[
                styles.barFill,
                {
                  height: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: colors.primary,
                }
              ]} />
            </View>
            <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            <Text style={[styles.barValue, { color: colors.text }]}>{item.value.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Calculate comparison percentage
  const calculateComparison = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري تحميل التقارير المتقدمة...</Text>
      </View>
    );
  }

  if (!reportData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header مبسط للحالة الفارغة */}
        <LinearGradient
          colors={[colors.primary, colors.secondary || colors.primary]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <Text style={[styles.pageTitle, { color: colors.surface }]}>التقارير المتقدمة</Text>
            <Text style={[styles.pageSubtitle, { color: colors.surface }]}>
              تحليلات شاملة ومتقدمة للمشروع
            </Text>
          </View>
        </LinearGradient>

        <View style={[styles.emptyStateContainer, { backgroundColor: colors.surface }]}>
          <Icons.FileText size={80} color={colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>لا توجد بيانات كافية</Text>
          <Text style={[styles.emptyStateMessage, { color: colors.textSecondary }]}>
            {selectedProjectId ? 'لا توجد بيانات كافية لإنتاج تقرير متقدم لهذا المشروع' : 'يرجى اختيار مشروع أولاً لعرض التقارير المتقدمة'}
          </Text>
          
          {selectedProjectId && (
            <TouchableOpacity
              style={[styles.refreshButton, { backgroundColor: colors.primary }]}
              onPress={loadAdvancedReport}
            >
              <Icons.RefreshCw size={20} color={colors.surface} />
              <Text style={[styles.refreshButtonText, { color: colors.surface }]}>إعادة المحاولة</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header متطور مع Gradient */}
      <LinearGradient
        colors={[colors.primary, colors.secondary || colors.primary]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleSection}>
            <Text style={[styles.pageTitle, { color: colors.surface }]}>التقارير المتقدمة</Text>
            <Text style={[styles.pageSubtitle, { color: colors.surface }]}>
              تحليلات شاملة ومتقدمة • {selectedProject?.name}
            </Text>
          </View>

          {/* إحصائيات سريعة */}
          <View style={styles.quickStatsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.success + '20' }]}>
              <Icons.TrendingUp size={20} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.surface }]}>{formatCurrency(reportData.projectMetrics.netProfit)}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>الربح الصافي</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.warning + '20' }]}>
              <Icons.Target size={20} color={colors.warning} />
              <Text style={[styles.statValue, { color: colors.surface }]}>{formatPercentage(reportData.projectMetrics.completionPercentage)}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>نسبة الإنجاز</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.primary + '20' }]}>
              <Icons.Users size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.surface }]}>{reportData.workerAnalytics.totalWorkers}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>العمال</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: getRiskColor(reportData.riskAssessment.overallRisk) + '20' }]}>
              <Icons.AlertTriangle size={20} color={getRiskColor(reportData.riskAssessment.overallRisk)} />
              <Text style={[styles.statValue, { color: colors.surface }]}>{getRiskText(reportData.riskAssessment.overallRisk)}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>المخاطر</Text>
            </View>
          </View>

          {/* أزرار الإجراءات */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface + '20' }]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Icons.Filter size={18} color={colors.surface} />
              <Text style={[styles.actionButtonText, { color: colors.surface }]}>فلاتر</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface + '20' }]}
              onPress={shareReport}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Icons.Share2 size={18} color={colors.surface} />
              )}
              <Text style={[styles.actionButtonText, { color: colors.surface }]}>مشاركة</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface + '20' }]}
              onPress={printReport}
            >
              <Icons.Printer size={18} color={colors.surface} />
              <Text style={[styles.actionButtonText, { color: colors.surface }]}>طباعة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* فلاتر متقدمة */}
      {showFilters && (
        <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>الفترة:</Text>
              <View style={styles.periodOptions}>
                {[
                  { key: 'week', label: 'أسبوع' },
                  { key: 'month', label: 'شهر' },
                  { key: 'quarter', label: 'ربع سنة' },
                  { key: 'year', label: 'سنة' }
                ].map((option) => {
                  const isSelected = filters.period === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.periodChip, {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border
                      }]}
                      onPress={() => setFilters(prev => ({ ...prev, period: option.key as any }))}
                    >
                      <Text style={[styles.periodChipText, {
                        color: isSelected ? colors.surface : colors.text
                      }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>المقارنة:</Text>
              <View style={styles.compareOptions}>
                {[
                  { key: 'none', label: 'بدون مقارنة' },
                  { key: 'previous', label: 'الفترة السابقة' },
                  { key: 'budget', label: 'مقارنة بالميزانية' },
                  { key: 'target', label: 'الأهداف المحددة' }
                ].map((option) => {
                  const isSelected = filters.compareMode === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.compareChip, {
                        backgroundColor: isSelected ? colors.warning : colors.background,
                        borderColor: isSelected ? colors.warning : colors.border
                      }]}
                      onPress={() => setFilters(prev => ({ ...prev, compareMode: option.key as any }))}
                    >
                      <Text style={[styles.compareChipText, {
                        color: isSelected ? colors.surface : colors.text
                      }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* تبويبات متطورة */}
      <View style={[styles.modernTabContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', icon: 'BarChart3', label: 'نظرة عامة' },
            { key: 'financial', icon: 'DollarSign', label: 'مالي' },
            { key: 'worker', icon: 'Users', label: 'العمال' },
            { key: 'material', icon: 'Package', label: 'المواد' },
            { key: 'risk', icon: 'AlertTriangle', label: 'المخاطر' },
            { key: 'timeline', icon: 'Calendar', label: 'الجدولة' }
          ].map((tab) => {
            const IconComponent = Icons[tab.icon as keyof typeof Icons] as any;
            const isActive = selectedReport === tab.key;
            
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.modernTab, {
                  backgroundColor: isActive ? colors.primary : 'transparent',
                  borderColor: isActive ? colors.primary : colors.border
                }]}
                onPress={() => setSelectedReport(tab.key as any)}
              >
                <IconComponent size={20} color={isActive ? colors.surface : colors.text} />
                <Text style={[styles.modernTabText, {
                  color: isActive ? colors.surface : colors.text
                }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* محتوى التقارير */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {selectedReport === 'overview' && (
            <View>
              {/* مؤشرات الأداء الرئيسية */}
              <View style={[styles.kpiContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>مؤشرات الأداء الرئيسية</Text>
                
                <View style={styles.kpiGrid}>
                  <View style={[styles.kpiCard, { backgroundColor: colors.background }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: colors.success + '20' }]}>
                      <Icons.TrendingUp size={24} color={colors.success} />
                    </View>
                    <Text style={[styles.kpiValue, { color: colors.success }]}>
                      {formatCurrency(reportData.projectMetrics.totalRevenue)}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>إجمالي الإيرادات</Text>
                    {comparisonData && (
                      <Text style={[styles.kpiComparison, { 
                        color: calculateComparison(reportData.projectMetrics.totalRevenue, comparisonData.projectMetrics.totalRevenue) >= 0 ? colors.success : colors.error 
                      }]}>
                        {calculateComparison(reportData.projectMetrics.totalRevenue, comparisonData.projectMetrics.totalRevenue) >= 0 ? '+' : ''}
                        {formatPercentage(calculateComparison(reportData.projectMetrics.totalRevenue, comparisonData.projectMetrics.totalRevenue))}
                      </Text>
                    )}
                  </View>
                  
                  <View style={[styles.kpiCard, { backgroundColor: colors.background }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: colors.error + '20' }]}>
                      <Icons.TrendingDown size={24} color={colors.error} />
                    </View>
                    <Text style={[styles.kpiValue, { color: colors.error }]}>
                      {formatCurrency(reportData.projectMetrics.totalExpenses)}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>إجمالي المصاريف</Text>
                    {comparisonData && (
                      <Text style={[styles.kpiComparison, { 
                        color: calculateComparison(reportData.projectMetrics.totalExpenses, comparisonData.projectMetrics.totalExpenses) <= 0 ? colors.success : colors.error 
                      }]}>
                        {calculateComparison(reportData.projectMetrics.totalExpenses, comparisonData.projectMetrics.totalExpenses) >= 0 ? '+' : ''}
                        {formatPercentage(calculateComparison(reportData.projectMetrics.totalExpenses, comparisonData.projectMetrics.totalExpenses))}
                      </Text>
                    )}
                  </View>
                  
                  <View style={[styles.kpiCard, { backgroundColor: colors.background }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Icons.DollarSign size={24} color={colors.primary} />
                    </View>
                    <Text style={[styles.kpiValue, { color: colors.primary }]}>
                      {formatCurrency(reportData.projectMetrics.netProfit)}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>الربح الصافي</Text>
                    {comparisonData && (
                      <Text style={[styles.kpiComparison, { 
                        color: calculateComparison(reportData.projectMetrics.netProfit, comparisonData.projectMetrics.netProfit) >= 0 ? colors.success : colors.error 
                      }]}>
                        {calculateComparison(reportData.projectMetrics.netProfit, comparisonData.projectMetrics.netProfit) >= 0 ? '+' : ''}
                        {formatPercentage(calculateComparison(reportData.projectMetrics.netProfit, comparisonData.projectMetrics.netProfit))}
                      </Text>
                    )}
                  </View>
                  
                  <View style={[styles.kpiCard, { backgroundColor: colors.background }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: colors.warning + '20' }]}>
                      <Icons.Target size={24} color={colors.warning} />
                    </View>
                    <Text style={[styles.kpiValue, { color: colors.warning }]}>
                      {formatPercentage(reportData.projectMetrics.completionPercentage)}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>نسبة الإنجاز</Text>
                    {comparisonData && (
                      <Text style={[styles.kpiComparison, { 
                        color: calculateComparison(reportData.projectMetrics.completionPercentage, comparisonData.projectMetrics.completionPercentage) >= 0 ? colors.success : colors.error 
                      }]}>
                        {calculateComparison(reportData.projectMetrics.completionPercentage, comparisonData.projectMetrics.completionPercentage) >= 0 ? '+' : ''}
                        {formatPercentage(calculateComparison(reportData.projectMetrics.completionPercentage, comparisonData.projectMetrics.completionPercentage))}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* مؤشرات الكفاءة */}
              <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>مؤشرات الكفاءة</Text>
                
                <View style={styles.efficiencyMetrics}>
                  <View style={styles.efficiencyItem}>
                    <View style={styles.efficiencyHeader}>
                      <Icons.Users size={20} color={colors.success} />
                      <Text style={[styles.efficiencyLabel, { color: colors.text }]}>إنتاجية العمال</Text>
                    </View>
                    <View style={[styles.efficiencyBar, { backgroundColor: colors.background }]}>
                      <View style={[
                        styles.efficiencyFill, 
                        { 
                          width: `${reportData.projectMetrics.workerProductivity}%`,
                          backgroundColor: colors.success 
                        }
                      ]} />
                    </View>
                    <Text style={[styles.efficiencyValue, { color: colors.text }]}>
                      {formatPercentage(reportData.projectMetrics.workerProductivity)}
                    </Text>
                  </View>
                  
                  <View style={styles.efficiencyItem}>
                    <View style={styles.efficiencyHeader}>
                      <Icons.Package size={20} color={colors.warning} />
                      <Text style={[styles.efficiencyLabel, { color: colors.text }]}>كفاءة المواد</Text>
                    </View>
                    <View style={[styles.efficiencyBar, { backgroundColor: colors.background }]}>
                      <View style={[
                        styles.efficiencyFill, 
                        { 
                          width: `${reportData.projectMetrics.materialEfficiency}%`,
                          backgroundColor: colors.warning 
                        }
                      ]} />
                    </View>
                    <Text style={[styles.efficiencyValue, { color: colors.text }]}>
                      {formatPercentage(reportData.projectMetrics.materialEfficiency)}
                    </Text>
                  </View>
                  
                  <View style={styles.efficiencyItem}>
                    <View style={styles.efficiencyHeader}>
                      <Icons.Settings size={20} color={colors.primary} />
                      <Text style={[styles.efficiencyLabel, { color: colors.text }]}>استخدام المعدات</Text>
                    </View>
                    <View style={[styles.efficiencyBar, { backgroundColor: colors.background }]}>
                      <View style={[
                        styles.efficiencyFill, 
                        { 
                          width: `${reportData.projectMetrics.equipmentUtilization}%`,
                          backgroundColor: colors.primary 
                        }
                      ]} />
                    </View>
                    <Text style={[styles.efficiencyValue, { color: colors.text }]}>
                      {formatPercentage(reportData.projectMetrics.equipmentUtilization)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* تحليل الوقت */}
              <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>تحليل الوقت والجدولة</Text>
                
                <View style={styles.timeAnalysisGrid}>
                  <View style={[styles.timeMetric, { backgroundColor: colors.background }]}>
                    <Icons.Calendar size={24} color={colors.primary} />
                    <Text style={[styles.timeValue, { color: colors.text }]}>{reportData.timeAnalysis.totalDays}</Text>
                    <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>إجمالي الأيام</Text>
                  </View>
                  
                  <View style={[styles.timeMetric, { backgroundColor: colors.background }]}>
                    <Icons.Clock size={24} color={colors.success} />
                    <Text style={[styles.timeValue, { color: colors.success }]}>{reportData.timeAnalysis.workingDays}</Text>
                    <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>أيام العمل</Text>
                  </View>
                  
                  <View style={[styles.timeMetric, { backgroundColor: colors.background }]}>
                    <Icons.AlertCircle size={24} color={reportData.timeAnalysis.delayDays > 0 ? colors.error : colors.success} />
                    <Text style={[styles.timeValue, { color: reportData.timeAnalysis.delayDays > 0 ? colors.error : colors.success }]}>
                      {reportData.timeAnalysis.delayDays}
                    </Text>
                    <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>أيام التأخير</Text>
                  </View>
                  
                  <View style={[styles.timeMetric, { backgroundColor: colors.background }]}>
                    <Icons.TrendingUp size={24} color={colors.warning} />
                    <Text style={[styles.timeValue, { color: colors.warning }]}>
                      {formatPercentage(reportData.timeAnalysis.averageDailyProgress)}
                    </Text>
                    <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>متوسط التقدم اليومي</Text>
                  </View>
                </View>
                
                {reportData.timeAnalysis.estimatedCompletion && (
                  <View style={[styles.completionEstimate, { backgroundColor: colors.primary + '15' }]}>
                    <Icons.Target size={20} color={colors.primary} />
                    <Text style={[styles.completionText, { color: colors.primary }]}>
                      التاريخ المتوقع للإنجاز: {new Date(reportData.timeAnalysis.estimatedCompletion).toLocaleDateString('ar-SA')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {selectedReport === 'financial' && (
            <View>
              {/* التوزيع المالي */}
              <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>التوزيع المالي</Text>
                
                {renderPieChart([
                  { label: 'المواد', value: reportData.financialBreakdown.materialCosts, color: colors.primary },
                  { label: 'العمالة', value: reportData.financialBreakdown.laborCosts, color: colors.success },
                  { label: 'المعدات', value: reportData.financialBreakdown.equipmentCosts, color: colors.warning },
                  { label: 'النقل', value: reportData.financialBreakdown.transportationCosts, color: colors.error },
                  { label: 'مصاريف متنوعة', value: reportData.financialBreakdown.miscExpenses, color: colors.textSecondary },
                ])}
              </View>

              {/* ملخص مالي */}
              <View style={[styles.financialSummary, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>الملخص المالي</Text>
                
                <View style={styles.financialRows}>
                  <View style={styles.financialRow}>
                    <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>إجمالي الإيرادات:</Text>
                    <Text style={[styles.financialValue, { color: colors.success }]}>
                      {formatCurrency(reportData.projectMetrics.totalRevenue)}
                    </Text>
                  </View>
                  
                  <View style={styles.financialRow}>
                    <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>إجمالي التكاليف:</Text>
                    <Text style={[styles.financialValue, { color: colors.error }]}>
                      {formatCurrency(reportData.projectMetrics.totalExpenses)}
                    </Text>
                  </View>
                  
                  <View style={[styles.financialRow, styles.profitRow]}>
                    <Text style={[styles.financialLabel, styles.profitLabel, { color: colors.text }]}>الربح الصافي:</Text>
                    <Text style={[
                      styles.financialValue, 
                      styles.profitValue, 
                      { color: reportData.projectMetrics.netProfit >= 0 ? colors.success : colors.error }
                    ]}>
                      {formatCurrency(reportData.projectMetrics.netProfit)}
                    </Text>
                  </View>
                  
                  <View style={styles.financialRow}>
                    <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>هامش الربح:</Text>
                    <Text style={[styles.financialValue, { color: colors.primary }]}>
                      {formatPercentage(reportData.projectMetrics.profitMargin)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* تكلفة المتر المربع */}
              <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.metricIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Icons.Square size={32} color={colors.primary} />
                </View>
                <Text style={[styles.metricTitle, { color: colors.text }]}>تكلفة المتر المربع</Text>
                <Text style={[styles.metricValue, { color: colors.primary }]}>
                  {formatCurrency(reportData.projectMetrics.costPerSquareMeter)}
                </Text>
              </View>
            </View>
          )}

          {selectedReport === 'worker' && (
            <View>
              {/* إحصائيات العمال */}
              <View style={[styles.workerStatsContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>إحصائيات العمال</Text>
                
                <View style={styles.workerStatsGrid}>
                  <View style={[styles.workerStatCard, { backgroundColor: colors.background }]}>
                    <Icons.Users size={32} color={colors.primary} />
                    <Text style={[styles.workerStatValue, { color: colors.primary }]}>
                      {reportData.workerAnalytics.totalWorkers}
                    </Text>
                    <Text style={[styles.workerStatLabel, { color: colors.textSecondary }]}>إجمالي العمال</Text>
                  </View>
                  
                  <View style={[styles.workerStatCard, { backgroundColor: colors.background }]}>
                    <Icons.CheckCircle size={32} color={colors.success} />
                    <Text style={[styles.workerStatValue, { color: colors.success }]}>
                      {formatPercentage(reportData.workerAnalytics.averageAttendance)}
                    </Text>
                    <Text style={[styles.workerStatLabel, { color: colors.textSecondary }]}>متوسط الحضور</Text>
                  </View>
                  
                  <View style={[styles.workerStatCard, { backgroundColor: colors.background }]}>
                    <Icons.Award size={32} color={colors.warning} />
                    <Text style={[styles.workerStatValue, { color: colors.warning }]}>
                      {reportData.workerAnalytics.productivityScore.toFixed(1)}
                    </Text>
                    <Text style={[styles.workerStatLabel, { color: colors.textSecondary }]}>نقاط الإنتاجية</Text>
                  </View>
                  
                  <View style={[styles.workerStatCard, { backgroundColor: colors.background }]}>
                    <Icons.DollarSign size={32} color={colors.error} />
                    <Text style={[styles.workerStatValue, { color: colors.error }]}>
                      {formatCurrency(reportData.workerAnalytics.totalWages)}
                    </Text>
                    <Text style={[styles.workerStatLabel, { color: colors.textSecondary }]}>إجمالي الأجور</Text>
                  </View>
                </View>
              </View>

              {/* أفضل العمال */}
              <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>أفضل العمال أداءً</Text>
                
                <FlatList
                  data={reportData.workerAnalytics.topPerformers}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item: performer, index }) => (
                    <View style={[styles.performerCard, { backgroundColor: colors.background }]}>
                      <View style={[styles.performerRank, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.performerRankText, { color: colors.surface }]}>
                          {index + 1}
                        </Text>
                      </View>
                      
                      <View style={styles.performerInfo}>
                        <Text style={[styles.performerName, { color: colors.text }]}>{performer.name}</Text>
                        <Text style={[styles.performerSkill, { color: colors.textSecondary }]}>{performer.skillLevel}</Text>
                      </View>
                      
                      <View style={styles.performerMetrics}>
                        <View style={styles.performerMetric}>
                          <Icons.Target size={16} color={colors.success} />
                          <Text style={[styles.performerMetricValue, { color: colors.success }]}>
                            {formatPercentage(performer.efficiency)}
                          </Text>
                        </View>
                        
                        <View style={styles.performerMetric}>
                          <Icons.DollarSign size={16} color={colors.primary} />
                          <Text style={[styles.performerMetricValue, { color: colors.primary }]}>
                            {formatCurrency(performer.totalEarnings)}
                          </Text>
                        </View>
                        
                        <View style={styles.performerMetric}>
                          <Icons.CheckCircle size={16} color={colors.warning} />
                          <Text style={[styles.performerMetricValue, { color: colors.warning }]}>
                            {formatPercentage(performer.attendanceRate)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                />
              </View>

              {/* توزيع المهارات */}
              <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>توزيع المهارات</Text>
                
                {renderBarChart(reportData.workerAnalytics.skillDistribution.map(skill => ({
                  label: skill.skill,
                  value: skill.count
                })))}
              </View>
            </View>
          )}

          {selectedReport === 'material' && (
            <View>
              {/* تحليلات المواد */}
              <View style={[styles.materialStatsContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>تحليلات المواد</Text>
                
                <View style={styles.materialStatsGrid}>
                  <View style={[styles.materialStatCard, { backgroundColor: colors.background }]}>
                    <Icons.Package size={32} color={colors.primary} />
                    <Text style={[styles.materialStatValue, { color: colors.primary }]}>
                      {reportData.materialAnalytics.totalPurchases.toLocaleString()}
                    </Text>
                    <Text style={[styles.materialStatLabel, { color: colors.textSecondary }]}>إجمالي المشتريات</Text>
                  </View>
                  
                  <View style={[styles.materialStatCard, { backgroundColor: colors.background }]}>
                    <Icons.TrendingUp size={32} color={colors.success} />
                    <Text style={[styles.materialStatValue, { color: colors.success }]}>
                      {formatCurrency(reportData.materialAnalytics.averagePrice)}
                    </Text>
                    <Text style={[styles.materialStatLabel, { color: colors.textSecondary }]}>متوسط السعر</Text>
                  </View>
                  
                  <View style={[styles.materialStatCard, { backgroundColor: colors.background }]}>
                    <Icons.AlertTriangle size={32} color={colors.error} />
                    <Text style={[styles.materialStatValue, { color: colors.error }]}>
                      {formatPercentage(reportData.materialAnalytics.wastePercentage)}
                    </Text>
                    <Text style={[styles.materialStatLabel, { color: colors.textSecondary }]}>نسبة الهدر</Text>
                  </View>
                  
                  <View style={[styles.materialStatCard, { backgroundColor: colors.background }]}>
                    <Icons.Award size={32} color={colors.warning} />
                    <Text style={[styles.materialStatValue, { color: colors.warning }]}>
                      {formatPercentage(reportData.materialAnalytics.costEfficiency)}
                    </Text>
                    <Text style={[styles.materialStatLabel, { color: colors.textSecondary }]}>كفاءة التكلفة</Text>
                  </View>
                </View>
              </View>

              {/* أفضل الموردين */}
              <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>أفضل الموردين</Text>
                
                <FlatList
                  data={reportData.materialAnalytics.topSuppliers}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item: supplier, index }) => (
                    <View style={[styles.supplierCard, { backgroundColor: colors.background }]}>
                      <View style={[styles.supplierRank, { backgroundColor: colors.warning }]}>
                        <Text style={[styles.supplierRankText, { color: colors.surface }]}>
                          {index + 1}
                        </Text>
                      </View>
                      
                      <View style={styles.supplierInfo}>
                        <Text style={[styles.supplierName, { color: colors.text }]}>{supplier.name}</Text>
                        <Text style={[styles.supplierPurchases, { color: colors.textSecondary }]}>
                          {supplier.totalPurchases} عملية شراء
                        </Text>
                      </View>
                      
                      <View style={styles.supplierMetrics}>
                        <View style={styles.supplierMetric}>
                          <Icons.DollarSign size={16} color={colors.primary} />
                          <Text style={[styles.supplierMetricValue, { color: colors.primary }]}>
                            {formatCurrency(supplier.totalAmount)}
                          </Text>
                        </View>
                        
                        <View style={styles.supplierMetric}>
                          <Icons.CheckCircle size={16} color={colors.success} />
                          <Text style={[styles.supplierMetricValue, { color: colors.success }]}>
                            {formatPercentage(supplier.reliability)}
                          </Text>
                        </View>
                        
                        <View style={styles.supplierMetric}>
                          <Icons.Star size={16} color={colors.warning} />
                          <Text style={[styles.supplierMetricValue, { color: colors.warning }]}>
                            {supplier.qualityScore.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                />
              </View>
            </View>
          )}

          {selectedReport === 'risk' && (
            <View>
              {/* تقييم المخاطر الإجمالي */}
              <View style={[styles.riskOverviewContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>تقييم المخاطر الإجمالي</Text>
                
                <View style={[styles.overallRiskCard, { 
                  backgroundColor: getRiskColor(reportData.riskAssessment.overallRisk) + '15',
                  borderColor: getRiskColor(reportData.riskAssessment.overallRisk)
                }]}>
                  <Icons.AlertTriangle size={48} color={getRiskColor(reportData.riskAssessment.overallRisk)} />
                  <Text style={[styles.overallRiskText, { color: getRiskColor(reportData.riskAssessment.overallRisk) }]}>
                    مستوى المخاطر: {getRiskText(reportData.riskAssessment.overallRisk)}
                  </Text>
                </View>
                
                <View style={styles.riskBreakdown}>
                  {[
                    { key: 'budgetRisk', label: 'مخاطر الميزانية', icon: 'DollarSign' },
                    { key: 'timelineRisk', label: 'مخاطر الجدولة', icon: 'Clock' },
                    { key: 'qualityRisk', label: 'مخاطر الجودة', icon: 'Award' },
                    { key: 'resourceRisk', label: 'مخاطر الموارد', icon: 'Users' },
                    { key: 'weatherRisk', label: 'مخاطر الطقس', icon: 'Cloud' }
                  ].map((risk) => {
                    const IconComponent = Icons[risk.icon as keyof typeof Icons] as any;
                    const riskLevel = reportData.riskAssessment[risk.key as keyof RiskAssessment] as 'low' | 'medium' | 'high';
                    
                    return (
                      <View key={risk.key} style={[styles.riskItem, { backgroundColor: colors.background }]}>
                        <IconComponent size={24} color={getRiskColor(riskLevel)} />
                        <Text style={[styles.riskLabel, { color: colors.text }]}>{risk.label}</Text>
                        <View style={[styles.riskBadge, { backgroundColor: getRiskColor(riskLevel) + '20' }]}>
                          <Text style={[styles.riskValue, { color: getRiskColor(riskLevel) }]}>
                            {getRiskText(riskLevel)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* القضايا الحرجة */}
              <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>القضايا الحرجة</Text>
                
                <FlatList
                  data={reportData.riskAssessment.criticalIssues}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item: issue }) => (
                    <View style={[styles.issueCard, { 
                      backgroundColor: colors.background,
                      borderLeftColor: getRiskColor(issue.severity),
                      borderLeftWidth: 4
                    }]}>
                      <View style={styles.issueHeader}>
                        <View style={[styles.issueSeverity, { backgroundColor: getRiskColor(issue.severity) + '20' }]}>
                          <Text style={[styles.issueSeverityText, { color: getRiskColor(issue.severity) }]}>
                            {getRiskText(issue.severity)}
                          </Text>
                        </View>
                        <Text style={[styles.issuePriority, { color: colors.textSecondary }]}>
                          أولوية: {issue.priority}
                        </Text>
                      </View>
                      
                      <Text style={[styles.issueTitle, { color: colors.text }]}>{issue.issue}</Text>
                      <Text style={[styles.issueImpact, { color: colors.textSecondary }]}>
                        التأثير: {issue.impact}
                      </Text>
                      <Text style={[styles.issueSolution, { color: colors.primary }]}>
                        الحل المقترح: {issue.solution}
                      </Text>
                      
                      {issue.assignedTo && (
                        <View style={styles.issueAssignment}>
                          <Icons.User size={16} color={colors.textSecondary} />
                          <Text style={[styles.issueAssignee, { color: colors.textSecondary }]}>
                            مكلف: {issue.assignedTo}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                />
              </View>

              {/* التوصيات */}
              <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>التوصيات</Text>
                
                <View style={styles.recommendationsList}>
                  {reportData.riskAssessment.recommendations.map((recommendation, index) => (
                    <View key={index} style={[styles.recommendationItem, { backgroundColor: colors.background }]}>
                      <Icons.Lightbulb size={20} color={colors.warning} />
                      <Text style={[styles.recommendationText, { color: colors.text }]}>
                        {recommendation}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {selectedReport === 'timeline' && reportData.timeAnalysis.milestones && (
            <View>
              {/* معالم المشروع */}
              <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>معالم المشروع</Text>
                
                <FlatList
                  data={reportData.timeAnalysis.milestones}
                  keyExtractor={(item, index) => index.toString()}
                  scrollEnabled={false}
                  renderItem={({ item: milestone }) => (
                    <View style={[styles.milestoneCard, { backgroundColor: colors.background }]}>
                      <View style={[styles.milestoneStatus, { backgroundColor: getMilestoneStatusColor(milestone.status) + '20' }]}>
                        <Text style={[styles.milestoneStatusText, { color: getMilestoneStatusColor(milestone.status) }]}>
                          {getMilestoneStatusText(milestone.status)}
                        </Text>
                      </View>
                      
                      <Text style={[styles.milestoneName, { color: colors.text }]}>{milestone.name}</Text>
                      
                      <View style={styles.milestoneDates}>
                        <View style={styles.milestoneDate}>
                          <Icons.Calendar size={16} color={colors.textSecondary} />
                          <Text style={[styles.milestoneDateLabel, { color: colors.textSecondary }]}>المخطط:</Text>
                          <Text style={[styles.milestoneDateValue, { color: colors.text }]}>
                            {new Date(milestone.plannedDate).toLocaleDateString('ar-SA')}
                          </Text>
                        </View>
                        
                        {milestone.actualDate && (
                          <View style={styles.milestoneDate}>
                            <Icons.CheckCircle size={16} color={colors.success} />
                            <Text style={[styles.milestoneDateLabel, { color: colors.textSecondary }]}>الفعلي:</Text>
                            <Text style={[styles.milestoneDateValue, { color: colors.text }]}>
                              {new Date(milestone.actualDate).toLocaleDateString('ar-SA')}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                />
              </View>

              {/* الاتجاهات الموسمية */}
              {reportData.timeAnalysis.seasonalTrends && reportData.timeAnalysis.seasonalTrends.length > 0 && (
                <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>الاتجاهات الموسمية</Text>
                  
                  {renderBarChart(reportData.timeAnalysis.seasonalTrends.map(trend => ({
                    label: trend.period,
                    value: trend.productivity
                  })))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* أزرار التصدير العائمة */}
      <View style={styles.floatingActionsContainer}>
        <TouchableOpacity
          style={[styles.floatingActionButton, { backgroundColor: colors.success }]}
          onPress={() => exportReport('excel')}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Icons.FileSpreadsheet size={24} color={colors.surface} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.floatingActionButton, { backgroundColor: colors.error }]}
          onPress={() => exportReport('pdf')}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Icons.FileText size={24} color={colors.surface} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.floatingActionButton, { backgroundColor: colors.warning }]}
          onPress={() => exportReport('csv')}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Icons.Download size={24} color={colors.surface} />
          )}
        </TouchableOpacity>
      </View>
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
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  
  // Header متطور
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTitleSection: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  
  // إحصائيات سريعة
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  
  // أزرار الإجراءات
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // فلاتر متقدمة
  filtersContainer: {
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  periodOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  periodChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  compareOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compareChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  compareChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // تبويبات متطورة
  modernTabContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  modernTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
    gap: 8,
  },
  modernTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // محتوى
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  
  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    margin: 20,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // مؤشرات الأداء الرئيسية
  kpiContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  kpiComparison: {
    fontSize: 10,
    fontWeight: '600',
  },
  
  // أقسام التقرير
  sectionContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  
  // مؤشرات الكفاءة
  efficiencyMetrics: {
    gap: 16,
  },
  efficiencyItem: {
    marginBottom: 12,
  },
  efficiencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  efficiencyLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  efficiencyBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  efficiencyFill: {
    height: 8,
    borderRadius: 4,
  },
  efficiencyValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  
  // تحليل الوقت
  timeAnalysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  timeMetric: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  timeLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  completionEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  completionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // الرسوم البيانية
  chartContainer: {
    marginVertical: 16,
  },
  pieChartContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pieSegment: {
    alignItems: 'center',
  },
  pieColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 4,
  },
  pieValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartLegend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    gap: 8,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 100,
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // الملخص المالي
  financialSummary: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  financialRows: {
    gap: 12,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 14,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profitRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
  },
  profitLabel: {
    fontWeight: 'bold',
  },
  profitValue: {
    fontSize: 18,
  },
  
  // بطاقة المتري
  metricCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  metricIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  
  // إحصائيات العمال
  workerStatsContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  workerStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  workerStatCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  workerStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  workerStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  
  // بطاقات أفضل العمال
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  performerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  performerRankText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  performerSkill: {
    fontSize: 12,
  },
  performerMetrics: {
    alignItems: 'flex-end',
    gap: 4,
  },
  performerMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  performerMetricValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // إحصائيات المواد
  materialStatsContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  materialStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  materialStatCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  materialStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  materialStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  
  // بطاقات الموردين
  supplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  supplierRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierRankText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  supplierPurchases: {
    fontSize: 12,
  },
  supplierMetrics: {
    alignItems: 'flex-end',
    gap: 4,
  },
  supplierMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  supplierMetricValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // تقييم المخاطر
  riskOverviewContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  overallRiskCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
    gap: 12,
  },
  overallRiskText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  riskBreakdown: {
    gap: 12,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  riskLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // القضايا الحرجة
  issueCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueSeverity: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  issueSeverityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  issuePriority: {
    fontSize: 12,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  issueImpact: {
    fontSize: 14,
    marginBottom: 8,
  },
  issueSolution: {
    fontSize: 14,
    marginBottom: 8,
  },
  issueAssignment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  issueAssignee: {
    fontSize: 12,
  },
  
  // التوصيات
  recommendationsList: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  
  // معالم المشروع
  milestoneCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  milestoneStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  milestoneStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  milestoneDates: {
    gap: 8,
  },
  milestoneDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  milestoneDateLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  milestoneDateValue: {
    fontSize: 12,
  },
  
  // أزرار التصدير العائمة
  floatingActionsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    gap: 12,
  },
  floatingActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});