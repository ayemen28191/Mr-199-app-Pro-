import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const NotFoundScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleGoHome = () => {
    navigation.navigate('Dashboard' as never);
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Dashboard' as never);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <Icon name="error-outline" size={120} color="#E5E7EB" />
        </View>

        {/* Error Code */}
        <Text style={styles.errorCode}>404</Text>

        {/* Main Message */}
        <Text style={styles.title}>الصفحة غير موجودة</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          عذراً، لا يمكن العثور على الصفحة التي تبحث عنها.
          {'\n'}
          قد تكون الصفحة قد نُقلت أو حُذفت أو أن الرابط غير صحيح.
        </Text>

        {/* Suggestions */}
        <View style={styles.suggestions}>
          <View style={styles.suggestionItem}>
            <Icon name="check-circle" size={16} color="#10B981" />
            <Text style={styles.suggestionText}>تحقق من صحة الرابط</Text>
          </View>
          <View style={styles.suggestionItem}>
            <Icon name="check-circle" size={16} color="#10B981" />
            <Text style={styles.suggestionText}>العودة للصفحة الرئيسية</Text>
          </View>
          <View style={styles.suggestionItem}>
            <Icon name="check-circle" size={16} color="#10B981" />
            <Text style={styles.suggestionText}>استخدم القائمة للتنقل</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoHome}>
            <Icon name="home" size={20} color="white" />
            <Text style={styles.primaryButtonText}>الصفحة الرئيسية</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoBack}>
            <Icon name="arrow-back" size={20} color="#3B82F6" />
            <Text style={styles.secondaryButtonText}>العودة للخلف</Text>
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>تحتاج مساعدة؟</Text>
          <Text style={styles.helpText}>
            يمكنك التواصل مع فريق الدعم الفني أو مراجعة دليل المستخدم
          </Text>
          <TouchableOpacity style={styles.helpButton}>
            <Icon name="help-outline" size={16} color="#6B7280" />
            <Text style={styles.helpButtonText}>مركز المساعدة</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          نظام إدارة المشاريع الإنشائية
        </Text>
        <Text style={styles.footerVersion}>
          الإصدار 1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 24,
    opacity: 0.6,
  },
  errorCode: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#E5E7EB',
    marginBottom: 16,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  suggestions: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    textAlign: 'right',
    flex: 1,
  },
  actions: {
    alignSelf: 'stretch',
    gap: 12,
    marginBottom: 40,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  helpButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default NotFoundScreen;