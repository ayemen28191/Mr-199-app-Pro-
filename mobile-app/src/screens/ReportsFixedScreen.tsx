import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ProjectContext } from '../context/ProjectContext';
import { supabase } from '../services/supabaseClient';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'financial' | 'operational' | 'analytical' | 'administrative';
}

interface GeneratedReport {
  id: string;
  type: string;
  title: string;
  generatedAt: string;
  dataPoints: number;
  fileSize: string;
  status: 'ready' | 'generating' | 'error';
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('SAR', 'ريال');
};

const ReportsFixedScreen: React.FC = () => {
  const { selectedProject } = useContext(ProjectContext);
  const [reportTypes] = useState<ReportType[]>([
    {
      id: 'financial_summary',
      name: 'الملخص المالي',
      description: 'تقرير شامل للوضع المالي للمشروع',
      icon: 'account-balance',
      color: '#3B82F6',
      category: 'financial'
    },
    {
      id: 'worker_performance',
      name: 'أداء العمال',
      description: 'تقرير مفصل عن حضور وأداء العمال',
      icon: 'people',
      color: '#10B981',
      category: 'operational'
    },
    {
      id: 'material_consumption',
      name: 'استهلاك المواد',
      description: 'تحليل استهلاك المواد والمخزون',
      icon: 'build',
      color: '#F59E0B',
      category: 'operational'
    },
    {
      id: 'cost_analysis',
      name: 'تحليل التكاليف',
      description: 'تحليل مفصل لتوزيع التكاليف',
      icon: 'pie-chart',
      color: '#8B5CF6',
      category: 'analytical'
    },
    {
      id: 'progress_tracking',
      name: 'تتبع التقدم',
      description: 'تقرير تقدم العمل والمهام المنجزة',
      icon: 'trending-up',
      color: '#EF4444',
      category: 'operational'
    },
    {
      id: 'supplier_analysis',
      name: 'تحليل الموردين',
      description: 'تقييم أداء الموردين والمشتريات',
      icon: 'store',
      color: '#06B6D4',
      category: 'analytical'
    },
    {
      id: 'daily_expenses',
      name: 'المصروفات اليومية',
      description: 'تقرير مفصل للمصروفات اليومية',
      icon: 'receipt',
      color: '#84CC16',
      category: 'financial'
    },
    {
      id: 'project_timeline',
      name: 'الجدول الزمني',
      description: 'تقرير الجدول الزمني والمواعيد النهائية',
      icon: 'schedule',
      color: '#F97316',
      category: 'administrative'
    }
  ]);

  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchGeneratedReports = async () => {
    try {
      setLoading(true);
      
      if (!selectedProject?.id) {
        setGeneratedReports([]);
        return;
      }

      // محاكاة جلب التقارير المُولدة مسبقاً
      // في التطبيق الحقيقي، ستأتي هذه من قاعدة البيانات
      const mockReports: GeneratedReport[] = [
        {
          id: '1',
          type: 'financial_summary',
          title: 'الملخص المالي - أغسطس 2025',
          generatedAt: '2025-08-23T10:30:00Z',
          dataPoints: 145,
          fileSize: '2.3 MB',
          status: 'ready'
        },
        {
          id: '2',
          type: 'worker_performance',
          title: 'تقرير أداء العمال - الأسبوع الثالث',
          generatedAt: '2025-08-22T14:15:00Z',
          dataPoints: 89,
          fileSize: '1.7 MB',
          status: 'ready'
        },
        {
          id: '3',
          type: 'material_consumption',
          title: 'استهلاك المواد - يوليو 2025',
          generatedAt: '2025-08-21T09:45:00Z',
          dataPoints: 67,
          fileSize: '1.2 MB',
          status: 'ready'
        }
      ];

      setGeneratedReports(mockReports);
    } catch (error) {
      console.error('خطأ في جلب التقارير:', error);
      Alert.alert('خطأ', 'فشل في تحميل التقارير المُولدة');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateReport = async (reportType: ReportType) => {
    try {
      if (!selectedProject?.id) {
        Alert.alert('خطأ', 'يرجى اختيار مشروع أولاً');
        return;
      }

      Alert.alert(
        'توليد التقرير',
        `سيتم توليد تقرير "${reportType.name}" للفترة من ${dateRange.startDate} إلى ${dateRange.endDate}`,
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'توليد',
            onPress: async () => {
              setShowGenerateModal(false);
              
              // إضافة تقرير جديد في حالة "قيد التوليد"
              const newReport: GeneratedReport = {
                id: Date.now().toString(),
                type: reportType.id,
                title: `${reportType.name} - ${new Date().toLocaleDateString('ar-SA')}`,
                generatedAt: new Date().toISOString(),
                dataPoints: 0,
                fileSize: '0 MB',
                status: 'generating'
              };

              setGeneratedReports(prev => [newReport, ...prev]);

              // محاكاة عملية التوليد
              setTimeout(() => {
                setGeneratedReports(prev => 
                  prev.map(report => 
                    report.id === newReport.id 
                      ? { ...report, status: 'ready', dataPoints: Math.floor(Math.random() * 200) + 50, fileSize: `${(Math.random() * 3 + 0.5).toFixed(1)} MB` }
                      : report
                  )
                );
                Alert.alert('نجح التوليد', `تم توليد تقرير "${reportType.name}" بنجاح`);
              }, 3000);
            }
          }
        ]
      );
    } catch (error) {
      console.error('خطأ في توليد التقرير:', error);
      Alert.alert('خطأ', 'فشل في توليد التقرير');
    }
  };

  const downloadReport = (report: GeneratedReport) => {
    Alert.alert(
      'تحميل التقرير',
      `سيتم تحميل "${report.title}"`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تحميل', onPress: () => console.log('تم تحميل التقرير:', report.id) }
      ]
    );
  };

  const shareReport = (report: GeneratedReport) => {
    Alert.alert(
      'مشاركة التقرير',
      `سيتم مشاركة "${report.title}"`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'مشاركة', onPress: () => console.log('تم مشاركة التقرير:', report.id) }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGeneratedReports();
  };

  useEffect(() => {
    fetchGeneratedReports();
  }, [selectedProject]);

  const filteredReportTypes = selectedCategory === 'all' 
    ? reportTypes 
    : reportTypes.filter(type => type.category === selectedCategory);

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'financial': return 'مالية';
      case 'operational': return 'تشغيلية';
      case 'analytical': return 'تحليلية';
      case 'administrative': return 'إدارية';
      default: return 'جميع التقارير';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#10B981';
      case 'generating': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'جاهز';
      case 'generating': return 'قيد التوليد';
      case 'error': return 'خطأ';
      default: return 'غير معروف';
    }
  };

  const renderReportType = ({ item }: { item: ReportType }) => (
    <TouchableOpacity
      style={styles.reportTypeCard}
      onPress={() => {
        setSelectedReportType(item);
        setShowGenerateModal(true);
      }}
    >
      <View style={[styles.reportTypeIcon, { backgroundColor: item.color + '20' }]}>
        <Icon name={item.icon} size={24} color={item.color} />
      </View>
      <View style={styles.reportTypeInfo}>
        <Text style={styles.reportTypeName}>{item.name}</Text>
        <Text style={styles.reportTypeDescription}>{item.description}</Text>
        <Text style={styles.reportTypeCategory}>{getCategoryName(item.category)}</Text>
      </View>
      <Icon name="add-circle" size={24} color={item.color} />
    </TouchableOpacity>
  );

  const renderGeneratedReport = ({ item }: { item: GeneratedReport }) => {
    const reportType = reportTypes.find(type => type.id === item.type);
    
    return (
      <View style={styles.generatedReportCard}>
        <View style={styles.generatedReportHeader}>
          <View style={styles.generatedReportInfo}>
            <View style={[styles.generatedReportIcon, { backgroundColor: reportType?.color + '20' || '#E5E7EB' }]}>
              <Icon name={reportType?.icon || 'description'} size={20} color={reportType?.color || '#6B7280'} />
            </View>
            <View style={styles.generatedReportDetails}>
              <Text style={styles.generatedReportTitle}>{item.title}</Text>
              <Text style={styles.generatedReportMeta}>
                {new Date(item.generatedAt).toLocaleDateString('ar-SA')} • {item.dataPoints} نقطة بيانات • {item.fileSize}
              </Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Icon name="circle" size={8} color={getStatusColor(item.status)} />
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {getStatusText(item.status)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {item.status === 'ready' && (
            <View style={styles.reportActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => downloadReport(item)}
              >
                <Icon name="file-download" size={16} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => shareReport(item)}
              >
                <Icon name="share" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}
          
          {item.status === 'generating' && (
            <ActivityIndicator size="small" color="#F59E0B" />
          )}
        </View>
      </View>
    );
  };

  if (!selectedProject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="assessment" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>يرجى اختيار مشروع</Text>
          <Text style={styles.emptySubtitle}>اختر مشروعاً لعرض وتوليد التقارير</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>جاري تحميل التقارير...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>التقارير المحسنة</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
          <Icon name="refresh" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Project Info */}
      <View style={styles.projectInfo}>
        <Text style={styles.projectName}>{selectedProject.name}</Text>
        <Text style={styles.projectSubtitle}>مركز التقارير المتقدم</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Filter */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {[
              { value: 'all', label: 'الكل' },
              { value: 'financial', label: 'مالية' },
              { value: 'operational', label: 'تشغيلية' },
              { value: 'analytical', label: 'تحليلية' },
              { value: 'administrative', label: 'إدارية' }
            ].map((category) => (
              <TouchableOpacity
                key={category.value}
                style={[styles.categoryButton, selectedCategory === category.value && styles.selectedCategoryButton]}
                onPress={() => setSelectedCategory(category.value)}
              >
                <Text style={[styles.categoryButtonText, selectedCategory === category.value && styles.selectedCategoryButtonText]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Available Report Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>أنواع التقارير المتاحة</Text>
          <FlatList
            data={filteredReportTypes}
            renderItem={renderReportType}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>

        {/* Generated Reports */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>التقارير المُولدة</Text>
            <Text style={styles.reportCount}>{generatedReports.length} تقرير</Text>
          </View>
          
          {generatedReports.length === 0 ? (
            <View style={styles.emptyReports}>
              <Icon name="description" size={48} color="#9CA3AF" />
              <Text style={styles.emptyReportsTitle}>لا توجد تقارير مُولدة</Text>
              <Text style={styles.emptyReportsSubtitle}>
                ابدأ بتوليد أول تقرير باختيار نوع التقرير من الأعلى
              </Text>
            </View>
          ) : (
            <FlatList
              data={generatedReports}
              renderItem={renderGeneratedReport}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </ScrollView>

      {/* Generate Report Modal */}
      <Modal
        visible={showGenerateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenerateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>توليد تقرير جديد</Text>
              <TouchableOpacity 
                onPress={() => setShowGenerateModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedReportType && (
              <>
                <View style={styles.selectedReportInfo}>
                  <View style={[styles.selectedReportIcon, { backgroundColor: selectedReportType.color + '20' }]}>
                    <Icon name={selectedReportType.icon} size={32} color={selectedReportType.color} />
                  </View>
                  <Text style={styles.selectedReportName}>{selectedReportType.name}</Text>
                  <Text style={styles.selectedReportDescription}>{selectedReportType.description}</Text>
                </View>

                <View style={styles.dateInputs}>
                  <View style={styles.dateInputGroup}>
                    <Text style={styles.dateInputLabel}>من تاريخ</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={dateRange.startDate}
                      onChangeText={(text) => setDateRange({...dateRange, startDate: text})}
                      placeholder="YYYY-MM-DD"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.dateInputGroup}>
                    <Text style={styles.dateInputLabel}>إلى تاريخ</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={dateRange.endDate}
                      onChangeText={(text) => setDateRange({...dateRange, endDate: text})}
                      placeholder="YYYY-MM-DD"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.generateButton, { backgroundColor: selectedReportType.color }]}
                  onPress={() => generateReport(selectedReportType)}
                >
                  <Icon name="play-arrow" size={20} color="white" />
                  <Text style={styles.generateButtonText}>توليد التقرير</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  headerButton: {
    padding: 8,
  },
  projectInfo: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
  },
  projectSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  categoryContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryScroll: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectedCategoryButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  reportCount: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reportTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  reportTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reportTypeInfo: {
    flex: 1,
  },
  reportTypeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 4,
  },
  reportTypeDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 4,
  },
  reportTypeCategory: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  generatedReportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  generatedReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  generatedReportInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  generatedReportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  generatedReportDetails: {
    flex: 1,
  },
  generatedReportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 4,
  },
  generatedReportMeta: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 6,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  emptyReports: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyReportsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyReportsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  separator: {
    height: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 320,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  selectedReportInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  selectedReportIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedReportName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  selectedReportDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  dateInputs: {
    marginBottom: 24,
  },
  dateInputGroup: {
    marginBottom: 16,
  },
  dateInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ReportsFixedScreen;