import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onProjectChange: (projectId: string, projectName: string) => void;
  projects: Project[];
}

export default function ProjectSelector({ 
  selectedProjectId, 
  onProjectChange, 
  projects 
}: ProjectSelectorProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleProjectSelect = (project: Project) => {
    onProjectChange(project.id, project.name);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[styles.label, { color: colors.textSecondary }]}>المشروع الحالي</Text>
        <Text style={[styles.projectName, { color: colors.text }]}>
          {selectedProject ? selectedProject.name : 'اختر مشروع'}
        </Text>
        <Text style={[styles.arrow, { color: colors.textSecondary }]}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>اختر المشروع</Text>
            
            <FlatList
              data={projects}
              keyExtractor={(item) => item.id}
              renderItem={({ item }: { item: Project }) => (
                <TouchableOpacity
                  style={[
                    styles.projectItem,
                    { borderColor: colors.border },
                    selectedProjectId === item.id && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => handleProjectSelect(item)}
                >
                  <Text style={[styles.projectItemName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: item.status === 'active' ? colors.success : colors.warning }
                  ]}>
                    <Text style={styles.statusText}>
                      {item.status === 'active' ? 'نشط' : 'متوقف'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.border }]}
              onPress={() => setIsOpen(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  selector: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  arrow: {
    position: 'absolute',
    left: 16,
    top: '50%',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  projectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  projectItemName: {
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});