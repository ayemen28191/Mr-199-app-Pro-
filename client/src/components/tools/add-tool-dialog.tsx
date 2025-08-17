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

// Form validation schema with enhanced validation and autocomplete
const addToolSchema = z.object({
  name: z.string()
    .min(2, 'اسم الأداة مطلوب ويجب أن يكون أكثر من حرفين')
    .max(100, 'اسم الأداة يجب أن يكون أقل من 100 حرف')
    .regex(/^[\u0621-\u064Aa-zA-Z0-9\s\-_.]+$/, 'اسم الأداة يحتوي على أحرف غير مسموحة'),
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
  locationType: z.string().min(1, 'يجب اختيار نوع الموقع'),
  locationId: z.string().optional(),
  projectId: z.string().optional(),
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
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showAddUnitDialog, setShowAddUnitDialog] = useState(false);
  
  // Autocomplete data states
  const [toolNameSuggestions, setToolNameSuggestions] = useState<string[]>([]);
  const [skuSuggestions, setSkuSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showSkuSuggestions, setShowSkuSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  
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
      projectId: '',
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<ToolCategory[]>({
    queryKey: ['/api/tool-categories'],
  });

  // Fetch projects for location selection
  const { data: projects = [] } = useQuery<{id: string, name: string, status: string}[]>({
    queryKey: ['/api/projects'],
  });

  // Autocomplete functions
  const fetchAutocomplete = async (type: string, query: string) => {
    if (query.length < 2) return [];
    try {
      const response = await fetch(`/api/autocomplete/${type}?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        return data.suggestions || [];
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
    }
    return [];
  };

  const handleNameChange = async (value: string) => {
    if (value.length >= 2) {
      const suggestions = await fetchAutocomplete('tool-names', value);
      setToolNameSuggestions(suggestions);
      setShowNameSuggestions(suggestions.length > 0);
    } else {
      setShowNameSuggestions(false);
    }
  };

  const handleSkuChange = async (value: string) => {
    if (value.length >= 2) {
      const suggestions = await fetchAutocomplete('tool-skus', value);
      setSkuSuggestions(suggestions);
      setShowSkuSuggestions(suggestions.length > 0);
    } else {
      setShowSkuSuggestions(false);
    }
  };

  const handleLocationChange = async (value: string) => {
    if (value.length >= 2) {
      const suggestions = await fetchAutocomplete('locations', value);
      setLocationSuggestions(suggestions);
      setShowLocationSuggestions(suggestions.length > 0);
    } else {
      setShowLocationSuggestions(false);
    }
  };

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
              <TabsList className="flex flex-wrap w-full bg-muted/30 p-2 rounded-lg mb-6 gap-1">
                <TabsTrigger 
                  value="basic" 
                  className="flex-1 min-w-0 text-xs sm:text-sm font-medium px-3 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                  data-testid="tab-basic"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">الأساسية</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="details" 
                  className="flex-1 min-w-0 text-xs sm:text-sm font-medium px-3 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                  data-testid="tab-details"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">التقنية</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="financial" 
                  className="flex-1 min-w-0 text-xs sm:text-sm font-medium px-3 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                  data-testid="tab-financial"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">المالية</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="location" 
                  className="flex-1 min-w-0 text-xs sm:text-sm font-medium px-3 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                  data-testid="tab-location"
                >
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">الموقع</span>
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
                              <div className="relative">
                                <Input
                                  placeholder="مثال: مثقاب كهربائي"
                                  {...field}
                                  data-testid="tool-name-input"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleNameChange(e.target.value);
                                  }}
                                  onFocus={() => {
                                    if (field.value && field.value.length >= 2) {
                                      handleNameChange(field.value);
                                    }
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => setShowNameSuggestions(false), 200);
                                  }}
                                />
                                {showNameSuggestions && toolNameSuggestions.length > 0 && (
                                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {toolNameSuggestions.map((suggestion, index) => (
                                      <button
                                        key={index}
                                        type="button"
                                        className="w-full px-3 py-2 text-right hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                        onClick={() => {
                                          field.onChange(suggestion);
                                          setShowNameSuggestions(false);
                                        }}
                                      >
                                        {suggestion}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
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
                            <div className="flex gap-2">
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
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="px-3"
                                onClick={() => setShowAddCategoryDialog(true)}
                                data-testid="add-category-button"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
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
                          <div className="flex gap-2">
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
                                <SelectItem value="صندوق">صندوق</SelectItem>
                                <SelectItem value="طن">طن</SelectItem>
                                <SelectItem value="حقيبة">حقيبة</SelectItem>
                                <SelectItem value="دلو">دلو</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="px-3"
                              onClick={() => setShowAddUnitDialog(true)}
                              data-testid="add-unit-button"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
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
                              <div className="relative flex-1">
                                <FormControl>
                                  <Input
                                    placeholder="مثال: TOOL-123456"
                                    {...field}
                                    data-testid="tool-sku-input"
                                    onChange={(e) => {
                                      field.onChange(e);
                                      handleSkuChange(e.target.value);
                                    }}
                                    onFocus={() => {
                                      if (field.value && field.value.length >= 2) {
                                        handleSkuChange(field.value);
                                      }
                                    }}
                                    onBlur={() => {
                                      setTimeout(() => setShowSkuSuggestions(false), 200);
                                    }}
                                  />
                                </FormControl>
                                {showSkuSuggestions && skuSuggestions.length > 0 && (
                                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {skuSuggestions.map((suggestion, index) => (
                                      <button
                                        key={index}
                                        type="button"
                                        className="w-full px-3 py-2 text-right hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                        onClick={() => {
                                          field.onChange(suggestion);
                                          setShowSkuSuggestions(false);
                                        }}
                                      >
                                        {suggestion}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
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
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المشروع</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="tool-project-select">
                                  <SelectValue placeholder="اختر المشروع" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {projects.filter(project => project.status === 'active').map((project) => (
                                  <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              اختر المشروع الذي ستستخدم فيه هذه الأداة
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
                              <div className="relative">
                                <Input
                                  placeholder="رقم أو اسم الموقع المحدد"
                                  {...field}
                                  data-testid="tool-location-id-input"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleLocationChange(e.target.value);
                                  }}
                                  onFocus={() => {
                                    if (field.value && field.value.length >= 2) {
                                      handleLocationChange(field.value);
                                    }
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => setShowLocationSuggestions(false), 200);
                                  }}
                                />
                                {showLocationSuggestions && locationSuggestions.length > 0 && (
                                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {locationSuggestions.map((suggestion, index) => (
                                      <button
                                        key={index}
                                        type="button"
                                        className="w-full px-3 py-2 text-right hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                        onClick={() => {
                                          field.onChange(suggestion);
                                          setShowLocationSuggestions(false);
                                        }}
                                      >
                                        {suggestion}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
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

      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة تصنيف جديد</DialogTitle>
            <DialogDescription>
              أضف تصنيفاً جديداً للأدوات والمعدات
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">اسم التصنيف</label>
              <Input 
                placeholder="مثال: أدوات كهربائية" 
                className="mt-1"
                data-testid="new-category-name-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الوصف (اختياري)</label>
              <Textarea 
                placeholder="وصف مختصر للتصنيف..."
                className="mt-1"
                data-testid="new-category-description-input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setShowAddCategoryDialog(false)}
            >
              إلغاء
            </Button>
            <Button 
              type="button"
              onClick={() => {
                toast({
                  title: 'إضافة تصنيف',
                  description: 'سيتم إضافة هذه الميزة قريباً',
                });
                setShowAddCategoryDialog(false);
              }}
            >
              إضافة التصنيف
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Unit Dialog */}
      <Dialog open={showAddUnitDialog} onOpenChange={setShowAddUnitDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة وحدة قياس جديدة</DialogTitle>
            <DialogDescription>
              أضف وحدة قياس جديدة للأدوات والمواد
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">اسم الوحدة</label>
              <Input 
                placeholder="مثال: بوصة، باوند، جالون" 
                className="mt-1"
                data-testid="new-unit-name-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الرمز المختصر (اختياري)</label>
              <Input 
                placeholder="مثال: كغ، م، ل"
                className="mt-1"
                data-testid="new-unit-symbol-input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setShowAddUnitDialog(false)}
            >
              إلغاء
            </Button>
            <Button 
              type="button"
              onClick={() => {
                toast({
                  title: 'إضافة وحدة قياس',
                  description: 'سيتم إضافة هذه الميزة قريباً',
                });
                setShowAddUnitDialog(false);
              }}
            >
              إضافة الوحدة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default AddToolDialog;