import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Worker } from '../types';

export default function WorkersScreen() {
  const { colors } = useTheme();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWorker, setNewWorker] = useState({
    name: '',
    type: '',
    dailyWage: '',
  });

  // تحميل العمال
  const loadWorkers = async () => {
    try {
      const response = await fetch('/api/workers');
      if (response.ok) {
        const workersData = await response.json();
        setWorkers(workersData);
      }
    } catch (error) {
      console.error('خطأ في تحميل العمال:', error);
      Alert.alert('خطأ', 'فشل في تحميل العمال');
    } finally {
      setLoading(false);
    }
  };

  // إضافة عامل جديد
  const addWorker = async () => {
    if (!newWorker.name.trim() || !newWorker.type.trim() || !newWorker.dailyWage.trim()) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول');
      return;
    }

    try {
      const response = await fetch('/api/workers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newWorker.name.trim(),
          type: newWorker.type.trim(),
          dailyWage: parseFloat(newWorker.dailyWage),
          isActive: true,
        }),
      });

      if (response.ok) {
        setNewWorker({ name: '', type: '', dailyWage: '' });
        setShowAddModal(false);
        loadWorkers();
        Alert.alert('نجح', 'تم إضافة العامل بنجاح');
      } else {
        Alert.alert('خطأ', 'فشل في إضافة العامل');
      }
    } catch (error) {
      console.error('خطأ في إضافة العامل:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة العامل');
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  // بطاقة العامل
  const WorkerCard = ({ worker }: { worker: Worker }) => (
    <TouchableOpacity
      style={[styles.workerCard, { 
        backgroundColor: colors.surface, 
        borderColor: colors.border,
        opacity: worker.isActive ? 1 : 0.7,
      }]}
    >
      <View style={styles.workerHeader}>
        <View style={styles.workerInfo}>
          <Text style={[styles.workerName, { color: colors.text }]}>{worker.name}</Text>
          <Text style={[styles.workerType, { color: colors.textSecondary }]}>{worker.type}</Text>
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: worker.isActive ? colors.success : colors.warning 
        }]}>
          <Text style={styles.statusText}>
            {worker.isActive ? 'نشط' : 'غير نشط'}
          </Text>
        </View>
      </View>

      <View style={styles.workerFooter}>
        <View style={styles.wageInfo}>
          <Text style={[styles.wageLabel, { color: colors.textSecondary }]}>الأجر اليومي:</Text>
          <Text style={[styles.wageAmount, { color: colors.primary }]}>
            {parseFloat(worker.dailyWage).toLocaleString('ar-SA')} ر.س
          </Text>
        </View>
        <Text style={[styles.joinDate, { color: colors.textSecondary }]}>
          انضم في: {new Date(worker.createdAt).toLocaleDateString('ar-SA')}
        </Text>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* عنوان الصفحة مع زر الإضافة */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>إدارة العمال</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ إضافة عامل</Text>
        </TouchableOpacity>
      </View>

      {/* الإحصائيات */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.text }]}>{workers.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>إجمالي العمال</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.success }]}>
            {workers.filter(w => w.isActive).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>العمال النشطون</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {Math.round(workers.reduce((sum, w) => sum + parseFloat(w.dailyWage), 0) / workers.length || 0).toLocaleString('ar-SA')}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>متوسط الأجر</Text>
        </View>
      </View>

      {/* قائمة العمال */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {workers.map((worker) => (
          <WorkerCard key={worker.id} worker={worker} />
        ))}
      </ScrollView>

      {/* مودال إضافة عامل */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة عامل جديد</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="اسم العامل"
              placeholderTextColor={colors.textSecondary}
              value={newWorker.name}
              onChangeText={(text) => setNewWorker({...newWorker, name: text})}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="نوع العمل (مثل: عامل، معلم، مساعد)"
              placeholderTextColor={colors.textSecondary}
              value={newWorker.type}
              onChangeText={(text) => setNewWorker({...newWorker, type: text})}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="الأجر اليومي"
              placeholderTextColor={colors.textSecondary}
              value={newWorker.dailyWage}
              onChangeText={(text) => setNewWorker({...newWorker, dailyWage: text})}
              keyboardType="numeric"
              textAlign="right"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.surface }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.buttonText, { color: colors.textSecondary }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={addWorker}
              >
                <Text style={[styles.buttonText, { color: 'white' }]}>إضافة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  workerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  workerType: {
    fontSize: 14,
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
  workerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 8,
  },
  wageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  wageLabel: {
    fontSize: 14,
  },
  wageAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  joinDate: {
    fontSize: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  confirmButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});