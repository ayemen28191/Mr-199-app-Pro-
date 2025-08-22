import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { History, ArrowRight, Calendar, User, FileText, MapPin } from "lucide-react";
import { Equipment } from "@shared/schema";
import { formatDate } from "@/lib/utils";

interface EquipmentMovementHistoryDialogProps {
  equipment: Equipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: any[];
}

interface MovementData {
  id: string;
  fromProjectId: string | null;
  toProjectId: string | null;
  movementDate: string;
  reason: string | null;
  performedBy: string;
  notes: string | null;
}

export function EquipmentMovementHistoryDialog({ 
  equipment, 
  open, 
  onOpenChange, 
  projects 
}: EquipmentMovementHistoryDialogProps) {
  
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["equipment-movements", equipment?.id],
    queryFn: () => fetch(`/api/equipment/${equipment?.id}/movements`).then(res => res.json()),
    enabled: !!equipment?.id && open,
    staleTime: 30000, // 30 seconds
  });

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return "غير محدد";
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "مشروع غير معروف";
  };

  const formatMovementDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }) + ' - ' + date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[700px] max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5 text-blue-600" />
            سجل حركة المعدة: {equipment?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* معلومات المعدة */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">معلومات المعدة</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">الكود:</span>
                  <span className="mr-2 font-medium">{equipment?.code}</span>
                </div>
                <div>
                  <span className="text-gray-600">النوع:</span>
                  <span className="mr-2 font-medium">{equipment?.type}</span>
                </div>
                <div>
                  <span className="text-gray-600">المشروع الحالي:</span>
                  <span className="mr-2 font-medium">
                    {getProjectName(equipment?.currentProjectId || null)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">الحالة:</span>
                  <Badge variant={equipment?.status === 'active' ? 'default' : 'secondary'}>
                    {equipment?.status === 'active' ? 'نشط' : 
                     equipment?.status === 'maintenance' ? 'في الصيانة' : 
                     equipment?.status === 'damaged' ? 'معطل' : 'غير نشط'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* سجل الحركات */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-gray-600" />
              <h3 className="font-medium text-gray-900">سجل الحركات</h3>
              <Badge variant="outline" className="mr-auto">
                {movements.length} حركة
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : movements.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">لا توجد حركات مسجلة لهذه المعدة</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {movements.map((movement: MovementData, index: number) => (
                  <Card key={movement.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* رأس الحركة */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-sm font-medium text-gray-900">
                              حركة رقم {movements.length - index}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {formatMovementDate(movement.movementDate)}
                          </div>
                        </div>

                        {/* تفاصيل النقل */}
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex flex-col items-center gap-1 flex-1">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-600">من</span>
                            <span className="text-sm font-medium text-center">
                              {getProjectName(movement.fromProjectId)}
                            </span>
                          </div>
                          
                          <div className="flex items-center mx-4">
                            <ArrowRight className="w-5 h-5 text-blue-500" />
                          </div>
                          
                          <div className="flex flex-col items-center gap-1 flex-1">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-600">إلى</span>
                            <span className="text-sm font-medium text-center">
                              {getProjectName(movement.toProjectId)}
                            </span>
                          </div>
                        </div>

                        {/* معلومات إضافية */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">قام بالنقل:</span>
                            <span className="text-sm font-medium">{movement.performedBy}</span>
                          </div>

                          {movement.reason && (
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                              <div>
                                <span className="text-sm text-gray-600">السبب:</span>
                                <p className="text-sm font-medium mt-1">{movement.reason}</p>
                              </div>
                            </div>
                          )}

                          {movement.notes && (
                            <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-sm">
                              <span className="text-yellow-800 font-medium">ملاحظات: </span>
                              <span className="text-yellow-700">{movement.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}