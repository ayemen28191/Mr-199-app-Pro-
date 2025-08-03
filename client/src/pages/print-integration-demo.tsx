import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, FileText, Settings, Check, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';
import PrintButton from '@/components/PrintButton';
import PrintSettingsButton from '@/components/PrintSettingsButton';
import { applyPrintSettings } from '@/hooks/usePrintSettings';

/**
 * صفحة توضيحية لإظهار كيفية التكامل مع نظام إعدادات الطباعة
 * هذه الصفحة تُظهر للمستخدم كيفية تطبيق النظام على جميع التقارير
 */
export default function PrintIntegrationDemo() {
  const [, setLocation] = useLocation();
  const [selectedReportType, setSelectedReportType] = useState('worker_statement');

  // قائمة التقارير المتاحة في النظام
  const availableReports = [
    {
      type: 'worker_statement',
      name: 'كشف حساب العامل',
      description: 'تقرير مفصل عن حساب العامل مع الحضور والحوالات',
      path: '/worker-accounts',
      status: 'مدمج ✅'
    },
    {
      type: 'supplier_statement', 
      name: 'كشف حساب المورد',
      description: 'تقرير مديونية ومشتريات المورد',
      path: '/supplier-report',
      status: 'جاري التكامل 🔄'
    },
    {
      type: 'daily_expenses',
      name: 'تقرير المصروفات اليومية', 
      description: 'كشف مفصل بمصروفات اليوم مع الأرصدة',
      path: '/daily-expenses-report',
      status: 'جاري التكامل 🔄'
    },
    {
      type: 'material_purchases',
      name: 'تقرير مشتريات المواد',
      description: 'كشف بجميع مشتريات المواد حسب التاريخ',
      path: '/reports',
      status: 'جاري التكامل 🔄'
    },
    {
      type: 'advanced_reports',
      name: 'التقارير المتقدمة',
      description: 'تقارير شاملة مع إحصائيات متطورة',
      path: '/advanced-reports',
      status: 'مدمج ✅'
    }
  ];

  const selectedReport = availableReports.find(r => r.type === selectedReportType);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* العنوان الرئيسي */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <FileText className="w-8 h-8" />
              نظام التكامل مع إعدادات الطباعة
            </CardTitle>
            <p className="text-blue-100 text-lg">
              تطبيق إعدادات الطباعة المخصصة على جميع التقارير في النظام
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* قائمة التقارير المتاحة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                التقارير المتاحة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableReports.map((report) => (
                <div 
                  key={report.type}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedReportType === report.type 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedReportType(report.type)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{report.name}</h3>
                    <Badge variant={report.status.includes('✅') ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(report.path);
                      }}
                    >
                      <ExternalLink className="w-4 h-4 ml-1" />
                      عرض التقرير
                    </Button>
                    {report.status.includes('✅') && (
                      <PrintSettingsButton 
                        reportType={report.type}
                        variant="ghost"
                        className="text-sm"
                      />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* تفاصيل التقرير المحدد */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                معاينة التكامل - {selectedReport?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* نموذج مبسط للتقرير */}
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="print-header text-center p-3 mb-4 bg-blue-600 text-white rounded">
                  <h2 className="text-lg font-bold">{selectedReport?.name}</h2>
                  <p className="text-sm">شركة الإنشاءات المتقدمة</p>
                </div>
                
                <div className="project-info mb-4 p-3 bg-gray-50 rounded">
                  <h3 className="font-semibold mb-2">معلومات المشروع:</h3>
                  <p className="text-sm">اسم المشروع: مشروع تجريبي للعرض</p>
                  <p className="text-sm">التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
                </div>

                <table className="print-table w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="border p-2">الرقم</th>
                      <th className="border p-2">البيان</th>
                      <th className="border p-2">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 text-center">1</td>
                      <td className="border p-2">عنصر تجريبي</td>
                      <td className="border p-2 text-center">1,000 ر.ي</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border p-2 text-center">2</td>
                      <td className="border p-2">عنصر آخر</td>
                      <td className="border p-2 text-center">500 ر.ي</td>
                    </tr>
                  </tbody>
                </table>

                <div className="summary-section mt-4 p-3 bg-green-50 rounded">
                  <h3 className="font-semibold">الملخص النهائي:</h3>
                  <p className="text-lg">المجموع: 1,500 ر.ي</p>
                </div>

                <div className="signatures-section mt-4 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="h-16 border-b-2 border-gray-300 mb-2"></div>
                    <p className="text-sm">توقيع المحاسب</p>
                  </div>
                  <div className="text-center">
                    <div className="h-16 border-b-2 border-gray-300 mb-2"></div>
                    <p className="text-sm">توقيع المسؤول</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* أزرار التحكم */}
              <div className="space-y-3">
                <h4 className="font-semibold">أدوات التحكم المدمجة:</h4>
                
                <div className="flex flex-wrap gap-2">
                  <PrintButton 
                    reportType={selectedReportType}
                    className="flex-1"
                  >
                    طباعة مع الإعدادات
                  </PrintButton>
                  
                  <PrintSettingsButton 
                    reportType={selectedReportType}
                    variant="outline"
                    className="flex-1"
                  />
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <h5 className="font-semibold text-blue-800 mb-2">كيفية التكامل:</h5>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>استيراد PrintButton و PrintSettingsButton</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>تحديد نوع التقرير (reportType)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>إضافة الأزرار إلى واجهة التقرير</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>إعدادات الطباعة تُطبق تلقائياً</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* معلومات إضافية */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 الخطوات التالية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">مكتمل ✅</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• نظام إعدادات الطباعة</li>
                  <li>• مكونات PrintButton و PrintSettingsButton</li>
                  <li>• Hook للتطبيق التلقائي</li>
                  <li>• تكامل مع كشف حساب العامل</li>
                </ul>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">قيد التنفيذ 🔄</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• تكامل باقي التقارير</li>
                  <li>• اختبار جودة الطباعة</li>
                  <li>• تحسين CSS للطباعة</li>
                  <li>• إضافة معاينة مباشرة</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">مقترح 💡</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• حفظ إعدادات مخصصة لكل مستخدم</li>
                  <li>• تصدير واستيراد الإعدادات</li>
                  <li>• قوالب طباعة جاهزة</li>
                  <li>• معاينة PDF قبل الطباعة</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* زر الانتقال لصفحة التحكم */}
        <div className="text-center">
          <Button 
            size="lg"
            onClick={() => setLocation('/print-control')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Settings className="w-5 h-5 ml-2" />
            الانتقال إلى صفحة التحكم الكاملة
            <ArrowRight className="w-5 h-5 mr-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}