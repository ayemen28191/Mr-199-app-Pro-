import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit2, Trash2, Building, Phone, MapPin, User, CreditCard, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { type Supplier } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import AddSupplierForm from "@/components/forms/add-supplier-form";

export default function SuppliersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/suppliers/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "تم حذف المورد بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في حذف المورد", variant: "destructive" });
    },
  });

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    if (confirm(`هل أنت متأكد من حذف المورد "${supplier.name}"؟`)) {
      deleteMutation.mutate(supplier.id);
    }
  };

  const resetForm = () => {
    setSelectedSupplier(null);
    setIsDialogOpen(false);
  };

  // Filter suppliers
  const filteredSuppliers = (suppliers as Supplier[]).filter((supplier: Supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.phone && supplier.phone.includes(searchTerm))
  );

  // Calculate statistics
  const stats = {
    total: suppliers.length,
    active: suppliers.filter((s: Supplier) => s.isActive).length,
    inactive: suppliers.filter((s: Supplier) => !s.isActive).length,
    totalDebt: suppliers.reduce((sum: number, s: Supplier) => sum + (s.totalDebt || 0), 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-YE', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ر.ي';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        {/* Loading Header */}
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
        
        {/* Loading Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-12"></div>
                  </div>
                  <div className="h-8 w-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Loading Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-24"></div>
                    <div className="h-3 bg-muted rounded w-20"></div>
                  </div>
                  <div className="h-5 w-12 bg-muted rounded"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-28"></div>
                  <div className="h-3 bg-muted rounded w-32"></div>
                  <div className="h-3 bg-muted rounded w-20"></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-7 bg-muted rounded w-16"></div>
                  <div className="h-7 bg-muted rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">إدارة الموردين</h1>
          <p className="text-sm text-muted-foreground">قم بإدارة بيانات الموردين والمقاولين</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              إضافة مورد جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {selectedSupplier ? "تعديل بيانات المورد" : "إضافة مورد جديد"}
              </DialogTitle>
              <DialogDescription>
                {selectedSupplier ? "قم بتعديل بيانات المورد المحدد" : "أدخل بيانات المورد الجديد"}
              </DialogDescription>
            </DialogHeader>

            <AddSupplierForm
              supplier={selectedSupplier}
              onSuccess={() => {
                resetForm();
                queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
              }}
              onCancel={resetForm}
              submitLabel={selectedSupplier ? "تحديث المورد" : "إضافة المورد"}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الموردين</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الموردين النشطين</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">غير النشطين</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inactive}</p>
              </div>
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي المديونية</p>
                <p className="text-xl font-bold text-red-600 text-xs sm:text-xl">
                  {formatCurrency(stats.totalDebt)}
                </p>
              </div>
              <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الموردين (الاسم، الشخص المسؤول، رقم الهاتف)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSuppliers.map((supplier: Supplier) => (
          <Card key={supplier.id} className="hover:shadow-lg transition-all duration-200 border hover:border-primary/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                  <CardTitle className="text-sm sm:text-base font-semibold truncate">{supplier.name}</CardTitle>
                  {supplier.contactPerson && (
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <User className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{supplier.contactPerson}</span>
                    </CardDescription>
                  )}
                </div>
                <Badge 
                  variant={supplier.isActive ? "default" : "secondary"}
                  className="text-xs flex-shrink-0"
                >
                  {supplier.isActive ? "نشط" : "معطل"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3 pt-0">
              {/* Contact Info */}
              <div className="space-y-2">
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{supplier.phone}</span>
                  </div>
                )}
                
                {supplier.address && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed">{supplier.address}</span>
                  </div>
                )}
                
                {supplier.paymentTerms && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CreditCard className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{supplier.paymentTerms}</span>
                  </div>
                )}

                {/* Debt Info */}
                {supplier.totalDebt > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <AlertCircle className="h-3 w-3 flex-shrink-0 text-red-500" />
                    <span className="font-medium text-red-600">
                      {formatCurrency(supplier.totalDebt)}
                    </span>
                  </div>
                )}

                {/* Created Date */}
                {supplier.createdAt && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>
                      {new Date(supplier.createdAt).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Notes Preview */}
              {supplier.notes && (
                <div className="p-2 bg-muted/50 rounded text-xs">
                  <p className="line-clamp-2 text-muted-foreground">{supplier.notes}</p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(supplier)}
                  className="flex-1 gap-1 text-xs h-8"
                >
                  <Edit2 className="h-3 w-3" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(supplier)}
                  className="flex-1 gap-1 text-xs h-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                  حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSuppliers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? "لا توجد نتائج" : "لا توجد موردين"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm 
                ? "لم يتم العثور على موردين يطابقون كلمات البحث المدخلة. جرب كلمات أخرى." 
                : "ابدأ ببناء قاعدة بيانات الموردين الخاصة بك عن طريق إضافة أول مورد."}
            </p>
            {!searchTerm && (
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة مورد جديد
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}