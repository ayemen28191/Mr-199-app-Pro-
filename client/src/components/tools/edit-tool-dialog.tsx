import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Edit, Save, X, Package, FileText, DollarSign, MapPin, AlertTriangle } from 'lucide-react';

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

import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AutocompleteInput } from '@/components/ui/autocomplete-input-database';

// Form validation schema
const editToolSchema = z.object({
  name: z.string()
    .min(2, 'اسم الأداة مطلوب ويجب أن يكون أكثر من حرفين')
    .max(100, 'اسم الأداة يجب أن يكون أقل من 100 حرف'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'يجب اختيار تصنيف الأداة من القائمة'),
  sku: z.string().optional(),
  serialNumber: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().min(1, 'يجب اختيار وحدة القياس'),
  purchasePrice: z.coerce.number()
    .min(0, 'سعر الشراء لا يمكن أن يكون سالباً')
    .max(999999, 'سعر الشراء مرتفع جداً')
    .optional(),
  currentValue: z.coerce.number()
    .min(0, 'القيمة الحالية لا يمكن أن تكون سالبة')
    .max(999999, 'القيمة الحالية مرتفعة جداً')
    .optional(),
  depreciationRate: z.coerce.number()
    .min(0, 'معدل الإهلاك لا يمكن أن يكون سالباً')
    .max(100, 'معدل الإهلاك لا يمكن أن يتجاوز 100%')
    .optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
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
  locationType: z.string().optional(),
  locationId: z.string().optional(),
  specifications: z.string().optional(),
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
}

interface Project {
  id: string;
  name: string;
  status: string;
}

const EditToolDialog: React.FC<EditToolDialogProps> = ({ toolId, open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch tool data
  const { data: tool, isLoading: isLoadingTool } = useQuery<Tool>({
    queryKey: ['/api/tools', toolId],
    enabled: !!toolId && open,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<ToolCategory[]>({
    queryKey: ['/api/tool-categories'],
    enabled: open,
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: open,
  });

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
      unit: '',
      purchasePrice: 0,
      currentValue: 0,
      depreciationRate: 0,
      purchaseDate: '',
      warrantyExpiry: '',
      maintenanceInterval: 90,
      status: 'available',
      condition: 'good',
      projectId: '',
      locationType: '',
      locationId: '',
      specifications: '',
    },
  });

  // Update form when tool data loads
  useEffect(() => {
    if (tool) {
      const formData: EditToolFormData = {
        name: tool.name || '',
        description: tool.description || '',
        categoryId: tool.categoryId || '',
        sku: tool.sku || '',
        serialNumber: tool.serialNumber || '',
        barcode: tool.barcode || '',
        unit: tool.unit || '',
        purchasePrice: tool.purchasePrice || 0,
        currentValue: tool.currentValue || 0,
        depreciationRate: tool.depreciationRate || 0,
        purchaseDate: tool.purchaseDate || '',
        warrantyExpiry: tool.warrantyExpiry || '',
        maintenanceInterval: tool.maintenanceInterval || 90,
        status: tool.status,
        condition: tool.condition,
        projectId: tool.projectId || '',
        locationType: tool.locationType || '',
        locationId: tool.locationId || '',
        specifications: typeof tool.specifications === 'string' ? tool.specifications : JSON.stringify(tool.specifications || {}),
      };
      form.reset(formData);
      setHasChanges(false);
    }
  }, [tool, form]);

  // Track form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Update tool mutation
  const updateToolMutation = useMutation({
    mutationFn: async (data: EditToolFormData) => {
      const payload = {
        ...data,
        specifications: data.specifications ? JSON.parse(data.specifications) : {},
      };
      return apiRequest(`/api/tools/${toolId}`, 'PUT', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tools', toolId] });
      toast({
        title: "نجح تحديث الأداة",
        description: "تم حفظ التغييرات بنجاح",
      });
      setHasChanges(false);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث الأداة",
        description: error.message || "حدث خطأ أثناء تحديث بيانات الأداة",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditToolFormData) => {
    updateToolMutation.mutate(data);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && hasChanges) {
      const confirmClose = window.confirm('لديك تغييرات غير محفوظة. هل تريد المتابعة بدون حفظ؟');
      if (!confirmClose) return;
    }
    onOpenChange(open);
    if (!open) {
      form.reset();
      setHasChanges(false);
    }
  };

  if (isLoadingTool) {
    return (
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">جاري تحميل بيانات الأداة...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!tool) {
    return (
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-sm text-gray-600">لم يتم العثور على بيانات الأداة المطلوبة</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Edit className="h-5 w-5" />
            تعديل الأداة: {tool.name}
          </DialogTitle>
          <DialogDescription>
            قم بتحديث معلومات الأداة والبيانات المرتبطة بها
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  البيانات الأساسية
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  التفاصيل المالية
                </TabsTrigger>
                <TabsTrigger value="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  الموقع والحالة
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
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="مثال: مثقاب كهربائي، منشار يدوي، مولد طوارئ"
                                category="toolNames"
                                className="arabic-numbers"
                              />
                            </FormControl>
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
                                className="arabic-numbers"
                              />
                            </FormControl>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Financial Details Tab */}
              <TabsContent value="details" className="space-y-4">
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
                                type="number"
                                inputMode="decimal"
                                className="arabic-numbers"
                              />
                            </FormControl>
                            <FormDescription>
                              سعر شراء الأداة الأصلي
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
                                type="number"
                                inputMode="decimal"
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
                              معدل انخفاض القيمة سنوياً
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
                                {...field}
                              />
                            </FormControl>
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
                                {...field}
                              />
                            </FormControl>
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
                              عدد الأيام بين كل صيانة وأخرى
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">معلومات الموقع والحالة</CardTitle>
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
                            <FormLabel>تحديد الموقع</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="مثال: مخزن رقم 1، مشروع الرياض، ورشة الصيانة"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              مثال: مخزن رقم 1، مشروع الرياض، إلخ
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              أدخل المواصفات التقنية والتفاصيل الإضافية للأداة
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