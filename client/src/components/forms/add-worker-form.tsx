import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertWorker } from "@shared/schema";

interface AddWorkerFormProps {
  onSuccess?: () => void;
}

export default function AddWorkerForm({ onSuccess }: AddWorkerFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [dailyWage, setDailyWage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة العامل",
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
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="اختر نوع العامل..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="معلم">معلم</SelectItem>
            <SelectItem value="عامل">عامل</SelectItem>
            <SelectItem value="حداد">حداد</SelectItem>
            <SelectItem value="نجار">نجار</SelectItem>
            <SelectItem value="سائق">سائق</SelectItem>
            <SelectItem value="كهربائي">كهربائي</SelectItem>
            <SelectItem value="سباك">سباك</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="daily-wage" className="block text-sm font-medium text-foreground mb-2">
          الأجر اليومي (ر.ي)
        </Label>
        <Input
          id="daily-wage"
          type="number"
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