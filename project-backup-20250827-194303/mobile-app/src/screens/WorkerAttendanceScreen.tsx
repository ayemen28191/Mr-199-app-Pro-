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
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import * as Icons from '../components/Icons';
import { AutocompleteInput } from '../components/AutocompleteInput';

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
    paymentType?: 'partial' | 'full' | 'none';
    overtimeHours?: number;
    breakTime?: string;
  };
}

interface AttendanceStats {
  totalWorkers: number;
  presentToday: number;
  absentToday: number;
  lateArrivals: number;
  totalHours: number;
  totalPayments: number;
}

export default function WorkerAttendanceScreen() {
  const { colors } = useTheme();
  const { selectedProjectId } = useProject();
  
  // State
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'present' | 'absent' | 'late'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Worker details form
  const [workerDetails, setWorkerDetails] = useState({
    startTime: '07:00',
    endTime: '15:00',
    workDescription: '',
    workDays: '1.0',
    paidAmount: '',
    paymentType: 'partial' as 'partial' | 'full' | 'none',
    overtimeHours: '0',
    breakTime: '60',
  });

  // Calculate statistics
  const calculateStats = (): AttendanceStats => {
    const present = Object.values(attendanceData).filter(data => data.isPresent).length;
    const late = Object.values(attendanceData).filter(data => 
      data.isPresent && data.startTime && data.startTime > '08:00'
    ).length;
    
    const totalHours = Object.values(attendanceData).reduce((sum, data) => {
      if (data.isPresent && data.startTime && data.endTime) {
        const start = new Date(`2000-01-01 ${data.startTime}`);
        const end = new Date(`2000-01-01 ${data.endTime}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return sum + Math.max(0, hours);
      }
      return sum;
    }, 0);

    const totalPayments = Object.values(attendanceData).reduce((sum, data) => {
      return sum + (data.paidAmount ? parseFloat(data.paidAmount) : 0);
    }, 0);

    return {
      totalWorkers: workers.length,
      presentToday: present,
      absentToday: workers.length - present,
      lateArrivals: late,
      totalHours,
      totalPayments,
    };
  };

  // Filter workers
  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worker.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const attendance = attendanceData[worker.id];
    switch (filterType) {
      case 'present':
        return attendance?.isPresent;
      case 'absent':
        return !attendance?.isPresent;
      case 'late':
        return attendance?.isPresent && attendance.startTime && attendance.startTime > '08:00';
      default:
        return true;
    }
  });

  // Generate date options for quick selection
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  // Load workers
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

  // Load attendance data
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
            overtimeHours: attendance.overtimeHours || 0,
            breakTime: attendance.breakTime || '60',
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

  // Toggle attendance
  const toggleAttendance = (workerId: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        isPresent: !prev[workerId]?.isPresent,
      }
    }));
  };

  // Open worker details
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
        overtimeHours: existingData.overtimeHours?.toString() || '0',
        breakTime: existingData.breakTime || '60',
      });
    } else {
      setWorkerDetails({
        startTime: '07:00',
        endTime: '15:00',
        workDescription: '',
        workDays: '1.0',
        paidAmount: '',
        paymentType: 'partial',
        overtimeHours: '0',
        breakTime: '60',
      });
    }
    setModalVisible(true);
  };

  // Save worker details
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
        overtimeHours: parseFloat(workerDetails.overtimeHours),
        breakTime: workerDetails.breakTime,
      }
    }));
    
    setModalVisible(false);
    Alert.alert('تم الحفظ', 'تم حفظ تفاصيل العامل بنجاح');
  };

  // Save all attendance
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
          overtimeHours: data.overtimeHours || 0,
          breakTime: data.breakTime || '60',
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

  // Reset form
  const resetForm = () => {
    setWorkerDetails({
      startTime: '07:00',
      endTime: '15:00',
      workDescription: '',
      workDays: '1.0',
      paidAmount: '',
      paymentType: 'partial',
      overtimeHours: '0',
      breakTime: '60',
    });
  };

  // Format time for display
  const formatTime = (time: string) => {
    return time || '--:--';
  };

  // Get attendance status color
  const getAttendanceStatusColor = (worker: Worker) => {
    const attendance = attendanceData[worker.id];
    if (!attendance?.isPresent) return colors.error;
    if (attendance.startTime && attendance.startTime > '08:00') return colors.warning;
    return colors.success;
  };

  // Get attendance status text
  const getAttendanceStatusText = (worker: Worker) => {
    const attendance = attendanceData[worker.id];
    if (!attendance?.isPresent) return 'غائب';
    if (attendance.startTime && attendance.startTime > '08:00') return 'متأخر';
    return 'حاضر';
  };

  const stats = calculateStats();

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
      {/* Header متطور مع Gradient */}
      <LinearGradient
        colors={[colors.primary, colors.secondary || colors.primary]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleSection}>
            <Text style={[styles.pageTitle, { color: colors.surface }]}>تسجيل حضور العمال</Text>
            <Text style={[styles.pageSubtitle, { color: colors.surface }]}>
              إدارة حضور وغياب العمال • {selectedDate}
            </Text>
          </View>

          {/* إحصائيات سريعة */}
          <View style={styles.quickStatsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.success + '20' }]}>
              <Icons.UserCheck size={20} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.success }]}>{stats.presentToday}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>حاضر</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.error + '20' }]}>
              <Icons.UserX size={20} color={colors.error} />
              <Text style={[styles.statValue, { color: colors.error }]}>{stats.absentToday}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>غائب</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.warning + '20' }]}>
              <Icons.Clock size={20} color={colors.warning} />
              <Text style={[styles.statValue, { color: colors.warning }]}>{stats.lateArrivals}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>متأخر</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.surface + '20' }]}>
              <Icons.Timer size={20} color={colors.surface} />
              <Text style={[styles.statValue, { color: colors.surface }]}>{stats.totalHours.toFixed(1)}</Text>
              <Text style={[styles.statLabel, { color: colors.surface }]}>ساعة</Text>
            </View>
          </View>

          {/* شريط التاريخ السريع */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.quickDateContainer}
          >
            {generateDateOptions().map((date) => (
              <TouchableOpacity
                key={date}
                style={[styles.quickDateButton, {
                  backgroundColor: selectedDate === date ? colors.surface : 'transparent',
                  borderColor: colors.surface
                }]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.quickDateText, {
                  color: selectedDate === date ? colors.primary : colors.surface
                }]}>
                  {new Date(date).toLocaleDateString('ar-SA', { 
                    weekday: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      {/* بحث وفلاتر */}
      <View style={[styles.searchFilterContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.searchContainer}>
          <Icons.Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="البحث عن عامل..."
            placeholderTextColor={colors.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.background }]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Icons.Filter size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* فلاتر متقدمة */}
      {showFilters && (
        <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>الحالة:</Text>
            {[
              { key: 'all', label: 'الكل', icon: 'Users' },
              { key: 'present', label: 'حاضر', icon: 'UserCheck' },
              { key: 'absent', label: 'غائب', icon: 'UserX' },
              { key: 'late', label: 'متأخر', icon: 'Clock' }
            ].map((filter) => {
              const IconComponent = Icons[filter.icon as keyof typeof Icons] as any;
              const isSelected = filterType === filter.key;
              
              return (
                <TouchableOpacity
                  key={filter.key}
                  style={[styles.filterChip, {
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border
                  }]}
                  onPress={() => setFilterType(filter.key as any)}
                >
                  <IconComponent size={14} color={isSelected ? colors.surface : colors.text} />
                  <Text style={[styles.filterChipText, {
                    color: isSelected ? colors.surface : colors.text
                  }]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* قائمة العمال */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {filteredWorkers.length === 0 ? (
            <View style={[styles.emptyStateContainer, { backgroundColor: colors.surface }]}>
              <Icons.Users size={80} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>لا توجد بيانات</Text>
              <Text style={[styles.emptyStateMessage, { color: colors.textSecondary }]}>
                {searchTerm || filterType !== 'all' ? 'لا توجد نتائج للبحث أو التصفية' : 'لم يتم إضافة عمال بعد'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredWorkers}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: worker }: { item: Worker }) => {
                const attendance = attendanceData[worker.id];
                const isPresent = attendance?.isPresent || false;
                const hasDetails = attendance?.startTime || attendance?.workDescription;
                
                return (
                  <View style={[styles.modernWorkerCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.workerCardHeader}>
                      <View style={styles.workerInfoSection}>
                        <View style={[styles.workerAvatar, { backgroundColor: colors.primary + '20' }]}>
                          <Icons.User size={24} color={colors.primary} />
                        </View>
                        <View style={styles.workerDetails}>
                          <Text style={[styles.modernWorkerName, { color: colors.text }]}>{worker.name}</Text>
                          <Text style={[styles.workerRole, { color: colors.textSecondary }]}>
                            {worker.type} • {worker.dailyWage} ر.س
                          </Text>
                          {hasDetails && (
                            <View style={styles.detailsIndicator}>
                              <Icons.CheckCircle size={14} color={colors.success} />
                              <Text style={[styles.detailsText, { color: colors.success }]}>
                                تم إضافة التفاصيل
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.attendanceSection}>
                        <View style={[styles.statusBadge, { backgroundColor: getAttendanceStatusColor(worker) + '20' }]}>
                          <Text style={[styles.statusText, { color: getAttendanceStatusColor(worker) }]}>
                            {getAttendanceStatusText(worker)}
                          </Text>
                        </View>
                        <Switch
                          value={isPresent}
                          onValueChange={() => toggleAttendance(worker.id)}
                          trackColor={{ false: colors.border, true: colors.primary }}
                          thumbColor={isPresent ? colors.surface : colors.textSecondary}
                        />
                      </View>
                    </View>
                    
                    {attendance?.isPresent && (
                      <View style={styles.attendanceInfo}>
                        <View style={styles.timeInfo}>
                          <View style={styles.timeItem}>
                            <Icons.Clock size={16} color={colors.textSecondary} />
                            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>البداية:</Text>
                            <Text style={[styles.timeValue, { color: colors.text }]}>
                              {formatTime(attendance.startTime || '')}
                            </Text>
                          </View>
                          
                          <View style={styles.timeItem}>
                            <Icons.ClockOff size={16} color={colors.textSecondary} />
                            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>النهاية:</Text>
                            <Text style={[styles.timeValue, { color: colors.text }]}>
                              {formatTime(attendance.endTime || '')}
                            </Text>
                          </View>
                          
                          {attendance.workDays && attendance.workDays !== 1 && (
                            <View style={styles.timeItem}>
                              <Icons.Calendar size={16} color={colors.textSecondary} />
                              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>أيام:</Text>
                              <Text style={[styles.timeValue, { color: colors.text }]}>
                                {attendance.workDays}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {isPresent && (
                      <View style={styles.workerActions}>
                        <TouchableOpacity
                          style={[styles.modernActionButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                          onPress={() => openWorkerDetails(worker)}
                        >
                          <Icons.Settings size={18} color={colors.primary} />
                          <Text style={[styles.modernActionText, { color: colors.primary }]}>
                            {hasDetails ? 'تعديل التفاصيل' : 'إضافة تفاصيل'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }}
            />
          )}
        </View>
      </ScrollView>

      {/* زر الحفظ العائم */}
      {Object.values(attendanceData).some(data => data.isPresent) && (
        <TouchableOpacity
          style={[styles.floatingSaveButton, { backgroundColor: colors.primary }]}
          onPress={saveAllAttendance}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <>
              <Icons.Save size={24} color={colors.surface} />
              <Text style={[styles.floatingSaveText, { color: colors.surface }]}>
                حفظ ({Object.values(attendanceData).filter(data => data.isPresent).length})
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* نموذج تفاصيل العامل */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                تفاصيل حضور: {selectedWorker?.name}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
              >
                <Icons.X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.timeSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>أوقات العمل</Text>
                
                <View style={styles.timeInputRow}>
                  <View style={styles.timeInputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>وقت البداية</Text>
                    <View style={[styles.timeInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Icons.Clock size={18} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.timeInput, { color: colors.text }]}
                        value={workerDetails.startTime}
                        onChangeText={(text: string) => setWorkerDetails(prev => ({ ...prev, startTime: text }))}
                        placeholder="07:00"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>

                  <View style={styles.timeInputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>وقت النهاية</Text>
                    <View style={[styles.timeInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Icons.ClockOff size={18} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.timeInput, { color: colors.text }]}
                        value={workerDetails.endTime}
                        onChangeText={(text: string) => setWorkerDetails(prev => ({ ...prev, endTime: text }))}
                        placeholder="15:00"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.timeInputRow}>
                  <View style={styles.timeInputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>ساعات إضافية</Text>
                    <View style={[styles.timeInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Icons.Timer size={18} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.timeInput, { color: colors.text }]}
                        value={workerDetails.overtimeHours}
                        onChangeText={(text: string) => setWorkerDetails(prev => ({ ...prev, overtimeHours: text }))}
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.timeInputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>استراحة (دقيقة)</Text>
                    <View style={[styles.timeInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Icons.Coffee size={18} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.timeInput, { color: colors.text }]}
                        value={workerDetails.breakTime}
                        onChangeText={(text: string) => setWorkerDetails(prev => ({ ...prev, breakTime: text }))}
                        placeholder="60"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.workSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>تفاصيل العمل</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>أيام العمل</Text>
                  <AutocompleteInput
                    value={workerDetails.workDays}
                    onChangeText={(text: string) => setWorkerDetails(prev => ({ ...prev, workDays: text }))}
                    placeholder="1.0"
                    category="worker_attendance_days"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>وصف العمل</Text>
                  <AutocompleteInput
                    value={workerDetails.workDescription}
                    onChangeText={(text: string) => setWorkerDetails(prev => ({ ...prev, workDescription: text }))}
                    placeholder="وصف العمل المنجز..."
                    category="worker_attendance_work_description"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              <View style={styles.paymentSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>معلومات الدفع</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>المبلغ المدفوع (اختياري)</Text>
                  <AutocompleteInput
                    value={workerDetails.paidAmount}
                    onChangeText={(text: string) => setWorkerDetails(prev => ({ ...prev, paidAmount: text }))}
                    placeholder="0"
                    category="worker_attendance_payment"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.paymentTypeContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>نوع الدفع</Text>
                  <View style={styles.paymentTypeGrid}>
                    {[
                      { key: 'none', label: 'بدون دفع', icon: 'X' },
                      { key: 'partial', label: 'دفع جزئي', icon: 'Minus' },
                      { key: 'full', label: 'دفع كامل', icon: 'Check' }
                    ].map((type) => {
                      const IconComponent = Icons[type.icon as keyof typeof Icons] as any;
                      const isSelected = workerDetails.paymentType === type.key;
                      
                      return (
                        <TouchableOpacity
                          key={type.key}
                          style={[styles.paymentTypeButton, {
                            backgroundColor: isSelected ? colors.primary : colors.background,
                            borderColor: isSelected ? colors.primary : colors.border
                          }]}
                          onPress={() => setWorkerDetails(prev => ({ ...prev, paymentType: type.key as any }))}
                        >
                          <IconComponent size={20} color={isSelected ? colors.surface : colors.text} />
                          <Text style={[styles.paymentTypeText, {
                            color: isSelected ? colors.surface : colors.text
                          }]}>
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modernCancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
              >
                <Icons.X size={18} color={colors.text} />
                <Text style={[styles.modernCancelText, { color: colors.text }]}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modernSaveButton, { backgroundColor: colors.primary }]}
                onPress={saveWorkerDetails}
              >
                <Icons.Check size={18} color={colors.surface} />
                <Text style={[styles.modernSaveText, { color: colors.surface }]}>حفظ التفاصيل</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button for Quick Add */}
      <TouchableOpacity
        style={[styles.floatingAddButton, { backgroundColor: colors.success }]}
        onPress={() => {
          // Quick mark all as present
          const newData: AttendanceData = {};
          workers.forEach(worker => {
            newData[worker.id] = {
              isPresent: true,
              startTime: '07:00',
              endTime: '15:00',
              workDays: 1,
              paymentType: 'partial',
            };
          });
          setAttendanceData(newData);
          Alert.alert('تم', 'تم تسجيل حضور جميع العمال');
        }}
      >
        <Icons.UserPlus size={24} color={colors.surface} />
      </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  
  // شريط التاريخ السريع
  quickDateContainer: {
    marginTop: 10,
  },
  quickDateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickDateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // بحث وتصفية
  searchFilterContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  filterButton: {
    padding: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '500',
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
  },
  
  // Modern Worker Cards
  modernWorkerCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  workerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workerInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workerDetails: {
    flex: 1,
  },
  modernWorkerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  workerRole: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  attendanceSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // معلومات الحضور
  attendanceInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeLabel: {
    fontSize: 12,
  },
  timeValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // أزرار العمال
  workerActions: {
    marginTop: 12,
  },
  modernActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  modernActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // زر الحفظ العائم
  floatingSaveButton: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    gap: 8,
  },
  floatingSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // زر الإضافة العائم
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
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
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  modalBody: {
    maxHeight: 500,
    paddingHorizontal: 20,
  },
  
  // أقسام النموذج
  timeSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  workSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  paymentSection: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  
  // حقول الوقت
  timeInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
  },
  
  // حقول الإدخال
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  
  // نوع الدفع
  paymentTypeContainer: {
    marginBottom: 16,
  },
  paymentTypeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  paymentTypeText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // أزرار Modal
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  modernCancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  modernCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modernSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  modernSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});