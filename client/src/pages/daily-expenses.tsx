import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowRight, Save, Users, Car, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ProjectSelector from "@/components/project-selector";
import ExpenseSummary from "@/components/expense-summary";
import { getCurrentDate, formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { 
  WorkerAttendance, 
  TransportationExpense, 
  FundTransfer,
  MaterialPurchase,
  WorkerTransfer,
  InsertFundTransfer,
  InsertTransportationExpense,
  InsertDailyExpenseSummary 
} from "@shared/schema";

export default function DailyExpenses() {
  const [, setLocation] = useLocation();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [carriedForward, setCarriedForward] = useState<string>("0");
  
  // Fund transfer form
  const [fundAmount, setFundAmount] = useState<string>("");
  const [senderName, setSenderName] = useState<string>("");
  const [transferNumber, setTransferNumber] = useState<string>("");
  const [transferType, setTransferType] = useState<string>("");
  
  // Transportation expense form
  const [transportDescription, setTransportDescription] = useState<string>("");
  const [transportAmount, setTransportAmount] = useState<string>("");
  const [transportNotes, setTransportNotes] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      return Array.isArray(response) ? response as MaterialPurchase[] : [];
    },
    enabled: !!selectedProjectId,
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

  const { data: todayFundTransfers = [], refetch: refetchFundTransfers } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "fund-transfers", selectedDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/fund-transfers?date=${selectedDate}`);
      console.log("Fund transfers response:", response);
      return Array.isArray(response) ? response as FundTransfer[] : [];
    },
    enabled: !!selectedProjectId && !!selectedDate,
  });

  // جلب الرصيد المتبقي من اليوم السابق
  const { data: previousBalance } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "previous-balance", selectedDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/projects/${selectedProjectId}/previous-balance/${selectedDate}`);
      return { balance: String(response || "0") };
    },
    enabled: !!selectedProjectId && !!selectedDate,
  });

  // تحديث المبلغ المرحل تلقائياً عند تغيير التاريخ أو المشروع
  useEffect(() => {
    if (previousBalance?.balance && previousBalance.balance !== "0") {
      setCarriedForward(previousBalance.balance);
    } else {
      setCarriedForward("0");
    }
  }, [previousBalance, selectedProjectId, selectedDate]);

  const addFundTransferMutation = useMutation({
    mutationFn: (data: InsertFundTransfer) => apiRequest("POST", "/api/fund-transfers", data),
    onSuccess: () => {
      setFundAmount("");
      setSenderName("");
      setTransferNumber("");
      setTransferType("");
      // إعادة جلب البيانات فوراً
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", selectedProjectId, "fund-transfers"] 
      });
      toast({
        title: "تم إضافة العهدة",
        description: "تم إضافة تحويل العهدة بنجاح",
      });
      // تحديث العهدة مباشرة
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "fund-transfers", selectedDate] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "fund-transfers"] });
      
      // تنظيف النموذج
      setFundAmount("");
      setSenderName("");
      setTransferNumber("");
      setTransferType("");
      
      // إعادة تحميل بيانات العهدة فوراً
      setTimeout(() => {
        refetchFundTransfers();
      }, 100);
    },
  });

  const addTransportationMutation = useMutation({
    mutationFn: (data: InsertTransportationExpense) => apiRequest("POST", "/api/transportation-expenses", data),
    onSuccess: () => {
      setTransportDescription("");
      setTransportAmount("");
      setTransportNotes("");
      toast({
        title: "تم إضافة المواصلات",
        description: "تم إضافة مصروف المواصلات بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "transportation-expenses"] });
      refetchMaterialPurchases();
      refetchWorkerTransfers();
    },
  });

  const saveDailySummaryMutation = useMutation({
    mutationFn: (data: InsertDailyExpenseSummary) => apiRequest("POST", "/api/daily-expense-summaries", data),
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم حفظ ملخص المصروفات اليومية بنجاح",
      });
      // Refresh all data to show updated totals
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "material-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/worker-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "transportation-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "attendance"] });
      
      // Refetch current data immediately
      refetchMaterialPurchases();
      refetchWorkerTransfers();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الملخص",
        variant: "destructive",
      });
    },
  });

  const handleAddFundTransfer = () => {
    if (!selectedProjectId || !fundAmount || !transferType) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع البيانات المطلوبة",
        variant: "destructive",
      });
      return;
    }

    addFundTransferMutation.mutate({
      projectId: selectedProjectId,
      amount: fundAmount,
      senderName,
      transferNumber,
      transferType,
      transferDate: new Date(selectedDate + 'T12:00:00.000Z'),
      notes: "",
    });
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

    addTransportationMutation.mutate({
      projectId: selectedProjectId,
      amount: transportAmount,
      description: transportDescription,
      date: selectedDate,
      notes: transportNotes,
    });
  };

  const calculateTotals = () => {
    const totalWorkerWages = todayAttendance.reduce(
      (sum, attendance) => sum + parseFloat(attendance.dailyWage || "0"), 
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
    const totalFundTransfers = Array.isArray(todayFundTransfers) ? 
      todayFundTransfers.reduce((sum, transfer) => sum + parseFloat(transfer.amount || "0"), 0) : 0;
    const carriedAmount = parseFloat(carriedForward) || 0;
    
    const totalIncome = carriedAmount + totalFundTransfers;
    const totalExpenses = totalWorkerWages + totalTransportation + totalMaterialCosts + totalWorkerTransfers;
    const remainingBalance = totalIncome - totalExpenses;

    return {
      totalWorkerWages,
      totalTransportation,
      totalMaterialCosts,
      totalWorkerTransfers,
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
        onProjectChange={setSelectedProjectId}
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
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="المبلغ"
                className="text-center arabic-numbers"
              />
              <Input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="اسم المرسل"
              />
            </div>
            <Input
              type="text"
              value={transferNumber}
              onChange={(e) => setTransferNumber(e.target.value)}
              placeholder="رقم الحولة"
              className="w-full mb-2"
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
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* عرض العهد المضافة لهذا اليوم */}
            {Array.isArray(todayFundTransfers) && todayFundTransfers.length > 0 && (
              <div className="space-y-2 mt-3 pt-3 border-t">
                <h5 className="text-sm font-medium text-muted-foreground">العهد المضافة اليوم:</h5>
                {todayFundTransfers.map((transfer, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                    <div className="text-sm">
                      <div>{transfer.senderName || 'غير محدد'}</div>
                      <div className="text-xs text-muted-foreground">{transfer.transferType}</div>
                    </div>
                    <span className="font-medium arabic-numbers">{formatCurrency(transfer.amount)}</span>
                  </div>
                ))}
                <div className="text-left pt-2 border-t">
                  <span className="text-sm text-muted-foreground">إجمالي العهد: </span>
                  <span className="font-bold text-primary arabic-numbers">
                    {formatCurrency(totals.totalFundTransfers)}
                  </span>
                </div>
              </div>
            )}
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
              {todayAttendance.map((attendance, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-sm">عامل {index + 1}</span>
                  <span className="font-medium arabic-numbers">{formatCurrency(attendance.dailyWage)}</span>
                </div>
              ))}
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
              <Input
                type="text"
                value={transportDescription}
                onChange={(e) => setTransportDescription(e.target.value)}
                placeholder="الوصف"
              />
              <Input
                type="number"
                value={transportAmount}
                onChange={(e) => setTransportAmount(e.target.value)}
                placeholder="المبلغ"
                className="text-center arabic-numbers"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={transportNotes}
                onChange={(e) => setTransportNotes(e.target.value)}
                placeholder="ملاحظات"
                className="flex-1"
              />
              <Button onClick={handleAddTransportation} size="sm" className="bg-secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Show existing transportation expenses */}
            {todayTransportation.map((expense, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-sm">{expense.description}</span>
                <span className="font-medium arabic-numbers">{formatCurrency(expense.amount)}</span>
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
              {todayMaterialPurchases.map((purchase, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-sm">{purchase.materialId || 'مادة غير محددة'}</span>
                  <span className="font-medium arabic-numbers">{formatCurrency(purchase.totalAmount)}</span>
                </div>
              ))}
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

      {/* Worker Transfers (Advances) */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <DollarSign className="text-warning ml-2 h-5 w-5" />
            عهد العمال
          </h4>
          {!Array.isArray(todayWorkerTransfers) || todayWorkerTransfers.length === 0 ? (
            <p className="text-muted-foreground text-sm mb-3">لا توجد عهد لهذا اليوم</p>
          ) : (
            <div className="space-y-2 mb-3">
              {todayWorkerTransfers.map((transfer, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-sm">{transfer.recipientName}</span>
                  <span className="font-medium arabic-numbers">{formatCurrency(transfer.amount)}</span>
                </div>
              ))}
              <div className="text-left mt-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">إجمالي العهد: </span>
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
            إضافة عهدة جديدة
          </Button>
        </CardContent>
      </Card>

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
