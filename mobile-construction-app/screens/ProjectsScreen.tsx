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

interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'on_hold';
  budget: number;
  spent: number;
}

const ProjectsScreen = () => {
  const [projects] = useState<Project[]>([
    {
      id: '1',
      name: 'مشروع إبار التحيتا',
      status: 'active',
      budget: 500000,
      spent: 294900,
    },
    {
      id: '2',
      name: 'مشروع البناء السكني',
      status: 'active',
      budget: 800000,
      spent: 484900,
    },
    {
      id: '3',
      name: 'مشروع الطرق',
      status: 'on_hold',
      budget: 300000,
      spent: 0,
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'completed':
        return '#6b7280';
      case 'on_hold':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'completed':
        return 'مكتمل';
      case 'on_hold':
        return 'معلق';
      default:
        return 'غير محدد';
    }
  };

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      Alert.alert('تمت الإضافة', `تم إضافة مشروع: ${newProjectName}`);
      setNewProjectName('');
      setModalVisible(false);
    } else {
      Alert.alert('خطأ', 'يرجى إدخال اسم المشروع');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>إدارة المشاريع</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ إضافة مشروع</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.projectsList}>
        {projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={styles.projectCard}
            onPress={() =>
              Alert.alert('تفاصيل المشروع', `المشروع: ${project.name}`)
            }
          >
            <View style={styles.projectHeader}>
              <Text style={styles.projectName}>{project.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(project.status) },
                ]}
              >
                <Text style={styles.statusText}>{getStatusText(project.status)}</Text>
              </View>
            </View>

            <View style={styles.projectDetails}>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>الميزانية:</Text>
                <Text style={styles.budgetValue}>
                  {project.budget.toLocaleString()} ر.س
                </Text>
              </View>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>المصروف:</Text>
                <Text style={styles.spentValue}>
                  {project.spent.toLocaleString()} ر.س
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        (project.spent / project.budget) * 100,
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal لإضافة مشروع جديد */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>إضافة مشروع جديد</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="اسم المشروع"
              value={newProjectName}
              onChangeText={setNewProjectName}
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
                onPress={handleAddProject}
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
  projectsList: {
    flex: 1,
    padding: 15,
  },
  projectCard: {
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
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
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
  projectDetails: {
    gap: 10,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  spentValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginTop: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
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

export default ProjectsScreen;