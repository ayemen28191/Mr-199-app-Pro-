import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

interface Equipment {
  id: string;
  name: string;
  category: string;
  location: string;
  status: 'available' | 'in_use' | 'maintenance';
  project?: string;
}

const EquipmentScreen = () => {
  const [equipment] = useState<Equipment[]>([
    {
      id: '1',
      name: 'حفارة كاتربيلار 320',
      category: 'معدات حفر',
      location: 'موقع مشروع إبار التحيتا',
      status: 'in_use',
      project: 'مشروع إبار التحيتا',
    },
    {
      id: '2',
      name: 'خلاطة خرسانة متنقلة',
      category: 'معدات خرسانة',
      location: 'المستودع الرئيسي',
      status: 'available',
    },
    {
      id: '3',
      name: 'رافعة شوكية تويوتا',
      category: 'معدات رفع',
      location: 'مشروع البناء السكني',
      status: 'in_use',
      project: 'مشروع البناء السكني',
    },
    {
      id: '4',
      name: 'مولد كهرباء 500 كيلو',
      category: 'معدات كهربائية',
      location: 'ورشة الصيانة',
      status: 'maintenance',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#10b981';
      case 'in_use':
        return '#f59e0b';
      case 'maintenance':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'متاح';
      case 'in_use':
        return 'قيد الاستخدام';
      case 'maintenance':
        return 'تحت الصيانة';
      default:
        return 'غير محدد';
    }
  };

  const handleEquipmentPress = (item: Equipment) => {
    Alert.alert(
      'تفاصيل المعدة',
      `الاسم: ${item.name}\nالفئة: ${item.category}\nالموقع: ${item.location}\nالحالة: ${getStatusText(item.status)}${item.project ? `\nالمشروع: ${item.project}` : ''}`,
      [
        { text: 'إغلاق', style: 'cancel' },
        {
          text: 'نقل المعدة',
          onPress: () => Alert.alert('نقل المعدة', 'سيتم فتح نموذج نقل المعدة'),
        },
      ]
    );
  };

  const availableCount = equipment.filter(e => e.status === 'available').length;
  const inUseCount = equipment.filter(e => e.status === 'in_use').length;
  const maintenanceCount = equipment.filter(e => e.status === 'maintenance').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>إدارة المعدات</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('إضافة معدة', 'سيتم فتح نموذج إضافة معدة جديدة')}
        >
          <Text style={styles.addButtonText}>+ إضافة معدة</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>
            {availableCount}
          </Text>
          <Text style={styles.statLabel}>متاح</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
            {inUseCount}
          </Text>
          <Text style={styles.statLabel}>قيد الاستخدام</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#dc2626' }]}>
            {maintenanceCount}
          </Text>
          <Text style={styles.statLabel}>تحت الصيانة</Text>
        </View>
      </View>

      <ScrollView style={styles.equipmentList}>
        {equipment.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.equipmentCard}
            onPress={() => handleEquipmentPress(item)}
          >
            <View style={styles.equipmentHeader}>
              <View style={styles.equipmentInfo}>
                <Text style={styles.equipmentName}>{item.name}</Text>
                <Text style={styles.equipmentCategory}>{item.category}</Text>
                <Text style={styles.equipmentLocation}>📍 {item.location}</Text>
                {item.project && (
                  <Text style={styles.equipmentProject}>🏗️ {item.project}</Text>
                )}
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              >
                <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  statCard: {
    alignItems: 'center',
    padding: 15,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
    textAlign: 'center',
  },
  equipmentList: {
    flex: 1,
    padding: 15,
  },
  equipmentCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'right',
    marginBottom: 5,
  },
  equipmentCategory: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 5,
  },
  equipmentLocation: {
    fontSize: 14,
    color: '#2563eb',
    textAlign: 'right',
    marginBottom: 3,
  },
  equipmentProject: {
    fontSize: 14,
    color: '#10b981',
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default EquipmentScreen;