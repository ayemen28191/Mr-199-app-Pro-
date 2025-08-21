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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            تفاصيل المعدة
          </DialogTitle>
          <DialogDescription>
            عرض وتعديل تفاصيل المعدة
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">التفاصيل</TabsTrigger>
            <TabsTrigger value="history">التاريخ</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {!isEditing ? (
              // عرض التفاصيل
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>معلومات أساسية</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                          data-testid="button-edit-equipment"
                        >
                          <Edit className="h-4 w-4" />
                          تعديل
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDelete}
                          disabled={deleteMutation.isPending}
                          data-testid="button-delete-equipment"
                        >
                          <Trash2 className="h-4 w-4" />
                          حذف
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Header with Equipment Name and Status */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {equipment.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-equipment-name">
                            {equipment.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="text-equipment-code">
                            {equipment.code}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(equipment.status)} px-3 py-1 text-sm font-medium`} data-testid="badge-equipment-status">
                        {getStatusText(equipment.status)}
                      </Badge>
                    </div>

                    {/* Main Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Type Card */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">ن</span>
                          </div>
                          <label className="text-sm font-medium text-purple-700 dark:text-purple-300">النوع</label>
                        </div>
                        <p className="text-lg font-semibold text-purple-900 dark:text-purple-100" data-testid="text-equipment-type">
                          {getTypeText(equipment.type)}
                        </p>
                      </div>

                      {/* Location Card */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">م</span>
                          </div>
                          <label className="text-sm font-medium text-green-700 dark:text-green-300">الموقع الحالي</label>
                        </div>
                        <p className="text-lg font-semibold text-green-900 dark:text-green-100" data-testid="text-current-location">
                          {equipment.currentProjectId 
                            ? projects.find(p => p.id === equipment.currentProjectId)?.name || 'مشروع غير معروف'
                            : 'المستودع'
                          }
                        </p>
                      </div>

                      {/* Purchase Date Card */}
                      {equipment.purchaseDate && (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">ت</span>
                            </div>
                            <label className="text-sm font-medium text-blue-700 dark:text-blue-300">تاريخ الشراء</label>
                          </div>
                          <p className="text-lg font-semibold text-blue-900 dark:text-blue-100" data-testid="text-purchase-date">
                            {format(new Date(equipment.purchaseDate), 'dd/MM/yyyy', { locale: ar })}
                          </p>
                        </div>
                      )}

                      {/* Purchase Price Card */}
                      {equipment.purchasePrice && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">س</span>
                            </div>
                            <label className="text-sm font-medium text-amber-700 dark:text-amber-300">سعر الشراء</label>
                          </div>
                          <p className="text-lg font-semibold text-amber-900 dark:text-amber-100" data-testid="text-purchase-price">
                            {equipment.purchasePrice.toLocaleString()} ر.س
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Description Section */}
                    {equipment.description && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">و</span>
                          </div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">الوصف</label>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-equipment-description">
                          {equipment.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              // نموذج التعديل
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم المعدة *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-edit-name" />
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
                          <FormLabel>كود المعدة *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-edit-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع المعدة *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-edit-type">
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
                          <FormLabel>حالة المعدة *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-edit-status">
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

                    <FormField
                      control={form.control}
                      name="purchaseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تاريخ الشراء</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-edit-purchase-date" />
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
                          <FormLabel>سعر الشراء</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-edit-purchase-price" />
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
                        <FormLabel>المشروع الحالي</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "warehouse" ? null : value)}
                          value={field.value || "warehouse"}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-project">
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
                        <FormLabel>الوصف</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="resize-none" 
                            rows={3} 
                            {...field} 
                            data-testid="textarea-edit-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      data-testid="button-cancel-edit"
                    >
                      إلغاء
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateMutation.isPending}
                      data-testid="button-save-edit"
                    >
                      {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  تاريخ حركات المعدة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {movements.length === 0 ? (
                  <p className="text-center text-gray-500 py-4" data-testid="text-no-movements">
                    لا توجد حركات مسجلة للمعدة
                  </p>
                ) : (
                  <div className="space-y-3">
                    {movements.map((movement: EquipmentMovement) => (
                      <div 
                        key={movement.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`movement-${movement.id}`}
                      >
                        <div>
                          <p className="font-medium">
                            {movement.reason || 'نقل معدة'}
                          </p>
                          <p className="text-sm text-gray-500">
                            بواسطة: {movement.performedBy}
                          </p>
                          {movement.notes && (
                            <p className="text-sm text-gray-600">{movement.notes}</p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(movement.movementDate), 'dd/MM/yyyy HH:mm', { locale: ar })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}