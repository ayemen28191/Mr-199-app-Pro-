import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowRight, Save, Users, Car, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";
import ExpenseSummary from "@/components/expense-summary";
import WorkerMiscExpenses from "./worker-misc-expenses";
import { getCurrentDate, formatCurrency, formatDate } from "@/lib/utils";
import { AutocompleteInput } from "@/components/ui/autocomplete-input-database";
import { apiRequest } from "@/lib/queryClient";
import type { 
  WorkerAttendance, 
  TransportationExpense, 
  FundTransfer,
  MaterialPurchase,
  WorkerTransfer,
  Worker,
  InsertFundTransfer,
  InsertTransportationExpense,
  InsertDailyExpenseSummary 
} from "@shared/schema";

export default function DailyExpenses() {
  const [, setLocation] = useLocation();
  const { selectedProjectId, selectProject } = useSelectedProject();
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [carriedForward, setCarriedForward] = useState<string>("0");
  
  // Fund transfer form
  const [fundAmount, setFundAmount] = useState<string>("");
  const [senderName, setSenderName] = useState<string>("");
  const [transferNumber, setTransferNumber] = useState<string>("");
  const [transferType, setTransferType] = useState<string>("");
  const [editingFundTransferId, setEditingFundTransferId] = useState<string | null>(null);
  
  // Transportation expense form
  const [transportDescription, setTransportDescription] = useState<string>("");
  const [transportAmount, setTransportAmount] = useState<string>("");
  const [transportNotes, setTransportNotes] = useState<string>("");
  const [editingTransportationId, setEditingTransportationId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // دالة مساعدة لحفظ قيم الإكمال التلقائي
  const saveAutocompleteValue = async (field: string, value: string) => {
    if (!value || value.trim().length < 2) return;
    
    try {
      await apiRequest('POST', '/api/autocomplete', {
        category: field,
        value: value.trim()
      });
    } catch (error) {
      console.error(`Error saving autocomplete value for ${field}:`, error);
    }
  };

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const { data: todayAttendance = [] } = useQuery<WorkerAttendance[]>({
    queryKey: ["/api/projects", selectedProjectId, "attendance", selectedDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/attendance?date=${selectedDate}`);
      return Array.isArray(response) ? response as WorkerAttendance[] : [];
    },
    enabled: !!selectedProjectId,
  });

  const { data: todayTransportation = [] } = useQuery<TransportationExpense[]>({
    queryKey: ["/api/projects", selectedProjectId, "transportation-expenses", selectedDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/transportation-expenses?date=${selectedDate}`);
      return Array.isArray(response) ? response as TransportationExpense[] : [];
    },
    enabled: !!selectedProjectId,
  });

  const { data: todayMaterialPurchases = [], refetch: refetchMaterialPurchases } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "material-purchases", selectedDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/material-purchases?dateFrom=${selectedDate}&dateTo=${selectedDate}`);
      console.log("Material purchases response:", response);
      return Array.isArray(response) ? response as any[] : [];
    },
    enabled: !!selectedProjectId,
  });

  // جلب معلومات المواد
  const { data: materials = [] } = useQuery({
    queryKey: ["/api/materials"],
  });

  const { data: todayWorkerTransfers = [], refetch: refetchWorkerTransfers } = useQuery({
    queryKey: ["/api/worker-transfers", selectedProjectId, selectedDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/worker-transfers?projectId=${selectedProjectId}&date=${selectedDate}`);
      console.log("Worker transfers response:", response);
      return Array.isArray(response) ? response as WorkerTransfer[] : [];
    },
    enabled: !!selectedProjectId,
  });

  const { data: todayMiscExpenses = [] } = useQuery({
    queryKey: ["/api/worker-misc-expenses", selectedProjectId, selectedDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/worker-misc-expenses?projectId=${selectedProjectId}&date=${selectedDate}`);
      return Array.isArray(response) ? response : [];
    },
    enabled: !!selectedProjectId,
  });

  const { data: todayFundTransfers = [], refetch: refetchFundTransfers, isLoading: fundTransfersLoading } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "fund-transfers", selectedDate],
    queryFn: async () => {
      console.log("=== FUND TRANSFERS QUERY STARTED ===");
      console.log("selectedProjectId:", selectedProjectId);
      console.log("selectedDate:", selectedDate);
      
      const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/fund-transfers?date=${selectedDate}`);
      console.log("=== FUND TRANSFERS DEBUG ===");
      console.log("API URL:", `/api/projects/${selectedProjectId}/fund-transfers?date=${selectedDate}`);
      console.log("API Response:", response);
      console.log("Response type:", typeof response);
      console.log("Is array:", Array.isArray(response));
      console.log("Array length:", response?.length);
      console.log("============================");
      return Array.isArray(response) ? response as FundTransfer[] : [];
    },
    enabled: !!selectedProjectId && !!selectedDate,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // جلب الرصيد المتبقي من اليوم السابق
  const { data: previousBalance } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "previous-balance", selectedDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/previous-balance/${selectedDate}`);
      return response?.balance || "0";
    },
    enabled: !!selectedProjectId && !!selectedDate,
  });

  // تحديث المبلغ المرحل تلقائياً عند جلب الرصيد السابق
  useEffect(() => {
    if (previousBalance) {
      setCarriedForward(previousBalance);
    }
  }, [previousBalance]);

  const addFundTransferMutation = useMutation({
    mutationFn: (data: InsertFundTransfer) => apiRequest("POST", "/api/fund-transfers", data),
    onSuccess: async () => {
      toast({
        title: "تم إضافة العهدة",
        description: "تم إضافة تحويل العهدة بنجاح",
      });
      
      // حفظ قيم الإكمال التلقائي
      if (senderName) await saveAutocompleteValue('senderNames', senderName);
      if (transferNumber) await saveAutocompleteValue('transferNumbers', transferNumber);
      
      // تنظيف النموذج
      setFundAmount("");
      setSenderName("");
      setTransferNumber("");
      setTransferType("");
      
      // إعادة جلب البيانات
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", selectedProjectId, "fund-transfers", selectedDate] 
      });
    },
  });

  const addTransportationMutation = useMutation({
    mutationFn: (data: InsertTransportationExpense) => apiRequest("POST", "/api/transportation-expenses", data),
    onSuccess: async () => {
      toast({
        title: "تم إضافة المواصلات",
        description: "تم إضافة مصروف المواصلات بنجاح",
      });
      
      // حفظ قيم الإكمال التلقائي
      if (transportDescription) await saveAutocompleteValue('transportDescriptions', transportDescription);
      if (transportNotes) await saveAutocompleteValue('notes', transportNotes);
      
      // تنظيف النموذج
      setTransportDescription("");
      setTransportAmount("");
      setTransportNotes("");
      
      // إعادة جلب البيانات
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", selectedProjectId, "transportation-expenses", selectedDate] 
      });
    },
  });

  const saveDailySummaryMutation = useMutation({
    mutationFn: (data: InsertDailyExpenseSummary) => apiRequest("POST", "/api/daily-expense-summaries", data),
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم حفظ ملخص المصروفات اليومية بنجاح",
      });
      
      // تحديث ملخص اليوم
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", selectedProjectId, "daily-summary", selectedDate] 
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الملخص",
        variant: "destructive",
      });
    },
  });

  // Delete mutations
  const deleteFundTransferMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/fund-transfers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", selectedProjectId, "fund-transfers", selectedDate] 
      });
      toast({ title: "تم الحذف", description: "تم حذف العهدة بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "حدث خطأ أثناء حذف العهدة", variant: "destructive" });
    }
  });

  const deleteTransportationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/transportation-expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", selectedProjectId, "transportation-expenses", selectedDate] 
      });
      toast({ title: "تم الحذف", description: "تم حذف مصروف المواصلات بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "حدث خطأ أثناء حذف المصروف", variant: "destructive" });
    }
  });

  const deleteMaterialPurchaseMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/material-purchases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "material-purchases"] });
      toast({ title: "تم الحذف", description: "تم حذف شراء المواد بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "حدث خطأ أثناء حذف الشراء", variant: "destructive" });
    }
  });

  const deleteWorkerAttendanceMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/worker-attendance/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "attendance"] });
      toast({ title: "تم الحذف", description: "تم حذف حضور العامل بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "حدث خطأ أثناء حذف الحضور", variant: "destructive" });
    }
  });

  // Fund Transfer Update Mutation
  const updateFundTransferMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PUT", `/api/fund-transfers/${id}`, data),
    onSuccess: async () => {
      // حفظ قيم الإكمال التلقائي
      if (senderName) await saveAutocompleteValue('senderNames', senderName);
      if (transferNumber) await saveAutocompleteValue('transferNumbers', transferNumber);
      
      resetFundTransferForm();
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", selectedProjectId, "fund-transfers", selectedDate] 
      });
      toast({
        title: "تم التحديث",
        description: "تم تحديث العهدة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث العهدة",
        variant: "destructive",
      });
    }
  });

  const resetFundTransferForm = () => {
    setFundAmount("");
    setSenderName("");
    setTransferNumber("");
    setTransferType("");
    setEditingFundTransferId(null);
  };

  const handleEditFundTransfer = (transfer: FundTransfer) => {
    setFundAmount(transfer.amount);
    setSenderName(transfer.senderName || "");
    setTransferNumber(transfer.transferNumber || "");
    setTransferType(transfer.transferType);
    setEditingFundTransferId(transfer.id);
  };

  const handleAddFundTransfer = () => {
    if (!selectedProjectId || !fundAmount || !transferType) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع البيانات المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const transferData = {
      projectId: selectedProjectId,
      amount: fundAmount,
      senderName,
      transferNumber,
      transferType,
      transferDate: new Date(selectedDate + 'T12:00:00.000Z'),
      notes: "",
    };

    if (editingFundTransferId) {
      updateFundTransferMutation.mutate({
        id: editingFundTransferId,
        data: transferData
      });
    } else {
      addFundTransferMutation.mutate(transferData);
    }
  };

  // Transportation Update Mutation
  const updateTransportationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PUT", `/api/transportation-expenses/${id}`, data),
    onSuccess: async () => {
      // حفظ قيم الإكمال التلقائي
      if (transportDescription) await saveAutocompleteValue('transportDescriptions', transportDescription);
      if (transportNotes) await saveAutocompleteValue('notes', transportNotes);
      
      resetTransportationForm();
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", selectedProjectId, "transportation-expenses"] 
      });
      toast({
        title: "تم التحديث",
        description: "تم تحديث مصروف المواصلات بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المصروف",
        variant: "destructive",
      });
    }
  });

  const resetTransportationForm = () => {
    setTransportDescription("");
    setTransportAmount("");
    setTransportNotes("");
    setEditingTransportationId(null);
  };

  const handleEditTransportation = (expense: TransportationExpense) => {
    setTransportDescription(expense.description);
    setTransportAmount(expense.amount);
    setTransportNotes(expense.notes || "");
    setEditingTransportationId(expense.id);
  };

  const handleAddTransportation = () => {
    if (!selectedProjectId || !transportDescription || !transportAmount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع البيانات المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const transportData = {
      projectId: selectedProjectId,
      amount: transportAmount,
      description: transportDescription,
      date: selectedDate,
      notes: transportNotes,
    };

    if (editingTransportationId) {
      updateTransportationMutation.mutate({
        id: editingTransportationId,
        data: transportData
      });
    } else {
      addTransportationMutation.mutate(transportData);
    }
  };

  const calculateTotals = () => {
    const totalWorkerWages = todayAttendance.reduce(
      (sum, attendance) => sum + parseFloat(attendance.paidAmount || "0"), 
      0
    );
    const totalTransportation = todayTransportation.reduce(
      (sum, expense) => sum + parseFloat(expense.amount || "0"), 
      0
    );
    const totalMaterialCosts = Array.isArray(todayMaterialPurchases) ? 
      todayMaterialPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.totalAmount || "0"), 0) : 0;
    const totalWorkerTransfers = Array.isArray(todayWorkerTransfers) ? 
      todayWorkerTransfers.reduce((sum, transfer) => sum + parseFloat(transfer.amount || "0"), 0) : 0;
    const totalMiscExpenses = Array.isArray(todayMiscExpenses) ? 
      todayMiscExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || "0"), 0) : 0;
    const totalFundTransfers = Array.isArray(todayFundTransfers) ? 
      todayFundTransfers.reduce((sum, transfer) => sum + parseFloat(transfer.amount || "0"), 0) : 0;
    const carriedAmount = parseFloat(carriedForward) || 0;
    
    const totalIncome = carriedAmount + totalFundTransfers;
    const totalExpenses = totalWorkerWages + totalTransportation + totalMaterialCosts + totalWorkerTransfers + totalMiscExpenses;
    const remainingBalance = totalIncome - totalExpenses;

    return {
      totalWorkerWages,
      totalTransportation,
      totalMaterialCosts,
      totalWorkerTransfers,
      totalMiscExpenses,
      totalFundTransfers,
      totalIncome,
      totalExpenses,
      remainingBalance,
    };
  };

  const handleSaveSummary = () => {
    if (!selectedProjectId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المشروع أولاً",
        variant: "destructive",
      });
      return;
    }

    const totals = calculateTotals();

    saveDailySummaryMutation.mutate({
      projectId: selectedProjectId,
      date: selectedDate,
      carriedForwardAmount: carriedForward,
      totalFundTransfers: totals.totalFundTransfers.toString(),
      totalWorkerWages: totals.totalWorkerWages.toString(),
      totalMaterialCosts: totals.totalMaterialCosts.toString(),
      totalTransportationCosts: totals.totalTransportation.toString(),
      totalIncome: totals.totalIncome.toString(),
      totalExpenses: totals.totalExpenses.toString(),
      remainingBalance: totals.remainingBalance.toString(),
    });
  };

  const totals = calculateTotals();

  // Debug logging في المكون
  console.log("=== COMPONENT STATE DEBUG ===");
  console.log("selectedProjectId:", selectedProjectId, "!! =", !!selectedProjectId);
  console.log("selectedDate:", selectedDate, "!! =", !!selectedDate);
  console.log("Query enabled:", !!selectedProjectId && !!selectedDate);
  console.log("todayFundTransfers:", todayFundTransfers);
  console.log("todayFundTransfers type:", typeof todayFundTransfers);
  console.log("todayFundTransfers isArray:", Array.isArray(todayFundTransfers));
  console.log("todayFundTransfers length:", todayFundTransfers?.length);
  console.log("fundTransfersLoading:", fundTransfersLoading);
  console.log("================================");

  return (
    <div className="p-4 slide-in">
      {/* Header with Back Button */}
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="ml-3 p-2"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold text-foreground">المصروفات اليومية</h2>
      </div>

      <ProjectSelector
        selectedProjectId={selectedProjectId}
        onProjectChange={selectProject}
      />

      {/* Date and Balance Info */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="block text-sm font-medium text-foreground mb-1">التاريخ</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-foreground mb-1">المبلغ المتبقي السابق</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={carriedForward}
                onChange={(e) => setCarriedForward(e.target.value)}
                placeholder="0"
                className="text-center arabic-numbers"
              />
            </div>
          </div>
          
          {/* Fund Transfer Section */}
          <div className="border-t pt-3">
            <h4 className="font-medium text-foreground mb-2">تحويل عهدة جديدة</h4>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <Input
                type="number"
                inputMode="decimal"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="المبلغ"
                className="text-center arabic-numbers"
              />
              <AutocompleteInput
                value={senderName}
                onChange={setSenderName}
                category="senderNames"
                placeholder="اسم المرسل"
              />
            </div>
            <AutocompleteInput
              type="number"
              inputMode="numeric"
              value={transferNumber}
              onChange={setTransferNumber}
              category="transferNumbers"
              placeholder="رقم الحولة"
              className="w-full mb-2 arabic-numbers"
            />
            <div className="flex gap-2">
              <Select value={transferType} onValueChange={setTransferType}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="نوع التحويل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="حولة">حولة بنكية</SelectItem>
                  <SelectItem value="تسليم يدوي">تسليم يدوي</SelectItem>
                  <SelectItem value="صراف">صراف آلي</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddFundTransfer} size="sm" className="bg-primary">
                {editingFundTransferId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
              {editingFundTransferId && (
                <Button onClick={resetFundTransferForm} size="sm" variant="outline">
                  إلغاء
                </Button>
              )}
            </div>
            
            {/* عرض العهد المضافة لهذا اليوم */}
            <div className="mt-3 pt-3 border-t">
              <h5 className="text-sm font-medium text-muted-foreground mb-2">العهد المضافة اليوم:</h5>
              {fundTransfersLoading ? (
                <div className="text-center text-muted-foreground">جاري التحميل...</div>
              ) : Array.isArray(todayFundTransfers) && todayFundTransfers.length > 0 ? (
                <div className="space-y-2">
                  {todayFundTransfers.map((transfer, index) => (
                    <div key={transfer.id || index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div className="text-sm flex-1">
                        <div>{transfer.senderName || 'غير محدد'}</div>
                        <div className="text-xs text-muted-foreground">{transfer.transferType}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium arabic-numbers">{formatCurrency(transfer.amount)}</span>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEditFundTransfer(transfer)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteFundTransferMutation.mutate(transfer.id)}
                            disabled={deleteFundTransferMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-left pt-2 border-t">
                    <span className="text-sm text-muted-foreground">إجمالي العهد: </span>
                    <span className="font-bold text-primary arabic-numbers">
                      {formatCurrency(totals.totalFundTransfers)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm text-center p-3">
                  لا توجد عهد مضافة لهذا اليوم (العدد: {todayFundTransfers?.length || 0})
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Worker Wages */}
      <Card className="mb-3">
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <Users className="text-primary ml-2 h-5 w-5" />
            أجور العمال
          </h4>
          {todayAttendance.length === 0 ? (
            <p className="text-muted-foreground text-sm">لم يتم تسجيل حضور عمال لهذا اليوم</p>
          ) : (
            <div className="space-y-2">
              {todayAttendance.map((attendance, index) => {
                const worker = workers.find(w => w.id === attendance.workerId);
                return (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm">{worker?.name || `عامل ${index + 1}`}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium arabic-numbers">{formatCurrency(attendance.paidAmount)}</span>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              // توجيه إلى صفحة حضور العمال مع معرف العامل والتاريخ للتعديل
                              setLocation(`/worker-attendance?edit=${attendance.id}&worker=${attendance.workerId}&date=${selectedDate}`);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteWorkerAttendanceMutation.mutate(attendance.id)}
                            disabled={deleteWorkerAttendanceMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                );
              })}
              <div className="text-left mt-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">إجمالي أجور العمال: </span>
                <span className="font-bold text-primary arabic-numbers">
                  {formatCurrency(totals.totalWorkerWages)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transportation */}
      <Card className="mb-3">
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <Car className="text-secondary ml-2 h-5 w-5" />
            أجور المواصلات
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <AutocompleteInput
                value={transportDescription}
                onChange={setTransportDescription}
                category="transportDescriptions"
                placeholder="الوصف"
              />
              <Input
                type="number"
                inputMode="decimal"
                value={transportAmount}
                onChange={(e) => setTransportAmount(e.target.value)}
                placeholder="المبلغ"
                className="text-center arabic-numbers"
              />
            </div>
            <div className="flex gap-2">
              <AutocompleteInput
                value={transportNotes}
                onChange={setTransportNotes}
                category="notes"
                placeholder="ملاحظات"
                className="flex-1"
              />
              <Button onClick={handleAddTransportation} size="sm" className="bg-secondary">
                {editingTransportationId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
              {editingTransportationId && (
                <Button onClick={resetTransportationForm} size="sm" variant="outline">
                  إلغاء
                </Button>
              )}
            </div>
            
            {/* Show existing transportation expenses */}
            {todayTransportation.map((expense, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-sm flex-1">{expense.description}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium arabic-numbers">{formatCurrency(expense.amount)}</span>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => handleEditTransportation(expense)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteTransportationMutation.mutate(expense.id)}
                      disabled={deleteTransportationMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Materials */}
      <Card className="mb-3">
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <Package className="text-success ml-2 h-5 w-5" />
            شراء مواد
          </h4>
          {!Array.isArray(todayMaterialPurchases) || todayMaterialPurchases.length === 0 ? (
            <p className="text-muted-foreground text-sm mb-3">لا توجد مشتريات لهذا اليوم</p>
          ) : (
            <div className="space-y-2 mb-3">
              {todayMaterialPurchases.map((purchase, index) => {
                const material = purchase.material || (materials as any[])?.find((m: any) => m.id === purchase.materialId);
                return (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <div className="text-sm flex-1">
                    <div className="font-medium">{material?.name || 'مادة غير محددة'}</div>
                    <div className="text-xs text-muted-foreground">
                      {purchase.quantity} {material?.unit || 'وحدة'} × {formatCurrency(purchase.unitPrice)}
                    </div>
                    {purchase.supplierName && (
                      <div className="text-xs text-muted-foreground">المورد: {purchase.supplierName}</div>
                    )}
                    {material?.category && (
                      <div className="text-xs text-muted-foreground">الفئة: {material.category}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium arabic-numbers">{formatCurrency(purchase.totalAmount)}</span>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          // توجيه إلى صفحة شراء المواد مع معرف الشراء للتعديل
                          setLocation(`/material-purchase?edit=${purchase.id}`);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteMaterialPurchaseMutation.mutate(purchase.id)}
                        disabled={deleteMaterialPurchaseMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                );
              })}
              <div className="text-left mt-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">إجمالي المشتريات: </span>
                <span className="font-bold text-success arabic-numbers">
                  {formatCurrency(totals.totalMaterialCosts)}
                </span>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => setLocation("/material-purchase")}
            className="w-full border-2 border-dashed"
          >
            <Plus className="ml-2 h-4 w-4" />
            إضافة شراء مواد
          </Button>
        </CardContent>
      </Card>

      {/* Worker Transfers */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <DollarSign className="text-warning ml-2 h-5 w-5" />
            حولة من حساب العمال
          </h4>
          {!Array.isArray(todayWorkerTransfers) || todayWorkerTransfers.length === 0 ? (
            <p className="text-muted-foreground text-sm mb-3">لا توجد حوالات لهذا اليوم</p>
          ) : (
            <div className="space-y-2 mb-3">
              {todayWorkerTransfers.map((transfer, index) => {
                const worker = workers.find(w => w.id === transfer.workerId);
                return (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted rounded border-r-4 border-warning">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {worker?.name || 'عامل غير معروف'}
                        </span>
                        <span className="font-bold text-warning arabic-numbers">{formatCurrency(transfer.amount)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span>المستلم: {transfer.recipientName}</span>
                        {transfer.recipientPhone && (
                          <span className="mr-3">الهاتف: {transfer.recipientPhone}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        طريقة التحويل: {transfer.transferMethod === "hawaleh" ? "حولة" : transfer.transferMethod === "bank" ? "تحويل بنكي" : "نقداً"}
                      </div>
                    </div>
                    <div className="flex gap-1 mr-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          // توجيه إلى صفحة حسابات العمال مع معرف التحويل للتعديل
                          setLocation(`/worker-accounts?edit=${transfer.id}&worker=${transfer.workerId}`);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          toast({ title: "قريباً", description: "سيتم إضافة ميزة الحذف" });
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              <div className="text-left mt-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">إجمالي الحوالات: </span>
                <span className="font-bold text-warning arabic-numbers">
                  {formatCurrency(totals.totalWorkerTransfers)}
                </span>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => setLocation("/worker-accounts")}
            className="w-full border-2 border-dashed"
          >
            <Plus className="ml-2 h-4 w-4" />
            إرسال حولة جديدة
          </Button>
        </CardContent>
      </Card>

      {/* Worker Miscellaneous Expenses */}
      {selectedProjectId && (
        <WorkerMiscExpenses 
          projectId={selectedProjectId} 
          selectedDate={selectedDate} 
        />
      )}

      {/* Total Summary */}
      <ExpenseSummary
        totalIncome={totals.totalIncome}
        totalExpenses={totals.totalExpenses}
        remainingBalance={totals.remainingBalance}
      />

      {/* Save Button */}
      <div className="mt-4">
        <Button
          onClick={handleSaveSummary}
          disabled={saveDailySummaryMutation.isPending}
          className="w-full bg-success hover:bg-success/90 text-success-foreground"
        >
          <Save className="ml-2 h-4 w-4" />
          {saveDailySummaryMutation.isPending ? "جاري الحفظ..." : "حفظ المصروفات"}
        </Button>
      </div>
    </div>
  );
}
