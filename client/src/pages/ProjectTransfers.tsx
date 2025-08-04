import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProjectFundTransferSchema } from "@shared/schema";
import type { InsertProjectFundTransfer, ProjectFundTransfer, Project } from "@shared/schema";
import { Plus, ArrowRight, Calendar, User, FileText } from "lucide-react";
import { z } from "zod";

type TransferFormData = z.infer<typeof insertProjectFundTransferSchema>;

export default function ProjectTransfers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  // جلب قائمة المشاريع
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // جلب قائمة عمليات الترحيل
  const { data: transfers = [], isLoading: transfersLoading } = useQuery<ProjectFundTransfer[]>({
    queryKey: ["/api/project-fund-transfers"],
  });

  // إنشاء عملية ترحيل جديدة
  const createTransferMutation = useMutation({
    mutationFn: (data: InsertProjectFundTransfer) =>
      apiRequest("/api/project-fund-transfers", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-fund-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/with-stats"] });
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء عملية ترحيل الأموال بنجاح",
      });
      setShowForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء عملية الترحيل",
        variant: "destructive",
      });
    },
  });

  // إعداد النموذج
  const form = useForm<TransferFormData>({
    resolver: zodResolver(insertProjectFundTransferSchema),
    defaultValues: {
      fromProjectId: "",
      toProjectId: "",
      amount: "",
      transferReason: "",
      transferDate: new Date().toISOString().split('T')[0],
      approvedBy: "",
      notes: "",
      status: "completed",
    },
  });

  const onSubmit = (data: TransferFormData) => {
    createTransferMutation.mutate(data);
  };

  // دالة لجلب اسم المشروع
  const getProjectName = (projectId: string) => {
    const project = projects.find((p: Project) => p.id === projectId);
    return project?.name || "غير محدد";
  };

  return (
    <div className="container mx-auto py-6 px-4" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ترحيل الأموال بين المشاريع
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            إدارة عمليات ترحيل الأموال بين مشاريع البناء المختلفة
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="button-add-transfer"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة عملية ترحيل
        </Button>
      </div>

      {/* نموذج إضافة عملية ترحيل جديدة */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              إضافة عملية ترحيل جديدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* المشروع المرسل */}
                  <FormField
                    control={form.control}
                    name="fromProjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المشروع المرسل</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                            data-testid="select-from-project"
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المشروع المرسل" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map((project: Project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* المشروع المستلم */}
                  <FormField
                    control={form.control}
                    name="toProjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المشروع المستلم</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                            data-testid="select-to-project"
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المشروع المستلم" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map((project: Project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* المبلغ */}
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المبلغ (ر.ي)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="أدخل المبلغ"
                            {...field}
                            data-testid="input-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* تاريخ الترحيل */}
                  <FormField
                    control={form.control}
                    name="transferDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ الترحيل</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-transfer-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* سبب الترحيل */}
                  <FormField
                    control={form.control}
                    name="transferReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>سبب الترحيل</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="أدخل سبب الترحيل"
                            {...field}
                            data-testid="input-transfer-reason"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* اسم المعتمد */}
                  <FormField
                    control={form.control}
                    name="approvedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المعتمد</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="أدخل اسم المعتمد"
                            {...field}
                            data-testid="input-approved-by"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ملاحظات */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="أدخل أي ملاحظات إضافية"
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createTransferMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-submit-transfer"
                  >
                    {createTransferMutation.isPending ? "جاري الحفظ..." : "حفظ عملية الترحيل"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    data-testid="button-cancel"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* قائمة عمليات الترحيل */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            سجل عمليات الترحيل
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transfersLoading ? (
            <div className="text-center py-8">
              <p>جاري تحميل عمليات الترحيل...</p>
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">لا توجد عمليات ترحيل مسجلة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">من مشروع</TableHead>
                    <TableHead className="text-right">إلى مشروع</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">السبب</TableHead>
                    <TableHead className="text-right">المعتمد</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((transfer: ProjectFundTransfer) => (
                    <TableRow key={transfer.id} data-testid={`row-transfer-${transfer.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {new Date(transfer.transferDate).toLocaleDateString('ar-SA')}
                        </div>
                      </TableCell>
                      <TableCell>{getProjectName(transfer.fromProjectId)}</TableCell>
                      <TableCell>{getProjectName(transfer.toProjectId)}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        {parseFloat(transfer.amount).toLocaleString()} ر.ي
                      </TableCell>
                      <TableCell>{transfer.transferReason}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          {transfer.approvedBy}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transfer.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : transfer.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {transfer.status === 'completed' ? 'مكتمل' 
                           : transfer.status === 'pending' ? 'في الانتظار' 
                           : 'ملغي'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}