import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Settings, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface MaintenanceScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  toolId?: string;
  scheduleId?: string;
}

interface MaintenanceSchedule {
  id: string;
  toolId: string;
  scheduleType: string;
  intervalDays?: number;
  intervalWeeks?: number;
  intervalMonths?: number;
  usageHoursInterval?: number;
  usageCountInterval?: number;
  isActive: boolean;
  lastMaintenanceDate?: string;
  nextDueDate: string;
  maintenanceType: string;
  priority: string;
  estimatedDuration?: number;
  estimatedCost?: number;
  assignedTo?: string;
  title: string;
  description?: string;
  checklistItems?: Array<{
    id: string;
    title: string;
    description?: string;
    required: boolean;
  }>;
  enableNotifications: boolean;
  notifyDaysBefore: number;
  createdAt: string;
  updatedAt: string;
}

interface Tool {
  id: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  name: string;
}

const scheduleSchema = z.object({
  toolId: z.string().min(1, "يرجى اختيار الأداة"),
  scheduleType: z.string().min(1, "يرجى اختيار نوع الجدولة"),
  intervalDays: z.number().optional(),
  intervalWeeks: z.number().optional(),
  intervalMonths: z.number().optional(),
  usageHoursInterval: z.number().optional(),
  usageCountInterval: z.number().optional(),
  maintenanceType: z.string().min(1, "يرجى اختيار نوع الصيانة"),
  priority: z.string().min(1, "يرجى اختيار الأولوية"),
  title: z.string().min(1, "يرجى إدخال عنوان الجدول"),
  description: z.string().optional(),
  estimatedDuration: z.number().optional(),
  estimatedCost: z.number().optional(),
  assignedTo: z.string().optional(),
  enableNotifications: z.boolean(),
  notifyDaysBefore: z.number().min(1, "يجب أن يكون أكبر من 0"),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

export function MaintenanceScheduleDialog({ 
  isOpen, 
  onClose, 
  toolId,
  scheduleId 
}: MaintenanceScheduleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checklistItems, setChecklistItems] = useState<Array<{
    id: string;
    title: string;
    description?: string;
    required: boolean;
  }>>([]);

  const form = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      toolId: toolId || "",
      scheduleType: "time_based",
      maintenanceType: "preventive",
      priority: "medium",
      enableNotifications: true,
      notifyDaysBefore: 3,
    },
  });

  // جلب الأدوات
  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      const response = await fetch('/api/tools');
      if (!response.ok) throw new Error('خطأ في جلب الأدوات');
      return response.json();
    },
  });

  // جلب المستخدمين
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('خطأ في جلب المستخدمين');
      return response.json();
    },
  });

  // جلب جدول الصيانة للتعديل
  const { data: schedule, isLoading } = useQuery({
    queryKey: ['maintenance-schedule', scheduleId],
    queryFn: async () => {
      if (!scheduleId) return null;
      const response = await fetch(`/api/maintenance-schedules/${scheduleId}`);
      if (!response.ok) throw new Error('خطأ في جلب جدول الصيانة');
      return response.json();
    },
    enabled: !!scheduleId,
  });

  // تعبئة النموذج عند التعديل
  useEffect(() => {
    if (schedule) {
      form.reset({
        toolId: schedule.toolId,
        scheduleType: schedule.scheduleType,
        intervalDays: schedule.intervalDays || undefined,
        intervalWeeks: schedule.intervalWeeks || undefined,
        intervalMonths: schedule.intervalMonths || undefined,
        usageHoursInterval: schedule.usageHoursInterval || undefined,
        usageCountInterval: schedule.usageCountInterval || undefined,
        maintenanceType: schedule.maintenanceType,
        priority: schedule.priority,
        title: schedule.title,
        description: schedule.description || "",
        estimatedDuration: schedule.estimatedDuration || undefined,
        estimatedCost: schedule.estimatedCost || undefined,
        assignedTo: schedule.assignedTo || "",
        enableNotifications: schedule.enableNotifications,
        notifyDaysBefore: schedule.notifyDaysBefore,
      });
      
      if (schedule.checklistItems) {
        setChecklistItems(schedule.checklistItems);
      }
    }
  }, [schedule, form]);

  // إنشاء/تحديث جدول الصيانة
  const saveMutation = useMutation({
    mutationFn: async (data: ScheduleForm) => {
      const payload = {
        ...data,
        checklistItems: checklistItems.length > 0 ? checklistItems : null,
        nextDueDate: calculateNextDueDate(data).toISOString(),
      };

      const url = scheduleId 
        ? `/api/maintenance-schedules/${scheduleId}`
        : '/api/maintenance-schedules';
      
      const method = scheduleId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error('خطأ في حفظ جدول الصيانة');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: scheduleId ? "تم التحديث بنجاح" : "تم الإنشاء بنجاح",
        description: `تم ${scheduleId ? 'تحديث' : 'إنشاء'} جدول الصيانة "${data.title}"`,
      });
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحفظ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateNextDueDate = (data: ScheduleForm): Date => {
    const now = new Date();
    
    switch (data.scheduleType) {
      case 'time_based':
        if (data.intervalDays) {
          now.setDate(now.getDate() + data.intervalDays);
        } else if (data.intervalWeeks) {
          now.setDate(now.getDate() + (data.intervalWeeks * 7));
        } else if (data.intervalMonths) {
          now.setMonth(now.getMonth() + data.intervalMonths);
        }
        break;
      default:
        now.setDate(now.getDate() + 30); // افتراضي شهر
    }
    
    return now;
  };

  const addChecklistItem = () => {
    const newItem = {
      id: Date.now().toString(),
      title: "",
      description: "",
      required: true,
    };
    setChecklistItems([...checklistItems, newItem]);
  };

  const updateChecklistItem = (id: string, updates: Partial<typeof checklistItems[0]>) => {
    setChecklistItems(items => 
      items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(items => items.filter(item => item.id !== id));
  };

  const onSubmit = (data: ScheduleForm) => {
    saveMutation.mutate(data);
  };

  const scheduleType = form.watch("scheduleType");

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="mr-3">جاري التحميل...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {scheduleId ? "تعديل جدول الصيانة" : "إنشاء جدول صيانة جديد"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
              <TabsTrigger value="schedule">إعدادات الجدولة</TabsTrigger>
              <TabsTrigger value="checklist">قائمة المراجعة</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="toolId">الأداة *</Label>
                  <Select
                    value={form.watch("toolId")}
                    onValueChange={(value) => form.setValue("toolId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الأداة" />
                    </SelectTrigger>
                    <SelectContent>
                      {tools.map((tool: Tool) => (
                        <SelectItem key={tool.id} value={tool.id}>
                          {tool.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.toolId && (
                    <p className="text-sm text-red-500">{form.formState.errors.toolId.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="assignedTo">المسؤول</Label>
                  <Select
                    value={form.watch("assignedTo")}
                    onValueChange={(value) => form.setValue("assignedTo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المسؤول" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user: User) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">عنوان جدول الصيانة *</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  placeholder="مثال: صيانة دورية للمولد الكهربائي"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="وصف تفصيلي لجدول الصيانة..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="maintenanceType">نوع الصيانة *</Label>
                  <Select
                    value={form.watch("maintenanceType")}
                    onValueChange={(value) => form.setValue("maintenanceType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive">صيانة وقائية</SelectItem>
                      <SelectItem value="corrective">صيانة تصحيحية</SelectItem>
                      <SelectItem value="inspection">فحص دوري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">الأولوية *</Label>
                  <Select
                    value={form.watch("priority")}
                    onValueChange={(value) => form.setValue("priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="urgent">عاجلة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="estimatedDuration">المدة المقدرة (ساعات)</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    {...form.register("estimatedDuration", { valueAsNumber: true })}
                    placeholder="2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="estimatedCost">التكلفة المقدرة (ر.ي)</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  step="0.01"
                  {...form.register("estimatedCost", { valueAsNumber: true })}
                  placeholder="500.00"
                />
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="scheduleType">نوع الجدولة *</Label>
                <Select
                  value={form.watch("scheduleType")}
                  onValueChange={(value) => form.setValue("scheduleType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time_based">مبنية على الوقت</SelectItem>
                    <SelectItem value="usage_based">مبنية على الاستخدام</SelectItem>
                    <SelectItem value="condition_based">مبنية على الحالة</SelectItem>
                    <SelectItem value="custom">مخصصة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scheduleType === "time_based" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">إعدادات الفترة الزمنية</CardTitle>
                    <CardDescription>حدد فترة تكرار الصيانة</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="intervalDays">كل كم يوم</Label>
                      <Input
                        id="intervalDays"
                        type="number"
                        {...form.register("intervalDays", { valueAsNumber: true })}
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="intervalWeeks">كل كم أسبوع</Label>
                      <Input
                        id="intervalWeeks"
                        type="number"
                        {...form.register("intervalWeeks", { valueAsNumber: true })}
                        placeholder="4"
                      />
                    </div>
                    <div>
                      <Label htmlFor="intervalMonths">كل كم شهر</Label>
                      <Input
                        id="intervalMonths"
                        type="number"
                        {...form.register("intervalMonths", { valueAsNumber: true })}
                        placeholder="3"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {scheduleType === "usage_based" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">إعدادات الاستخدام</CardTitle>
                    <CardDescription>حدد فترة تكرار الصيانة حسب الاستخدام</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="usageHoursInterval">كل كم ساعة عمل</Label>
                      <Input
                        id="usageHoursInterval"
                        type="number"
                        step="0.1"
                        {...form.register("usageHoursInterval", { valueAsNumber: true })}
                        placeholder="100.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="usageCountInterval">كل كم مرة استخدام</Label>
                      <Input
                        id="usageCountInterval"
                        type="number"
                        {...form.register("usageCountInterval", { valueAsNumber: true })}
                        placeholder="50"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">إعدادات التنبيهات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="enableNotifications"
                      checked={form.watch("enableNotifications")}
                      onCheckedChange={(checked) => form.setValue("enableNotifications", checked)}
                    />
                    <Label htmlFor="enableNotifications">تفعيل التنبيهات</Label>
                  </div>
                  
                  {form.watch("enableNotifications") && (
                    <div>
                      <Label htmlFor="notifyDaysBefore">التنبيه قبل (أيام)</Label>
                      <Input
                        id="notifyDaysBefore"
                        type="number"
                        min="1"
                        {...form.register("notifyDaysBefore", { valueAsNumber: true })}
                        placeholder="3"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="checklist" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">قائمة المراجعة</h3>
                  <p className="text-sm text-muted-foreground">
                    أضف المهام التي يجب تنفيذها أثناء الصيانة
                  </p>
                </div>
                <Button type="button" onClick={addChecklistItem} variant="outline">
                  إضافة مهمة
                </Button>
              </div>

              <div className="space-y-3">
                {checklistItems.map((item, index) => (
                  <Card key={item.id}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-12 gap-4 items-start">
                        <div className="col-span-5">
                          <Label htmlFor={`checklist-title-${item.id}`}>عنوان المهمة</Label>
                          <Input
                            id={`checklist-title-${item.id}`}
                            value={item.title}
                            onChange={(e) => updateChecklistItem(item.id, { title: e.target.value })}
                            placeholder="مثال: فحص مستوى الزيت"
                          />
                        </div>
                        <div className="col-span-4">
                          <Label htmlFor={`checklist-desc-${item.id}`}>الوصف</Label>
                          <Input
                            id={`checklist-desc-${item.id}`}
                            value={item.description || ""}
                            onChange={(e) => updateChecklistItem(item.id, { description: e.target.value })}
                            placeholder="تفاصيل إضافية..."
                          />
                        </div>
                        <div className="col-span-2 flex items-center space-x-2 space-x-reverse pt-6">
                          <Switch
                            id={`checklist-required-${item.id}`}
                            checked={item.required}
                            onCheckedChange={(checked) => updateChecklistItem(item.id, { required: checked })}
                          />
                          <Label htmlFor={`checklist-required-${item.id}`} className="text-xs">
                            مطلوب
                          </Label>
                        </div>
                        <div className="col-span-1 pt-6">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeChecklistItem(item.id)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {checklistItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد مهام في قائمة المراجعة</p>
                    <p className="text-sm">أضف المهام التي يجب تنفيذها أثناء الصيانة</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Settings className="ml-2 h-4 w-4" />
                  {scheduleId ? "تحديث الجدول" : "إنشاء جدول الصيانة"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}