import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Users, 
  DollarSign, 
  Package, 
  Calendar,
  TrendingUp,
  Clock,
  MapPin,
  BarChart3,
  Building2
} from "lucide-react";
import type { Project, InsertProject } from "@shared/schema";
import { insertProjectSchema } from "@shared/schema";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AutocompleteInput } from "@/components/ui/autocomplete-input-database";
import { useFloatingButton } from "@/components/layout/floating-button-context";
import { useEffect } from "react";

interface ProjectStats {
  totalWorkers: number;
  totalExpenses: number;
  totalIncome: number;
  currentBalance: number;
  activeWorkers: number;
  completedDays: number;
  materialPurchases: number;
  lastActivity: string;
}

interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

export default function ProjectsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { setFloatingAction } = useFloatingButton();

  // تعيين إجراء الزر العائم لإضافة مشروع جديد
  useEffect(() => {
    const handleAddProject = () => setIsCreateDialogOpen(true);
    setFloatingAction(handleAddProject, "إضافة مشروع جديد");
    return () => setFloatingAction(null);
  }, [setFloatingAction]);

  // Fetch projects with statistics مع إعادة التحديث المحسنة
  const { data: projects = [], isLoading, refetch: refetchProjects } = useQuery<ProjectWithStats[]>({
    queryKey: ["/api/projects/with-stats"],
    queryFn: async () => {
      console.log('🔄 جلب المشاريع مع الإحصائيات...');
      const response = await fetch("/api/projects/with-stats");
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ خطأ في جلب المشاريع:', errorText);
        throw new Error("فشل في تحميل المشاريع");
      }
      const data = await response.json();
      console.log('✅ تم جلب المشاريع:', data.length, 'مشروع');
      // تسجيل عينة من البيانات للتشخيص
      if (data.length > 0) {
        console.log('📊 عينة من إحصائيات المشاريع:', data.slice(0, 2).map((p: any) => ({
          name: p.name,
          totalIncome: p.stats?.totalIncome,
          totalExpenses: p.stats?.totalExpenses,
          currentBalance: p.stats?.currentBalance
        })));
      }
      return data;
    },
    refetchInterval: 60000, // إعادة التحديث كل دقيقة
    staleTime: 30000, // البيانات طازجة لـ 30 ثانية
    refetchOnWindowFocus: true,
  });

  // Create project form
  const createForm = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      status: "active",
    },
  });

  // Edit project form
  const editForm = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      status: "active",
    },
  });

  // دالة مساعدة لحفظ القيم في autocomplete_data
  const saveAutocompleteValue = async (category: string, value: string | null | undefined) => {
    if (!value || typeof value !== 'string' || !value.trim()) return;
    try {
      await apiRequest("POST", "/api/autocomplete", { 
        category, 
        value: value.trim() 
      });
    } catch (error) {
      // تجاهل الأخطاء لأن هذه عملية مساعدة
      console.log(`Failed to save autocomplete value for ${category}:`, error);
    }
  };

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: InsertProject) =>
      apiRequest("POST", "/api/projects", data),
    onSuccess: async (data, variables) => {
      // حفظ اسم المشروع في autocomplete_data
      await saveAutocompleteValue('projectNames', variables.name);
      
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/with-stats"] });
      toast({ title: "تم إنشاء المشروع بنجاح" });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء المشروع",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertProject }) =>
      apiRequest("PATCH", `/api/projects/${id}`, data),
    onSuccess: async (result, variables) => {
      // حفظ اسم المشروع في autocomplete_data
      await saveAutocompleteValue('projectNames', variables.data.name);
      
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/with-stats"] });
      toast({ title: "تم تحديث المشروع بنجاح" });
      setIsEditDialogOpen(false);
      setEditingProject(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث المشروع",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/with-stats"] });
      toast({ title: "تم حذف المشروع بنجاح" });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف المشروع",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = (data: InsertProject) => {
    createProjectMutation.mutate(data);
  };

  const handleEditProject = (data: InsertProject) => {
    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data });
    }
  };

  const handleDeleteProject = (id: string) => {
    deleteProjectMutation.mutate(id);
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    editForm.reset({
      name: project.name,
      status: project.status,
    });
    setIsEditDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "نشط";
      case "completed":
        return "مكتمل";
      case "paused":
        return "متوقف";
      default:
        return status;
    }
  };

  // تعيين إجراء الزر العائم
  useEffect(() => {
    setFloatingAction(() => setIsCreateDialogOpen(true), "إضافة مشروع جديد");
    
    // تنظيف الزر عند مغادرة الصفحة
    return () => setFloatingAction(null);
  }, [setFloatingAction]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري تحميل المشاريع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء مشروع جديد</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل المشروع الجديد
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateProject)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المشروع</FormLabel>
                      <FormControl>
                        <AutocompleteInput 
                          value={field.value}
                          onChange={field.onChange}
                          category="projectNames"
                          placeholder="اسم المشروع"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حالة المشروع</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر حالة المشروع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">نشط</SelectItem>
                          <SelectItem value="paused">متوقف</SelectItem>
                          <SelectItem value="completed">مكتمل</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createProjectMutation.isPending}>
                    {createProjectMutation.isPending ? "جاري الإنشاء..." : "إنشاء المشروع"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">لا توجد مشاريع</h3>
          <p className="text-muted-foreground mb-6">ابدأ بإنشاء مشروعك الأول</p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            إنشاء مشروع جديد
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      تم الإنشاء: {formatDate(project.createdAt)}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusText(project.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">الدخل</span>
                    </div>
                    <p className="text-sm font-bold text-green-800 dark:text-green-300 arabic-numbers">
                      {formatCurrency(project.stats.totalIncome)}
                    </p>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-medium text-red-700 dark:text-red-400">المصروفات</span>
                    </div>
                    <p className="text-sm font-bold text-red-800 dark:text-red-300 arabic-numbers">
                      {formatCurrency(project.stats.totalExpenses)}
                    </p>
                  </div>
                </div>

                {/* Current Balance */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">الرصيد الحالي</span>
                  </div>
                  <p className="text-lg font-bold text-blue-800 dark:text-blue-300 arabic-numbers">
                    {formatCurrency(project.stats.currentBalance)}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">العمال</p>
                    <p className="text-sm font-semibold arabic-numbers">{project.stats.totalWorkers}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <Package className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">المشتريات</p>
                    <p className="text-sm font-semibold arabic-numbers">{project.stats.materialPurchases}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">أيام العمل</p>
                    <p className="text-sm font-semibold">{project.stats.completedDays}</p>
                  </div>
                </div>

                {/* Last Activity */}
                {project.stats.lastActivity && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    آخر نشاط: {formatDate(project.stats.lastActivity)}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(project)}
                    className="flex-1 gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    تعديل
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                        <Trash2 className="h-3 w-3" />
                        حذف
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من حذف المشروع "{project.name}"؟ 
                          سيتم حذف جميع البيانات المرتبطة بهذا المشروع ولا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteProject(project.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          حذف المشروع
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المشروع</DialogTitle>
            <DialogDescription>
              تعديل تفاصيل المشروع
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditProject)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المشروع</FormLabel>
                    <FormControl>
                      <AutocompleteInput 
                        value={field.value}
                        onChange={field.onChange}
                        category="projectNames"
                        placeholder="اسم المشروع"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حالة المشروع</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر حالة المشروع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="paused">متوقف</SelectItem>
                        <SelectItem value="completed">مكتمل</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateProjectMutation.isPending}>
                  {updateProjectMutation.isPending ? "جاري التحديث..." : "حفظ التغييرات"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}