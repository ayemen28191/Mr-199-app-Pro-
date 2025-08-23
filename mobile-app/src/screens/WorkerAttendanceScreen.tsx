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
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import supabase from '../services/supabaseClient';

interface Worker {
  id: string;
  name: string;
  type: string;
  dailyWage: string;
  isActive: boolean;
  phone?: string;
}

interface AttendanceData {
  [workerId: string]: {
    isPresent: boolean;
    startTime?: string;
    endTime?: string;
    workDescription?: string;
    workDays?: number;
    paidAmount?: string;
    paymentType?: string;
  };
}

export default function WorkerAttendanceScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // بيانات الحضور للعامل المحدد
  const [workerDetails, setWorkerDetails] = useState({
    startTime: '07:00',
    endTime: '15:00',
    workDescription: '',
    workDays: '1.0',
    paidAmount: '',
    paymentType: 'partial' as 'partial' | 'full',
  });

  // تحميل العمال
  const loadWorkers = async () => {
    if (!selectedProjectId) return;
    
    try {
      const response = await fetch('/api/workers');
      if (response.ok) {
        const workersData = await response.json();
        setWorkers(workersData.filter((worker: Worker) => worker.isActive));
      }
    } catch (error) {
      console.error('خطأ في تحميل العمال:', error);
      Alert.alert('خطأ', 'فشل في تحميل قائمة العمال');
    } finally {
      setLoading(false);
    }
  };

  // تحميل بيانات الحضور للتاريخ المحدد
  const loadAttendanceData = async () => {
    if (!selectedProjectId) return;
    
    try {
      const response = await fetch(`/api/projects/${selectedProjectId}/attendance?date=${selectedDate}`);
      if (response.ok) {
        const attendanceList = await response.json();
        const attendanceMap: AttendanceData = {};
        
        attendanceList.forEach((attendance: any) => {
          attendanceMap[attendance.workerId] = {
            isPresent: true,
            startTime: attendance.startTime,
            endTime: attendance.endTime,
            workDescription: attendance.workDescription,
            workDays: parseFloat(attendance.workDays),
            paidAmount: attendance.paidAmount?.toString(),
            paymentType: attendance.paymentType,
          };
        });
        
        setAttendanceData(attendanceMap);
      }
    } catch (error) {
      console.error('خطأ في تحميل بيانات الحضور:', error);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, [selectedProjectId]);

  useEffect(() => {
    loadAttendanceData();
  }, [selectedProjectId, selectedDate]);

  // تبديل حالة الحضور
  const toggleAttendance = (workerId: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        isPresent: !prev[workerId]?.isPresent,
      }
    }));
  };

  // فتح تفاصيل العامل
  const openWorkerDetails = (worker: Worker) => {
    setSelectedWorker(worker);
    const existingData = attendanceData[worker.id];
    if (existingData) {
      setWorkerDetails({
        startTime: existingData.startTime || '07:00',
        endTime: existingData.endTime || '15:00',
        workDescription: existingData.workDescription || '',
        workDays: existingData.workDays?.toString() || '1.0',
        paidAmount: existingData.paidAmount || '',
        paymentType: existingData.paymentType || 'partial',
      });
    } else {
      setWorkerDetails({
        startTime: '07:00',
        endTime: '15:00',
        workDescription: '',
        workDays: '1.0',
        paidAmount: '',
        paymentType: 'partial',
      });
    }
    setModalVisible(true);
  };

  // حفظ تفاصيل العامل
  const saveWorkerDetails = () => {
    if (!selectedWorker) return;

    setAttendanceData(prev => ({
      ...prev,
      [selectedWorker.id]: {
        isPresent: true,
        startTime: workerDetails.startTime,
        endTime: workerDetails.endTime,
        workDescription: workerDetails.workDescription,
        workDays: parseFloat(workerDetails.workDays),
        paidAmount: workerDetails.paidAmount,
        paymentType: workerDetails.paymentType,
      }
    }));
    
    setModalVisible(false);
  };

  // حفظ جميع بيانات الحضور
  const saveAllAttendance = async () => {
    if (!selectedProjectId) {
      Alert.alert('خطأ', 'يرجى اختيار مشروع أولاً');
      return;
    }

    setSaving(true);
    
    try {
      const attendanceList = Object.entries(attendanceData)
        .filter(([_, data]) => data.isPresent)
        .map(([workerId, data]) => ({
          workerId,
          projectId: selectedProjectId,
          date: selectedDate,
          startTime: data.startTime,
          endTime: data.endTime,
          workDescription: data.workDescription,
          workDays: data.workDays?.toString() || '1.0',
          paidAmount: data.paidAmount ? parseFloat(data.paidAmount) : null,
          paymentType: data.paymentType || 'partial',
        }));

      const response = await fetch('/api/worker-attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceList),
      });

      if (response.ok) {
        Alert.alert('نجح الحفظ', 'تم حفظ بيانات الحضور بنجاح');
      } else {
        throw new Error('فشل في الحفظ');
      }
    } catch (error) {
      console.error('خطأ في حفظ الحضور:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ بيانات الحضور');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>جاري تحميل العمال...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* عنوان الشاشة */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>تسجيل حضور العمال</Text>
        <TextInput
          style={[styles.dateInput, { 
            backgroundColor: colors.surface, 
            color: colors.text,
            borderColor: colors.border 
          }]}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="تاريخ الحضور"
        />
      </View>

      {/* قائمة العمال */}
      <ScrollView style={styles.scrollView}>
        {workers.map((worker) => {
          const isPresent = attendanceData[worker.id]?.isPresent || false;
          const hasDetails = attendanceData[worker.id]?.startTime || attendanceData[worker.id]?.workDescription;
          
          return (
            <View key={worker.id} style={[styles.workerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.workerInfo}>
                <Text style={[styles.workerName, { color: colors.text }]}>{worker.name}</Text>
                <Text style={[styles.workerType, { color: colors.textSecondary }]}>
                  {worker.type} • {worker.dailyWage} ر.س
                </Text>
                {hasDetails && (
                  <Text style={[styles.detailsIndicator, { color: colors.success }]}>
                    ✓ تم إضافة التفاصيل
                  </Text>
                )}
              </View>
              
              <View style={styles.workerActions}>
                <Switch
                  value={isPresent}
                  onValueChange={() => toggleAttendance(worker.id)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={isPresent ? colors.surface : colors.textSecondary}
                />
                
                {isPresent && (
                  <TouchableOpacity
                    style={[styles.detailsButton, { backgroundColor: colors.primary }]}
                    onPress={() => openWorkerDetails(worker)}
                  >
                    <Text style={[styles.detailsButtonText, { color: colors.surface }]}>
                      تفاصيل
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* زر الحفظ */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={saveAllAttendance}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.surface} />
        ) : (
          <Text style={[styles.saveButtonText, { color: colors.surface }]}>
            حفظ الحضور ({Object.values(attendanceData).filter(data => data.isPresent).length})
          </Text>
        )}
      </TouchableOpacity>

      {/* نموذج تفاصيل العامل */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                تفاصيل حضور: {selectedWorker?.name}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>وقت البداية</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={workerDetails.startTime}
                  onChangeText={(text) => setWorkerDetails(prev => ({ ...prev, startTime: text }))}
                  placeholder="07:00"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>وقت النهاية</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={workerDetails.endTime}
                  onChangeText={(text) => setWorkerDetails(prev => ({ ...prev, endTime: text }))}
                  placeholder="15:00"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>أيام العمل</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={workerDetails.workDays}
                  onChangeText={(text) => setWorkerDetails(prev => ({ ...prev, workDays: text }))}
                  placeholder="1.0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>المبلغ المدفوع (اختياري)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={workerDetails.paidAmount}
                  onChangeText={(text) => setWorkerDetails(prev => ({ ...prev, paidAmount: text }))}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>وصف العمل</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={workerDetails.workDescription}
                  onChangeText={(text) => setWorkerDetails(prev => ({ ...prev, workDescription: text }))}
                  placeholder="وصف العمل المنجز..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.paymentTypeGroup}>
                <Text style={[styles.label, { color: colors.text }]}>نوع الدفع</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setWorkerDetails(prev => ({ ...prev, paymentType: 'partial' }))}
                  >
                    <View style={[styles.radioButton, { borderColor: colors.border }]}>
                      {workerDetails.paymentType === 'partial' && (
                        <View style={[styles.radioSelected, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                    <Text style={[styles.radioLabel, { color: colors.text }]}>دفع جزئي</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setWorkerDetails(prev => ({ ...prev, paymentType: 'full' }))}
                  >
                    <View style={[styles.radioButton, { borderColor: colors.border }]}>
                      {workerDetails.paymentType === 'full' && (
                        <View style={[styles.radioSelected, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                    <Text style={[styles.radioLabel, { color: colors.text }]}>دفع كامل</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.saveDetailsButton, { backgroundColor: colors.primary }]}
                onPress={saveWorkerDetails}
              >
                <Text style={[styles.saveDetailsButtonText, { color: colors.surface }]}>حفظ التفاصيل</Text>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  workerCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
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
    fontSize: 14,
    marginBottom: 4,
  },
  detailsIndicator: {
    fontSize: 12,
    fontWeight: '600',
  },
  workerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  paymentTypeGroup: {
    marginBottom: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 14,
  },
  modalActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  saveDetailsButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveDetailsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});