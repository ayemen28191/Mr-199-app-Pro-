import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import type { InsertWorker } from "@shared/schema";

interface AddWorkerFormProps {
  onSuccess?: () => void;
}

interface WorkerType {
  id: string;
  name: string;
  usageCount: number;
  lastUsed: string;
  createdAt: string;
}

export default function AddWorkerForm({ onSuccess }: AddWorkerFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [dailyWage, setDailyWage] = useState("");
  const [showAddTypeDialog, setShowAddTypeDialog] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب أنواع العمال من قاعدة البيانات
  const { data: workerTypes = [] } = useQuery<WorkerType[]>({
    queryKey: ["/api/worker-types"],
  });

  const addWorkerMutation = useMutation({
    mutationFn: (data: InsertWorker) => apiRequest("POST", "/api/workers", data),
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم إضافة العامل بنجاح",
      });
      setName("");
      setType("");
      setDailyWage("");
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/worker-types"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "حدث خطأ أثناء إضافة العامل";
      toast({
        title: "فشل في إضافة العامل",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // إضافة نوع عامل جديد
  const addWorkerTypeMutation = useMutation({
    mutationFn: (data: { name: string }) => apiRequest("POST", "/api/worker-types", data),
    onSuccess: (newType) => {
      toast({
        title: "تم الحفظ",
        description: "تم إضافة نوع العامل بنجاح",
      });
      setType(newType.name);
      setNewTypeName("");
      setShowAddTypeDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/worker-types"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "حدث خطأ أثناء إضافة نوع العامل";
      toast({
        title: "فشل في إضافة نوع العامل",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type || !dailyWage) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع البيانات المطلوبة",
        variant: "destructive",
      });
      return;
    }

    addWorkerMutation.mutate({
      name: name.trim(),
      type,
      dailyWage,
      isActive: true,
    });
  };

  const handleAddNewType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم نوع العامل",
        variant: "destructive",
      });
      return;
    }

    addWorkerTypeMutation.mutate({
      name: newTypeName.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="worker-name" className="block text-sm font-medium text-foreground mb-2">
          اسم العامل
        </Label>
        <Input
          id="worker-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="أدخل اسم العامل..."
          required
        />
      </div>

      <div>
        <Label htmlFor="worker-type" className="block text-sm font-medium text-foreground mb-2">
          نوع العامل
        </Label>
        <div className="flex gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="اختر نوع العامل..." />
            </SelectTrigger>
            <SelectContent>
              {workerTypes.map((workerType) => (
                <SelectItem key={workerType.id} value={workerType.name}>
                  {workerType.name}
                </SelectItem>
              ))}
              {workerTypes.length === 0 && (
                <>
                  <SelectItem value="معلم">معلم</SelectItem>
                  <SelectItem value="عامل">عامل</SelectItem>
                  <SelectItem value="حداد">حداد</SelectItem>
                  <SelectItem value="نجار">نجار</SelectItem>
                  <SelectItem value="سائق">سائق</SelectItem>
                  <SelectItem value="كهربائي">كهربائي</SelectItem>
                  <SelectItem value="سباك">سباك</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          
          <Dialog open={showAddTypeDialog} onOpenChange={setShowAddTypeDialog}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="shrink-0" title="إضافة نوع جديد">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة نوع عامل جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddNewType} className="space-y-4">
                <div>
                  <Label htmlFor="new-type-name" className="block text-sm font-medium text-foreground mb-2">
                    اسم نوع العامل
                  </Label>
                  <Input
                    id="new-type-name"
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="مثال: كهربائي، سباك، حداد..."
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={addWorkerTypeMutation.isPending}
                    className="flex-1"
                  >
                    {addWorkerTypeMutation.isPending ? "جاري الإضافة..." : "إضافة"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddTypeDialog(false);
                      setNewTypeName("");
                    }}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
        <Label htmlFor="daily-wage" className="block text-sm font-medium text-foreground mb-2">
          الأجر اليومي (ر.ي)
        </Label>
        <Input
          id="daily-wage"
          type="number"
          inputMode="decimal"
          value={dailyWage}
          onChange={(e) => setDailyWage(e.target.value)}
          placeholder="0"
          className="text-center arabic-numbers"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={addWorkerMutation.isPending}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {addWorkerMutation.isPending ? "جاري الإضافة..." : "إضافة العامل"}
      </Button>
    </form>
  );
}