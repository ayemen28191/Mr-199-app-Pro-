import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Icons from '../components/Icons';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';

interface Supplier {
  id: string;
  name: string;
  contactPhone: string;
  email?: string;
  address?: string;
  category: string;
  rating: number;
  totalOrders: number;
  totalAmount: number;
  lastOrderDate: string;
  isActive: boolean;
  paymentTerms: string;
  notes?: string;
}

interface SupplierPerformance {
  supplierId: string;
  onTimeDelivery: number;
  qualityRating: number;
  priceCompetitiveness: number;
  communicationRating: number;
  overallScore: number;
  ordersFulfilled: number;
  ordersDelayed: number;
  averageDeliveryTime: number;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ر.ي';
};

export default function SuppliersProfessionalScreen() {
  const { selectedProjectId } = useProject();
  const { colors } = useTheme();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [performanceData, setPerformanceData] = useState<{ [key: string]: SupplierPerformance }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const categories = [
    'مواد البناء',
    'الأدوات والمعدات',
    'الكهربائيات',
    'السباكة',
    'الدهانات',
    'المعادن',
    'الخدمات',
    'أخرى'
  ];

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      
      // استخدام عنوان API الكامل مطابق للنسخة الويب
      const API_BASE = __DEV__ ? 'http://localhost:5000' : 'https://your-production-domain.com';
      const response = await fetch(`${API_BASE}/api/suppliers`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const suppliersData = await response.json();
      setSuppliers(suppliersData);
      
      // حساب بيانات الأداء (مبسط للآن)
      const performanceMap: { [key: string]: SupplierPerformance } = {};
      suppliersData.forEach((supplier: Supplier) => {
        performanceMap[supplier.id] = {
          supplierId: supplier.id,
          onTimeDelivery: 95, // قيم افتراضية للآن
          qualityRating: 4.5,
          priceCompetitiveness: 4.0,
          communicationRating: 4.2,
          overallScore: 4.3,
          ordersFulfilled: supplier.totalOrders,
          ordersDelayed: Math.floor(supplier.totalOrders * 0.05),
          averageDeliveryTime: 3
        };
      });
      setPerformanceData(performanceMap);
    } catch (error) {
      console.error('خطأ في جلب الموردين:', error);
      Alert.alert('خطأ', 'فشل في تحميل بيانات الموردين - تأكد من اتصال الشبكة');
          contactPhone: '+966507654321',
          category: 'المعادن',
          rating: 4,
          totalOrders: 8,
          totalAmount: 32000,
          lastOrderDate: '2025-08-18',
          isActive: true,
          paymentTerms: 'نقدي',
        }
      ];
      
      setSuppliers(mockSuppliers);
      setPerformanceData({
        '1': {
          supplierId: '1',
          onTimeDelivery: 95,
          qualityRating: 92,
          priceCompetitiveness: 88,
          communicationRating: 90,
          overallScore: 91.25,
          ordersFulfilled: 14,
          ordersDelayed: 1,
          averageDeliveryTime: 2.5
        },
        '2': {
          supplierId: '2',
          onTimeDelivery: 87,
          qualityRating: 89,
          priceCompetitiveness: 85,
          communicationRating: 83,
          overallScore: 86,
          ordersFulfilled: 7,
          ordersDelayed: 1,
          averageDeliveryTime: 4.2
        }
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredAndSortedSuppliers = () => {
    let filtered = suppliers;

    // تطبيق فلتر الفئة
    if (filterCategory !== 'all') {
      filtered = filtered.filter(supplier => supplier.category === filterCategory);
    }

    // تطبيق البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(supplier => 
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.category.toLowerCase().includes(searchLower) ||
        supplier.contactPhone.includes(searchTerm)
      );
    }

    // تطبيق الترتيب
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'ar');
        case 'rating':
          return b.rating - a.rating;
        case 'totalAmount':
          return b.totalAmount - a.totalAmount;
        case 'totalOrders':
          return b.totalOrders - a.totalOrders;
        case 'lastOrder':
          return new Date(b.lastOrderDate || 0).getTime() - new Date(a.lastOrderDate || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSuppliers();
  };

  useEffect(() => {
    fetchSuppliers();
  }, [selectedProject]);

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Icon
          key={i}
          name={i <= rating ? 'star' : 'star-border'}
          size={12}
          color={i <= rating ? '#F59E0B' : '#D1D5DB'}
        />
      );
    }
    return stars;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return '#10B981'; // أخضر
    if (score >= 80) return '#F59E0B'; // أصفر
    if (score >= 70) return '#F97316'; // برتقالي
    return '#EF4444'; // أحمر
  };

  const renderSupplier = ({ item }: { item: Supplier }) => {
    const performance = performanceData[item.id];
    
    return (
      <TouchableOpacity
        style={styles.supplierCard}
        onPress={() => {
          setSelectedSupplier(item);
          setShowDetailsModal(true);
        }}
      >
        <View style={styles.supplierHeader}>
          <View style={styles.supplierMainInfo}>
            <View style={[styles.supplierAvatar, { backgroundColor: item.isActive ? '#10B981' : '#9CA3AF' }]}>
              <Text style={styles.supplierInitial}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.supplierDetails}>
              <Text style={styles.supplierName}>{item.name}</Text>
              <Text style={styles.supplierCategory}>{item.category}</Text>
              <View style={styles.supplierRating}>
                {getRatingStars(item.rating)}
                <Text style={styles.ratingText}>({item.rating}/5)</Text>
              </View>
            </View>
          </View>
          <View style={styles.supplierStats}>
            <Text style={styles.statValue}>{formatCurrency(item.totalAmount)}</Text>
            <Text style={styles.statLabel}>إجمالي المشتريات</Text>
            <Text style={styles.statCount}>{item.totalOrders} طلب</Text>
          </View>
        </View>

        <View style={styles.supplierMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>التسليم في الوقت</Text>
            <View style={styles.metricBar}>
              <View 
                style={[
                  styles.metricProgress, 
                  { 
                    width: `${performance?.onTimeDelivery || 0}%`,
                    backgroundColor: getPerformanceColor(performance?.onTimeDelivery || 0)
                  }
                ]} 
              />
            </View>
            <Text style={styles.metricValue}>{Math.round(performance?.onTimeDelivery || 0)}%</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>التقييم الإجمالي</Text>
            <View style={styles.metricBar}>
              <View 
                style={[
                  styles.metricProgress, 
                  { 
                    width: `${performance?.overallScore || 0}%`,
                    backgroundColor: getPerformanceColor(performance?.overallScore || 0)
                  }
                ]} 
              />
            </View>
            <Text style={styles.metricValue}>{Math.round(performance?.overallScore || 0)}%</Text>
          </View>
        </View>

        <View style={styles.supplierFooter}>
          <View style={styles.contactInfo}>
            <Icon name="phone" size={12} color="#6B7280" />
            <Text style={styles.contactText}>{item.contactPhone}</Text>
          </View>
          <View style={styles.lastOrderInfo}>
            <Icon name="schedule" size={12} color="#6B7280" />
            <Text style={styles.lastOrderText}>
              آخر طلب: {item.lastOrderDate ? new Date(item.lastOrderDate).toLocaleDateString('ar-SA') : 'لا يوجد'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!selectedProject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="store" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>يرجى اختيار مشروع</Text>
          <Text style={styles.emptySubtitle}>اختر مشروعاً لعرض الموردين المحترفين</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>جاري تحميل بيانات الموردين...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredSuppliers = filteredAndSortedSuppliers();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>الموردون المحترفون</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.headerButton}>
            <Icon name="filter-list" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
            <Icon name="refresh" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{suppliers.length}</Text>
          <Text style={styles.summaryLabel}>إجمالي الموردين</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{suppliers.filter(s => s.isActive).length}</Text>
          <Text style={styles.summaryLabel}>نشط</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {suppliers.reduce((sum, s) => sum + s.totalOrders, 0)}
          </Text>
          <Text style={styles.summaryLabel}>إجمالي الطلبات</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {formatCurrency(suppliers.reduce((sum, s) => sum + s.totalAmount, 0))}
          </Text>
          <Text style={styles.summaryLabel}>إجمالي المشتريات</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="البحث عن مورد..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <Icon name="search" size={20} color="#6B7280" style={styles.searchIcon} />
      </View>

      {/* Suppliers List */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>قائمة الموردين</Text>
          <Text style={styles.supplierCount}>{filteredSuppliers.length} مورد</Text>
        </View>

        {filteredSuppliers.length === 0 ? (
          <View style={styles.emptySuppliers}>
            <Icon name="store" size={48} color="#9CA3AF" />
            <Text style={styles.emptySuppliersTitle}>لا توجد موردين</Text>
            <Text style={styles.emptySuppliersSubtitle}>
              لا توجد موردين مطابقين للبحث أو الفلاتر المحددة
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredSuppliers}
            renderItem={renderSupplier}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تصفية وترتيب الموردين</Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>الفئة</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                <TouchableOpacity
                  style={[styles.categoryChip, filterCategory === 'all' && styles.selectedCategoryChip]}
                  onPress={() => setFilterCategory('all')}
                >
                  <Text style={[styles.categoryChipText, filterCategory === 'all' && styles.selectedCategoryChipText]}>
                    الكل
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryChip, filterCategory === category && styles.selectedCategoryChip]}
                    onPress={() => setFilterCategory(category)}
                  >
                    <Text style={[styles.categoryChipText, filterCategory === category && styles.selectedCategoryChipText]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>ترتيب حسب</Text>
              {[
                { value: 'name', label: 'الاسم' },
                { value: 'rating', label: 'التقييم' },
                { value: 'totalAmount', label: 'إجمالي المشتريات' },
                { value: 'totalOrders', label: 'عدد الطلبات' },
                { value: 'lastOrder', label: 'آخر طلب' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.sortOption, sortBy === option.value && styles.selectedSortOption]}
                  onPress={() => setSortBy(option.value)}
                >
                  <Text style={[styles.sortOptionText, sortBy === option.value && styles.selectedSortOptionText]}>
                    {option.label}
                  </Text>
                  {sortBy === option.value && <Icon name="check" size={20} color="#3B82F6" />}
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.modalButtonText}>تطبيق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Supplier Details Modal */}
      {selectedSupplier && (
        <Modal
          visible={showDetailsModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDetailsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>تفاصيل المورد</Text>
                <TouchableOpacity 
                  onPress={() => setShowDetailsModal(false)}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.supplierDetailsHeader}>
                  <View style={[styles.supplierDetailsAvatar, { backgroundColor: selectedSupplier.isActive ? '#10B981' : '#9CA3AF' }]}>
                    <Text style={styles.supplierDetailsInitial}>{selectedSupplier.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.supplierDetailsName}>{selectedSupplier.name}</Text>
                  <Text style={styles.supplierDetailsCategory}>{selectedSupplier.category}</Text>
                  <View style={styles.supplierDetailsRating}>
                    {getRatingStars(selectedSupplier.rating)}
                    <Text style={styles.ratingDetailsText}>({selectedSupplier.rating}/5)</Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>معلومات الاتصال</Text>
                  <View style={styles.detailsItem}>
                    <Icon name="phone" size={16} color="#6B7280" />
                    <Text style={styles.detailsText}>{selectedSupplier.contactPhone}</Text>
                  </View>
                  {selectedSupplier.email && (
                    <View style={styles.detailsItem}>
                      <Icon name="email" size={16} color="#6B7280" />
                      <Text style={styles.detailsText}>{selectedSupplier.email}</Text>
                    </View>
                  )}
                  {selectedSupplier.address && (
                    <View style={styles.detailsItem}>
                      <Icon name="location-on" size={16} color="#6B7280" />
                      <Text style={styles.detailsText}>{selectedSupplier.address}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>الإحصائيات</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                      <Text style={styles.statCardValue}>{selectedSupplier.totalOrders}</Text>
                      <Text style={styles.statCardLabel}>إجمالي الطلبات</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statCardValue}>{formatCurrency(selectedSupplier.totalAmount)}</Text>
                      <Text style={styles.statCardLabel}>إجمالي المشتريات</Text>
                    </View>
                  </View>
                </View>

                {performanceData[selectedSupplier.id] && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>تقييم الأداء</Text>
                    <View style={styles.performanceMetrics}>
                      <View style={styles.performanceItem}>
                        <Text style={styles.performanceLabel}>التسليم في الوقت</Text>
                        <Text style={styles.performanceValue}>{Math.round(performanceData[selectedSupplier.id].onTimeDelivery)}%</Text>
                      </View>
                      <View style={styles.performanceItem}>
                        <Text style={styles.performanceLabel}>جودة المنتجات</Text>
                        <Text style={styles.performanceValue}>{Math.round(performanceData[selectedSupplier.id].qualityRating)}%</Text>
                      </View>
                      <View style={styles.performanceItem}>
                        <Text style={styles.performanceLabel}>تنافسية الأسعار</Text>
                        <Text style={styles.performanceValue}>{Math.round(performanceData[selectedSupplier.id].priceCompetitiveness)}%</Text>
                      </View>
                      <View style={styles.performanceItem}>
                        <Text style={styles.performanceLabel}>التواصل</Text>
                        <Text style={styles.performanceValue}>{Math.round(performanceData[selectedSupplier.id].communicationRating)}%</Text>
                      </View>
                    </View>
                  </View>
                )}

                {selectedSupplier.notes && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>ملاحظات</Text>
                    <Text style={styles.notesText}>{selectedSupplier.notes}</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    fontSize: 14,
    textAlign: 'right',
  },
  searchIcon: {
    marginLeft: 12,
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  supplierCount: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptySuppliers: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptySuppliersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySuppliersSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  supplierCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  supplierMainInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  supplierAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supplierInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  supplierDetails: {
    flex: 1,
  },
  supplierName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 2,
  },
  supplierCategory: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 4,
  },
  supplierRating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  ratingText: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4,
  },
  supplierStats: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 2,
  },
  statCount: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 1,
  },
  supplierMetrics: {
    gap: 8,
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
    flex: 1,
    textAlign: 'right',
  },
  metricBar: {
    flex: 2,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricProgress: {
    height: '100%',
    borderRadius: 3,
  },
  metricValue: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'center',
  },
  supplierFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4,
  },
  lastOrderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastOrderText: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  detailsModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'right',
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectedCategoryChip: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: 'white',
    fontWeight: '600',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  selectedSortOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  selectedSortOptionText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  supplierDetailsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  supplierDetailsAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  supplierDetailsInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  supplierDetailsName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  supplierDetailsCategory: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  supplierDetailsRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingDetailsText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'right',
  },
  detailsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  statCardLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  performanceMetrics: {
    gap: 12,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  performanceLabel: {
    fontSize: 14,
    color: '#374151',
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    textAlign: 'right',
  },
});

export default SuppliersProfessionalScreen;