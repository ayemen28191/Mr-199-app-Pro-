import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, Phone, CreditCard, Edit, Trash2, Eye, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplierSchema, type InsertSupplier, type Supplier } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function SuppliersPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Autocomplete states
  const [isContactPersonOpen, setIsContactPersonOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [isPaymentTermsOpen, setIsPaymentTermsOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form for adding/editing suppliers
  const form = useForm<InsertSupplier>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      address: "",
      paymentTerms: "نقد",
      notes: "",
      isActive: true,
    },
  });

  // Get suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Get autocomplete suggestions
  const { data: contactPersonSuggestions = [] } = useQuery({
    queryKey: ["/api/autocomplete", "supplier_contact_person"],
  });

  const { data: phoneSuggestions = [] } = useQuery({
    queryKey: ["/api/autocomplete", "supplier_phone"],
  });

  const { data: addressSuggestions = [] } = useQuery({
    queryKey: ["/api/autocomplete", "supplier_address"],
  });

  const { data: paymentTermsSuggestions = [] } = useQuery({
    queryKey: ["/api/autocomplete", "supplier_payment_terms"],
  });

  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: async (supplier: InsertSupplier) => {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplier),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create supplier");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المورد بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, supplier }: { id: string; supplier: Partial<InsertSupplier> }) => {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplier),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update supplier");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsEditDialogOpen(false);
      setSelectedSupplier(null);
      form.reset();
      toast({
        title: "تم بنجاح",
        description: "تم تحديث المورد بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete supplier");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف المورد بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InsertSupplier) => {
    // Add autocomplete data
    if (data.contactPerson) {
      await fetch("/api/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "supplier_contact_person",
          value: data.contactPerson,
        }),
      });
    }

    if (data.phone) {
      await fetch("/api/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "supplier_phone",
          value: data.phone,
        }),
      });
    }

    if (data.address) {
      await fetch("/api/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "supplier_address",
          value: data.address,
        }),
      });
    }

    if (data.paymentTerms) {
      await fetch("/api/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "supplier_payment_terms",
          value: data.paymentTerms,
        }),
      });
    }

    if (selectedSupplier) {
      updateSupplierMutation.mutate({ id: selectedSupplier.id, supplier: data });
    } else {
      createSupplierMutation.mutate(data);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    form.reset({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      paymentTerms: supplier.paymentTerms || "نقد",
      notes: supplier.notes || "",
      isActive: supplier.isActive ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف المورد "${name}"؟`)) {
      deleteSupplierMutation.mutate(id);
    }
  };

  // Filter suppliers based on search term
  const filteredSuppliers = (suppliers as Supplier[]).filter((supplier: Supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.phone?.includes(searchTerm))
  );

  const SupplierForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم المورد *</FormLabel>
                <FormControl>
                  <Input placeholder="اسم المورد" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الشخص المسؤول</FormLabel>
                <Popover open={isContactPersonOpen} onOpenChange={setIsContactPersonOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Input 
                        placeholder="اسم الشخص المسؤول" 
                        value={field.value || ""} 
                        onChange={(e) => {
                          field.onChange(e);
                          setIsContactPersonOpen(e.target.value.length > 0);
                        }}
                        onFocus={() => setIsContactPersonOpen(field.value ? field.value.length > 0 : false)}
                      />
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="البحث..." />
                      <CommandList>
                        <CommandEmpty>لا توجد نتائج</CommandEmpty>
                        <CommandGroup>
                          {contactPersonSuggestions
                            .filter((suggestion: any) => 
                              suggestion.value.toLowerCase().includes((field.value || "").toLowerCase())
                            )
                            .slice(0, 5)
                            .map((suggestion: any) => (
                              <CommandItem
                                key={suggestion.id}
                                onSelect={() => {
                                  field.onChange(suggestion.value);
                                  setIsContactPersonOpen(false);
                                }}
                              >
                                {suggestion.value}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رقم الهاتف</FormLabel>
                <Popover open={isPhoneOpen} onOpenChange={setIsPhoneOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Input 
                        placeholder="777123456" 
                        value={field.value || ""} 
                        onChange={(e) => {
                          field.onChange(e);
                          setIsPhoneOpen(e.target.value.length > 0);
                        }}
                        onFocus={() => setIsPhoneOpen(field.value ? field.value.length > 0 : false)}
                      />
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="البحث..." />
                      <CommandList>
                        <CommandEmpty>لا توجد نتائج</CommandEmpty>
                        <CommandGroup>
                          {phoneSuggestions
                            .filter((suggestion: any) => 
                              suggestion.value.includes(field.value || "")
                            )
                            .slice(0, 5)
                            .map((suggestion: any) => (
                              <CommandItem
                                key={suggestion.id}
                                onSelect={() => {
                                  field.onChange(suggestion.value);
                                  setIsPhoneOpen(false);
                                }}
                              >
                                {suggestion.value}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentTerms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>شروط الدفع</FormLabel>
                <Popover open={isPaymentTermsOpen} onOpenChange={setIsPaymentTermsOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Input 
                        placeholder="نقد / 30 يوم / 60 يوم" 
                        value={field.value || ""} 
                        onChange={(e) => {
                          field.onChange(e);
                          setIsPaymentTermsOpen(e.target.value.length > 0);
                        }}
                        onFocus={() => setIsPaymentTermsOpen(field.value ? field.value.length > 0 : false)}
                      />
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="البحث..." />
                      <CommandList>
                        <CommandEmpty>لا توجد نتائج</CommandEmpty>
                        <CommandGroup>
                          {paymentTermsSuggestions
                            .filter((suggestion: any) => 
                              suggestion.value.toLowerCase().includes((field.value || "").toLowerCase())
                            )
                            .slice(0, 5)
                            .map((suggestion: any) => (
                              <CommandItem
                                key={suggestion.id}
                                onSelect={() => {
                                  field.onChange(suggestion.value);
                                  setIsPaymentTermsOpen(false);
                                }}
                              >
                                {suggestion.value}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>العنوان</FormLabel>
              <Popover open={isAddressOpen} onOpenChange={setIsAddressOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Input 
                      placeholder="العنوان الكامل" 
                      value={field.value || ""} 
                      onChange={(e) => {
                        field.onChange(e);
                        setIsAddressOpen(e.target.value.length > 0);
                      }}
                      onFocus={() => setIsAddressOpen(field.value ? field.value.length > 0 : false)}
                    />
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="البحث..." />
                    <CommandList>
                      <CommandEmpty>لا توجد نتائج</CommandEmpty>
                      <CommandGroup>
                        {addressSuggestions
                          .filter((suggestion: any) => 
                            suggestion.value.toLowerCase().includes((field.value || "").toLowerCase())
                          )
                          .slice(0, 5)
                          .map((suggestion: any) => (
                            <CommandItem
                              key={suggestion.id}
                              onSelect={() => {
                                field.onChange(suggestion.value);
                                setIsAddressOpen(false);
                              }}
                            >
                              {suggestion.value}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ملاحظات</FormLabel>
              <FormControl>
                <Textarea placeholder="ملاحظات إضافية" rows={3} {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">نشط</FormLabel>
                <div className="text-sm text-muted-foreground">
                  هل هذا المورد نشط ومتاح للتعامل؟
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (selectedSupplier) {
                setIsEditDialogOpen(false);
                setSelectedSupplier(null);
              } else {
                setIsAddDialogOpen(false);
              }
              form.reset();
            }}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}>
            {selectedSupplier ? "تحديث" : "إضافة"}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جاري تحميل الموردين...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الموردين</h1>
          <p className="text-muted-foreground">
            إدارة شاملة لجميع الموردين والمشتريات الآجلة
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              إضافة مورد جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة مورد جديد</DialogTitle>
            </DialogHeader>
            <SupplierForm />
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تعديل المورد</DialogTitle>
            </DialogHeader>
            <SupplierForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="البحث عن مورد..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier: Supplier) => (
          <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                </div>
                <Badge variant={supplier.isActive ? "default" : "secondary"}>
                  {supplier.isActive ? "نشط" : "غير نشط"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {supplier.contactPerson && (
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <span>{supplier.contactPerson}</span>
                </div>
              )}
              
              {supplier.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              
              {supplier.totalDebt && parseFloat(supplier.totalDebt) > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-red-500" />
                  <span>مديونية: {parseFloat(supplier.totalDebt).toLocaleString('en-GB')} ر.ي</span>
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                شروط الدفع: {supplier.paymentTerms || "نقد"}
              </div>
              
              {supplier.address && (
                <div className="text-sm text-gray-600 truncate" title={supplier.address}>
                  {supplier.address}
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/supplier-report?supplier=${supplier.id}`, '_blank')}
                  title="كشف حساب المورد"
                >
                  <FileText className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(supplier)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(supplier.id, supplier.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? "لا توجد موردين مطابقين للبحث" : "لا توجد موردين مسجلين"}
          </p>
        </div>
      )}
    </div>
  );
}