import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { 
  Move, 
  Plus, 
  History, 
  MapPin, 
  Calendar, 
  User, 
  FileText, 
  Package, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  Navigation,
  Clock,
  Lock
} from 'lucide-react';

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
import { Separator } from '@/components/ui/separator';

import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AutocompleteInput } from '@/components/ui/autocomplete-input-database';

// Enhanced form validation schema with improved constraints
const addMovementSchema = z.object({
  movementType: z.string()
    .min(1, 'يجب اختيار نوع الحركة من القائمة')
    .refine((val) => ['check_in', 'check_out', 'transfer', 'maintenance', 'return', 'repair', 'inspection'].includes(val), {
      message: 'نوع الحركة المختار غير صحيح'
    }),
  toLocation: z.string()
    .min(2, 'يجب تحديد الموقع المستهدف (أكثر من حرف واحد)')
    .max(200, 'اسم الموقع طويل جداً (أكثر من 200 حرف)')
    .regex(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\w\s\-\(\)\.،]+$/, 'الموقع يحتوي على أحرف غير مسموحة'),
  toProjectId: z.string().optional(),
  quantity: z.coerce.number()
    .min(1, 'الكمية يجب أن تكون أكبر من صفر')
    .max(10000, 'الكمية مرتفعة جداً (أكثر من 10,000)')
    .int('الكمية يجب أن تكون رقماً صحيحاً'),
  reason: z.string()
    .max(300, 'السبب طويل جداً (أكثر من 300 حرف)')
    .optional(),
  performedBy: z.string()
    .min(2, 'يجب إدخال اسم المسؤول عن الحركة (أكثر من حرف واحد)')
    .max(100, 'اسم المسؤول طويل جداً (أكثر من 100 حرف)')
    .regex(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\w\s\-\.]+$/, 'اسم المسؤول يحتوي على أحرف غير مسموحة'),
  notes: z.string()
    .max(500, 'الملاحظات طويلة جداً (أكثر من 500 حرف)')
    .optional(),
});

type AddMovementFormData = z.infer<typeof addMovementSchema>;

// Types
interface ToolMovement {
  id: string;
  toolId: string;
  movementType: string;
  fromLocation?: string;
  toLocation?: string;
  fromProjectId?: string;
  toProjectId?: string;
  quantity: number;
  reason?: string;
  performedBy?: string;
  notes?: string;
  gpsLocation?: any;
  createdAt: string;
  performedAt: string;
}

interface ToolMovementsDialogProps {
  toolId: string;
  toolName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ToolMovementsDialog: React.FC<ToolMovementsDialogProps> = ({ 
  toolId, 
  toolName, 
  open, 
  onOpenChange 
}) => {
  const [activeTab, setActiveTab] = useState('history');
  const [showAddForm, setShowAddForm] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tool movements
  const { data: movements = [], isLoading } = useQuery<ToolMovement[]>({
    queryKey: ['/api/tool-movements', toolId],
    queryFn: async () => {
      const response = await fetch(`/api/tool-movements?toolId=${toolId}`);
      if (!response.ok) {
        throw new Error('فشل في جلب حركات الأداة');
      }
      return response.json();
    },
    enabled: !!toolId && open,
  });

  // Fetch projects for location selection
  const { data: projects = [] } = useQuery<{id: string, name: string, status: string}[]>({
    queryKey: ['/api/projects'],
    enabled: open,
  });

  // Fetch current tool data to show current location and project
  const { data: currentTool } = useQuery<{id: string, name: string, currentLocation?: string, projectId?: string, projectName?: string}>({
    queryKey: ['/api/tools', toolId],
    enabled: !!toolId && open,
  });

  // Form setup
  const form = useForm<AddMovementFormData>({
    resolver: zodResolver(addMovementSchema),
    defaultValues: {
      movementType: '',
      toLocation: '',
      quantity: 1,
      performedBy: '',
      reason: '',
      notes: '',
    },
  });

  // Create movement mutation
  const createMovementMutation = useMutation({
    mutationFn: async (data: AddMovementFormData) => {
      const movementData = {
        toolId,
        movementType: data.movementType,
        quantity: Number(data.quantity),
        
        // From location (current location from tool data)
        fromType: currentTool?.projectId ? 'project' : 'warehouse',
        fromId: currentTool?.projectId || null,
        
        // To location (destination)
        toType: data.toProjectId && data.toProjectId !== 'none' ? 'project' : 'warehouse',
        toId: data.toProjectId === 'none' ? null : data.toProjectId,
        
        // معلومات إضافية
        projectId: data.toProjectId === 'none' ? null : data.toProjectId,
        performedBy: data.performedBy,
        reason: data.reason,
        notes: data.notes,
        referenceNumber: `MOV_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        performedAt: new Date(),
      };

      return apiRequest('/api/tool-movements', 'POST', movementData);
    },
    onSuccess: () => {
      toast({
        title: 'تم تسجيل الحركة بنجاح',
        description: 'تمت إضافة حركة الأداة إلى السجل',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tool-movements', toolId] });
      queryClient.invalidateQueries({ queryKey: ['/api/tools', toolId] });
      form.reset();
      setShowAddForm(false);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في تسجيل الحركة',
        description: error.message || 'حدث خطأ أثناء تسجيل حركة الأداة',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AddMovementFormData) => {
    createMovementMutation.mutate(data);
  };

  // Get current location for GPS
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          toast({
            title: 'تم تحديد الموقع',
            description: `الإحداثيات: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          });
        },
        (error) => {
          toast({
            title: 'خطأ في تحديد الموقع',
            description: 'لا يمكن الوصول إلى الموقع الجغرافي',
            variant: 'destructive',
          });
        }
      );
    } else {
      toast({
        title: 'الموقع غير مدعوم',
        description: 'هذا المتصفح لا يدعم تحديد الموقع الجغرافي',
        variant: 'destructive',
      });
    }
  };

  // Format movement type in Arabic
  const formatMovementType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'check_in': 'استلام',
      'check_out': 'تسليم',
      'transfer': 'نقل',
      'maintenance': 'صيانة',
      'return': 'إرجاع',
      'dispose': 'إتلاف',
      'repair': 'إصلاح',
      'inspection': 'فحص',
    };
    return typeMap[type] || type;
  };

  // Get movement icon
  const getMovementIcon = (type: string) => {
    const iconMap: { [key: string]: any } = {
      'check_in': CheckCircle,
      'check_out': ArrowRight,
      'transfer': Move,
      'maintenance': AlertTriangle,
      'return': ArrowRight,
      'dispose': AlertTriangle,
      'repair': AlertTriangle,
      'inspection': CheckCircle,
    };
    return iconMap[type] || Move;
  };

  // Get movement color theme
  const getMovementTheme = (type: string) => {
    const themeMap: { [key: string]: { border: string; bg: string; text: string; icon: string } } = {
      'check_in': { 
        border: 'border-l-green-500', 
        bg: 'bg-green-50 dark:bg-green-900/20', 
        text: 'text-green-700 dark:text-green-300',
        icon: 'text-green-600'
      },
      'check_out': { 
        border: 'border-l-blue-500', 
        bg: 'bg-blue-50 dark:bg-blue-900/20', 
        text: 'text-blue-700 dark:text-blue-300',
        icon: 'text-blue-600'
      },
      'transfer': { 
        border: 'border-l-purple-500', 
        bg: 'bg-purple-50 dark:bg-purple-900/20', 
        text: 'text-purple-700 dark:text-purple-300',
        icon: 'text-purple-600'
      },
      'maintenance': { 
        border: 'border-l-orange-500', 
        bg: 'bg-orange-50 dark:bg-orange-900/20', 
        text: 'text-orange-700 dark:text-orange-300',
        icon: 'text-orange-600'
      },
      'return': { 
        border: 'border-l-cyan-500', 
        bg: 'bg-cyan-50 dark:bg-cyan-900/20', 
        text: 'text-cyan-700 dark:text-cyan-300',
        icon: 'text-cyan-600'
      },
      'repair': { 
        border: 'border-l-red-500', 
        bg: 'bg-red-50 dark:bg-red-900/20', 
        text: 'text-red-700 dark:text-red-300',
        icon: 'text-red-600'
      },
      'inspection': { 
        border: 'border-l-indigo-500', 
        bg: 'bg-indigo-50 dark:bg-indigo-900/20', 
        text: 'text-indigo-700 dark:text-indigo-300',
        icon: 'text-indigo-600'
      },
      'dispose': { 
        border: 'border-l-gray-500', 
        bg: 'bg-gray-50 dark:bg-gray-900/20', 
        text: 'text-gray-700 dark:text-gray-300',
        icon: 'text-gray-600'
      },
    };
    return themeMap[type] || themeMap['transfer'];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <History className="h-6 w-6" />
            حركات الأداة: {toolName}
          </DialogTitle>
          <DialogDescription>
            تتبع وإدارة جميع حركات الأداة ونقلها بين المواقع
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 rounded-lg mb-4 sm:mb-6">
            <TabsTrigger value="history" className="text-xs sm:text-sm font-medium flex items-center gap-1">
              <History className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">سجل الحركات</span>
              <span className="sm:hidden">السجل</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="text-xs sm:text-sm font-medium flex items-center gap-1">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">إضافة حركة</span>
              <span className="sm:hidden">إضافة</span>
            </TabsTrigger>
          </TabsList>

          {/* Movements History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">سجل الحركات</h3>
              <Badge variant="secondary">
                {movements.length} حركة
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <History className="h-12 w-12 animate-pulse text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">جاري تحميل السجل...</p>
                </div>
              </div>
            ) : movements.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد حركات مسجلة</h3>
                  <p className="text-muted-foreground mb-4">
                    لم يتم تسجيل أي حركات لهذه الأداة بعد
                  </p>
                  <Button onClick={() => setActiveTab('add')}>
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة أول حركة
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {movements.map((movement) => {
                  const MovementIcon = getMovementIcon(movement.movementType);
                  const fromProject = projects.find(p => p.id === movement.fromProjectId);
                  const toProject = projects.find(p => p.id === movement.toProjectId);
                  const theme = getMovementTheme(movement.movementType);
                  
                  return (
                    <Card key={movement.id} className={`${theme.border} border-l-4 hover:shadow-md transition-shadow`}>
                      <CardContent className={`p-3 sm:p-4 ${theme.bg}`}>
                        <div className="flex flex-col sm:flex-row gap-3">
                          {/* رأس البطاقة - المعلومات الأساسية */}
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${theme.bg} border`}>
                              <MovementIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${theme.icon}`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* العنوان الرئيسي */}
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge variant="outline" className={`${theme.text} border-current text-xs font-semibold`}>
                                  {formatMovementType(movement.movementType)}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                                  <Package className="h-3 w-3" />
                                  <span>الكمية: {movement.quantity}</span>
                                </div>
                              </div>

                              {/* المعلومات المفصلة في شبكة */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                                {/* الموقع */}
                                {(movement.fromLocation || movement.toLocation) && (
                                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                    <MapPin className="h-3 w-3 text-gray-500" />
                                    <span className="truncate">
                                      {movement.fromLocation && movement.toLocation 
                                        ? `${movement.fromLocation} ← ${movement.toLocation}`
                                        : movement.toLocation || movement.fromLocation
                                      }
                                    </span>
                                  </div>
                                )}

                                {/* المشروع */}
                                {(fromProject || toProject) && (
                                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                    <Package className="h-3 w-3 text-gray-500" />
                                    <span className="truncate">
                                      {fromProject && toProject 
                                        ? `${fromProject.name} ← ${toProject.name}`
                                        : (toProject?.name || fromProject?.name)
                                      }
                                    </span>
                                  </div>
                                )}

                                {/* المسؤول */}
                                {movement.performedBy && (
                                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                    <User className="h-3 w-3 text-gray-500" />
                                    <span className="truncate">بواسطة: {movement.performedBy}</span>
                                  </div>
                                )}

                                {/* السبب */}
                                {movement.reason && (
                                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                    <FileText className="h-3 w-3 text-gray-500" />
                                    <span className="truncate">السبب: {movement.reason}</span>
                                  </div>
                                )}
                              </div>

                              {/* الملاحظات الإضافية */}
                              {movement.notes && (
                                <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded text-xs border border-gray-200 dark:border-gray-700">
                                  <span className="text-gray-700 dark:text-gray-300">{movement.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* التوقيت - يظهر على اليمين في الحاسوب وأسفل في الهاتف */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 text-xs">
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(movement.createdAt).toLocaleDateString('en-GB')}</span>
                            </div>
                            <div className="text-gray-400 dark:text-gray-500 font-mono">
                              {new Date(movement.createdAt).toLocaleTimeString('en-GB', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Add Movement Tab */}
          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  إضافة حركة جديدة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">


                    <div className="grid grid-cols-1 gap-4">

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="movementType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نوع الحركة *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="اختر نوع الحركة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="check_in">استلام</SelectItem>
                                  <SelectItem value="check_out">تسليم</SelectItem>
                                  <SelectItem value="transfer">نقل</SelectItem>
                                  <SelectItem value="maintenance">صيانة</SelectItem>
                                  <SelectItem value="return">إرجاع</SelectItem>
                                  <SelectItem value="repair">إصلاح</SelectItem>
                                  <SelectItem value="inspection">فحص</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الكمية *</FormLabel>
                              <FormControl>
                                <AutocompleteInput
                                  value={field.value?.toString() || ''}
                                  onChange={(value) => field.onChange(parseInt(value) || 1)}
                                  placeholder="1"
                                  category="toolQuantities"
                                  className="text-sm arabic-numbers"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>


                      {/* إلى الموقع والمشروع - المطلوب */}
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                          <ArrowRight className="h-4 w-4" />
                          إلى أين تريد نقل الأداة؟
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="toLocation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-green-800 dark:text-green-300 font-semibold">الموقع الجديد *</FormLabel>
                                <FormControl>
                                  <AutocompleteInput
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    placeholder="مثال: موقع العمل - القطاع B، مخزن رقم 1، ورشة الصيانة"
                                    category="toolLocations"
                                    className="border-green-300 dark:border-green-700 focus:border-green-500 text-sm arabic-numbers"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="toProjectId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-green-800 dark:text-green-300 font-semibold">المشروع الجديد (اختياري)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || 'none'}>
                                  <FormControl>
                                    <SelectTrigger className="border-green-300 dark:border-green-700 focus:border-green-500 text-sm">
                                      <SelectValue placeholder="اختر المشروع المستهدف" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">غير محدد</SelectItem>
                                    {projects.map((project) => (
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
                        </div>
                      </div>

                      {/* تم حذف التكرار - المشروع المستهدف موجود أعلاه في قسم "إلى أين تريد نقل الأداة؟" */}

                      {/* المسؤول والسبب */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="performedBy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>المسؤول عن الحركة *</FormLabel>
                              <FormControl>
                                <AutocompleteInput
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  placeholder="اسم الشخص المسؤول، مثال: أحمد محمد، مهندس الموقع"
                                  category="performedByNames"
                                  className="text-sm arabic-numbers"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>سبب الحركة (اختياري)</FormLabel>
                              <FormControl>
                                <AutocompleteInput
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  placeholder="مثال: انتهاء العمل، صيانة دورية، تغيير الموقع، طلب المشروع"
                                  category="movementReasons"
                                  className="text-sm arabic-numbers"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ملاحظات إضافية (اختياري)</FormLabel>
                          <FormControl>
                            <AutocompleteInput
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="مثال: الأداة في حالة ممتازة، تحتاج صيانة بسيطة، تم التحقق من الأداء"
                              category="movementNotes"
                              className="text-sm arabic-numbers"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={getCurrentLocation}
                        className="flex items-center gap-2 w-full sm:w-auto text-sm"
                        size="sm"
                      >
                        <Navigation className="h-3 w-3" />
                        تحديد الموقع الحالي
                      </Button>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setActiveTab('history')}
                          className="flex-1 sm:flex-none text-sm"
                          size="sm"
                        >
                          إلغاء
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMovementMutation.isPending}
                          className="min-w-[120px] flex-1 sm:flex-none text-sm"
                          size="sm"
                        >
                          {createMovementMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-2"></div>
                              جاري الحفظ...
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 ml-2" />
                              تسجيل الحركة
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ToolMovementsDialog;