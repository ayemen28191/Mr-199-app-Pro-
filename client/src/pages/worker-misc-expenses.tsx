import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit3, Save, X } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WorkerMiscExpense {
  id: string;
  projectId: string;
  amount: string;
  description: string;
  date: string;
  createdAt: string;
}

interface WorkerMiscExpensesProps {
  projectId: string;
  selectedDate: string;
}

export default function WorkerMiscExpenses({ projectId, selectedDate }: WorkerMiscExpensesProps) {
  const [newExpense, setNewExpense] = useState({ amount: "", description: "" });
  const [editingExpense, setEditingExpense] = useState<WorkerMiscExpense | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["/api/worker-misc-expenses", projectId, selectedDate],
    queryFn: () =>
      fetch(`/api/worker-misc-expenses?projectId=${projectId}&date=${selectedDate}`)
        .then((res) => res.json())
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: { amount: string; description: string; projectId: string; date: string }) =>
      apiRequest("/api/worker-misc-expenses", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worker-misc-expenses"] });
      setNewExpense({ amount: "", description: "" });
      setIsAddingNew(false);
      toast({
        title: "✅ تم إضافة النثريات",
        description: "تم إضافة نثريات العمال بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "❌ خطأ",
        description: "فشل في إضافة النثريات",
        variant: "destructive"
      });
    }
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkerMiscExpense> }) =>
      apiRequest(`/api/worker-misc-expenses/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worker-misc-expenses"] });
      setEditingExpense(null);
      toast({
        title: "✅ تم التحديث",
        description: "تم تحديث النثريات بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "❌ خطأ",
        description: "فشل في تحديث النثريات",
        variant: "destructive"
      });
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/worker-misc-expenses/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worker-misc-expenses"] });
      toast({
        title: "✅ تم الحذف",
        description: "تم حذف النثريات بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "❌ خطأ",
        description: "فشل في حذف النثريات",
        variant: "destructive"
      });
    }
  });

  const handleCreateExpense = () => {
    if (!newExpense.amount || !newExpense.description.trim()) {
      toast({
        title: "⚠️ بيانات ناقصة",
        description: "يرجى إدخال المبلغ ووصف النثريات",
        variant: "destructive"
      });
      return;
    }

    createExpenseMutation.mutate({
      ...newExpense,
      projectId,
      date: selectedDate
    });
  };

  const handleUpdateExpense = () => {
    if (!editingExpense || !editingExpense.amount || !editingExpense.description.trim()) {
      toast({
        title: "⚠️ بيانات ناقصة",
        description: "يرجى إدخال المبلغ ووصف النثريات",
        variant: "destructive"
      });
      return;
    }

    updateExpenseMutation.mutate({
      id: editingExpense.id,
      data: {
        amount: editingExpense.amount,
        description: editingExpense.description
      }
    });
  };

  const totalExpenses = expenses.reduce((sum: number, expense: WorkerMiscExpense) => sum + parseFloat(expense.amount), 0);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-right">نثريات العمال</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">جاري التحميل...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsAddingNew(true)}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isAddingNew}
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة نثريات
          </Button>
          {totalExpenses > 0 && (
            <Badge variant="outline" className="text-lg font-bold px-4 py-2">
              المجموع: {totalExpenses.toFixed(2)} ريال
            </Badge>
          )}
        </div>
        <CardTitle className="text-right">
          نثريات العمال - {format(new Date(selectedDate), "dd MMMM yyyy", { locale: ar })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* نموذج إضافة نثريات جديدة */}
        {isAddingNew && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-right">
                  <label className="block text-sm font-medium mb-2">المبلغ (ريال)</label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0.00"
                    className="text-right"
                  />
                </div>
                <div className="text-right md:col-span-2">
                  <label className="block text-sm font-medium mb-2">وصف النثريات</label>
                  <Textarea
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="مثال: أجور نقل، مصاريف إضافية، بونص عمال..."
                    className="text-right resize-none"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewExpense({ amount: "", description: "" });
                  }}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4 ml-1" />
                  إلغاء
                </Button>
                <Button
                  onClick={handleCreateExpense}
                  disabled={createExpenseMutation.isPending}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 ml-1" />
                  {createExpenseMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* قائمة النثريات */}
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">💰</div>
            <p className="text-lg">لا توجد نثريات مسجلة لهذا اليوم</p>
            <p className="text-sm">اضغط على "إضافة نثريات" لبدء التسجيل</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense: WorkerMiscExpense) => (
              <Card key={expense.id} className="border border-gray-200">
                <CardContent className="pt-4">
                  {editingExpense?.id === expense.id ? (
                    // وضع التحرير
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-right">
                        <label className="block text-sm font-medium mb-2">المبلغ (ريال)</label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          value={editingExpense?.amount || ""}
                          onChange={(e) =>
                            editingExpense && setEditingExpense({ ...editingExpense, amount: e.target.value })
                          }
                          className="text-right"
                        />
                      </div>
                      <div className="text-right md:col-span-2">
                        <label className="block text-sm font-medium mb-2">وصف النثريات</label>
                        <Textarea
                          value={editingExpense?.description || ""}
                          onChange={(e) =>
                            editingExpense && setEditingExpense({ ...editingExpense, description: e.target.value })
                          }
                          className="text-right resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    // وضع العرض
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setEditingExpense(expense)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => deleteExpenseMutation.mutate(expense.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deleteExpenseMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-right flex-1 ml-4">
                        <div className="flex justify-between items-center mb-2">
                          <Badge variant="secondary" className="text-lg font-bold">
                            {parseFloat(expense.amount).toFixed(2)} ريال
                          </Badge>
                          <div className="text-sm text-gray-500">
                            {format(new Date(expense.createdAt), "HH:mm", { locale: ar })}
                          </div>
                        </div>
                        <p className="text-gray-700">{expense.description}</p>
                      </div>
                    </div>
                  )}

                  {editingExpense?.id === expense.id && (
                    <div className="flex gap-2 justify-end pt-4 border-t">
                      <Button
                        onClick={() => setEditingExpense(null)}
                        variant="outline"
                        size="sm"
                      >
                        <X className="w-4 h-4 ml-1" />
                        إلغاء
                      </Button>
                      <Button
                        onClick={handleUpdateExpense}
                        disabled={updateExpenseMutation.isPending}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 ml-1" />
                        {updateExpenseMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}