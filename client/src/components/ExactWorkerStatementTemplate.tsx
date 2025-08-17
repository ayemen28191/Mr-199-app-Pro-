import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, FileText, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Worker {
  id: string;
  name: string;
  phone: string;
  skillType: string;
  dailyWage: number;
}

interface Project {
  id: string;
  name: string;
}

interface Attendance {
  id: string;
  workerId: string;
  projectId: string;
  date: string;
  workDays: number;
  workHours: number;
  workDescription: string;
  dailyWage: number;
  paidAmount: number;
}

interface Transfer {
  id: string;
  workerId: string;
  amount: number;
  date: string;
  description: string;
  type: 'outgoing';
}

const ExactWorkerStatementTemplate: React.FC = () => {
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // جلب البيانات
  const { data: workers = [] } = useQuery({
    queryKey: ['/api/workers'],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['/api/worker-attendance'],
    enabled: !!selectedWorker,
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ['/api/worker-transfers'],
    enabled: !!selectedWorker,
  });

  // تصفية البيانات
  const filteredData = React.useMemo(() => {
    if (!selectedWorker) return [];

    const attendanceData = Array.isArray(attendance) ? attendance : [];
    const transfersData = Array.isArray(transfers) ? transfers : [];

    let filteredAttendance = attendanceData.filter((record: any) => 
      record.workerId === selectedWorker &&
      (!selectedProject || selectedProject === 'all' || record.projectId === selectedProject) &&
      (!fromDate || record.date >= fromDate) &&
      (!toDate || record.date <= toDate)
    );

    let filteredTransfers = transfersData.filter((transfer: any) => 
      transfer.workerId === selectedWorker &&
      (!fromDate || transfer.date >= fromDate) &&
      (!toDate || transfer.date <= toDate)
    );

    // دمج الحضور والحوالات وترتيبهما حسب التاريخ
    const combinedData = [
      ...filteredAttendance.map((record: any) => ({
        ...record,
        type: 'attendance',
        sortDate: record.date
      })),
      ...filteredTransfers.map((transfer: any) => ({
        ...transfer,
        type: 'transfer',
        sortDate: transfer.date,
        workDays: 0,
        workHours: 0,
        dailyWage: 0,
        workDescription: transfer.description || 'حوالة مالية'
      }))
    ].sort((a, b) => new Date(a.sortDate).getTime() - new Date(b.sortDate).getTime());

    return combinedData;
  }, [attendance, transfers, selectedWorker, selectedProject, fromDate, toDate]);

  const workersData = Array.isArray(workers) ? workers : [];
  const projectsData = Array.isArray(projects) ? projects : [];
  
  const selectedWorkerData = workersData.find((w: any) => w.id === selectedWorker);
  const selectedProjectData = projectsData.find((p: any) => p.id === selectedProject);

  // حساب الإحصائيات
  const stats = React.useMemo(() => {
    const totalWorkDays = filteredData
      .filter(record => record.type === 'attendance')
      .reduce((sum, record) => sum + (Number(record.workDays) || 0), 0);
    
    const totalWorkHours = filteredData
      .filter(record => record.type === 'attendance')
      .reduce((sum, record) => sum + (Number(record.workHours) || 0), 0);
    
    const totalEarned = filteredData
      .filter(record => record.type === 'attendance')
      .reduce((sum, record) => {
        const dailyWage = Number(record.dailyWage) || Number(selectedWorkerData?.dailyWage) || 0;
        const workDays = Number(record.workDays) || 0;
        return sum + (dailyWage * workDays);
      }, 0);
    
    const totalAttendancePaid = filteredData
      .filter(record => record.type === 'attendance')
      .reduce((sum, record) => sum + (Number(record.paidAmount) || 0), 0);
    
    const totalTransferPaid = filteredData
      .filter(record => record.type === 'transfer')
      .reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
    
    const totalPaid = totalAttendancePaid + totalTransferPaid;
    const totalRemaining = totalEarned - totalPaid;

    return {
      totalWorkDays,
      totalWorkHours,
      totalEarned,
      totalPaid,
      totalRemaining,
      totalAttendancePaid,
      totalTransferPaid
    };
  }, [filteredData, selectedWorkerData]);

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar });
    } catch {
      return dateString;
    }
  };

  // تنسيق اليوم
  const formatDay = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE', { locale: ar });
    } catch {
      return '';
    }
  };

  // تنسيق المبلغ
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-SA')} ريال`;
  };

  // تصدير Excel
  const exportToExcel = async () => {
    if (!selectedWorkerData || filteredData.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('كشف حساب تفصيلي');

    // إعداد اتجاه الكتابة
    worksheet.views = [{ rightToLeft: true }];

    // العنوان الرئيسي
    worksheet.mergeCells('A1:K1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'شركة الفتحي للمقاولات والاستشارات الهندسية';
    titleCell.font = { name: 'Arial Unicode MS', size: 16, bold: true, color: { argb: 'FF1e40af' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // العنوان الفرعي
    worksheet.mergeCells('A2:K2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = 'كشف حساب تفصيلي للعمل';
    subtitleCell.font = { name: 'Arial Unicode MS', size: 14, bold: true };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // فترة التقرير
    worksheet.mergeCells('A3:K3');
    const periodCell = worksheet.getCell('A3');
    const fromDateFormatted = fromDate ? formatDate(fromDate) : 'البداية';
    const toDateFormatted = toDate ? formatDate(toDate) : format(new Date(), 'dd/MM/yyyy', { locale: ar });
    periodCell.value = `الفترة: من ${fromDateFormatted} إلى ${toDateFormatted}`;
    periodCell.font = { name: 'Arial Unicode MS', size: 10 };
    periodCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // معلومات العامل
    worksheet.addRow([]);
    const workerInfoRow = worksheet.addRow([
      `عدد السجلات: [${filteredData.length}]`,
      '',
      `عدد المشرف: 1`,
      '',
      '',
      '',
      `إجمالي أيام العمل: ${stats.totalWorkDays}`,
      '',
      `شهرية: ساعة طنطم [${stats.totalWorkHours}]`,
      '',
      `اسم المعلم: ${selectedWorkerData.name} [${stats.totalWorkHours}]`
    ]);
    
    workerInfoRow.eachCell((cell) => {
      cell.font = { name: 'Arial Unicode MS', size: 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFe5e7eb' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // عنوان الجدول
    worksheet.addRow([]);
    worksheet.mergeCells('A7:K7');
    const tableHeaderCell = worksheet.getCell('A7');
    tableHeaderCell.value = 'كشف حساب تفصيلي للعمل';
    tableHeaderCell.font = { name: 'Arial Unicode MS', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    tableHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e40af' } };
    tableHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
    tableHeaderCell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };

    // رؤوس الأعمدة
    const headers = [
      'ملاحظات',
      'المتبقي', 
      'المبلغ المدفوع',
      'المبلغ المستحق',
      'إجمالي الساعات',
      'أيام العمل',
      'الأجر اليومي',
      'نوع المشروع',
      'اليوم',
      'التاريخ',
      'م'
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial Unicode MS', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e40af' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // البيانات
    filteredData.forEach((record: any, index: number) => {
      let earned = 0;
      let paid = 0;
      let remaining = 0;
      let notes = '';

      if (record.type === 'attendance') {
        const dailyWage = Number(record.dailyWage) || Number(selectedWorkerData?.dailyWage) || 0;
        const workDays = Number(record.workDays) || 0;
        earned = dailyWage * workDays;
        paid = Number(record.paidAmount) || 0;
        remaining = earned - paid;
      } else if (record.type === 'transfer') {
        earned = 0;
        paid = Number(record.amount) || 0;
        remaining = -paid; // الحوالات سالبة في المتبقي
        notes = 'حوالة مالية';
      }

      const projectName = record.type === 'attendance' ? 
        (projectsData.find((p: any) => p.id === record.projectId)?.name || 'غير محدد') : 
        'حوالة مالية';

      const dataRow = worksheet.addRow([
        notes,
        remaining > 0 ? `${remaining.toLocaleString('ar-SA')} ريال` : remaining < 0 ? `-${Math.abs(remaining).toLocaleString('ar-SA')} ريال` : '0 ريال',
        `${paid.toLocaleString('ar-SA')} ريال`,
        record.type === 'attendance' ? `${earned.toLocaleString('ar-SA')} ريال` : '-',
        record.type === 'attendance' ? `${Number(record.workHours) || 0}` : '-',
        record.type === 'attendance' ? `${Number(record.workDays) || 0}` : '-',
        record.type === 'attendance' ? `${(Number(record.dailyWage) || Number(selectedWorkerData?.dailyWage) || 0).toLocaleString('ar-SA')} ريال` : '-',
        projectName,
        formatDay(record.sortDate),
        formatDate(record.sortDate),
        index + 1
      ]);

      dataRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial Unicode MS', size: 9 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };

        // ألوان مختلفة للقيم المالية
        if (colNumber === 2) { // المتبقي
          cell.font = { ...cell.font, color: { argb: remaining > 0 ? 'FFdc2626' : remaining < 0 ? 'FF16a34a' : 'FF000000' } };
        } else if (colNumber === 3) { // المدفوع
          cell.font = { ...cell.font, color: { argb: 'FFdc2626' } };
        } else if (colNumber === 4) { // المستحق
          cell.font = { ...cell.font, color: { argb: 'FF2563eb' } };
        }

        // لون الخلفية للصفوف
        if (index % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf8fafc' } };
        }
      });
    });

    // صف الإجماليات
    const totalRow = worksheet.addRow([
      '',
      `${stats.totalRemaining.toLocaleString('ar-SA')} ريال`,
      `${stats.totalPaid.toLocaleString('ar-SA')} ريال`,
      `${stats.totalEarned.toLocaleString('ar-SA')} ريال`,
      `${stats.totalWorkHours}`,
      `${stats.totalWorkDays}`,
      '',
      '',
      '',
      '',
      'الإجماليات'
    ]);

    totalRow.eachCell((cell) => {
      cell.font = { name: 'Arial Unicode MS', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16a34a' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // الملخص النهائي
    worksheet.addRow([]);
    worksheet.addRow([]);
    
    worksheet.mergeCells('D' + (worksheet.rowCount + 1) + ':H' + (worksheet.rowCount + 1));
    const summaryHeaderCell = worksheet.getCell('D' + (worksheet.rowCount));
    summaryHeaderCell.value = 'الملخص النهائي';
    summaryHeaderCell.font = { name: 'Arial Unicode MS', size: 12, bold: true, color: { argb: 'FF1e40af' } };
    summaryHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.addRow([]);
    
    const summaryData = [
      [`إجمالي المبلغ المستحق:`, `${stats.totalEarned.toLocaleString('ar-SA')} ريال`],
      [`إجمالي المبلغ المدفوع:`, `${stats.totalPaid.toLocaleString('ar-SA')} ريال`],
      [`إجمالي المبلغ المحول:`, `${stats.totalTransferPaid.toLocaleString('ar-SA')} ريال`],
      [`إجمالي المبلغ المتبقي:`, `${stats.totalRemaining.toLocaleString('ar-SA')} ريال`]
    ];

    summaryData.forEach(([label, value]) => {
      const summaryRow = worksheet.addRow(['', '', '', label, '', '', value, '', '', '', '']);
      summaryRow.eachCell((cell, colNumber) => {
        if (colNumber === 4 || colNumber === 7) {
          cell.font = { name: 'Arial Unicode MS', size: 10, bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFe5e7eb' } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        }
      });
    });

    // إعداد عرض الأعمدة
    worksheet.columns = [
      { width: 15 }, // ملاحظات
      { width: 12 }, // المتبقي
      { width: 15 }, // المدفوع
      { width: 15 }, // المستحق
      { width: 12 }, // الساعات
      { width: 10 }, // أيام العمل
      { width: 12 }, // الأجر
      { width: 20 }, // المشروع
      { width: 10 }, // اليوم
      { width: 12 }, // التاريخ
      { width: 6 }   // م
    ];

    // حفظ الملف
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `كشف_حساب_${selectedWorkerData.name}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    saveAs(blob, fileName);
  };

  // طباعة التقرير
  const printReport = () => {
    window.print();
  };

  if (!selectedWorker || !selectedWorkerData) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">كشف حساب تفصيلي للعمل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">اختر العامل</label>
              <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العامل" />
                </SelectTrigger>
                <SelectContent>
                  {workersData.map((worker: any) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name} - {worker.skillType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">المشروع (اختياري)</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع المشاريع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المشاريع</SelectItem>
                    {projectsData.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">من تاريخ</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">إلى تاريخ</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-full mx-auto bg-white print:shadow-none">
      {/* أزرار التحكم - مخفية عند الطباعة */}
      <div className="mb-4 flex gap-2 print:hidden">
        <Button onClick={exportToExcel} className="flex items-center gap-2">
          <Download size={16} />
          تصدير Excel
        </Button>
        <Button onClick={printReport} variant="outline" className="flex items-center gap-2">
          <Printer size={16} />
          طباعة
        </Button>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="print:text-xs" style={{ direction: 'rtl' }}>
        {/* الشعار والعنوان */}
        <div className="text-center mb-6 border-b-4 border-blue-600 pb-4">
          <h1 className="text-2xl font-bold text-blue-700 mb-2">
            شركة الفتحي للمقاولات والاستشارات الهندسية
          </h1>
          <h2 className="text-xl font-semibold mb-2">كشف حساب تفصيلي للعمل</h2>
          <p className="text-sm">
            الفترة: من {fromDate ? formatDate(fromDate) : 'البداية'} إلى {toDate ? formatDate(toDate) : format(new Date(), 'dd/MM/yyyy', { locale: ar })}
          </p>
        </div>

        {/* معلومات العامل */}
        <div className="grid grid-cols-6 gap-2 mb-4 text-sm bg-gray-100 p-2 border">
          <div>عدد السجلات: [{filteredData.length}]</div>
          <div>عدد المشرف: 1</div>
          <div></div>
          <div>إجمالي أيام العمل: {stats.totalWorkDays}</div>
          <div>شهرية: ساعة طنطم [{stats.totalWorkHours}]</div>
          <div>اسم المعلم: {selectedWorkerData.name} [{stats.totalWorkHours}]</div>
        </div>

        {/* عنوان الجدول */}
        <div className="bg-blue-600 text-white text-center py-2 font-bold text-lg mb-0">
          كشف حساب تفصيلي للعمل
        </div>

        {/* الجدول الرئيسي */}
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: '10px',
          border: '1px solid #000'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '4%' }}>م</th>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>التاريخ</th>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '8%' }}>اليوم</th>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '18%' }}>نوع المشروع</th>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>الأجر اليومي</th>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '8%' }}>أيام العمل</th>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>إجمالي الساعات</th>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '12%' }}>المبلغ المستحق</th>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '12%' }}>المبلغ المدفوع</th>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '8%' }}>المتبقي</th>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? filteredData.map((record: any, index: number) => {
              let earned = 0;
              let paid = 0;
              let remaining = 0;
              let notes = '';

              if (record.type === 'attendance') {
                const dailyWage = Number(record.dailyWage) || Number(selectedWorkerData?.dailyWage) || 0;
                const workDays = Number(record.workDays) || 0;
                earned = dailyWage * workDays;
                paid = Number(record.paidAmount) || 0;
                remaining = earned - paid;
              } else if (record.type === 'transfer') {
                earned = 0;
                paid = Number(record.amount) || 0;
                remaining = -paid; // الحوالات سالبة في المتبقي
                notes = 'حوالة مالية';
              }

              const projectName = record.type === 'attendance' ? 
                (projectsData.find((p: any) => p.id === record.projectId)?.name || 'غير محدد') : 
                'حوالة مالية';

              return (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#e6f3ff' }}>
                  <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{formatDate(record.sortDate)}</td>
                  <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{formatDay(record.sortDate)}</td>
                  <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>{projectName}</td>
                  <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', color: '#2563eb' }}>
                    {record.type === 'attendance' ? formatCurrency(Number(record.dailyWage) || Number(selectedWorkerData?.dailyWage) || 0) : '-'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontWeight: 'bold' }}>
                    {record.type === 'attendance' ? (Number(record.workDays) || 0) : '-'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>
                    {record.type === 'attendance' ? (Number(record.workHours) || 0) : '-'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', color: '#2563eb', fontWeight: 'bold' }}>
                    {record.type === 'attendance' ? formatCurrency(earned) : '-'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>
                    {formatCurrency(paid)}
                  </td>
                  <td style={{ 
                    border: '1px solid #000', 
                    padding: '3px', 
                    textAlign: 'center', 
                    color: remaining > 0 ? '#dc2626' : remaining < 0 ? '#16a34a' : '#000',
                    fontWeight: 'bold'
                  }}>
                    {remaining > 0 ? formatCurrency(remaining) : remaining < 0 ? `-${formatCurrency(Math.abs(remaining))}` : formatCurrency(0)}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px', textAlign: 'center', fontSize: '8px' }}>{notes}</td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={11} style={{ 
                  border: '1px solid #000', 
                  padding: '20px', 
                  textAlign: 'center',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626'
                }}>
                  لا توجد بيانات متاحة للفترة المحددة
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold' }}>
              <td colSpan={5} style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>الإجماليات</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{stats.totalWorkDays}</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{stats.totalWorkHours}</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{formatCurrency(stats.totalEarned)}</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{formatCurrency(stats.totalPaid)}</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{formatCurrency(stats.totalRemaining)}</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}></td>
            </tr>
          </tfoot>
        </table>

        {/* الملخص النهائي */}
        <div className="mt-6 bg-gray-100 border border-gray-300">
          <div className="text-center bg-blue-100 p-2 font-bold text-blue-700 border-b">
            الملخص النهائي
          </div>
          <div className="grid grid-cols-4 gap-0 text-sm">
            <div className="bg-gray-200 p-2 border-r border-gray-300 text-center font-bold">
              إجمالي المبلغ المستحق: <span className="text-blue-600">{formatCurrency(stats.totalEarned)}</span>
            </div>
            <div className="bg-gray-200 p-2 border-r border-gray-300 text-center font-bold">
              إجمالي المبلغ المدفوع: <span className="text-red-600">{formatCurrency(stats.totalPaid)}</span>
            </div>
            <div className="bg-gray-200 p-2 border-r border-gray-300 text-center font-bold">
              إجمالي المبلغ المحول: <span className="text-green-600">{formatCurrency(stats.totalTransferPaid)}</span>
            </div>
            <div className="bg-gray-200 p-2 text-center font-bold">
              إجمالي المبلغ المتبقي: <span className={stats.totalRemaining >= 0 ? 'text-red-600' : 'text-green-600'}>
                {formatCurrency(stats.totalRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* التوقيعات */}
        <div className="mt-8 grid grid-cols-3 gap-8 text-center text-sm">
          <div className="border border-gray-300 h-20 flex flex-col justify-end p-2">
            <div className="border-t border-gray-500 pt-1">توقيع المحاسب</div>
            <div className="text-xs text-gray-500 mt-1">........................</div>
          </div>
          <div className="border border-gray-300 h-20 flex flex-col justify-end p-2">
            <div className="border-t border-gray-500 pt-1">توقيع المهندس المشرف</div>
            <div className="text-xs text-gray-500 mt-1">........................</div>
          </div>
          <div className="border border-gray-300 h-20 flex flex-col justify-end p-2">
            <div className="border-t border-gray-500 pt-1">توقيع العامل</div>
            <div className="text-xs text-gray-500 mt-1">........................</div>
          </div>
        </div>

        {/* تذييل */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>تم إنشاء هذا التقرير آلياً بواسطة نظام إدارة المشاريع</p>
          <p>التاريخ: {format(new Date(), 'dd/MM/yyyy - HH:mm', { locale: ar })}</p>
        </div>
      </div>

      {/* CSS للطباعة */}
      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:text-xs { font-size: 8px !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:hidden { display: none !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      `}</style>
    </div>
  );
};

export default ExactWorkerStatementTemplate;