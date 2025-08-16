/**
 * الوصف: قالب موحد لتصفية وترتيب البيانات
 * المدخلات: قائمة البيانات وخيارات التصفية
 * المخرجات: واجهة تصفية موحدة مع البحث والترتيب
 * المالك: عمار
 * آخر تعديل: 2025-08-15
 * الحالة: نشط
 */

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  RefreshCw, 
  X,
  Users,
  Building2,
  Calendar
} from "lucide-react";

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface SortOption {
  key: string;
  label: string;
  direction: 'asc' | 'desc';
}

interface UnifiedFilterTemplateProps<T> {
  data: T[];
  searchFields: string[];
  filterOptions: FilterOption[];
  sortOptions: SortOption[];
  onFilteredDataChange: (filteredData: T[]) => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function UnifiedFilterTemplate<T extends Record<string, any>>({
  data,
  searchFields,
  filterOptions,
  sortOptions,
  onFilteredDataChange,
  title = "تصفية البيانات",
  subtitle = "استخدم الخيارات أدناه لتصفية وترتيب البيانات",
  icon = <Filter className="h-6 w-6" />,
  className = ""
}: UnifiedFilterTemplateProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<string>("none");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // تطبيق التصفية والبحث والترتيب
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // تطبيق البحث النصي
    if (searchTerm.trim()) {
      result = result.filter(item => 
        searchFields.some(field => {
          const value = getNestedValue(item, field);
          return String(value || '').toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // تطبيق المرشحات
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter(item => {
          const itemValue = getNestedValue(item, key);
          return String(itemValue || '').toLowerCase() === value.toLowerCase();
        });
      }
    });

    // تطبيق الترتيب
    if (sortBy && sortBy !== "none") {
      result.sort((a, b) => {
        const aValue = getNestedValue(a, sortBy);
        const bValue = getNestedValue(b, sortBy);
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [data, searchTerm, activeFilters, sortBy, sortDirection, searchFields]);

  // إشعار المكون الأب بالتغييرات - إصلاح عدم ظهور البيانات
  useEffect(() => {
    console.log('🔄 إشعار المكون الأب بالتغييرات، عدد النتائج:', filteredAndSortedData.length);
    onFilteredDataChange(filteredAndSortedData);
  }, [filteredAndSortedData, onFilteredDataChange]);

  // وظيفة للوصول للقيم المتداخلة
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // تحديث المرشح
  const updateFilter = (key: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // إزالة مرشح محدد
  const removeFilter = (key: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  // إعادة تعيين جميع المرشحات
  const resetAllFilters = () => {
    setSearchTerm("");
    setActiveFilters({});
    setSortBy("none");
    setSortDirection('asc');
  };

  // عدد المرشحات النشطة
  const activeFilterCount = Object.values(activeFilters).filter(v => v && v !== 'all').length + 
                           (searchTerm ? 1 : 0) + 
                           (sortBy && sortBy !== "none" ? 1 : 0);

  return (
    <Card className={`shadow-lg border-2 border-blue-100 ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              {icon}
            </div>
            <div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-sm text-muted-foreground font-normal">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {activeFilterCount} مرشح نشط
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetAllFilters}
              className="text-red-600 hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة تعيين
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* شريط البحث الذكي */}
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="ابحث في جميع الحقول..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 text-lg"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute left-2 top-2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* خيارات التصفية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filterOptions.map((option) => (
            <div key={option.key} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {option.label}
              </label>
              
              {option.type === 'select' ? (
                <Select 
                  value={activeFilters[option.key] || 'all'} 
                  onValueChange={(value) => updateFilter(option.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={option.placeholder || `اختر ${option.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الخيارات</SelectItem>
                    {option.options?.map((opt) => (
                      <SelectItem key={opt.value || 'empty'} value={opt.value || 'empty'}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={option.type}
                  placeholder={option.placeholder || `أدخل ${option.label}`}
                  value={activeFilters[option.key] || ''}
                  onChange={(e) => updateFilter(option.key, e.target.value)}
                />
              )}
              
              {activeFilters[option.key] && activeFilters[option.key] !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter(option.key)}
                  className="text-red-600 hover:bg-red-50 p-1 h-6"
                >
                  <X className="h-3 w-3" />
                  إزالة
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* خيارات الترتيب */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">ترتيب حسب:</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="اختر حقل الترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون ترتيب</SelectItem>
                {sortOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {sortBy && sortBy !== "none" && (
            <div className="flex items-center gap-1">
              <Button
                variant={sortDirection === 'asc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortDirection('asc')}
                className="flex items-center gap-1"
              >
                <SortAsc className="h-4 w-4" />
                تصاعدي
              </Button>
              <Button
                variant={sortDirection === 'desc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortDirection('desc')}
                className="flex items-center gap-1"
              >
                <SortDesc className="h-4 w-4" />
                تنازلي
              </Button>
            </div>
          )}
        </div>

        {/* عرض النتائج */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>عدد النتائج: {filteredAndSortedData.length} من أصل {data.length}</span>
            <span>
              {activeFilterCount > 0 && `تم تطبيق ${activeFilterCount} مرشح`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// مكونات مساعدة للتصفية السريعة
export const WorkerFilterPresets = {
  searchFields: ['name', 'type', 'phone'],
  filterOptions: [
    {
      key: 'type',
      label: 'نوع العمل',
      type: 'select' as const,
      options: [
        { value: 'عامل عادي', label: 'عامل عادي' },
        { value: 'سائق', label: 'سائق' },
        { value: 'فني', label: 'فني' },
        { value: 'مشرف', label: 'مشرف' },
        { value: 'مهندس', label: 'مهندس' }
      ]
    },
    {
      key: 'isActive',
      label: 'حالة العامل',
      type: 'select' as const,
      options: [
        { value: 'true', label: 'نشط' },
        { value: 'false', label: 'غير نشط' }
      ]
    }
  ],
  sortOptions: [
    { key: 'name', label: 'الاسم', direction: 'asc' as const },
    { key: 'dailyWage', label: 'الأجر اليومي', direction: 'desc' as const },
    { key: 'type', label: 'نوع العمل', direction: 'asc' as const },
    { key: 'createdAt', label: 'تاريخ الإضافة', direction: 'desc' as const }
  ]
};

export const ProjectFilterPresets = {
  searchFields: ['name', 'location', 'description'],
  filterOptions: [
    {
      key: 'status',
      label: 'حالة المشروع',
      type: 'select' as const,
      options: [
        { value: 'active', label: 'نشط' },
        { value: 'completed', label: 'مكتمل' },
        { value: 'paused', label: 'متوقف' }
      ]
    }
  ],
  sortOptions: [
    { key: 'name', label: 'اسم المشروع', direction: 'asc' as const },
    { key: 'createdAt', label: 'تاريخ الإنشاء', direction: 'desc' as const },
    { key: 'status', label: 'الحالة', direction: 'asc' as const }
  ]
};