import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Receipt, UserCheck, Package, PieChart, Eye, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProjectSelector from "@/components/project-selector";
import { getCurrentDate, formatCurrency, formatDate } from "@/lib/utils";

export default function Reports() {
  const [, setLocation] = useLocation();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  
  // Report form states
  const [dailyReportDate, setDailyReportDate] = useState(getCurrentDate());
  const [workerAccountDate1, setWorkerAccountDate1] = useState("");
  const [workerAccountDate2, setWorkerAccountDate2] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [materialReportDate1, setMaterialReportDate1] = useState("");
  const [materialReportDate2, setMaterialReportDate2] = useState("");
  const [projectSummaryDate1, setProjectSummaryDate1] = useState("");
  const [projectSummaryDate2, setProjectSummaryDate2] = useState("");

  const reportTypes = [
    {
      icon: Receipt,
      title: "كشف المصروفات اليومية",
      description: "عرض مصروفات يوم محدد",
      color: "bg-primary",
      hoverColor: "hover:bg-primary/90",
      textColor: "text-primary-foreground",
      form: (
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            value={dailyReportDate}
            onChange={(e) => setDailyReportDate(e.target.value)}
            className="text-sm"
          />
          <Select value={selectedProjectId}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="المشروع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="project1">مشروع إبار زيد</SelectItem>
              <SelectItem value="project2">مشروع مصنع الحيشي</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      icon: UserCheck,
      title: "كشف حساب عامل",
      description: "حساب عامل لفترة محددة",
      color: "bg-secondary",
      hoverColor: "hover:bg-secondary/90",
      textColor: "text-secondary-foreground",
      form: (
        <div className="space-y-2">
          <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="اختر العامل..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="worker1">موسى عبدالحكيم</SelectItem>
              <SelectItem value="worker2">سلطان</SelectItem>
              <SelectItem value="worker3">بشير</SelectItem>
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              value={workerAccountDate1}
              onChange={(e) => setWorkerAccountDate1(e.target.value)}
              placeholder="من تاريخ"
              className="text-sm"
            />
            <Input
              type="date"
              value={workerAccountDate2}
              onChange={(e) => setWorkerAccountDate2(e.target.value)}
              placeholder="إلى تاريخ"
              className="text-sm"
            />
          </div>
        </div>
      ),
    },
    {
      icon: Package,
      title: "كشف المواد المشتراة",
      description: "تقرير المواد والتوريدات",
      color: "bg-success",
      hoverColor: "hover:bg-success/90",
      textColor: "text-success-foreground",
      form: (
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            value={materialReportDate1}
            onChange={(e) => setMaterialReportDate1(e.target.value)}
            placeholder="من تاريخ"
            className="text-sm"
          />
          <Input
            type="date"
            value={materialReportDate2}
            onChange={(e) => setMaterialReportDate2(e.target.value)}
            placeholder="إلى تاريخ"
            className="text-sm"
          />
        </div>
      ),
    },
    {
      icon: PieChart,
      title: "ملخص المشروع",
      description: "تقرير شامل للمشروع",
      color: "bg-purple-600",
      hoverColor: "hover:bg-purple-700",
      textColor: "text-white",
      form: (
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            value={projectSummaryDate1}
            onChange={(e) => setProjectSummaryDate1(e.target.value)}
            placeholder="من تاريخ"
            className="text-sm"
          />
          <Input
            type="date"
            value={projectSummaryDate2}
            onChange={(e) => setProjectSummaryDate2(e.target.value)}
            placeholder="إلى تاريخ"
            className="text-sm"
          />
        </div>
      ),
    },
  ];

  const handleGenerateReport = (reportType: string) => {
    console.log(`Generating ${reportType} report`);
    // TODO: Implement report generation
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
        <h2 className="text-xl font-bold text-foreground">التقارير</h2>
      </div>

      <ProjectSelector
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />

      {/* Report Types */}
      <div className="space-y-3">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-reverse space-x-3">
                    <Icon className={`h-6 w-6 ${report.color.replace('bg-', 'text-')}`} />
                    <div>
                      <h4 className="font-medium text-foreground">{report.title}</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleGenerateReport(report.title)}
                    className={`${report.color} ${report.hoverColor} ${report.textColor} px-4 py-2 text-sm`}
                  >
                    إنشاء
                  </Button>
                </div>
                {report.form}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Preview Sample */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground mb-3 flex items-center">
            <Eye className="text-primary ml-2 h-5 w-5" />
            معاينة كشف المصروفات - {formatDate(new Date())}
          </h4>
          <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
            <div className="flex justify-between">
              <span>المشروع:</span>
              <span className="font-medium">مشروع إبار زيد</span>
            </div>
            <div className="flex justify-between">
              <span>مرحل من التاريخ السابق:</span>
              <span className="font-medium arabic-numbers">{formatCurrency(4700)}</span>
            </div>
            <div className="flex justify-between">
              <span>توريد اليوم:</span>
              <span className="font-medium arabic-numbers">{formatCurrency(41700)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between">
              <span>إجمالي الدخل:</span>
              <span className="font-bold text-primary arabic-numbers">{formatCurrency(46400)}</span>
            </div>
            <div className="flex justify-between">
              <span>إجمالي المنصرف:</span>
              <span className="font-bold text-destructive arabic-numbers">{formatCurrency(31000)}</span>
            </div>
            <div className="flex justify-between">
              <span>المبلغ المتبقي:</span>
              <span className="font-bold text-success arabic-numbers">{formatCurrency(15400)}</span>
            </div>
          </div>
          <div className="mt-3 flex space-x-reverse space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Download className="ml-1 h-4 w-4" />
              تحميل PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <Share2 className="ml-1 h-4 w-4" />
              مشاركة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
