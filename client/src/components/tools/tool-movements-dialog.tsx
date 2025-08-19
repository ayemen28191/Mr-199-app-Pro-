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
  Clock
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

// Form validation schema
const addMovementSchema = z.object({
  movementType: z.string().min(1, 'يجب اختيار نوع الحركة'),
  fromLocation: z.string().optional(),
  toLocation: z.string().min(1, 'يجب تحديد الموقع المستهدف'),
  fromProjectId: z.string().optional(),
  toProjectId: z.string().optional(),
  quantity: z.coerce.number()
    .min(1, 'الكمية يجب أن تكون أكبر من صفر')
    .max(1000, 'الكمية مرتفعة جداً'),
  reason: z.string().optional(),
  performedBy: z.string().min(2, 'يجب إدخال اسم المسؤول عن الحركة'),
  notes: z.string().optional(),
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
    enabled: !!toolId && open,
  });

  // Fetch projects for location selection
  const { data: projects = [] } = useQuery<{id: string, name: string, status: string}[]>({
    queryKey: ['/api/projects'],
    enabled: open,
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
        ...data,
        toolId,
        gpsLocation: null, // Can be enhanced with GPS if needed
        createdAt: new Date().toISOString(),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
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
          <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 rounded-lg mb-6">
            <TabsTrigger value="history" className="text-sm font-medium">
              <History className="h-4 w-4 ml-1" />
              سجل الحركات
            </TabsTrigger>
            <TabsTrigger value="add" className="text-sm font-medium">
              <Plus className="h-4 w-4 ml-1" />
              إضافة حركة
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
              <div className="space-y-3">
                {movements.map((movement) => {
                  const MovementIcon = getMovementIcon(movement.movementType);
                  const fromProject = projects.find(p => p.id === movement.fromProjectId);
                  const toProject = projects.find(p => p.id === movement.toProjectId);
                  
                  return (
                    <Card key={movement.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              <MovementIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">
                                  {formatMovementType(movement.movementType)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  الكمية: {movement.quantity}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <MapPin className="h-4 w-4" />
                                {movement.fromLocation && (
                                  <span>من: {movement.fromLocation}</span>
                                )}
                                {movement.fromLocation && movement.toLocation && (
                                  <ArrowRight className="h-4 w-4" />
                                )}
                                {movement.toLocation && (
                                  <span>إلى: {movement.toLocation}</span>
                                )}
                              </div>

                              {(fromProject || toProject) && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                  <Package className="h-4 w-4" />
                                  {fromProject && (
                                    <span>من مشروع: {fromProject.name}</span>
                                  )}
                                  {fromProject && toProject && (
                                    <ArrowRight className="h-4 w-4" />
                                  )}
                                  {toProject && (
                                    <span>إلى مشروع: {toProject.name}</span>
                                  )}
                                </div>
                              )}

                              {movement.reason && (
                                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                                  <FileText className="h-4 w-4 mt-0.5" />
                                  <span>السبب: {movement.reason}</span>
                                </div>
                              )}

                              {movement.performedBy && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <User className="h-4 w-4" />
                                  <span>بواسطة: {movement.performedBy}</span>
                                </div>
                              )}

                              {movement.notes && (
                                <div className="mt-2 p-2 bg-muted rounded text-sm">
                                  {movement.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-left">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(movement.createdAt).toLocaleDateString('en-US')}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(movement.createdAt).toLocaleTimeString('en-US', { 
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="movementType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نوع الحركة *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
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
                              <Input
                                type="number"
                                min="1"
                                placeholder="1"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fromLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>من الموقع</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="مثال: مخزن A - رف 3"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="toLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>إلى الموقع *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="مثال: موقع العمل - القطاع B"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fromProjectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>من المشروع</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر المشروع (اختياري)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">غير محدد</SelectItem>
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

                      <FormField
                        control={form.control}
                        name="toProjectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>إلى المشروع</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر المشروع (اختياري)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">غير محدد</SelectItem>
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

                      <FormField
                        control={form.control}
                        name="performedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المسؤول عن الحركة *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="اسم الشخص المسؤول"
                                {...field}
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
                            <FormLabel>سبب الحركة</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="مثال: صيانة دورية، نقل للمشروع"
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
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ملاحظات إضافية</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="أي ملاحظات أو تفاصيل إضافية..."
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="flex justify-between items-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={getCurrentLocation}
                        className="flex items-center gap-2"
                      >
                        <Navigation className="h-4 w-4" />
                        تحديد الموقع الحالي
                      </Button>

                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setActiveTab('history')}
                        >
                          إلغاء
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMovementMutation.isPending}
                          className="min-w-[120px]"
                        >
                          {createMovementMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                              جاري الحفظ...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 ml-2" />
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