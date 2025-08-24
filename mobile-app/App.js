import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>نظام إدارة المشاريع</Text>
        <Text style={styles.headerSubtitle}>إدارة شاملة للمقاولات والعمال</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* بطاقات الميزات الرئيسية */}
        <View style={styles.cardsContainer}>
          
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>📊</Text>
            </View>
            <Text style={styles.cardTitle}>لوحة القيادة</Text>
            <Text style={styles.cardDescription}>عرض إحصائيات شاملة للمشاريع</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>🏗️</Text>
            </View>
            <Text style={styles.cardTitle}>إدارة المشاريع</Text>
            <Text style={styles.cardDescription}>متابعة جميع المشاريع الجارية</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>👷</Text>
            </View>
            <Text style={styles.cardTitle}>إدارة العمال</Text>
            <Text style={styles.cardDescription}>تسجيل الحضور والأجور</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>💰</Text>
            </View>
            <Text style={styles.cardTitle}>المصروفات اليومية</Text>
            <Text style={styles.cardDescription}>تتبع جميع النفقات والمشتريات</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>🏪</Text>
            </View>
            <Text style={styles.cardTitle}>إدارة الموردين</Text>
            <Text style={styles.cardDescription}>متابعة حسابات الموردين</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>📋</Text>
            </View>
            <Text style={styles.cardTitle}>التقارير</Text>
            <Text style={styles.cardDescription}>تقارير مفصلة وتصدير البيانات</Text>
          </TouchableOpacity>
        </View>

        {/* معلومات إضافية */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>مرحباً بك في نظام إدارة المشاريع</Text>
          <Text style={styles.infoText}>
            نظام شامل لإدارة المشاريع الإنشائية ومتابعة العمال والمصروفات اليومية
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    textAlign: 'center',
    marginTop: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  cardsContainer: {
    paddingVertical: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    width: '48%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardIconText: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});
