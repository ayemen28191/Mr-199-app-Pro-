import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';

interface Worker {
  id: string;
  name: string;
  type: string;
  phone: string;
  project: string;
  dailyWage: number;
  status: 'present' | 'absent' | 'leave';
}

const WorkersScreen = () => {
  const [workers] = useState<Worker[]>([
    {
      id: '1',
      name: 'أحمد محمد علي',
      type: 'عامل بناء',
      phone: '0551234567',
      project: 'مشروع إبار التحيتا',
      dailyWage: 200,
      status: 'present',
    },
    {
      id: '2',
      name: 'محمد أحمد حسن',
      type: 'مساعد ملحم',
      phone: '0559876543',
      project: 'مشروع البناء السكني',
      dailyWage: 180,
      status: 'present',
    },
    {
      id: '3',
      name: 'علي حسن محمد',
      type: 'سائق',
      phone: '0554567890',
      project: 'مشروع الطرق',
      dailyWage: 250,
      status: 'absent',
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#10b981';
      case 'absent':
        return '#dc2626';
      case 'leave':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'حاضر';
      case 'absent':
        return 'غائب';
      case 'leave':
        return 'إجازة';
      default:
        return 'غير محدد';
    }
  };

  const handleWorkerPress = (worker: Worker) => {
    setSelectedWorker(worker);
    Alert.alert(
      'تفاصيل العامل',
      `الاسم: ${worker.name}\nالنوع: ${worker.type}\nالهاتف: ${worker.phone}\nالمشروع: ${worker.project}\nالأجر اليومي: ${worker.dailyWage} ر.س`,
      [
        { text: 'إغلاق', style: 'cancel' },
        {
          text: 'تسجيل حضور',
          onPress: () => handleAttendance(worker.id, 'present'),
        },
        {
          text: 'تسجيل غياب',
          onPress: () => handleAttendance(worker.id, 'absent'),
        },
      ]
    );
  };

  const handleAttendance = (workerId: string, status: 'present' | 'absent') => {
    Alert.alert('تم التحديث', `تم تحديث حالة الحضور إلى: ${getStatusText(status)}`);
  };

  const handleAddWorker = () => {
    if (newWorkerName.trim()) {
      Alert.alert('تمت الإضافة', `تم إضافة عامل: ${newWorkerName}`);
      setNewWorkerName('');
      setModalVisible(false);
    } else {
      Alert.alert('خطأ', 'يرجى إدخال اسم العامل');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>إدارة العمال</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ إضافة عامل</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {workers.filter(w => w.status === 'present').length}
          </Text>
          <Text style={styles.statLabel}>حاضرين</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {workers.filter(w => w.status === 'absent').length}
          </Text>
          <Text style={styles.statLabel}>غائبين</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{workers.length}</Text>
          <Text style={styles.statLabel}>إجمالي العمال</Text>
        </View>
      </View>

      <ScrollView style={styles.workersList}>
        {workers.map((worker) => (
          <TouchableOpacity
            key={worker.id}
            style={styles.workerCard}
            onPress={() => handleWorkerPress(worker)}
          >
            <View style={styles.workerHeader}>
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <Text style={styles.workerType}>{worker.type}</Text>
                <Text style={styles.workerProject}>{worker.project}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(worker.status) },
                ]}
              >
                <Text style={styles.statusText}>{getStatusText(worker.status)}</Text>
              </View>
            </View>

            <View style={styles.workerDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>الهاتف:</Text>
                <Text style={styles.detailValue}>{worker.phone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>الأجر اليومي:</Text>
                <Text style={styles.wageValue}>{worker.dailyWage} ر.س</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal لإضافة عامل جديد */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>إضافة عامل جديد</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="اسم العامل"
              value={newWorkerName}
              onChangeText={setNewWorkerName}
              textAlign="right"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddWorker}
              >
                <Text style={styles.confirmButtonText}>إضافة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
    textAlign: 'center',
  },
  workersList: {
    flex: 1,
    padding: 15,
  },
  workerCard: {
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
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'right',
    marginBottom: 5,
  },
  workerType: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 3,
  },
  workerProject: {
    fontSize: 14,
    color: '#2563eb',
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
  workerDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  wageValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1f2937',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'right',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  confirmButton: {
    backgroundColor: '#2563eb',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default WorkersScreen;