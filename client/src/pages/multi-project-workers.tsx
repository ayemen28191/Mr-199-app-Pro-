import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, Building, Eye, FileText, Users, DollarSign, Calculator } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MultiProjectWorker {
  worker: {
    id: string;
    name: string;
    type: string;
    dailyWage: string;
    isActive: boolean;
    createdAt: string;
  };
  projects: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
  }[];
  totalBalance: string;
}

interface WorkerStatement {
  worker: {
    id: string;
    name: string;
    type: string;
    dailyWage: string;
    isActive: boolean;
    createdAt: string;
  };
  projects: {
    project: {
      id: string;
      name: string;
      status: string;
      createdAt: string;
    };
    attendance: any[];
    balance: {
      totalEarned: string;
      totalPaid: string;
      totalTransferred: string;
      currentBalance: string;
    } | null;
    transfers: any[];
  }[];
  totals: {
    totalEarned: string;
    totalPaid: string;
    totalTransferred: string;
    totalBalance: string;
  };
}

export default function MultiProjectWorkers() {
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const queryClient = useQueryClient();

  // Query for multi-project workers
  const { data: multiProjectWorkers, isLoading } = useQuery<MultiProjectWorker[]>({
    queryKey: ["/api/workers/multi-project"],
    queryFn: async () => {
      const response = await fetch("/api/workers/multi-project");
      if (!response.ok) {
        throw new Error("Failed to fetch multi-project workers");
      }
      return response.json();
    },
  });

  // Query for worker statement
  const { data: workerStatement, isLoading: isLoadingStatement } = useQuery<WorkerStatement>({
    queryKey: ["/api/workers/multi-project-statement", selectedWorker, dateFrom, dateTo],
    queryFn: async () => {
      if (!selectedWorker) return null;
      
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const response = await fetch(`/api/workers/${selectedWorker}/multi-project-statement?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch worker statement");
      }
      return response.json();
    },
    enabled: !!selectedWorker,
  });

  // استخدام دالة formatCurrency من utils.ts

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Users className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">العمال متعددي المشاريع</h1>
          <p className="text-muted-foreground">
            عرض وإدارة العمال الذين يعملون في أكثر من مشروع واحد
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العمال</p>
                <p className="text-2xl font-bold">{multiProjectWorkers?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Building className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">متوسط المشاريع للعامل</p>
                <p className="text-2xl font-bold">
                  {multiProjectWorkers && multiProjectWorkers.length > 0
                    ? (multiProjectWorkers.reduce((sum, w) => sum + w.projects.length, 0) / multiProjectWorkers.length).toFixed(1)
                    : "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأرصدة</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    multiProjectWorkers?.reduce((sum, w) => sum + parseFloat(w.totalBalance), 0) || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            قائمة العمال متعددي المشاريع
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!multiProjectWorkers || multiProjectWorkers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد عمال يعملون في أكثر من مشروع واحد
            </div>
          ) : (
            <div className="space-y-4">
              {multiProjectWorkers.map((workerData) => (
                <Card key={workerData.worker.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{workerData.worker.name}</h3>
                          <Badge variant={workerData.worker.type === 'معلم' ? 'default' : 'secondary'}>
                            {workerData.worker.type}
                          </Badge>
                          <Badge variant={workerData.worker.isActive ? 'default' : 'destructive'}>
                            {workerData.worker.isActive ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">الأجر اليومي:</span>
                            <span className="font-medium mr-2">{formatCurrency(workerData.worker.dailyWage)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">عدد المشاريع:</span>
                            <span className="font-medium mr-2">{workerData.projects.length} مشروع</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">إجمالي الرصيد:</span>
                            <span className="font-medium mr-2">{formatCurrency(workerData.totalBalance)}</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground mb-2">المشاريع:</p>
                          <div className="flex flex-wrap gap-2">
                            {workerData.projects.map((project) => (
                              <Badge key={project.id} variant="outline">
                                {project.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedWorker(workerData.worker.id)}
                            >
                              <Eye className="h-4 w-4 ml-2" />
                              عرض الكشف
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" dir="rtl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                كشف حساب العامل: {workerData.worker.name}
                              </DialogTitle>
                            </DialogHeader>

                            {/* Date Filter */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <Label htmlFor="dateFrom">من تاريخ</Label>
                                <Input
                                  id="dateFrom"
                                  type="date"
                                  value={dateFrom}
                                  onChange={(e) => setDateFrom(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="dateTo">إلى تاريخ</Label>
                                <Input
                                  id="dateTo"
                                  type="date"
                                  value={dateTo}
                                  onChange={(e) => setDateTo(e.target.value)}
                                />
                              </div>
                            </div>

                            {isLoadingStatement ? (
                              <div className="text-center py-8">جاري التحميل...</div>
                            ) : workerStatement ? (
                              <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <p className="text-sm text-muted-foreground">إجمالي المكتسب</p>
                                      <p className="text-lg font-bold text-green-600">
                                        {formatCurrency(workerStatement.totals.totalEarned)}
                                      </p>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <p className="text-sm text-muted-foreground">إجمالي المدفوع</p>
                                      <p className="text-lg font-bold text-blue-600">
                                        {formatCurrency(workerStatement.totals.totalPaid)}
                                      </p>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <p className="text-sm text-muted-foreground">إجمالي التحويلات</p>
                                      <p className="text-lg font-bold text-orange-600">
                                        {formatCurrency(workerStatement.totals.totalTransferred)}
                                      </p>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                                      <p className="text-lg font-bold text-purple-600">
                                        {formatCurrency(workerStatement.totals.totalBalance)}
                                      </p>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Projects Details */}
                                <Tabs defaultValue="0" className="w-full">
                                  <TabsList className="grid w-full grid-cols-3">
                                    {workerStatement.projects.slice(0, 3).map((projectData, index) => (
                                      <TabsTrigger key={index} value={index.toString()}>
                                        {projectData.project.name}
                                      </TabsTrigger>
                                    ))}
                                  </TabsList>
                                  
                                  {workerStatement.projects.map((projectData, index) => (
                                    <TabsContent key={index} value={index.toString()}>
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-lg">
                                            مشروع: {projectData.project.name}
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          {/* Project Balance */}
                                          {projectData.balance && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                              <div className="text-center">
                                                <p className="text-sm text-muted-foreground">المكتسب</p>
                                                <p className="font-bold text-green-600">
                                                  {formatCurrency(projectData.balance.totalEarned)}
                                                </p>
                                              </div>
                                              <div className="text-center">
                                                <p className="text-sm text-muted-foreground">المدفوع</p>
                                                <p className="font-bold text-blue-600">
                                                  {formatCurrency(projectData.balance.totalPaid)}
                                                </p>
                                              </div>
                                              <div className="text-center">
                                                <p className="text-sm text-muted-foreground">المحول</p>
                                                <p className="font-bold text-orange-600">
                                                  {formatCurrency(projectData.balance.totalTransferred)}
                                                </p>
                                              </div>
                                              <div className="text-center">
                                                <p className="text-sm text-muted-foreground">الرصيد</p>
                                                <p className="font-bold text-purple-600">
                                                  {formatCurrency(projectData.balance.currentBalance)}
                                                </p>
                                              </div>
                                            </div>
                                          )}

                                          <Separator className="my-4" />

                                          {/* Attendance Records */}
                                          <div>
                                            <h4 className="font-semibold mb-3">سجلات الحضور</h4>
                                            {projectData.attendance.length === 0 ? (
                                              <p className="text-muted-foreground text-center py-4">
                                                لا توجد سجلات حضور للفترة المحددة
                                              </p>
                                            ) : (
                                              <Table>
                                                <TableHeader>
                                                  <TableRow>
                                                    <TableHead>التاريخ</TableHead>
                                                    <TableHead>وصف العمل</TableHead>
                                                    <TableHead>الأجر اليومي</TableHead>
                                                    <TableHead>نوع الدفع</TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                  {projectData.attendance.map((record, idx) => (
                                                    <TableRow key={idx}>
                                                      <TableCell>
                                                        {formatDate(record.date)}
                                                      </TableCell>
                                                      <TableCell>{record.workDescription}</TableCell>
                                                      <TableCell>{formatCurrency(record.dailyWage || 0)}</TableCell>
                                                      <TableCell>
                                                        <Badge variant={record.paymentType === 'نقد' ? 'default' : 'secondary'}>
                                                          {record.paymentType}
                                                        </Badge>
                                                      </TableCell>
                                                    </TableRow>
                                                  ))}
                                                </TableBody>
                                              </Table>
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TabsContent>
                                  ))}
                                </Tabs>
                              </div>
                            ) : null}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}