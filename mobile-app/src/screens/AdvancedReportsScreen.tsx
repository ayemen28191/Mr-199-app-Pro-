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
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';

interface AdvancedReport {
  projectMetrics: {
    totalRevenue: number;
    totalExpenses: number;
    profitMargin: number;
    completionPercentage: number;
    workerProductivity: number;
    materialEfficiency: number;
    equipmentUtilization: number;
    costPerSquareMeter: number;
  };
  timeAnalysis: {
    totalDays: number;
    workingDays: number;
    averageDailyProgress: number;
    estimatedCompletion: string;
    delayDays: number;
    seasonalTrends: Array<{
      period: string;
      productivity: number;
      expenses: number;
    }>;
  };
  financialBreakdown: {
    materialCosts: number;
    laborCosts: number;
    equipmentCosts: number;
    miscExpenses: number;
    overheadCosts: number;
    profitLoss: number;
  };
  workerAnalytics: {
    totalWorkers: number;
    averageAttendance: number;
    productivityScore: number;
    topPerformers: Array<{
      name: string;
      efficiency: number;
      totalEarnings: number;
    }>;
    skillDistribution: Array<{
      skill: string;
      count: number;
      averageWage: number;
    }>;
  };
  materialAnalytics: {
    totalPurchases: number;
    wastePercentage: number;
    costEfficiency: number;
    topSuppliers: Array<{
      name: string;
      totalPurchases: number;
      reliability: number;
    }>;
    materialUsage: Array<{
      material: string;
      quantity: number;
      cost: number;
      efficiency: number;
    }>;
  };
  riskAssessment: {
    budgetRisk: 'low' | 'medium' | 'high';
    timelineRisk: 'low' | 'medium' | 'high';
    qualityRisk: 'low' | 'medium' | 'high';
    resourceRisk: 'low' | 'medium' | 'high';
    recommendations: string[];
    criticalIssues: Array<{
      issue: string;
      severity: 'low' | 'medium' | 'high';
      impact: string;
      solution: string;
    }>;
  };
}

export default function AdvancedReportsScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  
  // الحالات الأساسية
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<'overview' | 'financial' | 'worker' | 'material' | 'risk'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
  const [compareMode, setCompareMode] = useState<'none' | 'previous' | 'budget'>('none');
  
  // البيانات
  const [reportData, setReportData] = useState<AdvancedReport | null>(null);
  const [comparisonData, setComparisonData] = useState<AdvancedReport | null>(null);

  // تحميل البيانات
  const loadAdvancedReport = async () => {
    if (!selectedProjectId) {
      Alert.alert('تنبيه', 'يرجى اختيار مشروع أولاً');
      return;
    }
    
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        projectId: selectedProjectId,
        period: selectedPeriod,
        compareMode: compareMode,
      });
      
      const response = await fetch(`/api/advanced-reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data.current);
        if (data.comparison) {
          setComparisonData(data.comparison);
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
  }, [selectedProjectId, selectedPeriod, compareMode]);

  // تصدير التقرير المتقدم
  const exportAdvancedReport = async (format: 'pdf' | 'excel') => {
    try {
      Alert.alert('جاري التصدير', `جاري إعداد التقرير المتقدم بتنسيق ${format.toUpperCase()}...`);
      
      const response = await fetch('/api/advanced-reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          period: selectedPeriod,
          reportType: selectedReport,
          compareMode: compareMode,
          format: format,
        }),
      });

      if (response.ok) {
        Alert.alert('نجح التصدير', 'تم تصدير التقرير المتقدم بنجاح');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تصدير التقرير');
    }
  };

  // تنسيق العملة
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-SA')} ر.س`;
  };

  // تنسيق النسبة المئوية
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // الحصول على لون المخاطر
  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return colors.success;
      case 'medium': return colors.warning;
      case 'high': return colors.error;
      default: return colors.textSecondary;
    }
  };

  // الحصول على نص المخاطر
  const getRiskText = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'منخفض';
      case 'medium': return 'متوسط';
      case 'high': return 'مرتفع';
      default: return 'غير محدد';
    }
  };

  // رندر مخطط دائري بسيط
  const renderSimplePieChart = (data: Array<{label: string, value: number, color: string}>) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <View style={styles.chartContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.chartLegendItem}>
            <View style={[styles.chartColor, { backgroundColor: item.color }]} />
            <Text style={[styles.chartLabel, { color: colors.text }]}>
              {item.label}: {formatPercentage((item.value / total) * 100)}
            </Text>
          </View>
        ))}
      </View>
    );
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
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          لا توجد بيانات كافية لإنتاج تقرير متقدم
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* عنوان الشاشة */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>التقارير المتقدمة</Text>
        <View style={styles.exportButtons}>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: colors.success }]}
            onPress={() => exportAdvancedReport('excel')}
          >
            <Text style={[styles.exportButtonText, { color: colors.surface }]}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: colors.error }]}
            onPress={() => exportAdvancedReport('pdf')}
          >
            <Text style={[styles.exportButtonText, { color: colors.surface }]}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* فلاتر التقرير */}
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
                <Picker.Item label="شهر" value="month" />
                <Picker.Item label="ربع سنة" value="quarter" />
                <Picker.Item label="سنة" value="year" />
                <Picker.Item label="مخصص" value="custom" />
              </Picker>
            </View>
          </View>
          
          <View style={[styles.filterGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>المقارنة</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Picker
                selectedValue={compareMode}
                style={[styles.picker, { color: colors.text }]}
                onValueChange={(value) => setCompareMode(value)}
              >
                <Picker.Item label="بدون مقارنة" value="none" />
                <Picker.Item label="الفترة السابقة" value="previous" />
                <Picker.Item label="مقارنة بالميزانية" value="budget" />
              </Picker>
            </View>
          </View>
        </View>
      </View>

      {/* التبويبات */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedReport === 'overview' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedReport('overview')}
        >
          <Text style={[styles.tabText, { 
            color: selectedReport === 'overview' ? colors.surface : colors.text 
          }]}>نظرة عامة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedReport === 'financial' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedReport('financial')}
        >
          <Text style={[styles.tabText, { 
            color: selectedReport === 'financial' ? colors.surface : colors.text 
          }]}>مالي</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedReport === 'worker' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedReport('worker')}
        >
          <Text style={[styles.tabText, { 
            color: selectedReport === 'worker' ? colors.surface : colors.text 
          }]}>العمال</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedReport === 'material' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedReport('material')}
        >
          <Text style={[styles.tabText, { 
            color: selectedReport === 'material' ? colors.surface : colors.text 
          }]}>المواد</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedReport === 'risk' && { backgroundColor: colors.primary }]}
          onPress={() => setSelectedReport('risk')}
        >
          <Text style={[styles.tabText, { 
            color: selectedReport === 'risk' ? colors.surface : colors.text 
          }]}>المخاطر</Text>
        </TouchableOpacity>
      </View>

      {/* محتوى التقرير */}
      <ScrollView style={styles.content}>
        {selectedReport === 'overview' && (
          <View>
            {/* مؤشرات الأداء الرئيسية */}
            <View style={[styles.kpiContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>مؤشرات الأداء الرئيسية</Text>
              
              <View style={styles.kpiGrid}>
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiValue, { color: colors.success }]}>
                    {formatCurrency(reportData.projectMetrics.totalRevenue)}
                  </Text>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>إجمالي الإيرادات</Text>
                </View>
                
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiValue, { color: colors.error }]}>
                    {formatCurrency(reportData.projectMetrics.totalExpenses)}
                  </Text>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>إجمالي المصاريف</Text>
                </View>
                
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiValue, { color: colors.primary }]}>
                    {formatPercentage(reportData.projectMetrics.profitMargin)}
                  </Text>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>هامش الربح</Text>
                </View>
                
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiValue, { color: colors.warning }]}>
                    {formatPercentage(reportData.projectMetrics.completionPercentage)}
                  </Text>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>نسبة الإنجاز</Text>
                </View>
              </View>
            </View>

            {/* تحليل الوقت */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>تحليل الوقت</Text>
              
              <View style={styles.timeAnalysisGrid}>
                <View style={styles.timeMetric}>
                  <Text style={[styles.timeValue, { color: colors.text }]}>{reportData.timeAnalysis.totalDays}</Text>
                  <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>إجمالي الأيام</Text>
                </View>
                
                <View style={styles.timeMetric}>
                  <Text style={[styles.timeValue, { color: colors.success }]}>{reportData.timeAnalysis.workingDays}</Text>
                  <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>أيام العمل</Text>
                </View>
                
                <View style={styles.timeMetric}>
                  <Text style={[styles.timeValue, { color: reportData.timeAnalysis.delayDays > 0 ? colors.error : colors.success }]}>
                    {reportData.timeAnalysis.delayDays}
                  </Text>
                  <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>أيام التأخير</Text>
                </View>
              </View>
              
              {reportData.timeAnalysis.estimatedCompletion && (
                <Text style={[styles.completionEstimate, { color: colors.primary }]}>
                  التاريخ المتوقع للإنجاز: {new Date(reportData.timeAnalysis.estimatedCompletion).toLocaleDateString('ar-SA')}
                </Text>
              )}
            </View>

            {/* مؤشرات الكفاءة */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>مؤشرات الكفاءة</Text>
              
              <View style={styles.efficiencyMetrics}>
                <View style={styles.efficiencyItem}>
                  <Text style={[styles.efficiencyLabel, { color: colors.text }]}>إنتاجية العمال</Text>
                  <View style={styles.efficiencyBar}>
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
                  <Text style={[styles.efficiencyLabel, { color: colors.text }]}>كفاءة المواد</Text>
                  <View style={styles.efficiencyBar}>
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
                  <Text style={[styles.efficiencyLabel, { color: colors.text }]}>استخدام المعدات</Text>
                  <View style={styles.efficiencyBar}>
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
          </View>
        )}

        {selectedReport === 'financial' && (
          <View>
            {/* التوزيع المالي */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>التوزيع المالي</Text>
              
              {renderSimplePieChart([
                { label: 'المواد', value: reportData.financialBreakdown.materialCosts, color: colors.primary },
                { label: 'العمالة', value: reportData.financialBreakdown.laborCosts, color: colors.success },
                { label: 'المعدات', value: reportData.financialBreakdown.equipmentCosts, color: colors.warning },
                { label: 'مصاريف متنوعة', value: reportData.financialBreakdown.miscExpenses, color: colors.error },
                { label: 'تكاليف إدارية', value: reportData.financialBreakdown.overheadCosts, color: colors.secondary },
              ])}
              
              <View style={styles.financialSummary}>
                <View style={styles.financialRow}>
                  <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>إجمالي التكاليف:</Text>
                  <Text style={[styles.financialValue, { color: colors.error }]}>
                    {formatCurrency(
                      reportData.financialBreakdown.materialCosts +
                      reportData.financialBreakdown.laborCosts +
                      reportData.financialBreakdown.equipmentCosts +
                      reportData.financialBreakdown.miscExpenses +
                      reportData.financialBreakdown.overheadCosts
                    )}
                  </Text>
                </View>
                
                <View style={[styles.financialRow, styles.profitRow]}>
                  <Text style={[styles.financialLabel, styles.profitLabel, { color: colors.text }]}>الربح/الخسارة:</Text>
                  <Text style={[
                    styles.financialValue, 
                    styles.profitValue, 
                    { color: reportData.financialBreakdown.profitLoss >= 0 ? colors.success : colors.error }
                  ]}>
                    {formatCurrency(reportData.financialBreakdown.profitLoss)}
                  </Text>
                </View>
              </View>
            </View>

            {/* تكلفة المتر المربع */}
            <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.metricTitle, { color: colors.text }]}>تكلفة المتر المربع</Text>
              <Text style={[styles.metricValue, { color: colors.primary }]}>
                {formatCurrency(reportData.projectMetrics.costPerSquareMeter)}
              </Text>
            </View>
          </View>
        )}

        {selectedReport === 'worker' && (
          <View>
            {/* تحليلات العمال */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>إحصائيات العمال</Text>
              
              <View style={styles.workerStats}>
                <View style={styles.workerStatItem}>
                  <Text style={[styles.workerStatValue, { color: colors.primary }]}>
                    {reportData.workerAnalytics.totalWorkers}
                  </Text>
                  <Text style={[styles.workerStatLabel, { color: colors.textSecondary }]}>إجمالي العمال</Text>
                </View>
                
                <View style={styles.workerStatItem}>
                  <Text style={[styles.workerStatValue, { color: colors.success }]}>
                    {formatPercentage(reportData.workerAnalytics.averageAttendance)}
                  </Text>
                  <Text style={[styles.workerStatLabel, { color: colors.textSecondary }]}>متوسط الحضور</Text>
                </View>
                
                <View style={styles.workerStatItem}>
                  <Text style={[styles.workerStatValue, { color: colors.warning }]}>
                    {reportData.workerAnalytics.productivityScore.toFixed(1)}
                  </Text>
                  <Text style={[styles.workerStatLabel, { color: colors.textSecondary }]}>نقاط الإنتاجية</Text>
                </View>
              </View>
            </View>

            {/* أفضل العمال */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>أفضل العمال</Text>
              
              {reportData.workerAnalytics.topPerformers.map((performer, index) => (
                <View key={index} style={styles.performerCard}>
                  <View style={styles.performerRank}>
                    <Text style={[styles.rankText, { color: colors.surface, backgroundColor: colors.primary }]}>
                      {index + 1}
                    </Text>
                  </View>
                  
                  <View style={styles.performerInfo}>
                    <Text style={[styles.performerName, { color: colors.text }]}>{performer.name}</Text>
                    <Text style={[styles.performerEfficiency, { color: colors.success }]}>
                      كفاءة: {formatPercentage(performer.efficiency)}
                    </Text>
                  </View>
                  
                  <Text style={[styles.performerEarnings, { color: colors.primary }]}>
                    {formatCurrency(performer.totalEarnings)}
                  </Text>
                </View>
              ))}
            </View>

            {/* توزيع المهارات */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>توزيع المهارات</Text>
              
              {reportData.workerAnalytics.skillDistribution.map((skill, index) => (
                <View key={index} style={styles.skillItem}>
                  <View style={styles.skillInfo}>
                    <Text style={[styles.skillName, { color: colors.text }]}>{skill.skill}</Text>
                    <Text style={[styles.skillCount, { color: colors.textSecondary }]}>
                      {skill.count} عامل
                    </Text>
                  </View>
                  
                  <Text style={[styles.skillWage, { color: colors.success }]}>
                    متوسط الأجر: {formatCurrency(skill.averageWage)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedReport === 'material' && (
          <View>
            {/* تحليلات المواد */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>إحصائيات المواد</Text>
              
              <View style={styles.materialStats}>
                <View style={styles.materialStatItem}>
                  <Text style={[styles.materialStatValue, { color: colors.primary }]}>
                    {formatCurrency(reportData.materialAnalytics.totalPurchases)}
                  </Text>
                  <Text style={[styles.materialStatLabel, { color: colors.textSecondary }]}>إجمالي المشتريات</Text>
                </View>
                
                <View style={styles.materialStatItem}>
                  <Text style={[styles.materialStatValue, { color: colors.error }]}>
                    {formatPercentage(reportData.materialAnalytics.wastePercentage)}
                  </Text>
                  <Text style={[styles.materialStatLabel, { color: colors.textSecondary }]}>نسبة الهدر</Text>
                </View>
                
                <View style={styles.materialStatItem}>
                  <Text style={[styles.materialStatValue, { color: colors.success }]}>
                    {formatPercentage(reportData.materialAnalytics.costEfficiency)}
                  </Text>
                  <Text style={[styles.materialStatLabel, { color: colors.textSecondary }]}>كفاءة التكلفة</Text>
                </View>
              </View>
            </View>

            {/* أفضل الموردين */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>أفضل الموردين</Text>
              
              {reportData.materialAnalytics.topSuppliers.map((supplier, index) => (
                <View key={index} style={styles.supplierCard}>
                  <View style={styles.supplierInfo}>
                    <Text style={[styles.supplierName, { color: colors.text }]}>{supplier.name}</Text>
                    <Text style={[styles.supplierReliability, { color: colors.success }]}>
                      موثوقية: {formatPercentage(supplier.reliability)}
                    </Text>
                  </View>
                  
                  <Text style={[styles.supplierPurchases, { color: colors.primary }]}>
                    {formatCurrency(supplier.totalPurchases)}
                  </Text>
                </View>
              ))}
            </View>

            {/* استخدام المواد */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>استخدام المواد</Text>
              
              {reportData.materialAnalytics.materialUsage.map((material, index) => (
                <View key={index} style={styles.materialUsageItem}>
                  <View style={styles.materialUsageInfo}>
                    <Text style={[styles.materialUsageName, { color: colors.text }]}>{material.material}</Text>
                    <Text style={[styles.materialUsageQuantity, { color: colors.textSecondary }]}>
                      الكمية: {material.quantity.toLocaleString('ar-SA')}
                    </Text>
                  </View>
                  
                  <View style={styles.materialUsageMetrics}>
                    <Text style={[styles.materialUsageCost, { color: colors.error }]}>
                      {formatCurrency(material.cost)}
                    </Text>
                    <Text style={[styles.materialUsageEfficiency, { color: colors.success }]}>
                      كفاءة: {formatPercentage(material.efficiency)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedReport === 'risk' && (
          <View>
            {/* تقييم المخاطر */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>تقييم المخاطر</Text>
              
              <View style={styles.riskAssessment}>
                <View style={styles.riskItem}>
                  <Text style={[styles.riskLabel, { color: colors.text }]}>مخاطر الميزانية</Text>
                  <Text style={[styles.riskValue, { color: getRiskColor(reportData.riskAssessment.budgetRisk) }]}>
                    {getRiskText(reportData.riskAssessment.budgetRisk)}
                  </Text>
                </View>
                
                <View style={styles.riskItem}>
                  <Text style={[styles.riskLabel, { color: colors.text }]}>مخاطر الجدولة</Text>
                  <Text style={[styles.riskValue, { color: getRiskColor(reportData.riskAssessment.timelineRisk) }]}>
                    {getRiskText(reportData.riskAssessment.timelineRisk)}
                  </Text>
                </View>
                
                <View style={styles.riskItem}>
                  <Text style={[styles.riskLabel, { color: colors.text }]}>مخاطر الجودة</Text>
                  <Text style={[styles.riskValue, { color: getRiskColor(reportData.riskAssessment.qualityRisk) }]}>
                    {getRiskText(reportData.riskAssessment.qualityRisk)}
                  </Text>
                </View>
                
                <View style={styles.riskItem}>
                  <Text style={[styles.riskLabel, { color: colors.text }]}>مخاطر الموارد</Text>
                  <Text style={[styles.riskValue, { color: getRiskColor(reportData.riskAssessment.resourceRisk) }]}>
                    {getRiskText(reportData.riskAssessment.resourceRisk)}
                  </Text>
                </View>
              </View>
            </View>

            {/* القضايا الحرجة */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>القضايا الحرجة</Text>
              
              {reportData.riskAssessment.criticalIssues.map((issue, index) => (
                <View key={index} style={[styles.issueCard, { borderColor: getRiskColor(issue.severity) }]}>
                  <View style={styles.issueHeader}>
                    <Text style={[styles.issueTitle, { color: colors.text }]}>{issue.issue}</Text>
                    <Text style={[styles.issueSeverity, { color: getRiskColor(issue.severity) }]}>
                      {getRiskText(issue.severity)}
                    </Text>
                  </View>
                  
                  <Text style={[styles.issueImpact, { color: colors.textSecondary }]}>
                    التأثير: {issue.impact}
                  </Text>
                  
                  <Text style={[styles.issueSolution, { color: colors.text }]}>
                    الحل المقترح: {issue.solution}
                  </Text>
                </View>
              ))}
            </View>

            {/* التوصيات */}
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>التوصيات</Text>
              
              {reportData.riskAssessment.recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={[styles.recommendationText, { color: colors.text }]}>
                    • {recommendation}
                  </Text>
                </View>
              ))}
            </View>
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
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
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
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  kpiContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  kpiLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  timeAnalysisGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  timeMetric: {
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
  },
  completionEstimate: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  efficiencyMetrics: {
    gap: 12,
  },
  efficiencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  efficiencyLabel: {
    fontSize: 14,
    width: 100,
  },
  efficiencyBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
  },
  efficiencyFill: {
    height: '100%',
    borderRadius: 4,
  },
  efficiencyValue: {
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  chartContainer: {
    marginVertical: 12,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  chartLabel: {
    fontSize: 14,
  },
  financialSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  financialLabel: {
    fontSize: 14,
  },
  financialValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  profitRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 8,
    marginTop: 8,
  },
  profitLabel: {
    fontWeight: 'bold',
  },
  profitValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  metricCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  workerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  workerStatItem: {
    alignItems: 'center',
  },
  workerStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  workerStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  performerRank: {
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 32,
    height: 32,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 16,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  performerEfficiency: {
    fontSize: 12,
  },
  performerEarnings: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  skillItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  skillCount: {
    fontSize: 12,
  },
  skillWage: {
    fontSize: 12,
    fontWeight: '600',
  },
  materialStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  materialStatItem: {
    alignItems: 'center',
  },
  materialStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  materialStatLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  supplierCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  supplierReliability: {
    fontSize: 12,
  },
  supplierPurchases: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  materialUsageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  materialUsageInfo: {
    flex: 1,
  },
  materialUsageName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  materialUsageQuantity: {
    fontSize: 12,
  },
  materialUsageMetrics: {
    alignItems: 'flex-end',
  },
  materialUsageCost: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  materialUsageEfficiency: {
    fontSize: 12,
  },
  riskAssessment: {
    gap: 12,
  },
  riskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 14,
  },
  riskValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  issueCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  issueSeverity: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  issueImpact: {
    fontSize: 12,
    marginBottom: 8,
  },
  issueSolution: {
    fontSize: 12,
  },
  recommendationItem: {
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
  },
});