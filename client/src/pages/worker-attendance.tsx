import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";
import EnhancedWorkerCard from "@/components/enhanced-worker-card";
import { getCurrentDate, formatCurrency, autocompleteKeys, saveToAutocomplete, getAutocompleteData, removeFromAutocomplete } from "@/lib/utils";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
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
  const { selectedProjectId, selectProject } = useSelectedProject();
  
  // Get URL parameters for editing
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  const workerId = urlParams.get('worker');
  const dateParam = urlParams.get('date');
  const [selectedDate, setSelectedDate] = useState(dateParam || getCurrentDate());
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get today's attendance records
  const { data: todayAttendance = [] } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "attendance", selectedDate],
    queryFn: () => apiRequest("GET", `/api/projects/${selectedProjectId}/attendance?date=${selectedDate}`),
    enabled: !!selectedProjectId,
  });

  // Fetch specific attendance record for editing
  const { data: attendanceToEdit } = useQuery({
    queryKey: ["/api/worker-attendance", editId],
    queryFn: () => apiRequest("GET", `/api/worker-attendance/${editId}`),
    enabled: !!editId,
  });

  // Effect to populate form when editing
  useEffect(() => {
    if (attendanceToEdit && workerId) {
      const newAttendanceData = { ...attendanceData };
      newAttendanceData[workerId] = {
        isPresent: true,
        startTime: attendanceToEdit.startTime,
        endTime: attendanceToEdit.endTime,
        workDescription: attendanceToEdit.workDescription || "",
        paidAmount: attendanceToEdit.paidAmount?.toString() || "",
        paymentType: attendanceToEdit.paymentType || "partial"
      };
      setAttendanceData(newAttendanceData);
    }
  }, [attendanceToEdit, workerId]);

  // Delete Attendance Mutation
  const deleteAttendanceMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/worker-attendance/${id}`),
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف سجل الحضور بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "attendance"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف سجل الحضور",
        variant: "destructive",
      });
    }
  });

  // Edit Attendance Function
  const handleEditAttendance = (record: any) => {
    const worker = workers.find(w => w.id === record.workerId);
    if (worker) {
      const newAttendanceData = { ...attendanceData };
      newAttendanceData[record.workerId] = {
        isPresent: true,
        startTime: record.startTime,
        endTime: record.endTime,
        workDescription: record.workDescription || "",
        paidAmount: record.paidAmount,
        paymentType: record.paymentType || "partial"
      };
      setAttendanceData(newAttendanceData);
    }
  };

  const { data: workers = [], isLoading: workersLoading } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async (attendanceRecords: InsertWorkerAttendance[]) => {
      console.log("Saving attendance records:", attendanceRecords);
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
      // مسح البيانات بعد الحفظ
      setAttendanceData({});
    },
    onError: (error: any) => {
      console.error("Error saving attendance:", error);
      toast({
        title: "خطأ",
        description: error?.message || "حدث خطأ أثناء حفظ الحضور",
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
        onProjectChange={selectProject}
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
            <EnhancedWorkerCard
              key={worker.id}
              worker={worker}
              attendance={attendanceData[worker.id] || { isPresent: false }}
              onAttendanceChange={(attendance) => handleAttendanceChange(worker.id, attendance)}
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

      {/* Today's Attendance List */}
      {selectedProjectId && todayAttendance.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">حضور اليوم المسجل ({selectedDate})</h3>
            <div className="space-y-3">
              {todayAttendance.map((record: any) => {
                const worker = workers.find(w => w.id === record.workerId);
                return (
                  <div key={record.id} className="border rounded-lg p-3 bg-card">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-foreground">{worker?.name}</span>
                          <span className="text-xs bg-success text-success-foreground px-2 py-1 rounded">حاضر</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>الوقت: {record.startTime} - {record.endTime}</p>
                          <p>الراتب اليومي: {record.dailyWage} ريال</p>
                          <p>المدفوع: {record.paidAmount} ريال | المتبقي: {record.remainingAmount} ريال</p>
                          {record.workDescription && <p>الوصف: {record.workDescription}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditAttendance(record)}
                        >
                          تعديل
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteAttendanceMutation.mutate(record.id)}
                          disabled={deleteAttendanceMutation.isPending}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
