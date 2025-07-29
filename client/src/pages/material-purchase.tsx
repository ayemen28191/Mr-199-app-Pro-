import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowRight, Save, Plus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";
import { getCurrentDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Material, InsertMaterialPurchase, InsertMaterial } from "@shared/schema";

export default function MaterialPurchase() {
  const [, setLocation] = useLocation();
  const { selectedProjectId, selectProject } = useSelectedProject();
  
  // Form states
  const [materialName, setMaterialName] = useState<string>("");
  const [materialCategory, setMaterialCategory] = useState<string>("");
  const [materialUnit, setMaterialUnit] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [purchaseType, setPurchaseType] = useState<string>("نقد");
  const [supplierName, setSupplierName] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(getCurrentDate());
  const [purchaseDate, setPurchaseDate] = useState<string>(getCurrentDate());
  const [notes, setNotes] = useState<string>("");
  const [invoicePhoto, setInvoicePhoto] = useState<string>("");
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const addMaterialMutation = useMutation({
    mutationFn: (data: InsertMaterial) => apiRequest("POST", "/api/materials", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
    },
  });

  // Get unique material names, categories, units, and suppliers
  const materialNames = materials.map(m => m.name);
  const materialCategories = Array.from(new Set(materials.map(m => m.category)));
  const materialUnits = Array.from(new Set(materials.map(m => m.unit)));
  const existingSuppliers = ["متجر الإعمار", "مؤسسة البناء", "شركة المواد"]; // Will be dynamic later

  const addMaterialPurchaseMutation = useMutation({
    mutationFn: async (data: any) => {
      // Send the purchase data with material info directly to the server
      // The server will handle creating the material if needed
      return apiRequest("POST", "/api/material-purchases", data);
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم حفظ شراء المواد بنجاح",
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "material-purchases"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ شراء المواد",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setMaterialName("");
    setMaterialCategory("");
    setMaterialUnit("");
    setQuantity("");
    setUnitPrice("");
    setPurchaseType("نقد");
    setSupplierName("");
    setInvoiceNumber("");
    setInvoiceDate(getCurrentDate());
    setPurchaseDate(getCurrentDate());
    setNotes("");
    setInvoicePhoto("");
    setEditingPurchaseId(null);
  };

  // Update Material Purchase Mutation
  const updateMaterialPurchaseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PUT", `/api/material-purchases/${id}`, data),
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث شراء المواد بنجاح",
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "material-purchases"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث شراء المواد",
        variant: "destructive",
      });
    }
  });

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    return (qty * price).toFixed(2);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInvoicePhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSave = (saveAndAddAnother = false) => {
    if (!selectedProjectId || !materialName || !materialUnit || !quantity || !unitPrice) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع البيانات المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = calculateTotal();
    const purchaseData = {
      projectId: selectedProjectId,
      materialName,
      materialCategory,
      materialUnit,
      quantity,
      unitPrice,
      totalAmount,
      purchaseType,
      supplierName,
      invoiceNumber,
      invoiceDate,
      invoicePhoto,
      notes,
      purchaseDate: purchaseDate,
    };

    if (editingPurchaseId) {
      updateMaterialPurchaseMutation.mutate({
        id: editingPurchaseId,
        data: purchaseData
      });
    } else {
      addMaterialPurchaseMutation.mutate(purchaseData);
    }

    if (!saveAndAddAnother && !editingPurchaseId) {
      setLocation("/daily-expenses");
    }
  };

  // Fetch Material Purchases for Edit Support
  const { data: materialPurchases = [] } = useQuery<any[]>({
    queryKey: ["/api/projects", selectedProjectId, "material-purchases"],
    enabled: !!selectedProjectId,
  });

  // Edit Function
  const handleEdit = (purchase: any) => {
    setMaterialName(purchase.material?.name || "");
    setMaterialCategory(purchase.material?.category || "");
    setMaterialUnit(purchase.material?.unit || "");
    setQuantity(purchase.quantity);
    setUnitPrice(purchase.unitPrice);
    setPurchaseType(purchase.purchaseType || "نقد");
    setSupplierName(purchase.supplierName || "");
    setInvoiceNumber(purchase.invoiceNumber || "");
    setInvoiceDate(purchase.invoiceDate || getCurrentDate());
    setPurchaseDate(purchase.purchaseDate || getCurrentDate());
    setNotes(purchase.notes || "");
    setInvoicePhoto(purchase.invoicePhoto || "");
    setEditingPurchaseId(purchase.id);
  };

  // Delete Material Purchase Mutation
  const deleteMaterialPurchaseMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/material-purchases/${id}`),
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف شراء المواد بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "material-purchases"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف شراء المواد",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="p-4 slide-in">
      {/* Header with Back Button */}
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/daily-expenses")}
          className="ml-3 p-2"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold text-foreground">شراء مواد</h2>
      </div>

      <ProjectSelector
        selectedProjectId={selectedProjectId}
        onProjectChange={selectProject}
      />

      {/* Purchase Form */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Material Name */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">اسم المادة</Label>
              <Combobox
                value={materialName}
                onValueChange={setMaterialName}
                options={materialNames}
                placeholder="اختر أو أدخل اسم المادة..."
                customPlaceholder="إضافة مادة جديدة"
              />
            </div>

            {/* Material Category */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">فئة المادة</Label>
              <Combobox
                value={materialCategory}
                onValueChange={setMaterialCategory}
                options={materialCategories}
                placeholder="اختر أو أدخل فئة المادة..."
                customPlaceholder="إضافة فئة جديدة"
              />
            </div>

            {/* Material Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">الكمية</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="text-center arabic-numbers"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">الوحدة</Label>
                <Combobox
                  value={materialUnit}
                  onValueChange={setMaterialUnit}
                  options={materialUnits}
                  placeholder="اختر أو أدخل الوحدة..."
                  customPlaceholder="إضافة وحدة جديدة"
                />
              </div>
            </div>

            {/* Price and Total */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">سعر الوحدة</Label>
                <Input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0.00"
                  className="text-center arabic-numbers"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">المبلغ الإجمالي</Label>
                <Input
                  type="number"
                  value={calculateTotal()}
                  readOnly
                  className="text-center arabic-numbers bg-muted"
                />
              </div>
            </div>

            {/* Purchase Type */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">نوع الشراء</Label>
              <RadioGroup value={purchaseType} onValueChange={setPurchaseType} className="flex gap-4">
                <div className="flex items-center space-x-reverse space-x-2">
                  <RadioGroupItem value="نقد" id="cash" />
                  <Label htmlFor="cash" className="text-sm">نقد</Label>
                </div>
                <div className="flex items-center space-x-reverse space-x-2">
                  <RadioGroupItem value="آجل" id="credit" />
                  <Label htmlFor="credit" className="text-sm">آجل</Label>
                </div>
                <div className="flex items-center space-x-reverse space-x-2">
                  <RadioGroupItem value="توريد" id="supply" />
                  <Label htmlFor="supply" className="text-sm">توريد</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Supplier/Store */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">اسم المورد/المحل</Label>
              <Combobox
                value={supplierName}
                onValueChange={setSupplierName}
                options={existingSuppliers}
                placeholder="اختر أو أدخل اسم المورد..."
                customPlaceholder="إضافة مورد جديد"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">تاريخ الشراء</Label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">رقم الفاتورة</Label>
                <Input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="رقم الفاتورة"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">تاريخ الفاتورة</Label>
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
            </div>

            {/* Invoice Photo Upload */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">صورة الفاتورة</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                {invoicePhoto ? (
                  <div className="space-y-2">
                    <img 
                      src={invoicePhoto} 
                      alt="Invoice" 
                      className="max-w-full max-h-32 mx-auto rounded"
                    />
                    <p className="text-sm text-success">تم رفع الصورة بنجاح</p>
                  </div>
                ) : (
                  <>
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-2">اضغط لإضافة صورة الفاتورة</p>
                  </>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="invoice-photo"
                />
                <Label
                  htmlFor="invoice-photo"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg cursor-pointer hover:bg-primary/90 transition-colors inline-block"
                >
                  {invoicePhoto ? "تغيير الصورة" : "اختر صورة"}
                </Label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">ملاحظات</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات إضافية..."
                className="h-20 resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={() => handleSave(false)}
          disabled={addMaterialPurchaseMutation.isPending || updateMaterialPurchaseMutation.isPending}
          className="w-full bg-success hover:bg-success/90 text-success-foreground"
        >
          <Save className="ml-2 h-4 w-4" />
          {(addMaterialPurchaseMutation.isPending || updateMaterialPurchaseMutation.isPending) 
            ? "جاري الحفظ..." 
            : editingPurchaseId 
              ? "تحديث الشراء" 
              : "حفظ الشراء"}
        </Button>
        
        {!editingPurchaseId && (
          <Button
            onClick={() => handleSave(true)}
            disabled={addMaterialPurchaseMutation.isPending}
            variant="outline"
            className="w-full"
          >
            <Plus className="ml-2 h-4 w-4" />
            حفظ وإضافة آخر
          </Button>
        )}

        {editingPurchaseId && (
          <Button
            onClick={resetForm}
            variant="outline"
            className="w-full"
          >
            إلغاء التحرير
          </Button>
        )}
      </div>

      {/* Material Purchases List for Today */}
      {selectedProjectId && materialPurchases.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">المشتريات المسجلة</h3>
            <div className="space-y-3">
              {materialPurchases.map((purchase: any) => (
                <div key={purchase.id} className="border rounded-lg p-3 bg-card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-foreground">{purchase.material?.name}</span>
                        <span className="text-sm text-muted-foreground">({purchase.material?.unit})</span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>الكمية: {purchase.quantity} | السعر: {purchase.unitPrice} ريال</p>
                        <p className="font-medium">الإجمالي: {purchase.totalAmount} ريال</p>
                        {purchase.supplierName && <p>المورد: {purchase.supplierName}</p>}
                        {purchase.purchaseType && <p>نوع الدفع: {purchase.purchaseType}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(purchase)}
                        disabled={editingPurchaseId === purchase.id}
                      >
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMaterialPurchaseMutation.mutate(purchase.id)}
                        disabled={deleteMaterialPurchaseMutation.isPending}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
