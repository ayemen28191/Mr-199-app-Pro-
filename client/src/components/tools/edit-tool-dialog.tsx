import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Edit, Save, X, Package, FileText, DollarSign, MapPin, AlertTriangle, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AutocompleteInput } from '@/components/ui/autocomplete-input-database';

// Enhanced form validation schema with additional constraints
const editToolSchema = z.object({
  name: z.string()
    .min(2, 'اسم الأداة مطلوب ويجب أن يكون أكثر من حرفين')
    .max(100, 'اسم الأداة يجب أن يكون أقل من 100 حرف')
    .regex(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\w\s\-\(\)\.]+$/, 'يسمح بالأحرف العربية والإنجليزية والأرقام والرموز الأساسية فقط'),
  description: z.string()
    .max(500, 'الوصف يجب أن يكون أقل من 500 حرف')
    .optional(),
  categoryId: z.string().min(1, 'يجب اختيار تصنيف الأداة من القائمة'),
  sku: z.string()
    .max(50, 'رقم SKU يجب أن يكون أقل من 50 حرف')
    .regex(/^[A-Z0-9\-]*$/, 'رقم SKU يجب أن يحتوي على أحرف إنجليزية كبيرة وأرقام ورموز - فقط')
    .optional(),
  serialNumber: z.string()
    .max(100, 'الرقم التسلسلي يجب أن يكون أقل من 100 حرف')
    .optional(),
  barcode: z.string()
    .max(100, 'الرمز الشريطي يجب أن يكون أقل من 100 حرف')
    .optional(),
  unit: z.string()
    .min(1, 'يجب اختيار وحدة القياس')
    .max(20, 'وحدة القياس يجب أن تكون أقل من 20 حرف'),
  purchasePrice: z.coerce.number()
    .min(0, 'سعر الشراء لا يمكن أن يكون سالباً')
    .max(9999999, 'سعر الشراء مرتفع جداً (أكثر من 9 مليون)')
    .optional(),
  currentValue: z.coerce.number()
    .min(0, 'القيمة الحالية لا يمكن أن تكون سالبة')
    .max(9999999, 'القيمة الحالية مرتفعة جداً (أكثر من 9 مليون)')
    .optional(),
  depreciationRate: z.coerce.number()
    .min(0, 'معدل الإهلاك لا يمكن أن يكون سالباً')
    .max(100, 'معدل الإهلاك لا يمكن أن يتجاوز 100%')
    .optional(),
  purchaseDate: z.string()
    .refine((date) => {
      if (!date) return true; // اختياري
      const purchaseDate = new Date(date);
      const today = new Date();
      return purchaseDate <= today;
    }, 'تاريخ الشراء لا يمكن أن يكون في المستقبل')
    .optional(),
  warrantyExpiry: z.string()
    .refine((date) => {
      if (!date) return true; // اختياري
      const warrantyDate = new Date(date);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      return warrantyDate >= oneYearAgo;
    }, 'تاريخ انتهاء الضمان قديم جداً (أكثر من سنة مضت)')
    .optional(),
  maintenanceInterval: z.coerce.number()
    .min(1, 'فترة الصيانة يجب أن تكون يوم واحد على الأقل')
    .max(3650, 'فترة الصيانة طويلة جداً (أكثر من 10 سنوات)')
    .optional(),
  status: z.enum(['available', 'assigned', 'maintenance', 'lost', 'consumed', 'reserved', 'in_use', 'damaged', 'retired'], {
    errorMap: () => ({ message: 'يجب اختيار حالة الأداة من القائمة' })
  }),
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'damaged'], {
    errorMap: () => ({ message: 'يجب اختيار حالة الجودة من القائمة' })
  }),
  projectId: z.string().min(1, 'يجب اختيار المشروع المرتبط بالأداة'),
  locationType: z.string()
    .max(50, 'نوع الموقع يجب أن يكون أقل من 50 حرف')
    .optional(),
  locationId: z.string()
    .max(200, 'تحديد الموقع يجب أن يكون أقل من 200 حرف')
    .optional(),
  specifications: z.string()
    .max(2000, 'المواصفات التقنية يجب أن تكون أقل من 2000 حرف')
    .optional(),
});

type EditToolFormData = z.infer<typeof editToolSchema>;

// Types
interface Tool {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  sku?: string;
  serialNumber?: string;
  barcode?: string;
  qrCode?: string;
  unit: string;
  purchasePrice?: number;
  currentValue?: number;
  depreciationRate?: number;
  purchaseDate?: string;
  warrantyExpiry?: string;
  maintenanceInterval?: number;
  nextMaintenanceDate?: string;
  status: 'available' | 'assigned' | 'maintenance' | 'lost' | 'consumed' | 'reserved' | 'in_use' | 'damaged' | 'retired';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  projectId?: string;
  locationType?: string;
  locationId?: string;
  specifications?: any;
  images?: string[];
  manuals?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ToolCategory {
  id: string;
  name: string;
  description?: string;
}

interface EditToolDialogProps {
  toolId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditToolDialog: React.FC<EditToolDialogProps> = ({ 
  toolId, 
  open, 
  onOpenChange, 
  onSuccess 
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [hasChanges, setHasChanges] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tool details
  const { data: tool, isLoading } = useQuery<Tool>({
    queryKey: ['/api/tools', toolId],
    enabled: !!toolId && open,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<ToolCategory[]>({
    queryKey: ['/api/tool-categories'],
    enabled: open,
  });

  // Fetch projects for location selection
  const { data: projects = [] } = useQuery<{id: string, name: string, status: string}[]>({
    queryKey: ['/api/projects'],
    enabled: open,
  });

  // Get current project name for display
  const currentProject = projects.find(p => p.id === tool?.projectId);

  // دالة مساعدة لحفظ قيم الإكمال التلقائي
  const saveAutocompleteValue = async (category: string, value: string) => {
    if (!value || value.trim().length < 2) return;
    
    try {
      await apiRequest('/api/autocomplete', 'POST', {
        category,
        value: value.trim(),
        usageCount: 1
      });
      console.log(`✅ تم حفظ قيمة الإكمال التلقائي: ${category} = ${value.trim()}`);
    } catch (error) {
      console.error(`❌ خطأ في حفظ قيمة الإكمال التلقائي ${category}:`, error);
    }
  };

  // دالة لحفظ جميع قيم الإكمال التلقائي
  const saveAllAutocompleteValues = async (data: EditToolFormData) => {
    const promises = [];
    
    if (data.name && data.name.trim().length >= 2) {
      promises.push(saveAutocompleteValue('toolNames', data.name));
    }
    
    if (data.description && data.description.trim().length >= 2) {
      promises.push(saveAutocompleteValue('toolDescriptions', data.description));
    }
    
    if (data.sku && data.sku.trim().length >= 2) {
      promises.push(saveAutocompleteValue('toolSkus', data.sku));
    }
    
    if (data.barcode && data.barcode.trim().length >= 2) {
      promises.push(saveAutocompleteValue('toolBarcodes', data.barcode));
    }
    
    if (data.specifications && data.specifications.trim().length >= 2) {
      promises.push(saveAutocompleteValue('toolSpecifications', data.specifications));
    }
    
    if (data.unit && data.unit.trim().length >= 2) {
      promises.push(saveAutocompleteValue('toolUnits', data.unit));
    }
    
    if (data.locationType && data.locationType.trim().length >= 2) {
      promises.push(saveAutocompleteValue('toolLocationTypes', data.locationType));
    }
    
    if (data.locationId && data.locationId.trim().length >= 2) {
      promises.push(saveAutocompleteValue('toolLocations', data.locationId));
    }
    
    if (data.serialNumber && data.serialNumber.trim().length >= 2) {
      promises.push(saveAutocompleteValue('toolSerialNumbers', data.serialNumber));
    }
    
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  };

  // Form setup
  const form = useForm<EditToolFormData>({
    resolver: zodResolver(editToolSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      sku: '',
      serialNumber: '',
      barcode: '',
      unit: 'قطعة',
      status: 'available',
      condition: 'excellent',
      specifications: '',
    },
  });

  // Load tool data into form when tool is fetched
  useEffect(() => {
    if (tool) {
      // Helper function to convert dates from string to YYYY-MM-DD format
      const formatDateForInput = (dateString: string | null | undefined) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return '';
          return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        } catch {
          return '';
        }
      };

      // Helper function to convert string numbers to actual numbers
      const parseNumber = (value: string | number | null | undefined) => {
        if (value === null || value === undefined || value === '') return undefined;
        const parsed = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(parsed) ? undefined : parsed;
      };

      const formData = {
        name: tool.name || '',
        description: tool.description || '',
        categoryId: tool.categoryId || '',
        sku: tool.sku || '',
        serialNumber: tool.serialNumber || '',
        barcode: tool.barcode || '',
        unit: tool.unit || 'قطعة',
        purchasePrice: parseNumber(tool.purchasePrice),
        currentValue: parseNumber(tool.currentValue),
        depreciationRate: parseNumber(tool.depreciationRate),
        purchaseDate: formatDateForInput(tool.purchaseDate),
        warrantyExpiry: formatDateForInput(tool.warrantyExpiry),
        maintenanceInterval: parseNumber(tool.maintenanceInterval),
        status: tool.status || 'available',
        condition: tool.condition || 'excellent',
        projectId: tool.projectId || '',
        locationType: tool.locationType || '',
        locationId: tool.locationId || '',
        specifications: typeof tool.specifications === 'string' 
          ? tool.specifications 
          : tool.specifications 
            ? JSON.stringify(tool.specifications, null, 2) 
            : '',
      };
      
      console.log('🔧 البيانات الأصلية المُرجعة من API:', tool);
      console.log('🔧 البيانات المحولة للنموذج:', formData);
      form.reset(formData);
      setHasChanges(false);
    }
  }, [tool, form]);

  // Watch for form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Update tool mutation
  const updateToolMutation = useMutation({
    mutationFn: async (data: EditToolFormData) => {
      console.log('🔧 البيانات المُرسلة من Frontend:', data);
      
      // Convert specifications string to JSON if provided
      const specifications = data.specifications 
        ? (() => {
            try {
              return JSON.parse(data.specifications);
            } catch {
              // If not valid JSON, store as simple text object
              return { description: data.specifications };
            }
          })()
        : {};

      // تنظيف البيانات مع المحافظة على التواريخ الفارغة كـ null
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => {
          // For date fields, convert empty strings to null
          if (['purchaseDate', 'warrantyExpiry'].includes(key) && value === '') {
            return [key, null];
          }
          // For other fields, keep the original behavior
          if (value === '' || value === undefined) {
            return [key, null];
          }
          return [key, value];
        }).filter(([_, value]) => value !== undefined)
      );

      const updateData = {
        ...cleanedData,
        specifications,
        // إزالة حقل updatedAt لأن قاعدة البيانات تتولى هذا
      };

      console.log('📤 البيانات النهائية المُرسلة:', updateData);
      return apiRequest(`/api/tools/${toolId}`, 'PUT', updateData);
    },
    onSuccess: () => {
      toast({
        title: 'تم تحديث الأداة بنجاح',
        description: 'تم حفظ التغييرات على الأداة',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tools', toolId] });
      queryClient.invalidateQueries({ queryKey: ['/api/autocomplete'] });
      setHasChanges(false);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في تحديث الأداة',
        description: error.message || 'حدث خطأ أثناء تحديث الأداة',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: EditToolFormData) => {
    // حفظ قيم الإكمال التلقائي قبل إرسال البيانات
    await saveAllAutocompleteValues(data);
    
    updateToolMutation.mutate(data);
  };

  // Handle dialog close with unsaved changes warning
  const handleDialogClose = (open: boolean) => {
    if (!open && hasChanges) {
      const confirmed = confirm('لديك تغييرات غير محفوظة. هل تريد المتابعة؟');
      if (!confirmed) return;
    }
    onOpenChange(open);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Package className="h-12 w-12 animate-pulse text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">جاري تحميل بيانات الأداة...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!tool) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>خطأ</DialogTitle>
            <DialogDescription>
              لم يتم العثور على الأداة المطلوبة
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>إغلاق</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <Edit className="h-6 w-6" />
                تعديل الأداة: {tool.name}
              </DialogTitle>
              <DialogDescription className="mt-2">
                تحديث معلومات الأداة وإعداداتها
              </DialogDescription>
            </div>
            <div className="flex gap-2 mr-4">
              {hasChanges && (
                <Badge variant="secondary" className="text-orange-600">
                  <AlertTriangle className="h-3 w-3 ml-1" />
                  تغييرات غير محفوظة
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => handleDialogClose(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-muted/30 p-1 rounded-lg mb-6">
                <TabsTrigger value="basic" className="text-sm font-medium">
                  <Package className="h-4 w-4 ml-1" />
                  الأساسية
                </TabsTrigger>
                <TabsTrigger value="details" className="text-sm font-medium">
                  <FileText className="h-4 w-4 ml-1" />
                  التقنية
                </TabsTrigger>
                <TabsTrigger value="financial" className="text-sm font-medium">
                  <DollarSign className="h-4 w-4 ml-1" />
                  المالية
                </TabsTrigger>
                <TabsTrigger value="location" className="text-sm font-medium">
                  <MapPin className="h-4 w-4 ml-1" />
                  الموقع
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">المعلومات الأساسية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم الأداة *</FormLabel>
                            <FormControl>
                              <AutocompleteInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder="مثال: مثقاب كهربائي، منشار، مولد طوارئ"
                                category="toolNames"
                                className="arabic-numbers"
                              />
                            </FormControl>
                            <FormDescription>
                              يجب أن يكون اسماً وصفياً واضحاً للأداة
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>التصنيف *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر تصنيف الأداة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم SKU <span className="text-xs text-gray-500">(اختياري)</span></FormLabel>
                            <FormControl>
                              <AutocompleteInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder="مثال: TOOL-123456، BUILD-789012"
                                category="toolSkus"
                                className="arabic-numbers uppercase"
                              />
                            </FormControl>
                            <FormDescription>
                              رقم فريد للأداة (أحرف إنجليزية كبيرة وأرقام فقط)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="serialNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الرقم التسلسلي <span className="text-xs text-gray-500">(اختياري)</span></FormLabel>
                            <FormControl>
                              <AutocompleteInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder="مثال: SN-123456، ABC-789"
                                category="toolSerialNumbers"
                                className="arabic-numbers"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>وحدة القياس *</FormLabel>
                            <FormControl>
                              <AutocompleteInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder="مثال: قطعة، مجموعة، كيلوغرام، متر"
                                category="toolUnits"
                                className="arabic-numbers"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="barcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الرمز الشريطي <span className="text-xs text-gray-500">(اختياري)</span></FormLabel>
                            <FormControl>
                              <AutocompleteInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder="رمز QR أو الباركود"
                                category="toolBarcodes"
                                className="arabic-numbers"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الوصف <span className="text-xs text-gray-500">(اختياري)</span></FormLabel>
                          <FormControl>
                            <AutocompleteInput
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="مثال: مثقاب كهربائي قوي، منشار يدوي، مولد طوارئ"
                              category="toolDescriptions"
                              className="arabic-numbers"
                            />
                          </FormControl>
                          <FormDescription>
                            وصف تفصيلي للأداة ومواصفاتها (حد أقصى 500 حرف)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Technical Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">المواصفات التقنية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>حالة الأداة *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر حالة الأداة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="available">متاح</SelectItem>
                                <SelectItem value="assigned">مخصص</SelectItem>
                                <SelectItem value="in_use">قيد الاستخدام</SelectItem>
                                <SelectItem value="maintenance">صيانة</SelectItem>
                                <SelectItem value="damaged">معطل</SelectItem>
                                <SelectItem value="lost">مفقود</SelectItem>
                                <SelectItem value="consumed">مستهلك</SelectItem>
                                <SelectItem value="reserved">محجوز</SelectItem>
                                <SelectItem value="retired">متقاعد</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="condition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>حالة الجودة *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر حالة الجودة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="excellent">ممتاز</SelectItem>
                                <SelectItem value="good">جيد</SelectItem>
                                <SelectItem value="fair">مقبول</SelectItem>
                                <SelectItem value="poor">ضعيف</SelectItem>
                                <SelectItem value="damaged">معطل</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="specifications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المواصفات التقنية <span className="text-xs text-gray-500">(اختياري)</span></FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="مثال: القوة 500 واط، الوزن 2.5 كيلو، المقاس 30x20x15 سم"
                                className="min-h-[100px] max-h-[200px] resize-y"
                                maxLength={2000}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              أدخل المواصفات التقنية والتفاصيل الإضافية للأداة (حد أقصى 2000 حرف)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Financial Information Tab */}
              <TabsContent value="financial" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">التفاصيل المالية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="purchasePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>سعر الشراء (ر.ي)</FormLabel>
                            <FormControl>
                              <AutocompleteInput
                                value={field.value?.toString() || ''}
                                onChange={(value) => field.onChange(parseFloat(value) || 0)}
                                category="toolPurchasePrices"
                                placeholder="مثال: 1500.00"
                                className="arabic-numbers"
                              />
                            </FormControl>
                            <FormDescription>
                              سعر شراء الأداة الأصلي (حد أقصى 9 مليون ريال)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currentValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>القيمة الحالية (ر.ي)</FormLabel>
                            <FormControl>
                              <AutocompleteInput
                                value={field.value?.toString() || ''}
                                onChange={(value) => field.onChange(parseFloat(value) || 0)}
                                category="toolCurrentValues"
                                placeholder="مثال: 1200.00"
                                className="arabic-numbers"
                              />
                            </FormControl>
                            <FormDescription>
                              القيمة التقديرية الحالية للأداة
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="depreciationRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>معدل الإهلاك (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="مثال: 15"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              معدل انخفاض القيمة سنوياً (0-100%)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maintenanceInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>فترة الصيانة (بالأيام)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="3650"
                                placeholder="مثال: 90"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              عدد الأيام بين كل صيانة وأخرى (1-3650 يوم)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="purchaseDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاريخ الشراء</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                max={new Date().toISOString().split('T')[0]}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              لا يمكن أن يكون في المستقبل
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="warrantyExpiry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>انتهاء الضمان</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                min={(() => {
                                  const oneYearAgo = new Date();
                                  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                                  return oneYearAgo.toISOString().split('T')[0];
                                })()}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              يجب أن يكون خلال السنة الماضية أو في المستقبل
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Location Information Tab */}
              <TabsContent value="location" className="space-y-4">
                {/* Current Location Display */}
                {currentProject && (
                  <Alert className="mb-4">
                    <Lock className="h-4 w-4" />
                    <AlertDescription className="font-medium">
                      الموقع الحالي: <span className="text-blue-600">{currentProject.name}</span>
                      <span className="text-xs text-gray-500 block mt-1">
                        هذا هو المشروع الحالي المسجل للأداة
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">معلومات الموقع</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المشروع المرتبط *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر المشروع" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {projects.filter(p => p.status === 'active').map((project) => (
                                  <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              اختر المشروع الذي تتبع له الأداة حالياً
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="locationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نوع الموقع</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر نوع الموقع" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="مخزن">مخزن</SelectItem>
                                <SelectItem value="مشروع">مشروع</SelectItem>
                                <SelectItem value="فرع">فرع</SelectItem>
                                <SelectItem value="مكتب">مكتب</SelectItem>
                                <SelectItem value="ورشة">ورشة</SelectItem>
                                <SelectItem value="موقع عمل">موقع عمل</SelectItem>
                                <SelectItem value="عهدة شخصية">عهدة شخصية</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="locationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تحديد الموقع التفصيلي</FormLabel>
                            <FormControl>
                              <AutocompleteInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder="مثال: مخزن رقم 1، مشروع الرياض، ورشة الصيانة"
                                category="toolLocations"
                                className="arabic-numbers"
                              />
                            </FormControl>
                            <FormDescription>
                              وصف تفصيلي للموقع الدقيق للأداة (حد أقصى 200 حرف)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleDialogClose(false)}
                >
                  إلغاء
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={updateToolMutation.isPending || !hasChanges}
                  className="min-w-[120px]"
                >
                  {updateToolMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 ml-2" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditToolDialog;