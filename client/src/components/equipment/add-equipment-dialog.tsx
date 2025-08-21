import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: any[];
}

export function AddEquipmentDialog({ open, onOpenChange, projects }: AddEquipmentDialogProps) {
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

  const addMutation = useMutation({
    mutationFn: (data: EquipmentFormData) => apiRequest("/api/equipment", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({
        title: "نجح الحفظ",
        description: "تم إضافة المعدة بنجاح",
        variant: "default",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة المعدة",
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
    addMutation.mutate(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg">إضافة معدة جديدة</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            أدخل تفاصيل المعدة الجديدة
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {/* Equipment Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">اسم المعدة *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="مثال: حفار صغير"
                      className="h-9 text-sm"
                      {...field} 
                      data-testid="input-equipment-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Equipment Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">كود المعدة *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="مثال: EQ-001"
                      className="h-9 text-sm"
                      {...field} 
                      data-testid="input-equipment-code"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Equipment Type and Status in a row for mobile */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">النوع *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-equipment-type" className="h-9 text-sm">
                          <SelectValue placeholder="اختر النوع" />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-equipment-status" className="h-9 text-sm">
                          <SelectValue placeholder="اختر الحالة" />
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

            {/* Purchase Date and Price in a row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">تاريخ الشراء</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        className="h-9 text-sm"
                        {...field} 
                        data-testid="input-purchase-date"
                      />
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
                      <Input 
                        type="number"
                        placeholder="0"
                        className="h-9 text-sm"
                        {...field} 
                        data-testid="input-purchase-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Current Project */}
            <FormField
              control={form.control}
              name="currentProjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">المشروع الحالي</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "warehouse" ? null : value)}
                    defaultValue={field.value || "warehouse"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-current-project" className="h-9 text-sm">
                        <SelectValue placeholder="اختر المشروع (اختياري)" />
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
                  <FormDescription className="text-xs text-gray-500">
                    اتركه فارغاً إذا كانت المعدة في المستودع
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">الوصف</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="وصف إضافي للمعدة..."
                      className="resize-none text-sm min-h-[60px]"
                      rows={2}
                      {...field} 
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Buttons - Full width on mobile */}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="order-2 sm:order-1 h-9 text-sm"
                data-testid="button-cancel"
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={addMutation.isPending}
                className="order-1 sm:order-2 h-9 text-sm"
                data-testid="button-submit"
              >
                {addMutation.isPending ? "جاري الحفظ..." : "إضافة المعدة"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}