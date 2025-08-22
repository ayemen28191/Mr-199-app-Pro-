import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

const ReportsScreen = () => {
  const reports = [
    {
      id: '1',
      title: 'تقرير المشاريع الشهري',
      description: 'تقرير شامل عن جميع المشاريع خلال الشهر الحالي',
      icon: '📊',
      color: '#2563eb',
    },
    {
      id: '2',
      title: 'تقرير حضور العمال',
      description: 'تقرير مفصل عن حضور وغياب العمال',
      icon: '👷',
      color: '#10b981',
    },
    {
      id: '3',
      title: 'تقرير المصروفات',
      description: 'تقرير المصروفات اليومية والشهرية',
      icon: '💰',
      color: '#f59e0b',
    },
    {
      id: '4',
      title: 'تقرير المعدات',
      description: 'حالة واستخدام المعدات والأدوات',
      icon: '🔧',
      color: '#8b5cf6',
    },
    {
      id: '5',
      title: 'تقرير الموردين',
      description: 'تقرير المشتريات والموردين',
      icon: '🏪',
      color: '#06b6d4',
    },
    {
      id: '6',
      title: 'التقارير المالية',
      description: 'الميزانية والأرباح والخسائر',
      icon: '📈',
      color: '#dc2626',
    },
  ];

  const handleReportPress = (report: any) => {
    Alert.alert(
      report.title,
      `سيتم إنشاء وعرض ${report.title}\n\n${report.description}`,
      [
        { text: 'إغلاق', style: 'cancel' },
        { text: 'عرض التقرير', onPress: () => Alert.alert('عرض التقرير', 'جاري إنشاء التقرير...') },
        { text: 'تصدير PDF', onPress: () => Alert.alert('تصدير', 'سيتم تصدير التقرير كملف PDF') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>التقارير والإحصائيات</Text>
      </View>

      <ScrollView style={styles.reportsList}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>ملخص سريع</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>5</Text>
              <Text style={styles.summaryLabel}>مشاريع نشطة</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>24</Text>
              <Text style={styles.summaryLabel}>عامل</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>156</Text>
              <Text style={styles.summaryLabel}>معدة</Text>
            </View>
          </View>
          <View style={styles.summaryFinancial}>
            <Text style={styles.financialTitle}>الوضع المالي</Text>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>إجمالي الميزانية:</Text>
              <Text style={styles.financialValue}>1,600,000 ر.س</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>إجمالي المصروفات:</Text>
              <Text style={styles.spentValue}>779,800 ر.س</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>المتبقي:</Text>
              <Text style={styles.remainingValue}>820,200 ر.س</Text>
            </View>
          </View>
        </View>

        <View style={styles.reportsGrid}>
          {reports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={[styles.reportCard, { borderLeftColor: report.color }]}
              onPress={() => handleReportPress(report)}
            >
              <View style={styles.reportHeader}>
                <Text style={[styles.reportIcon, { color: report.color }]}>
                  {report.icon}
                </Text>
                <Text style={styles.reportTitle}>{report.title}</Text>
              </View>
              <Text style={styles.reportDescription}>{report.description}</Text>
              <TouchableOpacity
                style={[styles.viewButton, { backgroundColor: report.color }]}
                onPress={() => handleReportPress(report)}
              >
                <Text style={styles.viewButtonText}>عرض التقرير</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  reportsList: {
    flex: 1,
    padding: 15,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 15,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  summaryFinancial: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 15,
  },
  financialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  financialLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  financialValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  spentValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  remainingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  reportsGrid: {
    gap: 15,
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
  },
  reportDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 15,
    lineHeight: 20,
  },
  viewButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  viewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ReportsScreen;