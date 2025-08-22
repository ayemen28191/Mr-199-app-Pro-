import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator 
} from 'react-native';

interface Project {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'مشروع أبار التحيتا',
      status: 'نشط',
      createdAt: new Date().toISOString()
    },
    {
      id: '2', 
      name: 'مشروع مصنع الحبشي',
      status: 'مكتمل',
      createdAt: new Date().toISOString()
    }
  ]);
  const [loading, setLoading] = useState(false);

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: `مشروع جديد - ${new Date().toLocaleTimeString('ar-SA')}`,
      status: 'نشط',
      createdAt: new Date().toISOString()
    };

    setProjects([newProject, ...projects]);
    Alert.alert('نجح', 'تم إضافة مشروع جديد!');
  };

  const refreshProjects = async () => {
    setLoading(true);
    // محاكاة تحميل البيانات
    setTimeout(() => {
      setLoading(false);
      Alert.alert('نجح', `تم تحديث ${projects.length} مشروع`);
    }, 1000);
  };

  const ProjectCard = ({ item }: { item: Project }) => (
    <View style={styles.projectCard}>
      <Text style={styles.projectName}>{item.name}</Text>
      <Text style={styles.projectStatus}>الحالة: {item.status}</Text>
      <Text style={styles.projectDate}>
        {new Date(item.createdAt).toLocaleDateString('ar-SA')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3b82f6" style="light" />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏗️ إدارة المشاريع الإنشائية</Text>
        <Text style={styles.headerSubtitle}>تطبيق الموبايل - إصدار تجريبي</Text>
      </View>

      {/* مؤشر الحالة */}
      <View style={styles.statusIndicator}>
        <Text style={styles.statusText}>✅ التطبيق جاهز للاستخدام</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* أزرار التحكم */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={refreshProjects}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>🔄 تحديث المشاريع</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={addProject}
          >
            <Text style={[styles.buttonText, { color: '#3b82f6' }]}>
              ➕ إضافة مشروع جديد
            </Text>
          </TouchableOpacity>
        </View>

        {/* قائمة المشاريع */}
        <View style={styles.projectsSection}>
          <Text style={styles.sectionTitle}>
            📋 المشاريع ({projects.length})
          </Text>
          
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ProjectCard item={item} />}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>

        {/* معلومات التطبيق */}
        <View style={styles.appInfo}>
          <Text style={styles.infoTitle}>📱 معلومات التطبيق</Text>
          <Text style={styles.infoText}>• تطبيق React Native مع Expo</Text>
          <Text style={styles.infoText}>• يدعم اللغة العربية كاملة</Text>
          <Text style={styles.infoText}>• جاهز للربط مع Supabase</Text>
          <Text style={styles.infoText}>• يمكن تصديره كـ APK</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
    marginTop: 4,
  },
  statusIndicator: {
    backgroundColor: '#22c55e',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  controls: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  projectsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1e293b',
  },
  projectCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  projectStatus: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  projectDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  appInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1e293b',
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
    lineHeight: 20,
  },
});
