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
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">اسم المعدة</label>
                        <p className="text-lg font-semibold" data-testid="text-equipment-name">{equipment.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">كود المعدة</label>
                        <p className="text-lg font-semibold" data-testid="text-equipment-code">{equipment.code}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">النوع</label>
                        <p className="text-lg" data-testid="text-equipment-type">{getTypeText(equipment.type)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">الحالة</label>
                        <Badge className={getStatusColor(equipment.status)} data-testid="badge-equipment-status">
                          {getStatusText(equipment.status)}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">الموقع الحالي</label>
                        <p className="text-lg" data-testid="text-current-location">
                          {equipment.currentProjectId 
                            ? projects.find(p => p.id === equipment.currentProjectId)?.name || 'مشروع غير معروف'
                            : 'المستودع'
                          }
                        </p>
                      </div>
                      {equipment.purchaseDate && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">تاريخ الشراء</label>
                          <p className="text-lg" data-testid="text-purchase-date">
                            {format(new Date(equipment.purchaseDate), 'dd/MM/yyyy', { locale: ar })}
                          </p>
                        </div>
                      )}
                      {equipment.purchasePrice && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">سعر الشراء</label>
                          <p className="text-lg" data-testid="text-purchase-price">
                            {equipment.purchasePrice.toLocaleString()} ر.س
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {equipment.description && (
                      <>
                        <Separator />
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">الوصف</label>
                          <p className="text-gray-700 dark:text-gray-300 mt-1" data-testid="text-equipment-description">
                            {equipment.description}
                          </p>
                        </div>
                      </>
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
                          onValueChange={(value) => field.onChange(value === "" ? null : value)}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-project">
                              <SelectValue placeholder="اختر المشروع" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">المستودع</SelectItem>
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