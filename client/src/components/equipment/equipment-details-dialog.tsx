import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Equipment, EquipmentMovement } from "@shared/schema";
import { Edit, History, Info, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const equipmentSchema = z.object({
  name: z.string().min(1, "اسم المعدة مطلوب"),
  code: z.string().min(1, "كود المعدة مطلوب"),
  type: z.string().min(1, "نوع المعدة مطلوب"),
  status: z.string().min(1, "حالة المعدة مطلوبة"),
  description: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),
  currentProjectId: z.string().nullable().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface EquipmentDetailsDialogProps {
  equipment: Equipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: any[];
}

export function EquipmentDetailsDialog({ equipment, open, onOpenChange, projects }: EquipmentDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "construction",
      status: "active",
      description: "",
      purchaseDate: "",
      purchasePrice: "",
      currentProjectId: null,
    },
  });

  // تحديث القيم عند تغيير المعدة
  useEffect(() => {
    if (equipment && open) {
      form.reset({
        name: equipment.name || "",
        code: equipment.code || "",
        type: equipment.type || "construction",
        status: equipment.status || "active",
        description: equipment.description || "",
        purchaseDate: equipment.purchaseDate || "",
        purchasePrice: equipment.purchasePrice?.toString() || "",
        currentProjectId: equipment.currentProjectId || null,
      });
      setIsEditing(false);
    }
  }, [equipment, open, form]);

  // جلب تاريخ حركات المعدة
  const { data: movements = [] } = useQuery({
    queryKey: ['equipment-movements', equipment?.id],
    queryFn: async () => {
      if (!equipment?.id) return [];
      const response = await fetch(`/api/equipment/${equipment.id}/movements`);
      if (!response.ok) throw new Error('فشل في جلب حركات المعدة');
      return response.json();
    },
    enabled: open && !!equipment?.id
  });

  const updateMutation = useMutation({
    mutationFn: (data: EquipmentFormData) => 
      apiRequest(`/api/equipment/${equipment?.id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({
        title: "نجح التحديث",
        description: "تم تحديث المعدة بنجاح",
        variant: "default",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث المعدة",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest(`/api/equipment/${equipment?.id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({
        title: "نجح الحذف",
        description: "تم حذف المعدة بنجاح",
        variant: "default",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف المعدة",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EquipmentFormData) => {
    const submitData = {
      ...data,
      purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : undefined,
      currentProjectId: data.currentProjectId || null,
    };
    updateMutation.mutate(submitData);
  };

  const handleDelete = () => {
    if (window.confirm("هل أنت متأكد من حذف هذه المعدة؟")) {
      deleteMutation.mutate();
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      'maintenance': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      'out_of_service': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      'inactive': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getStatusText = (status: string) => {
    const texts = {
      'active': 'نشط',
      'maintenance': 'صيانة',
      'out_of_service': 'خارج الخدمة',
      'inactive': 'غير نشط'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getTypeText = (type: string) => {
    const texts = {
      'construction': 'إنشائية',
      'transport': 'نقل',
      'tool': 'أداة'
    };
    return texts[type as keyof typeof texts] || type;
  };

  if (!equipment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[450px] max-h-[90vh] overflow-y-auto p-4" dir="rtl">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="flex items-center justify-between text-lg">
            <span>تفاصيل المعدة</span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 px-2 text-xs"
                data-testid="button-edit-equipment"
              >
                <Edit className="h-3 w-3" />
                تعديل
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="h-8 px-2 text-xs"
                data-testid="button-delete-equipment"
              >
                <Trash2 className="h-3 w-3" />
                حذف
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            عرض وتعديل تفاصيل المعدة
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full mt-3">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="details" className="text-sm">التفاصيل</TabsTrigger>
            <TabsTrigger value="history" className="text-sm">التاريخ</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3 mt-3">
            {!isEditing ? (
              // عرض التفاصيل
              <div className="space-y-3">
                {/* Header with Equipment Name and Status - Compact */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {equipment.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white truncate" data-testid="text-equipment-name">
                        {equipment.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="text-equipment-code">
                        {equipment.code}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(equipment.status)} px-2 py-1 text-xs font-medium shrink-0`} data-testid="badge-equipment-status">
                      {getStatusText(equipment.status)}
                    </Badge>
                  </div>
                </div>

                {/* Main Information - Compact Cards */}
                <div className="space-y-2">
                  {/* Type */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">ن</span>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-purple-700 dark:text-purple-300">النوع</label>
                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-100" data-testid="text-equipment-type">
                          {getTypeText(equipment.type)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">م</span>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-green-700 dark:text-green-300">الموقع الحالي</label>
                        <p className="text-sm font-semibold text-green-900 dark:text-green-100" data-testid="text-current-location">
                          {equipment.currentProjectId 
                            ? projects.find(p => p.id === equipment.currentProjectId)?.name || 'مشروع غير معروف'
                            : 'المستودع'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Purchase Date Card */}
                  {equipment.purchaseDate && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">ت</span>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium text-blue-700 dark:text-blue-300">تاريخ الشراء</label>
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100" data-testid="text-purchase-date">
                            {format(new Date(equipment.purchaseDate), 'dd/MM/yyyy', { locale: ar })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Purchase Price Card */}
                  {equipment.purchasePrice && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">س</span>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium text-amber-700 dark:text-amber-300">سعر الشراء</label>
                          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100" data-testid="text-purchase-price">
                            {equipment.purchasePrice.toLocaleString()} ر.س
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                    
                  {/* Description Section */}
                  {equipment.description && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">و</span>
                        </div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">الوصف</label>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-equipment-description">
                        {equipment.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // نموذج التعديل - محسن للهواتف
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <div className="space-y-3">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 gap-3">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">اسم المعدة *</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-9 text-sm" data-testid="input-edit-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">كود المعدة *</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-9 text-sm" data-testid="input-edit-code" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">النوع *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9 text-sm" data-testid="select-edit-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="construction">إنشائية</SelectItem>
                                  <SelectItem value="transport">نقل</SelectItem>
                                  <SelectItem value="tool">أداة</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">الحالة *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9 text-sm" data-testid="select-edit-status">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="active">نشط</SelectItem>
                                  <SelectItem value="maintenance">صيانة</SelectItem>
                                  <SelectItem value="out_of_service">خارج الخدمة</SelectItem>
                                  <SelectItem value="inactive">غير نشط</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name="purchaseDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">تاريخ الشراء</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} className="h-9 text-sm" data-testid="input-edit-purchase-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="purchasePrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">سعر الشراء</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} className="h-9 text-sm" data-testid="input-edit-purchase-price" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="currentProjectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">المشروع الحالي</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(value === "warehouse" ? null : value)}
                              value={field.value || "warehouse"}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9 text-sm" data-testid="select-edit-project">
                                  <SelectValue placeholder="اختر المشروع" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="warehouse">المستودع</SelectItem>
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
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">الوصف</FormLabel>
                            <FormControl>
                              <Textarea 
                                className="resize-none text-sm min-h-[60px]" 
                                rows={2} 
                                {...field} 
                                data-testid="textarea-edit-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Buttons - Full width on mobile */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="order-2 sm:order-1 h-9 text-sm"
                      data-testid="button-cancel-edit"
                    >
                      إلغاء
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateMutation.isPending}
                      className="order-1 sm:order-2 h-9 text-sm"
                      data-testid="button-save-edit"
                    >
                      {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3 mt-3">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <History className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ حركات المعدة</h3>
              </div>
              
              {movements.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500" data-testid="text-no-movements">
                    لا توجد حركات مسجلة للمعدة
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {movements.map((movement: EquipmentMovement) => (
                    <div 
                      key={movement.id} 
                      className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-sm"
                      data-testid={`movement-${movement.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {movement.reason || 'نقل معدة'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            بواسطة: {movement.performedBy}
                          </p>
                          {movement.notes && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                              {movement.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 shrink-0 mr-2">
                          {format(new Date(movement.movementDate), 'dd/MM/yyyy HH:mm', { locale: ar })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}