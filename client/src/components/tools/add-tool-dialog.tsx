import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Plus, Upload, X, QrCode, Calendar, DollarSign, Package, MapPin, FileText } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Form validation schema
const addToolSchema = z.object({
  name: z.string().min(2, 'اسم الأداة مطلوب ويجب أن يكون أكثر من حرفين'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'تصنيف الأداة مطلوب'),
  sku: z.string().optional(),
  serialNumber: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().min(1, 'وحدة القياس مطلوبة'),
  purchasePrice: z.coerce.number().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  maintenanceInterval: z.coerce.number().optional(),
  status: z.enum(['available', 'in_use', 'maintenance', 'damaged', 'retired']),
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'damaged']),
  locationType: z.string().min(1, 'نوع الموقع مطلوب'),
  locationId: z.string().optional(),
  specifications: z.string().optional(),
});

type AddToolFormData = z.infer<typeof addToolSchema>;

// Types
interface ToolCategory {
  id: string;
  name: string;
  description?: string;
}

interface AddToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddToolDialog: React.FC<AddToolDialogProps> = ({ open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<AddToolFormData>({
    resolver: zodResolver(addToolSchema),
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

  // Fetch categories
  const { data: categories = [] } = useQuery<ToolCategory[]>({
    queryKey: ['/api/tool-categories'],
  });

  // Create tool mutation
  const createToolMutation = useMutation({
    mutationFn: async (data: AddToolFormData) => {
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

      const toolData = {
        ...data,
        specifications,
        images: uploadedImages,
        manuals: [],
        isActive: true,
      };

      return apiRequest('/api/tools', 'POST', toolData);
    },
    onSuccess: () => {
      toast({
        title: 'تم إنشاء الأداة بنجاح',
        description: 'تمت إضافة الأداة الجديدة إلى النظام',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tools'] });
      form.reset();
      setUploadedImages([]);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في إنشاء الأداة',
        description: error.message || 'حدث خطأ أثناء إنشاء الأداة',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AddToolFormData) => {
    createToolMutation.mutate(data);
  };

  // Generate QR Code
  const generateQrCode = () => {
    const qrData = `TOOL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    form.setValue('barcode', qrData);
    toast({
      title: 'تم إنشاء رمز QR',
      description: 'تم إنشاء رمز QR فريد للأداة',
    });
  };

  // Auto-generate SKU
  const generateSku = () => {
    const categoryName = categories.find(c => c.id === form.getValues('categoryId'))?.name || 'TOOL';
    const timestamp = Date.now().toString().slice(-6);
    const sku = `${categoryName.substring(0, 3).toUpperCase()}-${timestamp}`;
    form.setValue('sku', sku);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            إضافة أداة جديدة
          </DialogTitle>
          <DialogDescription>
            أضف أداة أو معدة جديدة إلى النظام مع جميع التفاصيل المطلوبة
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-lg mb-6">
                <TabsTrigger 
                  value="basic" 
                  className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    المعلومات الأساسية
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="details" 
                  className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    التفاصيل التقنية
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="financial" 
                  className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    المعلومات المالية
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="location" 
                  className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    الموقع والحالة
                  </div>
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
                                data-testid="tool-name-input"
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
                                <SelectTrigger data-testid="tool-category-select">
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
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الوصف</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="وصف مفصل للأداة ومواصفاتها..."
                              {...field}
                              data-testid="tool-description-input"
                            />
                          </FormControl>
                          <FormDescription>
                            وصف تفصيلي للأداة ومواصفاتها واستخداماتها
                          </FormDescription>
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
                              <SelectTrigger data-testid="tool-unit-select">
                                <SelectValue placeholder="اختر وحدة القياس" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="قطعة">قطعة</SelectItem>
                              <SelectItem value="مجموعة">مجموعة</SelectItem>
                              <SelectItem value="كيلوغرام">كيلوغرام</SelectItem>
                              <SelectItem value="متر">متر</SelectItem>
                              <SelectItem value="لتر">لتر</SelectItem>
                              <SelectItem value="عبوة">عبوة</SelectItem>
                            </SelectContent>
                          </Select>
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
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رمز المنتج (SKU)</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder="مثال: TOOL-123456"
                                  {...field}
                                  data-testid="tool-sku-input"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={generateSku}
                                data-testid="generate-sku-button"
                              >
                                توليد
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="serialNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الرقم التسلسلي</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="الرقم التسلسلي للأداة"
                                {...field}
                                data-testid="tool-serial-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رمز QR / الباركود</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder="رمز QR أو الباركود"
                                {...field}
                                data-testid="tool-barcode-input"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={generateQrCode}
                              data-testid="generate-qr-button"
                            >
                              <QrCode className="h-4 w-4" />
                              إنشاء QR
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المواصفات التقنية</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='مثال: {"القوة": "750 واط", "السرعة": "3000 دورة/دقيقة", "الوزن": "2.5 كجم"}'
                              {...field}
                              data-testid="tool-specifications-input"
                            />
                          </FormControl>
                          <FormDescription>
                            يمكن إدخال المواصفات كنص عادي أو بصيغة JSON
                          </FormDescription>
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
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      المعلومات المالية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="purchasePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>سعر الشراء (ريال سعودي)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                {...field}
                                data-testid="tool-purchase-price-input"
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
                                data-testid="tool-purchase-date-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                data-testid="tool-warranty-input"
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
                                placeholder="90"
                                {...field}
                                data-testid="tool-maintenance-interval-input"
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

              {/* Location and Status Tab */}
              <TabsContent value="location" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      الموقع والحالة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="locationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نوع الموقع *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="tool-location-type-select">
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

                      <FormField
                        control={form.control}
                        name="locationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تحديد الموقع</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="رقم أو اسم الموقع المحدد"
                                {...field}
                                data-testid="tool-location-id-input"
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
                                <SelectTrigger data-testid="tool-status-select">
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
                                <SelectTrigger data-testid="tool-condition-select">
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
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="cancel-add-tool-button"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createToolMutation.isPending}
                data-testid="save-add-tool-button"
              >
                {createToolMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة الأداة
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddToolDialog;