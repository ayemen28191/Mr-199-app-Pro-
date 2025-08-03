// صفحة التحكم المتقدم في طباعة الكشوف - النسخة المحسنة
// تتضمن تحكم شامل في جميع جوانب التنسيق والطباعة

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  Printer, Settings, Palette, Layout, Type, Grid3x3, Eye, Save, 
  Download, Upload, RotateCcw, Copy, Trash2, Plus, FileText, 
  Monitor, ArrowLeft, ChevronDown, ChevronUp
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useLocation } from "wouter";
import { printWithSettings } from '@/hooks/usePrintSettings';
import type { PrintSettings as DBPrintSettings, InsertPrintSettings } from '@shared/schema';

interface PrintSettings extends Omit<DBPrintSettings, 'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight' | 'tableColumnWidths' | 'createdAt' | 'updatedAt'> {
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  tableColumnWidths?: number[];
}

const defaultSettings: Omit<PrintSettings, 'id'> = {
  reportType: 'worker_statement',
  name: 'إعداد جديد',
  pageSize: 'A4',
  pageOrientation: 'portrait',
  marginTop: 15,
  marginBottom: 15,
  marginLeft: 15,
  marginRight: 15,
  fontFamily: 'Arial',
  fontSize: 12,
  headerFontSize: 16,
  tableFontSize: 10,
  headerBackgroundColor: '#1e40af',
  headerTextColor: '#ffffff',
  tableHeaderColor: '#1e40af',
  tableRowEvenColor: '#ffffff',
  tableRowOddColor: '#f9fafb',
  tableBorderColor: '#000000',
  tableBorderWidth: 1,
  tableCellPadding: 3,
  tableColumnWidths: [8, 12, 10, 30, 12, 15, 15, 12],
  showHeader: true,
  showLogo: true,
  showProjectInfo: true,
  showWorkerInfo: true,
  showAttendanceTable: true,
  showTransfersTable: true,
  showSummary: true,
  showSignatures: true,
  isDefault: false,
  isActive: true,
  userId: null,
};

export default function AdvancedPrintControl() {
  const [, setLocation] = useLocation();
  const [currentSettings, setCurrentSettings] = useState<PrintSettings>(defaultSettings as PrintSettings);
  const [selectedSettingsId, setSelectedSettingsId] = useState<string>('');
  const [reportContext, setReportContext] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string>('');
  const { toast } = useToast();

  // استقبال بيانات التقرير من localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const withData = urlParams.get('withData');
    const reportTypeParam = urlParams.get('reportType');
    
    if (withData === 'true') {
      try {
        const storedContext = localStorage.getItem('printReportContext');
        if (storedContext) {
          const context = JSON.parse(storedContext);
          setReportContext(context);
          
          if (context.type && context.type !== currentSettings.reportType) {
            setCurrentSettings(prev => ({
              ...prev,
              reportType: context.type
            }));
          }
          
          toast({
            title: "تم استقبال التقرير",
            description: `تم تحميل بيانات ${context.title} للمعاينة والتخصيص`,
          });
        }
      } catch (error) {
        console.error('خطأ في استقبال بيانات التقرير:', error);
      }
    } else if (reportTypeParam) {
      setCurrentSettings(prev => ({
        ...prev,
        reportType: reportTypeParam
      }));
    }
  }, []);

  // جلب الإعدادات المحفوظة
  const { data: savedSettingsList = [], refetch: refetchSettings } = useQuery<DBPrintSettings[]>({
    queryKey: ['/api/print-settings', currentSettings.reportType],
    queryFn: ({ queryKey }) => {
      const [, reportType] = queryKey;
      return apiRequest('GET', `/api/print-settings?reportType=${reportType || ''}`);
    },
  });

  // طفرة لحفظ الإعدادات
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<InsertPrintSettings & { id?: string }>) => {
      if (settings.id) {
        return apiRequest('PUT', `/api/print-settings/${settings.id}`, settings);
      } else {
        return apiRequest('POST', '/api/print-settings', settings);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/print-settings'] });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ الإعدادات بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error?.message || "فشل في حفظ الإعدادات",
      });
    }
  });

  // دالة تحديث الإعدادات
  const updateSetting = (key: keyof PrintSettings, value: any) => {
    setCurrentSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // دالة حفظ الإعدادات
  const saveSettings = () => {
    if (!currentSettings.name || currentSettings.name.trim() === '') {
      toast({
        title: "خطأ في البيانات",
        description: "يجب إدخال اسم للإعداد",
      });
      return;
    }

    const settingsToSave: Partial<InsertPrintSettings & { id?: string }> = {
      reportType: currentSettings.reportType,
      name: currentSettings.name.trim(),
      pageSize: currentSettings.pageSize,
      pageOrientation: currentSettings.pageOrientation,
      marginTop: currentSettings.marginTop.toString(),
      marginBottom: currentSettings.marginBottom.toString(),
      marginLeft: currentSettings.marginLeft.toString(),
      marginRight: currentSettings.marginRight.toString(),
      fontFamily: currentSettings.fontFamily,
      fontSize: Number(currentSettings.fontSize),
      headerFontSize: Number(currentSettings.headerFontSize),
      tableFontSize: Number(currentSettings.tableFontSize),
      headerBackgroundColor: currentSettings.headerBackgroundColor,
      headerTextColor: currentSettings.headerTextColor,
      tableHeaderColor: currentSettings.tableHeaderColor,
      tableRowEvenColor: currentSettings.tableRowEvenColor,
      tableRowOddColor: currentSettings.tableRowOddColor,
      tableBorderColor: currentSettings.tableBorderColor,
      tableBorderWidth: Number(currentSettings.tableBorderWidth),
      tableCellPadding: Number(currentSettings.tableCellPadding),
      tableColumnWidths: Array.isArray(currentSettings.tableColumnWidths) 
        ? JSON.stringify(currentSettings.tableColumnWidths)
        : currentSettings.tableColumnWidths || "[8,12,10,30,12,15,15,12]",
      showHeader: Boolean(currentSettings.showHeader),
      showLogo: Boolean(currentSettings.showLogo),
      showProjectInfo: Boolean(currentSettings.showProjectInfo),
      showWorkerInfo: Boolean(currentSettings.showWorkerInfo),
      showAttendanceTable: Boolean(currentSettings.showAttendanceTable),
      showTransfersTable: Boolean(currentSettings.showTransfersTable),
      showSummary: Boolean(currentSettings.showSummary),
      showSignatures: Boolean(currentSettings.showSignatures),
      isDefault: Boolean(currentSettings.isDefault),
      isActive: Boolean(currentSettings.isActive),
      id: selectedSettingsId || undefined
    };
    
    saveSettingsMutation.mutate(settingsToSave);
  };

  // دالة تحميل إعدادات محفوظة
  const loadSettings = (settingsId: string) => {
    const settings = savedSettingsList.find((s) => s.id === settingsId);
    if (settings) {
      const formattedSettings: PrintSettings = {
        ...settings,
        marginTop: parseFloat(settings.marginTop),
        marginBottom: parseFloat(settings.marginBottom),
        marginLeft: parseFloat(settings.marginLeft),
        marginRight: parseFloat(settings.marginRight),
        tableColumnWidths: typeof settings.tableColumnWidths === 'string' 
          ? JSON.parse(settings.tableColumnWidths)
          : (settings.tableColumnWidths as any) || [8, 12, 10, 30, 12, 15, 15, 12]
      };
      
      setCurrentSettings(formattedSettings);
      setSelectedSettingsId(settingsId);
      toast({
        title: "تم التحميل",
        description: `تم تحميل إعدادات: ${settings.name}`,
      });
    }
  };

  // دالة الطباعة
  const handlePrint = () => {
    const printContent = document.getElementById('live-report-preview');
    if (printContent) {
      printContent.classList.add('print-content', 'report-preview');
    }
    printWithSettings(currentSettings.reportType, 500);
  };

  // دالة عرض التقرير الحقيقي مع الإعدادات
  const renderReportPreview = () => {
    if (!reportContext || !reportContext.data) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>لا توجد بيانات للمعاينة</p>
          <p className="text-sm mt-2">قم بإنشاء تقرير من صفحة التقارير أولاً</p>
        </div>
      );
    }

    const { type, data, projectInfo } = reportContext;

    // تطبيق الإعدادات الحالية على التقرير
    const customStyle = {
      '--header-bg-color': currentSettings.headerBackgroundColor,
      '--header-text-color': currentSettings.headerTextColor,
      '--table-header-color': currentSettings.tableHeaderColor,
      '--table-even-row': currentSettings.tableRowEvenColor,
      '--table-odd-row': currentSettings.tableRowOddColor,
      '--table-border-color': currentSettings.tableBorderColor,
      '--table-border-width': `${currentSettings.tableBorderWidth}px`,
      '--table-padding': `${currentSettings.tableCellPadding}px`,
      '--font-size': `${currentSettings.fontSize}px`,
      '--header-font-size': `${currentSettings.headerFontSize}px`,
      '--table-font-size': `${currentSettings.tableFontSize}px`,
    } as React.CSSProperties;

    if (type === 'worker_statement') {
      return (
        <div style={customStyle} className="worker-statement-print-preview">
          {currentSettings.showHeader && (
            <div 
              className="text-center p-4 mb-6 rounded-lg font-bold"
              style={{ 
                backgroundColor: currentSettings.headerBackgroundColor,
                color: currentSettings.headerTextColor,
                fontSize: `${currentSettings.headerFontSize}px`
              }}
            >
              كشف حساب العامل
            </div>
          )}

          {currentSettings.showProjectInfo && projectInfo && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <h3 className="font-bold text-lg mb-2">معلومات المشروع</h3>
              <p><strong>اسم المشروع:</strong> {projectInfo.name}</p>
              <p><strong>الحالة:</strong> {projectInfo.status}</p>
            </div>
          )}

          {currentSettings.showWorkerInfo && data.worker && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <h3 className="font-bold text-lg mb-2">معلومات العامل</h3>
              <p><strong>الاسم:</strong> {data.worker.name}</p>
              <p><strong>النوع:</strong> {data.worker.type}</p>
              <p><strong>الأجر اليومي:</strong> {data.worker.dailyWage} ر.ي</p>
            </div>
          )}

          {currentSettings.showAttendanceTable && data.attendance && data.attendance.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3">جدول الحضور والمدفوعات</h3>
              <table 
                className="w-full border-collapse"
                style={{ 
                  borderColor: currentSettings.tableBorderColor,
                  fontSize: `${currentSettings.tableFontSize}px`
                }}
              >
                <thead>
                  <tr 
                    style={{ 
                      backgroundColor: currentSettings.tableHeaderColor,
                      color: currentSettings.headerTextColor
                    }}
                  >
                    <th style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}` }}>التاريخ</th>
                    <th style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}` }}>الحضور</th>
                    <th style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}` }}>الأجر</th>
                    <th style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}` }}>المدفوع</th>
                    <th style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}` }}>الرصيد</th>
                  </tr>
                </thead>
                <tbody>
                  {data.attendance.map((record: any, index: number) => (
                    <tr 
                      key={index}
                      style={{ 
                        backgroundColor: index % 2 === 0 
                          ? currentSettings.tableRowEvenColor 
                          : currentSettings.tableRowOddColor
                      }}
                    >
                      <td style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`, textAlign: 'center' }}>
                        {new Date(record.date).toLocaleDateString('ar-SA')}
                      </td>
                      <td style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`, textAlign: 'center' }}>
                        {record.attendanceStatus === 'present' ? 'حاضر' : 'غائب'}
                      </td>
                      <td style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`, textAlign: 'center' }}>
                        {record.dailyWage} ر.ي
                      </td>
                      <td style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`, textAlign: 'center' }}>
                        {record.amountPaid || 0} ر.ي
                      </td>
                      <td style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`, textAlign: 'center' }}>
                        {record.balance || 0} ر.ي
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {currentSettings.showTransfersTable && data.transfers && data.transfers.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3">التحويلات المرسلة</h3>
              <table 
                className="w-full border-collapse"
                style={{ 
                  borderColor: currentSettings.tableBorderColor,
                  fontSize: `${currentSettings.tableFontSize}px`
                }}
              >
                <thead>
                  <tr 
                    style={{ 
                      backgroundColor: currentSettings.tableHeaderColor,
                      color: currentSettings.headerTextColor
                    }}
                  >
                    <th style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}` }}>التاريخ</th>
                    <th style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}` }}>المبلغ</th>
                    <th style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}` }}>البيان</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transfers.map((transfer: any, index: number) => (
                    <tr 
                      key={index}
                      style={{ 
                        backgroundColor: index % 2 === 0 
                          ? currentSettings.tableRowEvenColor 
                          : currentSettings.tableRowOddColor
                      }}
                    >
                      <td style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`, textAlign: 'center' }}>
                        {new Date(transfer.date).toLocaleDateString('ar-SA')}
                      </td>
                      <td style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`, textAlign: 'center' }}>
                        {transfer.amount} ر.ي
                      </td>
                      <td style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}` }}>
                        {transfer.description || 'تحويل للعامل'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {currentSettings.showSummary && data.summary && (
            <div className="mb-6 p-4 bg-blue-50 rounded">
              <h3 className="font-bold text-lg mb-3">الملخص المالي</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>إجمالي الأجور:</strong> {data.summary.totalWages || 0} ر.ي</p>
                  <p><strong>إجمالي المدفوع:</strong> {data.summary.totalPaid || 0} ر.ي</p>
                </div>
                <div>
                  <p><strong>الرصيد النهائي:</strong> {data.summary.finalBalance || 0} ر.ي</p>
                  <p><strong>عدد أيام العمل:</strong> {data.summary.workDays || 0} يوم</p>
                </div>
              </div>
            </div>
          )}

          {currentSettings.showSignatures && (
            <div className="mt-8 flex justify-between items-end">
              <div className="text-center">
                <div className="w-32 border-b-2 border-gray-400 mb-2"></div>
                <p className="text-sm">توقيع العامل</p>
              </div>
              <div className="text-center">
                <div className="w-32 border-b-2 border-gray-400 mb-2"></div>
                <p className="text-sm">توقيع المسؤول</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (type === 'daily_expenses') {
      return (
        <div style={customStyle} className="daily-expenses-print-preview">
          {currentSettings.showHeader && (
            <div 
              className="text-center p-4 mb-6 rounded-lg font-bold"
              style={{ 
                backgroundColor: currentSettings.headerBackgroundColor,
                color: currentSettings.headerTextColor,
                fontSize: `${currentSettings.headerFontSize}px`
              }}
            >
              كشف المصروفات اليومية
            </div>
          )}

          {currentSettings.showProjectInfo && projectInfo && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <h3 className="font-bold text-lg mb-2">معلومات المشروع</h3>
              <p><strong>اسم المشروع:</strong> {projectInfo.name}</p>
              <p><strong>التاريخ:</strong> {data.date}</p>
            </div>
          )}

          {data.expenses && data.expenses.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3">تفاصيل المصروفات</h3>
              <table 
                className="w-full border-collapse"
                style={{ 
                  borderColor: currentSettings.tableBorderColor,
                  fontSize: `${currentSettings.tableFontSize}px`
                }}
              >
                <thead>
                  <tr 
                    style={{ 
                      backgroundColor: currentSettings.tableHeaderColor,
                      color: currentSettings.headerTextColor
                    }}
                  >
                    <th style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}` }}>البند</th>
                    <th style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}` }}>المبلغ</th>
                    <th style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}` }}>البيان</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenses.map((expense: any, index: number) => (
                    <tr 
                      key={index}
                      style={{ 
                        backgroundColor: index % 2 === 0 
                          ? currentSettings.tableRowEvenColor 
                          : currentSettings.tableRowOddColor
                      }}
                    >
                      <td style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}` }}>
                        {expense.category || expense.type}
                      </td>
                      <td style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`, textAlign: 'center' }}>
                        {expense.amount} ر.ي
                      </td>
                      <td style={{ padding: `${currentSettings.tableCellPadding}px`, border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}` }}>
                        {expense.description || expense.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {currentSettings.showSummary && data.summary && (
            <div className="mb-6 p-4 bg-blue-50 rounded">
              <h3 className="font-bold text-lg mb-3">الملخص المالي</h3>
              <p><strong>إجمالي المصروفات:</strong> {data.summary.totalExpenses || 0} ر.ي</p>
              <p><strong>الرصيد المنقول:</strong> {data.summary.carriedForward || 0} ر.ي</p>
              <p><strong>الرصيد النهائي:</strong> {data.summary.finalBalance || 0} ر.ي</p>
            </div>
          )}
        </div>
      );
    }

    // التقارير الأخرى
    return (
      <div style={customStyle} className="generic-report-preview">
        {currentSettings.showHeader && (
          <div 
            className="text-center p-4 mb-6 rounded-lg font-bold"
            style={{ 
              backgroundColor: currentSettings.headerBackgroundColor,
              color: currentSettings.headerTextColor,
              fontSize: `${currentSettings.headerFontSize}px`
            }}
          >
            {reportContext.title}
          </div>
        )}
        
        <div className="p-4 bg-gray-50 rounded text-center">
          <p>معاينة التقرير مع الإعدادات المطبقة</p>
          <p className="text-sm text-gray-600 mt-2">نوع التقرير: {type}</p>
        </div>
      </div>
    );
  };

  // أنواع التقارير المتاحة
  const reportTypes = [
    { value: 'worker_statement', label: 'كشف حساب العامل', icon: <FileText className="h-4 w-4" /> },
    { value: 'supplier_statement', label: 'كشف حساب المورد', icon: <FileText className="h-4 w-4" /> },
    { value: 'daily_expenses', label: 'المصروفات اليومية', icon: <FileText className="h-4 w-4" /> },
    { value: 'material_purchases', label: 'مشتريات المواد', icon: <FileText className="h-4 w-4" /> },
    { value: 'advanced_reports', label: 'التقارير المتقدمة', icon: <FileText className="h-4 w-4" /> }
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl" style={{ direction: 'rtl' }}>
      {/* الرأسية */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/reports')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للتقارير
          </Button>
          
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
            <Button onClick={saveSettings} variant="outline" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              حفظ الإعدادات
            </Button>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            نظام التحكم المتقدم في طباعة الكشوف
          </h1>
          <p className="text-gray-600">
            تحكم شامل في جميع جوانب التنسيق والطباعة مع معاينة فورية للتغييرات
          </p>
        </div>

        {reportContext && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mt-4">
            <p className="text-blue-700 font-medium">
              تم استقبال تقرير: {reportContext.title}
            </p>
            <p className="text-blue-600 text-sm mt-1">
              يمكنك الآن تخصيص إعدادات الطباعة ومعاينة التقرير مع بياناته الحقيقية
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* لوحة التحكم */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="page" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="page">الصفحة</TabsTrigger>
              <TabsTrigger value="fonts">الخطوط</TabsTrigger>
              <TabsTrigger value="colors">الألوان</TabsTrigger>
              <TabsTrigger value="table">الجدول</TabsTrigger>
              <TabsTrigger value="columns">الأعمدة</TabsTrigger>
              <TabsTrigger value="elements">العناصر</TabsTrigger>
            </TabsList>

            {/* تبويب إعدادات الصفحة */}
            <TabsContent value="page" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    إعدادات الصفحة والهوامش
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>حجم الصفحة</Label>
                      <Select
                        value={currentSettings.pageSize}
                        onValueChange={(value) => updateSetting('pageSize', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4 (210×297 مم)</SelectItem>
                          <SelectItem value="A3">A3 (297×420 مم)</SelectItem>
                          <SelectItem value="Letter">Letter (216×279 مم)</SelectItem>
                          <SelectItem value="Legal">Legal (216×356 مم)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>اتجاه الصفحة</Label>
                      <Select
                        value={currentSettings.pageOrientation}
                        onValueChange={(value) => updateSetting('pageOrientation', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">عمودي (Portrait)</SelectItem>
                          <SelectItem value="landscape">أفقي (Landscape)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">الهوامش (بالملليمتر)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'marginTop', label: 'الهامش العلوي' },
                        { key: 'marginBottom', label: 'الهامش السفلي' },
                        { key: 'marginLeft', label: 'الهامش الأيسر' },
                        { key: 'marginRight', label: 'الهامش الأيمن' }
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <Label className="flex items-center justify-between">
                            {label}
                            <span className="text-sm font-normal bg-blue-100 px-2 py-1 rounded">
                              {currentSettings[key as keyof PrintSettings]} مم
                            </span>
                          </Label>
                          <div className="flex items-center gap-2 mt-2">
                            <Slider
                              value={[currentSettings[key as keyof PrintSettings] as number]}
                              onValueChange={([value]) => updateSetting(key as keyof PrintSettings, value)}
                              max={50}
                              min={5}
                              step={1}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={currentSettings[key as keyof PrintSettings] as number}
                              onChange={(e) => updateSetting(key as keyof PrintSettings, Number(e.target.value))}
                              className="w-16 text-center"
                              min={5}
                              max={50}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg">
                      <Label>توحيد جميع الهوامش</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const avgMargin = Math.round((currentSettings.marginTop + currentSettings.marginBottom + currentSettings.marginLeft + currentSettings.marginRight) / 4);
                          updateSetting('marginTop', avgMargin);
                          updateSetting('marginBottom', avgMargin);
                          updateSetting('marginLeft', avgMargin);
                          updateSetting('marginRight', avgMargin);
                        }}
                      >
                        توحيد الهوامش
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* تبويب الخطوط */}
            <TabsContent value="fonts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    إعدادات الخطوط والأحجام
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>نوع الخط</Label>
                      <Select
                        value={currentSettings.fontFamily}
                        onValueChange={(value) => updateSetting('fontFamily', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Tahoma">Tahoma</SelectItem>
                          <SelectItem value="Calibri">Calibri</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>معاينة الخط</Label>
                      <div 
                        className="p-3 border rounded-lg bg-gray-50 text-center" 
                        style={{ fontFamily: currentSettings.fontFamily, fontSize: '14px' }}
                      >
                        نموذج النص - Sample Text 123
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { key: 'fontSize', label: 'حجم الخط العام', min: 8, max: 20, color: 'bg-green-100' },
                      { key: 'headerFontSize', label: 'حجم خط العناوين', min: 12, max: 28, color: 'bg-blue-100' },
                      { key: 'tableFontSize', label: 'حجم خط الجدول', min: 6, max: 16, color: 'bg-purple-100' }
                    ].map(({ key, label, min, max, color }) => (
                      <div key={key}>
                        <Label className="flex items-center justify-between">
                          {label}
                          <span className={`text-sm font-normal ${color} px-2 py-1 rounded`}>
                            {currentSettings[key as keyof PrintSettings]}px
                          </span>
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Slider
                            value={[currentSettings[key as keyof PrintSettings] as number]}
                            onValueChange={([value]) => updateSetting(key as keyof PrintSettings, value)}
                            max={max}
                            min={min}
                            step={1}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={currentSettings[key as keyof PrintSettings] as number}
                            onChange={(e) => updateSetting(key as keyof PrintSettings, Number(e.target.value))}
                            className="w-16 text-center"
                            min={min}
                            max={max}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* تبويب الألوان */}
            <TabsContent value="colors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    نظام الألوان والمظهر
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* ألوان الرأسية */}
                  <div>
                    <h4 className="font-medium mb-3">ألوان الرأسية والعناوين</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'headerBackgroundColor', label: 'لون خلفية الرأسية' },
                        { key: 'headerTextColor', label: 'لون نص الرأسية' }
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <Label>{label}</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type="color"
                              value={currentSettings[key as keyof PrintSettings] as string}
                              onChange={(e) => updateSetting(key as keyof PrintSettings, e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={currentSettings[key as keyof PrintSettings] as string}
                              onChange={(e) => updateSetting(key as keyof PrintSettings, e.target.value)}
                              className="flex-1"
                              placeholder="#1e40af"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* ألوان الجدول */}
                  <div>
                    <h4 className="font-medium mb-3">ألوان الجدول</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'tableHeaderColor', label: 'لون رأس الجدول' },
                        { key: 'tableBorderColor', label: 'لون حدود الجدول' },
                        { key: 'tableRowEvenColor', label: 'لون الصفوف الزوجية' },
                        { key: 'tableRowOddColor', label: 'لون الصفوف الفردية' }
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <Label>{label}</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type="color"
                              value={currentSettings[key as keyof PrintSettings] as string}
                              onChange={(e) => updateSetting(key as keyof PrintSettings, e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={currentSettings[key as keyof PrintSettings] as string}
                              onChange={(e) => updateSetting(key as keyof PrintSettings, e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* نماذج ألوان جاهزة */}
                  <div>
                    <h4 className="font-medium mb-3">نماذج ألوان جاهزة</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: 'أزرق كلاسيكي', header: '#1e40af', text: '#ffffff', table: '#1e40af', even: '#ffffff', odd: '#f0f9ff', border: '#1e40af' },
                        { name: 'أخضر طبيعي', header: '#15803d', text: '#ffffff', table: '#15803d', even: '#ffffff', odd: '#f0fdf4', border: '#15803d' },
                        { name: 'رمادي احترافي', header: '#374151', text: '#ffffff', table: '#374151', even: '#ffffff', odd: '#f9fafb', border: '#374151' },
                        { name: 'بني دافئ', header: '#92400e', text: '#ffffff', table: '#92400e', even: '#ffffff', odd: '#fef3c7', border: '#92400e' }
                      ].map((theme, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateSetting('headerBackgroundColor', theme.header);
                            updateSetting('headerTextColor', theme.text);
                            updateSetting('tableHeaderColor', theme.table);
                            updateSetting('tableRowEvenColor', theme.even);
                            updateSetting('tableRowOddColor', theme.odd);
                            updateSetting('tableBorderColor', theme.border);
                          }}
                          className="p-2 h-auto flex flex-col items-center gap-1"
                        >
                          <div className="flex gap-1">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.header }}></div>
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.even }}></div>
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.odd }}></div>
                          </div>
                          <span className="text-xs">{theme.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* تبويب إعدادات الجدول */}
            <TabsContent value="table" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3x3 className="h-5 w-5" />
                    تنسيق الجدول والحدود
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center justify-between">
                        سمك الحدود (px)
                        <span className="text-sm font-normal bg-purple-100 px-2 py-1 rounded">
                          {currentSettings.tableBorderWidth}px
                        </span>
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[currentSettings.tableBorderWidth]}
                          onValueChange={([value]) => updateSetting('tableBorderWidth', value)}
                          max={5}
                          min={0}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={currentSettings.tableBorderWidth}
                          onChange={(e) => updateSetting('tableBorderWidth', Number(e.target.value))}
                          className="w-16 text-center"
                          min={0}
                          max={5}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="flex items-center justify-between">
                        الحشو الداخلي (mm)
                        <span className="text-sm font-normal bg-purple-100 px-2 py-1 rounded">
                          {currentSettings.tableCellPadding}mm
                        </span>
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[currentSettings.tableCellPadding]}
                          onValueChange={([value]) => updateSetting('tableCellPadding', value)}
                          max={10}
                          min={1}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={currentSettings.tableCellPadding}
                          onChange={(e) => updateSetting('tableCellPadding', Number(e.target.value))}
                          className="w-16 text-center"
                          min={1}
                          max={10}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* تبويب الأعمدة */}
            <TabsContent value="columns" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    تخصيص عرض الأعمدة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {currentSettings.tableColumnWidths?.map((width, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Label className="w-20 text-sm font-medium">العمود {index + 1}</Label>
                        <div className="flex items-center gap-2 flex-1">
                          <Slider
                            value={[width]}
                            onValueChange={([value]) => {
                              const newWidths = [...(currentSettings.tableColumnWidths || [])];
                              newWidths[index] = value;
                              updateSetting('tableColumnWidths', newWidths);
                            }}
                            max={50}
                            min={5}
                            step={1}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={width}
                            onChange={(e) => {
                              const newWidths = [...(currentSettings.tableColumnWidths || [])];
                              newWidths[index] = Number(e.target.value);
                              updateSetting('tableColumnWidths', newWidths);
                            }}
                            className="w-16 text-center"
                            min={5}
                            max={50}
                          />
                          <span className="text-sm text-gray-500 w-8">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentWidths = currentSettings.tableColumnWidths || [];
                        updateSetting('tableColumnWidths', [...currentWidths, 10]);
                      }}
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة عمود
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentWidths = currentSettings.tableColumnWidths || [];
                        if (currentWidths.length > 1) {
                          updateSetting('tableColumnWidths', currentWidths.slice(0, -1));
                        }
                      }}
                      disabled={(currentSettings.tableColumnWidths?.length || 0) <= 1}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const numCols = currentSettings.tableColumnWidths?.length || 8;
                        const equalWidth = Math.floor(100 / numCols);
                        const newWidths = Array(numCols).fill(equalWidth);
                        updateSetting('tableColumnWidths', newWidths);
                      }}
                    >
                      توزيع متساوي
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <strong>المجموع الحالي:</strong> {(currentSettings.tableColumnWidths || []).reduce((sum, width) => sum + width, 0)}%
                  </div>

                  <Separator />

                  {/* نماذج تخطيط جاهزة */}
                  <div>
                    <h4 className="font-medium mb-3">نماذج تخطيط جاهزة</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'كشف العامل الشامل', widths: [8, 12, 10, 30, 12, 15, 15, 8] },
                        { name: 'كشف المورد', widths: [10, 20, 15, 25, 15, 15] },
                        { name: 'المصروفات اليومية', widths: [15, 40, 20, 25] },
                        { name: 'توزيع متوازن', widths: [12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5] }
                      ].map((layout, index) => (
                        <Button
                          key={index}
                          variant="outline" 
                          size="sm"
                          onClick={() => updateSetting('tableColumnWidths', layout.widths)}
                          className="justify-start"
                        >
                          {layout.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* تبويب العناصر المرئية */}
            <TabsContent value="elements" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    التحكم في العناصر المرئية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { key: 'showHeader', label: 'رأسية التقرير', description: 'عرض رأسية التقرير مع العنوان الرئيسي' },
                      { key: 'showLogo', label: 'الشعار', description: 'عرض شعار الشركة في التقرير' },
                      { key: 'showProjectInfo', label: 'معلومات المشروع', description: 'عرض تفاصيل المشروع' },
                      { key: 'showWorkerInfo', label: 'معلومات العامل', description: 'عرض بيانات العامل الشخصية' },
                      { key: 'showAttendanceTable', label: 'جدول الحضور', description: 'عرض جدول حضور وغياب العامل' },
                      { key: 'showTransfersTable', label: 'جدول التحويلات', description: 'عرض جدول التحويلات المالية' },
                      { key: 'showSummary', label: 'الملخص المالي', description: 'عرض ملخص الحساب النهائي' },
                      { key: 'showSignatures', label: 'التوقيعات', description: 'عرض منطقة التوقيعات' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <Label className="font-medium">{item.label}</Label>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        </div>
                        <Switch
                          checked={currentSettings[item.key as keyof PrintSettings] as boolean}
                          onCheckedChange={(checked) => updateSetting(item.key as keyof PrintSettings, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* لوحة الإعدادات المحفوظة */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 z-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                الإعدادات المحفوظة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>اسم الإعداد</Label>
                <Input
                  value={currentSettings.name}
                  onChange={(e) => updateSetting('name', e.target.value)}
                  placeholder="أدخل اسم الإعداد"
                />
              </div>

              <div>
                <Label>نوع التقرير</Label>
                <Select
                  value={currentSettings.reportType}
                  onValueChange={(value) => updateSetting('reportType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <Label>الإعدادات المحفوظة</Label>
                <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                  {savedSettingsList.map((settings) => (
                    <div
                      key={settings.id}
                      className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                        selectedSettingsId === settings.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => loadSettings(settings.id)}
                    >
                      <div className="font-medium text-sm">{settings.name}</div>
                      <div className="text-xs text-gray-500">{settings.reportType}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="default-setting"
                  checked={currentSettings.isDefault}
                  onCheckedChange={(checked) => updateSetting('isDefault', checked)}
                />
                <Label htmlFor="default-setting" className="text-sm">
                  جعل هذا الإعداد افتراضي
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* معاينة سريعة */}
          <Card className="mt-4 z-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                معاينة سريعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white space-y-2 text-sm" style={{ fontFamily: currentSettings.fontFamily }}>
                {currentSettings.showHeader && (
                  <div 
                    className="p-2 rounded text-center font-bold"
                    style={{ 
                      backgroundColor: currentSettings.headerBackgroundColor, 
                      color: currentSettings.headerTextColor,
                      fontSize: `${currentSettings.headerFontSize}px`
                    }}
                  >
                    رأسية التقرير
                  </div>
                )}
                {currentSettings.showProjectInfo && (
                  <div className="p-2 bg-gray-50 rounded text-xs">معلومات المشروع</div>
                )}
                {currentSettings.showWorkerInfo && (
                  <div className="p-2 bg-gray-50 rounded text-xs">معلومات العامل</div>
                )}
                {currentSettings.showAttendanceTable && (
                  <div className="border rounded overflow-hidden">
                    <div 
                      className="p-1 text-center font-bold text-xs"
                      style={{ 
                        backgroundColor: currentSettings.tableHeaderColor,
                        color: currentSettings.headerTextColor,
                        fontSize: `${currentSettings.tableFontSize}px`
                      }}
                    >
                      جدول الحضور
                    </div>
                    <div className="flex text-xs">
                      <div 
                        className="flex-1 p-1 border-r"
                        style={{ backgroundColor: currentSettings.tableRowEvenColor }}
                      >
                        صف زوجي
                      </div>
                      <div 
                        className="flex-1 p-1"
                        style={{ backgroundColor: currentSettings.tableRowOddColor }}
                      >
                        صف فردي
                      </div>
                    </div>
                  </div>
                )}
                {currentSettings.showSummary && (
                  <div className="p-2 bg-blue-50 rounded text-center text-xs">الملخص المالي</div>
                )}
                {currentSettings.showSignatures && (
                  <div className="p-2 bg-gray-100 rounded text-center text-xs">التوقيعات</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* المعاينة المباشرة للتقرير الحقيقي - إصدار واحد فقط */}
      {reportContext && (
        <div className="mt-8 w-full">
          <Card className="bg-white shadow-xl border rounded-2xl overflow-hidden relative z-0">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <Eye className="h-7 w-7" />
                  المعاينة المباشرة مع الإعدادات
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handlePrint}
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl backdrop-blur-sm"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    طباعة المعاينة
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 overflow-hidden">
              <div 
                id="live-report-preview"
                className="print-preview-container bg-white border rounded-lg shadow-sm p-6 max-h-[800px] overflow-y-auto"
                style={{
                  fontFamily: currentSettings.fontFamily,
                  fontSize: `${currentSettings.fontSize}px`,
                  position: 'relative',
                  zIndex: 1
                }}
              >
                {renderReportPreview()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}