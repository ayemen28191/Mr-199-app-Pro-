import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";

const notificationSchema = z.object({
  type: z.enum(['safety', 'task', 'payroll', 'announcement', 'system']),
  title: z.string().min(1, "العنوان مطلوب"),
  body: z.string().min(1, "المحتوى مطلوب"),
  priority: z.number().min(1).max(5),
  recipients: z.array(z.string()).optional(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

interface CreateNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notificationType?: 'safety' | 'task' | 'payroll' | 'announcement' | 'system';
  projectId?: string;
}

const notificationTypes = [
  { value: 'safety', label: 'تنبيه أمني', description: 'تنبيهات السلامة والأمان' },
  { value: 'task', label: 'إشعار مهمة', description: 'إشعارات المهام والواجبات' },
  { value: 'payroll', label: 'إشعار راتب', description: 'إشعارات الرواتب والمستحقات' },
  { value: 'announcement', label: 'إعلان عام', description: 'إعلانات عامة للجميع' },
  { value: 'system', label: 'إشعار نظام', description: 'إشعارات النظام التلقائية' },
];

const priorityLevels = [
  { value: 1, label: 'عاجل جداً', color: 'text-red-600' },
  { value: 2, label: 'عاجل', color: 'text-orange-600' },
  { value: 3, label: 'متوسط', color: 'text-yellow-600' },
  { value: 4, label: 'منخفض', color: 'text-blue-600' },
  { value: 5, label: 'معلومة', color: 'text-gray-600' },
];

export function CreateNotificationDialog({
  open,
  onOpenChange,
  notificationType = 'announcement',
  projectId
}: CreateNotificationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      type: notificationType,
      title: "",
      body: "",
      priority: 3,
      recipients: ["default"],
    },
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (data: NotificationFormData & { projectId?: string }) => {
      let endpoint = '/api/notifications';
      
      // اختيار endpoint بناء على نوع الإشعار
      switch (data.type) {
        case 'safety':
          endpoint = '/api/notifications/safety';
          break;
        case 'task':
          endpoint = '/api/notifications/task';
          break;
        case 'payroll':
          endpoint = '/api/notifications/payroll';
          break;
        case 'announcement':
          endpoint = '/api/notifications/announcement';
          break;
        default:
          endpoint = '/api/notifications';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          projectId: projectId,
          recipients: data.type === 'announcement' ? 'all' : data.recipients,
        }),
      });

      if (!response.ok) {
        throw new Error('فشل في إنشاء الإشعار');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الإشعار بنجاح",
      });
      
      // تحديث cache الإشعارات
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // إغلاق الحوار وإعادة تعيين النموذج
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الإشعار",
        variant: "destructive",
      });
      console.error('Error creating notification:', error);
    },
  });

  const onSubmit = (data: NotificationFormData) => {
    createNotificationMutation.mutate({
      ...data,
      projectId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="create-notification-dialog">
        <DialogHeader>
          <DialogTitle>إنشاء إشعار جديد</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع الإشعار</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="notification-type-select">
                        <SelectValue placeholder="اختر نوع الإشعار" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {notificationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{type.label}</span>
                            <span className="text-sm text-muted-foreground">
                              {type.description}
                            </span>
                          </div>
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
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مستوى الأولوية</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="priority-select">
                        <SelectValue placeholder="اختر مستوى الأولوية" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value.toString()}>
                          <span className={level.color}>{level.label}</span>
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان الإشعار</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="أدخل عنوان الإشعار"
                      data-testid="notification-title-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>محتوى الإشعار</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field}
                      placeholder="أدخل محتوى الإشعار التفصيلي"
                      rows={4}
                      data-testid="notification-body-textarea"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="cancel-notification-button"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createNotificationMutation.isPending}
                data-testid="create-notification-button"
              >
                {createNotificationMutation.isPending ? "جاري الإنشاء..." : "إنشاء الإشعار"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}