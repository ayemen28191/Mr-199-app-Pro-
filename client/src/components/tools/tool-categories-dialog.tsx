import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Folder, 
  FolderPlus, 
  Package, 
  Tag, 
  Search,
  MoreVertical,
  X,
  CheckCircle,
  AlertCircle
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Form validation schema
const categorySchema = z.object({
  name: z.string()
    .min(2, 'اسم التصنيف مطلوب ويجب أن يكون أكثر من حرفين')
    .max(50, 'اسم التصنيف يجب أن يكون أقل من 50 حرف'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

// Types
interface ToolCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  toolCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface ToolCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ToolCategoriesDialog: React.FC<ToolCategoriesDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ToolCategory | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // دالة مساعدة لحفظ القيم في autocomplete_data
  const saveAutocompleteValue = async (category: string, value: string | null | undefined) => {
    if (!value || typeof value !== 'string' || !value.trim()) return;
    try {
      await apiRequest("/api/autocomplete", "POST", { 
        category, 
        value: value.trim() 
      });
    } catch (error) {

    }
  };

  // Fetch categories with tool count
  const { data: categories = [], isLoading } = useQuery<ToolCategory[]>({
    queryKey: ['/api/tool-categories'],
    enabled: open,
  });

  // Form setup
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'Folder',
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      // حفظ القيم في autocomplete_data قبل العملية الأساسية
      await Promise.all([
        saveAutocompleteValue('toolCategoryNames', data.name),
        saveAutocompleteValue('toolCategoryDescriptions', data.description)
      ]);
      
      return apiRequest('/api/tool-categories', 'POST', data);
    },
    onSuccess: () => {
      // تحديث كاش autocomplete للتأكد من ظهور البيانات الجديدة
      queryClient.invalidateQueries({ queryKey: ["/api/autocomplete"] });
      
      toast({
        title: 'تم إنشاء التصنيف بنجاح',
        description: 'تمت إضافة التصنيف الجديد إلى النظام',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tool-categories'] });
      form.reset();
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في إنشاء التصنيف',
        description: error.message || 'حدث خطأ أثناء إنشاء التصنيف',
        variant: 'destructive',
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: CategoryFormData }) => {
      // حفظ القيم في autocomplete_data قبل العملية الأساسية
      await Promise.all([
        saveAutocompleteValue('toolCategoryNames', data.name),
        saveAutocompleteValue('toolCategoryDescriptions', data.description)
      ]);
      
      return apiRequest(`/api/tool-categories/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: 'تم تحديث التصنيف بنجاح',
        description: 'تم حفظ التغييرات على التصنيف',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tool-categories'] });
      form.reset();
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في تحديث التصنيف',
        description: error.message || 'حدث خطأ أثناء تحديث التصنيف',
        variant: 'destructive',
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/tool-categories/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: 'تم حذف التصنيف بنجاح',
        description: 'تم إزالة التصنيف من النظام',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tool-categories'] });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في حذف التصنيف',
        description: error.message || 'حدث خطأ أثناء حذف التصنيف',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEdit = (category: ToolCategory) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'Folder',
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (categoryId: string, categoryName: string) => {
    const confirmed = confirm(`هل أنت متأكد من حذف تصنيف "${categoryName}"؟`);
    if (confirmed) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  // Filter categories
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Available icons
  const availableIcons = [
    { value: 'Folder', label: 'مجلد', icon: Folder },
    { value: 'Package', label: 'صندوق', icon: Package },
    { value: 'Tag', label: 'علامة', icon: Tag },
    { value: 'FolderPlus', label: 'مجلد بلاس', icon: FolderPlus },
  ];

  const getIcon = (iconName: string) => {
    const iconItem = availableIcons.find(item => item.value === iconName);
    return iconItem ? iconItem.icon : Folder;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
            <Folder className="h-5 w-5 sm:h-6 sm:w-6" />
            إدارة تصنيفات الأدوات
          </DialogTitle>
          <DialogDescription className="text-sm">
            إضافة وتعديل وحذف تصنيفات الأدوات والمعدات
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Header Actions - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-full sm:max-w-md">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في التصنيفات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 text-sm"
                />
              </div>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 ml-1" />
              إضافة تصنيف
            </Button>
          </div>

          {/* Categories Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                التصنيفات ({filteredCategories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <Folder className="h-12 w-12 animate-pulse text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">جاري تحميل التصنيفات...</p>
                  </div>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد تصنيفات</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'لا توجد تصنيفات تطابق البحث' : 'لم يتم إضافة أي تصنيفات بعد'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة أول تصنيف
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop Table View - Hidden on mobile */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الرمز</TableHead>
                          <TableHead className="text-right">اسم التصنيف</TableHead>
                          <TableHead className="text-right">الوصف</TableHead>
                          <TableHead className="text-right">عدد الأدوات</TableHead>
                          <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                          <TableHead className="text-center">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCategories.map((category) => {
                          const IconComponent = getIcon(category.icon || 'Folder');
                          return (
                            <TableRow key={category.id}>
                              <TableCell>
                                <div className="flex justify-center">
                                  <IconComponent className="h-5 w-5 text-primary" />
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {category.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {category.description || 'لا يوجد وصف'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {category.toolCount || 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(category.createdAt).toLocaleDateString('en-GB')}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEdit(category)}>
                                        <Edit className="h-4 w-4 ml-2" />
                                        تعديل
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => handleDelete(category.id, category.name)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 ml-2" />
                                        حذف
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View - Shown only on mobile */}
                  <div className="md:hidden space-y-3">
                    {filteredCategories.map((category) => {
                      const IconComponent = getIcon(category.icon || 'Folder');
                      return (
                        <Card key={category.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex-shrink-0">
                                <IconComponent className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-base mb-1">{category.name}</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {category.description || 'لا يوجد وصف'}
                                </p>
                                <div className="flex items-center gap-4 text-xs">
                                  <div className="flex items-center gap-1">
                                    <span>عدد الأدوات:</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {category.toolCount || 0}
                                    </Badge>
                                  </div>
                                  <span className="text-muted-foreground">
                                    {new Date(category.createdAt).toLocaleDateString('en-GB')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(category)}>
                                  <Edit className="h-4 w-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(category.id, category.name)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 ml-2" />
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Category Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingCategory ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? 'تعديل معلومات التصنيف' : 'إضافة تصنيف جديد للأدوات'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم التصنيف *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: أدوات كهربائية"
                          {...field}
                        />
                      </FormControl>
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
                          placeholder="وصف مختصر للتصنيف..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الرمز</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر رمز للتصنيف" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableIcons.map((iconItem) => {
                            const IconComponent = iconItem.icon;
                            return (
                              <SelectItem key={iconItem.value} value={iconItem.value}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4" />
                                  <span>{iconItem.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCloseDialog}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    className="min-w-[100px]"
                  >
                    {(createCategoryMutation.isPending || updateCategoryMutation.isPending) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        {editingCategory ? <CheckCircle className="h-4 w-4 ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
                        {editingCategory ? 'تحديث' : 'إضافة'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default ToolCategoriesDialog;