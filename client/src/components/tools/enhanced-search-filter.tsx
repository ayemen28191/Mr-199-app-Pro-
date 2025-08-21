import React, { useState, useMemo } from 'react';
import { Search, Filter, X, Calendar, DollarSign, MapPin, AlertTriangle, CheckCircle, Clock, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/ui/stats-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface EnhancedSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedCondition: string;
  onConditionChange: (value: string) => void;
  categories: Array<{
    id: string;
    name: string;
  }>;
  onClearFilters: () => void;
  toolStats: {
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
    damaged: number;
    maintenanceOverdue: number;
  };
}

const EnhancedSearchFilter: React.FC<EnhancedSearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedCondition,
  onConditionChange,
  categories,
  onClearFilters,
  toolStats
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(true);
  const [dateFilters, setDateFilters] = useState({
    purchaseDate: { from: '', to: '' },
    warrantyExpiry: { from: '', to: '' },
  });

  const hasActiveFilters = useMemo(() => {
    return (
      selectedCategory !== 'all' ||
      selectedStatus !== 'all' ||
      selectedCondition !== 'all' ||
      priceRange.min !== '' ||
      priceRange.max !== '' ||
      dateFilters.purchaseDate.from !== '' ||
      dateFilters.purchaseDate.to !== '' ||
      dateFilters.warrantyExpiry.from !== '' ||
      dateFilters.warrantyExpiry.to !== ''
    );
  }, [selectedCategory, selectedStatus, selectedCondition, priceRange, dateFilters]);

  const clearAllFilters = () => {
    onClearFilters();
    setPriceRange({ min: '', max: '' });
    setDateFilters({
      purchaseDate: { from: '', to: '' },
      warrantyExpiry: { from: '', to: '' },
    });
  };

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            البحث والفلترة المتقدمة
            {hasActiveFilters && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                فعال
              </Badge>
            )}
          </CardTitle>
          
          {/* Quick Stats */}
          <div className="flex gap-2 text-sm">
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              متاح: {toolStats.available}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-500" />
              قيد الاستخدام: {toolStats.inUse}
            </Badge>
            {toolStats.maintenanceOverdue > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                صيانة متأخرة: {toolStats.maintenanceOverdue}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Maintenance Alert */}
        {toolStats.maintenanceOverdue > 0 && showMaintenanceAlert && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200">
                    تنبيه صيانة متأخرة
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    هناك {toolStats.maintenanceOverdue} أداة تحتاج صيانة فورية
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMaintenanceAlert(false)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => onStatusChange('maintenance')}
              >
                عرض الأدوات المتأخرة
              </Button>
            </div>
          </div>
        )}

        {/* Primary Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="ابحث عن الأدوات حسب الاسم، الوصف، SKU، أو الرقم التسلسلي..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="enhanced-search-input"
          />
        </div>

        {/* Basic Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600">
              <SelectValue placeholder="اختر التصنيف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع التصنيفات</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600">
              <SelectValue placeholder="اختر الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="available">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  متاح
                </div>
              </SelectItem>
              <SelectItem value="in_use">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  قيد الاستخدام
                </div>
              </SelectItem>
              <SelectItem value="maintenance">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  صيانة
                </div>
              </SelectItem>
              <SelectItem value="damaged">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  معطل
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Condition Filter */}
          <Select value={selectedCondition} onValueChange={onConditionChange}>
            <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600">
              <SelectValue placeholder="اختر الجودة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الجودات</SelectItem>
              <SelectItem value="excellent">ممتاز</SelectItem>
              <SelectItem value="good">جيد</SelectItem>
              <SelectItem value="fair">مقبول</SelectItem>
              <SelectItem value="poor">ضعيف</SelectItem>
              <SelectItem value="damaged">معطل</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters Toggle */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-0 h-auto">
              <Filter className="h-4 w-4 ml-2" />
              {isAdvancedOpen ? 'إخفاء الفلاتر المتقدمة' : 'إظهار الفلاتر المتقدمة'}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4 space-y-4">
            {/* Price Range Filter */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  السعر من
                </Label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="pr-10"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  إلى
                </Label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    placeholder="9999"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="pr-10"
                  />
                </div>
              </div>
            </div>

            {/* Date Filters */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  تاريخ الشراء
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={dateFilters.purchaseDate.from}
                    onChange={(e) => setDateFilters(prev => ({
                      ...prev,
                      purchaseDate: { ...prev.purchaseDate, from: e.target.value }
                    }))}
                    className="text-sm"
                  />
                  <Input
                    type="date"
                    value={dateFilters.purchaseDate.to}
                    onChange={(e) => setDateFilters(prev => ({
                      ...prev,
                      purchaseDate: { ...prev.purchaseDate, to: e.target.value }
                    }))}
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  انتهاء الضمان
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={dateFilters.warrantyExpiry.from}
                    onChange={(e) => setDateFilters(prev => ({
                      ...prev,
                      warrantyExpiry: { ...prev.warrantyExpiry, from: e.target.value }
                    }))}
                    className="text-sm"
                  />
                  <Input
                    type="date"
                    value={dateFilters.warrantyExpiry.to}
                    onChange={(e) => setDateFilters(prev => ({
                      ...prev,
                      warrantyExpiry: { ...prev.warrantyExpiry, to: e.target.value }
                    }))}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className="border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4 mr-1" />
              مسح جميع الفلاتر
            </Button>
          </div>
          
          <StatsCard
            title="إجمالي الأدوات"
            value={toolStats.total}
            icon={Package}
            color="blue"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedSearchFilter;