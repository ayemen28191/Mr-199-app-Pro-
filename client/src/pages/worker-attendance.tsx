import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import ProjectSelector from "@/components/project-selector";
import EnhancedWorkerCard from "@/components/enhanced-worker-card";
import { getCurrentDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Worker, InsertWorkerAttendance } from "@shared/schema";

interface AttendanceData {
  [workerId: string]: {
    isPresent: boolean;
    startTime?: string;
    endTime?: string;
    workDescription?: string;
    paidAmount?: string;
    paymentType?: string;
  };
}

export default function WorkerAttendance() {
  const [, setLocation] = useLocation();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workers = [], isLoading: workersLoading } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async (attendanceRecords: InsertWorkerAttendance[]) => {
      const promises = attendanceRecords.map(record =>
        apiRequest("POST", "/api/worker-attendance", record)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم حفظ حضور العمال بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "attendance"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الحضور",
        variant: "destructive",
      });
    },
  });

  const handleAttendanceChange = (workerId: string, attendance: AttendanceData[string]) => {
    setAttendanceData(prev => ({
      ...prev,
      [workerId]: attendance,
    }));
  };

  const handleSaveAttendance = () => {
    if (!selectedProjectId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المشروع أولاً",
        variant: "destructive",
      });
      return;
    }

    const attendanceRecords: InsertWorkerAttendance[] = Object.entries(attendanceData)
      .filter(([_, data]) => data.isPresent)
      .map(([workerId, data]) => {
        const worker = workers.find(w => w.id === workerId);
        const dailyWage = parseFloat(worker?.dailyWage || "0");
        const paidAmount = parseFloat(data.paidAmount || "0");
        const remainingAmount = dailyWage - paidAmount;
        
        return {
          projectId: selectedProjectId,
          workerId,
          date: selectedDate,
          startTime: data.startTime || "07:00",
          endTime: data.endTime || "15:00",
          workDescription: data.workDescription || "",
          isPresent: true,
          dailyWage: worker?.dailyWage || "0",
          paidAmount: paidAmount.toString(),
          remainingAmount: remainingAmount.toString(),
          paymentType: data.paymentType || "partial",
        };
      });

    if (attendanceRecords.length === 0) {
      toast({
        title: "تنبيه",
        description: "لم يتم تحديد أي عامل كحاضر",
        variant: "destructive",
      });
      return;
    }

    saveAttendanceMutation.mutate(attendanceRecords);
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
        <h2 className="text-xl font-bold text-foreground">تسجيل حضور العمال</h2>
      </div>

      <ProjectSelector
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />

      {/* Date Selection */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <Label className="block text-sm font-medium text-foreground mb-2">التاريخ</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Worker List */}
      {workersLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">جاري تحميل العمال...</p>
        </div>
      ) : workers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">لا توجد عمال مسجلين</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workers.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              date={selectedDate}
              onAttendanceChange={handleAttendanceChange}
            />
          ))}
        </div>
      )}

      {/* Save Button */}
      {workers.length > 0 && (
        <div className="mt-6">
          <Button
            onClick={handleSaveAttendance}
            disabled={saveAttendanceMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="ml-2 h-4 w-4" />
            {saveAttendanceMutation.isPending ? "جاري الحفظ..." : "حفظ الحضور"}
          </Button>
        </div>
      )}
    </div>
  );
}
