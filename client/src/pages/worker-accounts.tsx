import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowRight, Send, Eye, Calculator, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";
import { getCurrentDate, formatCurrency } from "@/lib/utils";
import { AutocompleteInput } from "@/components/ui/autocomplete-input-database";
import { apiRequest } from "@/lib/queryClient";
import { FormErrorHandler, FormField, useFormErrors } from "@/components/form-error-handler";
import type { Worker, WorkerBalance, WorkerTransfer, WorkerAttendance, InsertWorkerTransfer } from "@shared/schema";

export default function WorkerAccounts() {
  const [, setLocation] = useLocation();
  const { selectedProjectId, selectProject } = useSelectedProject();
  
  // Get URL parameters for editing
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  const workerId = urlParams.get('worker');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(workerId || "");
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showStatementDialog, setShowStatementDialog] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNumber, setTransferNumber] = useState("");
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [transferMethod, setTransferMethod] = useState("hawaleh");
  const [transferDate, setTransferDate] = useState(getCurrentDate());
  const [transferNotes, setTransferNotes] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { validateField, clearErrors } = useFormErrors();

  const { data: workers = [], isLoading: workersLoading } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const { data: workerBalance, isLoading: balanceLoading } = useQuery<WorkerBalance>({
    queryKey: ["/api/workers", selectedWorkerId, "balance", selectedProjectId],
    queryFn: () => apiRequest("GET", `/api/workers/${selectedWorkerId}/balance/${selectedProjectId}`),
    enabled: !!(selectedWorkerId && selectedProjectId),
  });

  const { data: workerTransfers = [], isLoading: transfersLoading } = useQuery({
    queryKey: ["/api/workers", selectedWorkerId, "transfers"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/workers/${selectedWorkerId}/transfers?projectId=${selectedProjectId}`);
      return Array.isArray(response) ? response as WorkerTransfer[] : [];
    },
    enabled: !!(selectedWorkerId && selectedProjectId),
  });

  // Fetch specific transfer for editing
  const { data: transferToEdit } = useQuery({
    queryKey: ["/api/worker-transfers", editId],
    queryFn: () => apiRequest("GET", `/api/worker-transfers/${editId}`),
    enabled: !!editId,
  });

  // Effect to populate form when editing a transfer
  useEffect(() => {
    if (transferToEdit && editId) {
      setTransferAmount(transferToEdit.amount?.toString() || "");
      setTransferNumber(transferToEdit.transferNumber || "");
      setSenderName(transferToEdit.senderName || "");
      setRecipientName(transferToEdit.recipientName || "");
      setRecipientPhone(transferToEdit.recipientPhone || "");
      setTransferMethod(transferToEdit.transferMethod || "hawaleh");
      setTransferDate(transferToEdit.transferDate || getCurrentDate());
      setTransferNotes(transferToEdit.notes || "");
      setShowTransferDialog(true);
    }
  }, [transferToEdit, editId]);

  const { data: accountStatement = [], isLoading: statementLoading } = useQuery({
    queryKey: ["/api/workers", selectedWorkerId, "account-statement"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/workers/${selectedWorkerId}/account-statement?projectId=${selectedProjectId}`);
      return Array.isArray(response) ? response as WorkerAttendance[] : [];
    },
    enabled: !!(selectedWorkerId && selectedProjectId && showStatementDialog),
  });

  const createTransferMutation = useMutation({
    mutationFn: async (transfer: InsertWorkerTransfer) => {
      return apiRequest("POST", "/api/worker-transfers", transfer);
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الحولية",
        description: "تم إرسال الحولية للأهل بنجاح",
      });
      resetTransferForm();
      invalidateTransferQueries();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الحولية",
        variant: "destructive",
      });
    },
  });

  const updateTransferMutation = useMutation({
    mutationFn: async ({ id, transfer }: { id: string; transfer: Partial<InsertWorkerTransfer> }) => {
      return apiRequest("PUT", `/api/worker-transfers/${id}`, transfer);
    },
    onSuccess: () => {
      toast({
        title: "تم تعديل الحولية",
        description: "تم تعديل بيانات الحولية بنجاح",
      });
      resetTransferForm();
      invalidateTransferQueries();
      // رجوع إلى صفحة المصروفات اليومية
      setLocation("/daily-expenses");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تعديل الحولية",
        variant: "destructive",
      });
    },
  });

  const deleteTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/worker-transfers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "تم حذف الحولية",
        description: "تم حذف الحولية بنجاح",
      });
      resetTransferForm();
      invalidateTransferQueries();
      // رجوع إلى صفحة المصروفات اليومية
      setLocation("/daily-expenses");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الحولية",
        variant: "destructive",
      });
    },
  });

  const resetTransferForm = () => {
    setShowTransferDialog(false);
    setTransferAmount("");
    setTransferNumber("");
    setSenderName("");
    setRecipientName("");
    setRecipientPhone("");
    setTransferMethod("hawaleh");
    setTransferDate(getCurrentDate());
    setTransferNotes("");
    setFormErrors({});
  };

  const invalidateTransferQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/workers", selectedWorkerId, "balance", selectedProjectId] });
    queryClient.invalidateQueries({ queryKey: ["/api/workers", selectedWorkerId, "transfers"] });
    queryClient.invalidateQueries({ queryKey: ["/api/worker-transfers"] });
    queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "fund-transfers"] });
  };

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);
  const currentBalance = parseFloat(workerBalance?.currentBalance || "0");
  const transferAmountNum = parseFloat(transferAmount || "0");

  const handleSendTransfer = () => {
    // مسح الأخطاء السابقة
    setFormErrors(clearErrors(formErrors));
    
    const errors: Record<string, string> = {};

    // التحقق من اختيار المشروع والعامل
    if (!selectedWorkerId || !selectedProjectId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المشروع والعامل أولاً",
        variant: "destructive",
      });
      return;
    }

    // التحقق من المبلغ
    const amountError = validateField(transferAmount, { 
      required: true,
      custom: (value) => parseFloat(value) > 0
    }, "المبلغ");
    if (amountError) errors.transferAmount = amountError;

    // التحقق من اسم المستلم
    const recipientError = validateField(recipientName, { 
      required: true,
      minLength: 2
    }, "اسم المستلم");
    if (recipientError) errors.recipientName = recipientError;

    // التحقق من رقم الهاتف إذا تم إدخاله
    if (recipientPhone.trim()) {
      const phoneError = validateField(recipientPhone, {
        pattern: /^[0-9]{7,15}$/,
      }, "رقم الهاتف");
      if (phoneError) errors.recipientPhone = "رقم الهاتف غير صالح";
    }

    // التحقق من رصيد العامل للحوالات الجديدة
    if (!editId && transferAmountNum > currentBalance) {
      errors.transferAmount = "المبلغ المطلوب أكبر من رصيد العامل";
    }

    // إذا كان هناك أخطاء، عرضها ولا تتابع
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const transfer: Partial<InsertWorkerTransfer> = {
      workerId: selectedWorkerId,
      projectId: selectedProjectId,
      amount: transferAmount,
      transferNumber: transferNumber.trim() || undefined,
      senderName: senderName.trim() || undefined,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim() || undefined,
      transferMethod,
      transferDate: transferDate,
      notes: transferNotes.trim() || undefined,
    };

    if (editId) {
      // تعديل حولة موجودة
      updateTransferMutation.mutate({ id: editId, transfer });
    } else {
      // إنشاء حولة جديدة
      if (transferAmountNum > currentBalance) {
        toast({
          title: "خطأ",
          description: "المبلغ المطلوب أكبر من رصيد العامل",
          variant: "destructive",
        });
        return;
      }
      createTransferMutation.mutate(transfer as InsertWorkerTransfer);
    }
  };

  const handleDeleteTransfer = () => {
    if (editId) {
      deleteTransferMutation.mutate(editId);
    }
  };

  const handleEditTransfer = (transfer: WorkerTransfer) => {
    setTransferAmount(transfer.amount?.toString() || "");
    setTransferNumber(transfer.transferNumber || "");
    setSenderName(transfer.senderName || "");
    setRecipientName(transfer.recipientName || "");
    setRecipientPhone(transfer.recipientPhone || "");
    setTransferMethod(transfer.transferMethod || "hawaleh");
    setTransferDate(transfer.transferDate || getCurrentDate());
    setTransferNotes(transfer.notes || "");
    
    // تحديث URL لوضع التعديل
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('edit', transfer.id);
    newUrl.searchParams.set('worker', selectedWorkerId);
    window.history.pushState({}, '', newUrl.toString());
    
    setShowTransferDialog(true);
  };

  const handleDeleteTransferDirect = (transferId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الحولة؟')) {
      deleteTransferMutation.mutate(transferId);
    }
  };

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
        <h2 className="text-xl font-bold text-foreground">حسابات العمال</h2>
      </div>

      <ProjectSelector
        selectedProjectId={selectedProjectId}
        onProjectChange={selectProject}
      />

      {/* Worker Selection */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <Label className="block text-sm font-medium text-foreground mb-2">اختيار العامل</Label>
          <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
            <SelectTrigger>
              <SelectValue placeholder="اختر عامل..." />
            </SelectTrigger>
            <SelectContent>
              {workers.map((worker) => (
                <SelectItem key={worker.id} value={worker.id}>
                  {worker.name} - {worker.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Worker Balance Info */}
      {selectedWorkerId && selectedProjectId && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>رصيد {selectedWorker?.name}</span>
              <div className="flex gap-2">
                <Dialog open={showStatementDialog} onOpenChange={setShowStatementDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="ml-2 h-4 w-4" />
                      كشف الحساب
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>كشف حساب {selectedWorker?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {statementLoading ? (
                        <p className="text-center py-4">جاري التحميل...</p>
                      ) : !Array.isArray(accountStatement) || accountStatement.length === 0 ? (
                        <p className="text-center py-4 text-muted-foreground">لا توجد سجلات</p>
                      ) : (
                        <div className="space-y-2">
                          {Array.isArray(accountStatement) && accountStatement.map((record) => (
                            <div key={record.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                              <div>
                                <p className="font-medium">{record.date}</p>
                                <p className="text-sm text-muted-foreground">{record.workDescription}</p>
                              </div>
                              <div className="text-left">
                                <p className="font-medium">الأجر: {formatCurrency(parseFloat(record.dailyWage))}</p>
                                <p className="text-sm text-green-600">المدفوع: {formatCurrency(parseFloat(record.paidAmount))}</p>
                                <p className="text-sm text-orange-600">المتبقي: {formatCurrency(parseFloat(record.remainingAmount))}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <p className="text-center py-4">جاري التحميل...</p>
            ) : workerBalance ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">إجمالي المكتسب:</span>
                    <span className="font-medium arabic-numbers">{formatCurrency(parseFloat(workerBalance.totalEarned))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">إجمالي المدفوع:</span>
                    <span className="font-medium text-green-600 arabic-numbers">{formatCurrency(parseFloat(workerBalance.totalPaid))}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">إجمالي المحول:</span>
                    <span className="font-medium text-blue-600 arabic-numbers">{formatCurrency(parseFloat(workerBalance.totalTransferred))}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">الرصيد الحالي:</span>
                    <span className="font-bold text-lg text-primary arabic-numbers">{formatCurrency(currentBalance)}</span>
                  </div>
                  <div className="flex gap-2 mt-3 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/excel-worker-statement?workerId=${selectedWorkerId}&projectId=${selectedProjectId}`)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <Eye className="h-4 w-4" />
                      عرض كشف الحساب
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">لا يوجد رصيد للعامل في هذا المشروع</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transfer Money Section */}
      {selectedWorkerId && selectedProjectId && currentBalance > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="ml-2 h-5 w-5" />
              إرسال حولية للأهل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Send className="ml-2 h-4 w-4" />
                  إرسال حولية
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editId ? `تعديل حولة لأهل ${selectedWorker?.name}` : `إرسال حولية لأهل ${selectedWorker?.name}`}
                  </DialogTitle>
                </DialogHeader>
                {editId && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      🔄 وضع التعديل - قم بتعديل البيانات ثم احفظ التغييرات
                    </p>
                  </div>
                )}
                <FormErrorHandler 
                  errors={formErrors}
                  onFirstError={() => toast({
                    title: "تنبيه",
                    description: "يرجى تصحيح الأخطاء المحددة أدناه",
                    variant: "destructive",
                  })}
                />
                <div className="space-y-4">
                  <FormField id="transferAmount" error={formErrors.transferAmount}>
                    <Label htmlFor="transferAmount">المبلغ المطلوب إرساله</Label>
                    <Input
                      id="transferAmount"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      max={editId ? undefined : currentBalance}
                      className="arabic-numbers"
                    />
                    {!editId && (
                      <p className="text-xs text-muted-foreground mt-1 arabic-numbers">
                        الرصيد المتاح: {formatCurrency(currentBalance)}
                      </p>
                    )}
                  </FormField>

                  <FormField id="transferNumber" error={formErrors.transferNumber}>
                    <Label htmlFor="transferNumber">رقم الحوالة (اختياري)</Label>
                    <Input
                      id="transferNumber"
                      type="text"
                      inputMode="numeric"
                      placeholder="رقم الحوالة..."
                      value={transferNumber}
                      onChange={(e) => setTransferNumber(e.target.value)}
                      className="arabic-numbers"
                    />
                  </FormField>

                  <FormField id="senderName" error={formErrors.senderName}>
                    <Label htmlFor="senderName">اسم المرسل</Label>
                    <AutocompleteInput
                      value={senderName}
                      onChange={setSenderName}
                      category="senderNames"
                      placeholder="اسم المرسل"
                    />
                  </FormField>

                  <FormField id="recipientName" error={formErrors.recipientName}>
                    <Label htmlFor="recipientName">اسم المستلم (الأهل)</Label>
                    <AutocompleteInput
                      value={recipientName}
                      onChange={setRecipientName}
                      category="recipientNames"
                      placeholder="اسم المستلم"
                    />
                  </FormField>

                  <FormField id="recipientPhone" error={formErrors.recipientPhone}>
                    <Label htmlFor="recipientPhone">رقم هاتف المستلم (اختياري)</Label>
                    <AutocompleteInput
                      type="tel"
                      inputMode="numeric"
                      value={recipientPhone}
                      onChange={setRecipientPhone}
                      category="recipientPhones"
                      placeholder="رقم الهاتف"
                      className="arabic-numbers"
                    />
                  </FormField>

                  <FormField id="transferMethod" error={formErrors.transferMethod}>
                    <Label htmlFor="transferMethod">طريقة التحويل</Label>
                    <Select value={transferMethod} onValueChange={setTransferMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hawaleh">حولة</SelectItem>
                        <SelectItem value="bank">تحويل بنكي</SelectItem>
                        <SelectItem value="cash">نقداً</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField id="transferDate" error={formErrors.transferDate}>
                    <Label htmlFor="transferDate">تاريخ التحويل</Label>
                    <Input
                      id="transferDate"
                      type="date"
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                      className="arabic-numbers"
                    />
                  </FormField>

                  <FormField id="transferNotes" error={formErrors.transferNotes}>
                    <Label htmlFor="transferNotes">ملاحظات (اختياري)</Label>
                    <AutocompleteInput
                      value={transferNotes}
                      onChange={setTransferNotes}
                      category="notes"
                      placeholder="ملاحظات إضافية..."
                    />
                  </FormField>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSendTransfer}
                      disabled={createTransferMutation.isPending || updateTransferMutation.isPending}
                      className="flex-1"
                    >
                      {editId ? (
                        updateTransferMutation.isPending ? "جاري التحديث..." : "حفظ التعديل"
                      ) : (
                        createTransferMutation.isPending ? "جاري الإرسال..." : "تأكيد الإرسال"
                      )}
                    </Button>
                    {editId && (
                      <Button 
                        onClick={handleDeleteTransfer}
                        disabled={deleteTransferMutation.isPending}
                        variant="destructive"
                        className="px-6"
                      >
                        {deleteTransferMutation.isPending ? "جاري الحذف..." : "حذف"}
                      </Button>
                    )}
                  </div>
                  
                  {editId && (
                    <Button 
                      onClick={() => setLocation("/daily-expenses")}
                      variant="outline"
                      className="w-full"
                    >
                      إلغاء والعودة للمصروفات
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Previous Transfers */}
      {selectedWorkerId && selectedProjectId && (
        <Card>
          <CardHeader>
            <CardTitle>الحوالات السابقة</CardTitle>
          </CardHeader>
          <CardContent>
            {transfersLoading ? (
              <p className="text-center py-4">جاري التحميل...</p>
            ) : !Array.isArray(workerTransfers) || workerTransfers.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">لا توجد حوالات سابقة</p>
            ) : (
              <div className="space-y-3">
                {Array.isArray(workerTransfers) && workerTransfers.map((transfer) => (
                  <div key={transfer.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{transfer.recipientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {transfer.transferDate} • {transfer.transferMethod === "hawaleh" ? "حولة" : transfer.transferMethod === "bank" ? "تحويل بنكي" : "نقداً"}
                      </p>
                      {transfer.transferNumber && (
                        <p className="text-xs text-muted-foreground">رقم الحوالة: {transfer.transferNumber}</p>
                      )}
                      {transfer.recipientPhone && (
                        <p className="text-xs text-muted-foreground">{transfer.recipientPhone}</p>
                      )}
                    </div>
                    <div className="text-left flex items-center gap-3">
                      <p className="font-bold text-blue-600">{formatCurrency(parseFloat(transfer.amount))}</p>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTransfer(transfer)}
                          className="px-2 py-1 h-8"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTransferDirect(transfer.id)}
                          className="px-2 py-1 h-8 text-red-600 hover:text-red-700"
                          disabled={deleteTransferMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}