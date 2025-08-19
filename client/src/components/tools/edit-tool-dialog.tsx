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
    .max(100, 'معدل الإهلاك لا يمكن أن يزيد عن 100%')
    .optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  maintenanceInterval: z.coerce.number()
    .min(1, 'فترة الصيانة يجب أن تكون يوم واحد على الأقل')
    .max(3650, 'فترة الصيانة طويلة جداً (أكثر من 10 سنوات)')
    .optional(),
  status: z.enum(['available', 'in_use', 'maintenance', 'damaged', 'retired'], {
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
  status: 'available' | 'in_use' | 'maintenance' | 'damaged' | 'retired';
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
      condition: 'good',
      locationType: 'مخزن',
      specifications: '',
    },
  });

  // Load tool data into form when tool is fetched
  useEffect(() => {
    if (tool) {
      const formData = {
        name: tool.name || '',
        description: tool.description || '',
        categoryId: tool.categoryId || '',
        sku: tool.sku || '',
        serialNumber: tool.serialNumber || '',
        barcode: tool.barcode || '',
        unit: tool.unit || 'قطعة',
        purchasePrice: tool.purchasePrice || undefined,
        currentValue: tool.currentValue || undefined,
        depreciationRate: tool.depreciationRate || undefined,
        purchaseDate: tool.purchaseDate || '',
        warrantyExpiry: tool.warrantyExpiry || '',
        maintenanceInterval: tool.maintenanceInterval || undefined,
        status: tool.status || 'available',
        condition: tool.condition || 'good',
        projectId: tool.projectId || '',
        locationType: tool.locationType || 'مخزن',
        locationId: tool.locationId || '',
        specifications: typeof tool.specifications === 'string' 
          ? tool.specifications 
          : tool.specifications 
            ? JSON.stringify(tool.specifications, null, 2) 
            : '',
      };
      
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

      const updateData = {
        ...data,
        specifications,
        updatedAt: new Date().toISOString(),
      };

      return apiRequest(`/api/tools/${toolId}`, 'PUT', updateData);
    },
    onSuccess: () => {
      toast({
        title: 'تم تحديث الأداة بنجاح',
        description: 'تم حفظ التغييرات على الأداة',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tools', toolId] });
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

  const onSubmit = (data: EditToolFormData) => {
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
                              <Input
                                placeholder="مثال: مثقاب كهربائي"
                                {...field}
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
                              <Input
                                placeholder="مثال: TOOL-001"
                                {...field}
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
                              <Input
                                placeholder="مثال: SN123456789"
                                {...field}
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
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر وحدة القياس" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="قطعة">قطعة</SelectItem>
                                <SelectItem value="عدد">عدد</SelectItem>
                                <SelectItem value="متر">متر</SelectItem>
                                <SelectItem value="كيلوجرام">كيلوجرام</SelectItem>
                                <SelectItem value="لتر">لتر</SelectItem>
                                <SelectItem value="صندوق">صندوق</SelectItem>
                                <SelectItem value="طقم">طقم</SelectItem>
                              </SelectContent>
                            </Select>
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
                              <Input
                                placeholder="رمز QR أو باركود"
                                {...field}
                                readOnly
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
                            <Textarea
                              placeholder="وصف مفصل للأداة وخصائصها..."
                              {...field}
                              rows={3}
                            />
                          </FormControl>
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
                    <CardTitle className="text-lg">التفاصيل التقنية</CardTitle>
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
                                <SelectItem value="in_use">قيد الاستخدام</SelectItem>
                                <SelectItem value="maintenance">صيانة</SelectItem>
                                <SelectItem value="damaged">معطل</SelectItem>
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

                      <FormField
                        control={form.control}
                        name="maintenanceInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>فترة الصيانة (بالأيام) <span className="text-xs text-gray-500">(اختياري)</span></FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="مثال: 30"
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
                            <FormLabel>انتهاء الضمان <span className="text-xs text-gray-500">(اختياري)</span></FormLabel>
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
                    </div>

                    <FormField
                      control={form.control}
                      name="specifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المواصفات التقنية <span className="text-xs text-gray-500">(اختياري)</span></FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="مواصفات تقنية مفصلة (يمكن كتابتها بصيغة JSON)..."
                              {...field}
                              rows={6}
                              className="font-mono text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Financial Information Tab */}
              <TabsContent value="financial" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">المعلومات المالية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="purchasePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>سعر الشراء (ريال)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="مثال: 1500.00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currentValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>القيمة الحالية (ريال)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="مثال: 1200.00"
                                {...field}
                              />
                            </FormControl>
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
                                step="0.1"
                                placeholder="مثال: 10.5"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Location Information Tab */}
              <TabsContent value="location" className="space-y-4">
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="locationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نوع الموقع <span className="text-xs text-gray-500">(اختياري)</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر نوع الموقع" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="مخزن">مخزن</SelectItem>
                                <SelectItem value="مشروع">مشروع</SelectItem>
                                <SelectItem value="صيانة">ورشة صيانة</SelectItem>
                                <SelectItem value="مكتب">مكتب</SelectItem>
                                <SelectItem value="موقع">موقع خارجي</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="locationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تفاصيل الموقع <span className="text-xs text-gray-500">(اختياري)</span></FormLabel>
                            <FormControl>
                              <Input
                                placeholder="رقم الرف، المنطقة، إلخ"
                                {...field}
                              />
                            </FormControl>
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