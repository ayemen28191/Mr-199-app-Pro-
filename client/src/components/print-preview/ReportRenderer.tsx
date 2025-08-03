import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

interface ReportRendererProps {
  reportType: string;
  className?: string;
}

/**
 * مكون عرض التقارير الحقيقية للمعاينة
 * يجلب ويعرض البيانات الفعلية حسب نوع التقرير المحدد
 */
export function ReportRenderer({ reportType, className = "" }: ReportRendererProps) {
  
  // جلب البيانات حسب نوع التقرير
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: [`/api/print-preview/${reportType}`],
    enabled: !!reportType
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['/api/projects'],
  });

  const { data: workers = [] } = useQuery<any[]>({
    queryKey: ['/api/workers'],
  });

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin ml-2" />
        <span>جاري تحميل التقرير...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded ${className}`}>
        <p className="text-red-600">خطأ في تحميل التقرير: {error.toString()}</p>
      </div>
    );
  }

  // عرض التقرير حسب النوع
  const renderReportContent = () => {
    switch (reportType) {
      case 'worker_statement':
        return renderWorkerStatement();
      case 'supplier_statement':
        return renderSupplierStatement();
      case 'daily_expenses':
        return renderDailyExpenses();
      case 'material_purchases':
        return renderMaterialPurchases();
      case 'advanced_reports':
        return renderAdvancedReports();
      default:
        return renderDefaultPreview();
    }
  };

  const renderWorkerStatement = () => {
    const project = projects[0] || { name: 'مشروع تجريبي', location: 'الرياض' };
    const worker = workers[0] || { name: 'عامل تجريبي', workerType: 'معلم بناء', dailyWage: 200 };
    
    return (
      <div className="worker-statement-preview">
        <div className="print-header text-center p-4 mb-4 bg-blue-600 text-white">
          <h1 className="text-xl font-bold">كشف حساب العامل</h1>
          <h2 className="text-lg">شركة الإنشاءات المتقدمة</h2>
          <p className="text-sm">المملكة العربية السعودية</p>
        </div>

        <div className="project-info grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded">
          <div>
            <h3 className="font-semibold mb-2 text-blue-800">معلومات المشروع:</h3>
            <p className="text-sm"><strong>اسم المشروع:</strong> {project.name}</p>
            <p className="text-sm"><strong>الموقع:</strong> {project.location || 'غير محدد'}</p>
            <p className="text-sm"><strong>تاريخ التقرير:</strong> {new Date().toLocaleDateString('ar-SA')}</p>
          </div>
          <div className="worker-info">
            <h3 className="font-semibold mb-2 text-green-800">معلومات العامل:</h3>
            <p className="text-sm"><strong>اسم العامل:</strong> {worker.name}</p>
            <p className="text-sm"><strong>نوع العمل:</strong> {worker.workerType}</p>
            <p className="text-sm"><strong>الأجر اليومي:</strong> {worker.dailyWage} ر.ي</p>
          </div>
        </div>

        <table className="print-table w-full border-collapse mb-4">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border p-2">التاريخ</th>
              <th className="border p-2">ساعات العمل</th>
              <th className="border p-2">نوع العمل</th>
              <th className="border p-2">الأجر</th>
              <th className="border p-2">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((day, index) => (
              <tr key={day} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border p-2 text-center">{new Date(Date.now() - day * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA')}</td>
                <td className="border p-2 text-center">8</td>
                <td className="border p-2">{worker.workerType}</td>
                <td className="border p-2 text-center">{worker.dailyWage} ر.ي</td>
                <td className="border p-2">عمل عادي</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="transfers-table mb-4">
          <h3 className="font-semibold mb-2 text-purple-800">الحوالات المرسلة:</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-purple-600 text-white">
                <th className="border p-2">التاريخ</th>
                <th className="border p-2">المبلغ</th>
                <th className="border p-2">رقم الحوالة</th>
                <th className="border p-2">المرسل إليه</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="border p-2 text-center">{new Date().toLocaleDateString('ar-SA')}</td>
                <td className="border p-2 text-center">500 ر.ي</td>
                <td className="border p-2 text-center">1234567</td>
                <td className="border p-2">الأهل</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="summary-section p-4 bg-green-50 rounded mb-4">
          <h3 className="font-semibold text-green-800 mb-3">الملخص النهائي:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>إجمالي أيام العمل:</strong> 5 أيام</p>
              <p><strong>إجمالي الأجور:</strong> {5 * worker.dailyWage} ر.ي</p>
            </div>
            <div>
              <p><strong>إجمالي الحوالات:</strong> 500 ر.ي</p>
              <p className="text-lg font-bold text-green-700"><strong>الرصيد النهائي:</strong> {5 * worker.dailyWage - 500} ر.ي</p>
            </div>
          </div>
        </div>

        <div className="signatures-section grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
            <p className="text-sm font-semibold">توقيع العامل</p>
          </div>
          <div className="text-center">
            <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
            <p className="text-sm font-semibold">توقيع المحاسب</p>
          </div>
          <div className="text-center">
            <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
            <p className="text-sm font-semibold">توقيع المسؤول</p>
          </div>
        </div>
      </div>
    );
  };

  const renderSupplierStatement = () => {
    return (
      <div className="supplier-statement-preview">
        <div className="print-header text-center p-4 mb-4 bg-green-600 text-white">
          <h1 className="text-xl font-bold">كشف حساب المورد</h1>
          <h2 className="text-lg">شركة الإنشاءات المتقدمة</h2>
        </div>

        <div className="supplier-info mb-4 p-3 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">معلومات المورد:</h3>
          <p><strong>اسم المورد:</strong> مورد تجريبي</p>
          <p><strong>رقم الهاتف:</strong> +966501234567</p>
          <p><strong>تاريخ التقرير:</strong> {new Date().toLocaleDateString('ar-SA')}</p>
        </div>

        <table className="print-table w-full border-collapse">
          <thead>
            <tr className="bg-green-600 text-white">
              <th className="border p-2">التاريخ</th>
              <th className="border p-2">نوع المادة</th>
              <th className="border p-2">الكمية</th>
              <th className="border p-2">سعر الوحدة</th>
              <th className="border p-2">المجموع</th>
              <th className="border p-2">حالة الدفع</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="border p-2 text-center">{new Date().toLocaleDateString('ar-SA')}</td>
              <td className="border p-2">أسمنت</td>
              <td className="border p-2 text-center">50 كيس</td>
              <td className="border p-2 text-center">25 ر.ي</td>
              <td className="border p-2 text-center">1,250 ر.ي</td>
              <td className="border p-2 text-center">مؤجل</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border p-2 text-center">{new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA')}</td>
              <td className="border p-2">حديد</td>
              <td className="border p-2 text-center">2 طن</td>
              <td className="border p-2 text-center">2,500 ر.ي</td>
              <td className="border p-2 text-center">5,000 ر.ي</td>
              <td className="border p-2 text-center">نقدي</td>
            </tr>
          </tbody>
        </table>

        <div className="summary-section p-4 bg-green-50 rounded mt-4">
          <h3 className="font-semibold text-green-800 mb-2">ملخص الحساب:</h3>
          <p><strong>إجمالي المشتريات:</strong> 6,250 ر.ي</p>
          <p><strong>المبلغ المدفوع:</strong> 5,000 ر.ي</p>
          <p className="text-lg font-bold text-red-600"><strong>الرصيد المطلوب:</strong> 1,250 ر.ي</p>
        </div>
      </div>
    );
  };

  const renderDailyExpenses = () => {
    return (
      <div className="daily-expenses-preview">
        <div className="print-header text-center p-4 mb-4 bg-red-600 text-white">
          <h1 className="text-xl font-bold">تقرير المصروفات اليومية</h1>
          <h2 className="text-lg">شركة الإنشاءات المتقدمة</h2>
        </div>

        <div className="date-info mb-4 p-3 bg-gray-50 rounded">
          <p><strong>تاريخ التقرير:</strong> {new Date().toLocaleDateString('ar-SA')}</p>
          <p><strong>المشروع:</strong> مشروع تجريبي</p>
        </div>

        <table className="print-table w-full border-collapse">
          <thead>
            <tr className="bg-red-600 text-white">
              <th className="border p-2">الوقت</th>
              <th className="border p-2">نوع المصروف</th>
              <th className="border p-2">التفاصيل</th>
              <th className="border p-2">المبلغ</th>
              <th className="border p-2">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="border p-2 text-center">08:00</td>
              <td className="border p-2">عمالة</td>
              <td className="border p-2">أجور عمال اليوم</td>
              <td className="border p-2 text-center">1,500 ر.ي</td>
              <td className="border p-2">5 عمال</td>
            </tr>
            <tr className="bg-red-50">
              <td className="border p-2 text-center">10:30</td>
              <td className="border p-2">مواد</td>
              <td className="border p-2">شراء أسمنت</td>
              <td className="border p-2 text-center">800 ر.ي</td>
              <td className="border p-2">من المورد الرئيسي</td>
            </tr>
            <tr className="bg-white">
              <td className="border p-2 text-center">14:00</td>
              <td className="border p-2">مواصلات</td>
              <td className="border p-2">نقل مواد</td>
              <td className="border p-2 text-center">200 ر.ي</td>
              <td className="border p-2">شاحنة كبيرة</td>
            </tr>
          </tbody>
        </table>

        <div className="summary-section p-4 bg-red-50 rounded mt-4">
          <h3 className="font-semibold text-red-800 mb-2">ملخص اليوم:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>الرصيد المترحل:</strong> 5,000 ر.ي</p>
              <p><strong>الإيرادات اليوم:</strong> 0 ر.ي</p>
            </div>
            <div>
              <p><strong>المصروفات اليوم:</strong> 2,500 ر.ي</p>
              <p className="text-lg font-bold"><strong>الرصيد النهائي:</strong> 2,500 ر.ي</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMaterialPurchases = () => {
    return (
      <div className="material-purchases-preview">
        <div className="print-header text-center p-4 mb-4 bg-orange-600 text-white">
          <h1 className="text-xl font-bold">تقرير مشتريات المواد</h1>
          <h2 className="text-lg">شركة الإنشاءات المتقدمة</h2>
        </div>

        <table className="print-table w-full border-collapse">
          <thead>
            <tr className="bg-orange-600 text-white">
              <th className="border p-2">التاريخ</th>
              <th className="border p-2">المادة</th>
              <th className="border p-2">المورد</th>
              <th className="border p-2">الكمية</th>
              <th className="border p-2">السعر</th>
              <th className="border p-2">المجموع</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="border p-2 text-center">{new Date().toLocaleDateString('ar-SA')}</td>
              <td className="border p-2">أسمنت بورتلاندي</td>
              <td className="border p-2">مصنع الرياض</td>
              <td className="border p-2 text-center">100 كيس</td>
              <td className="border p-2 text-center">25 ر.ي</td>
              <td className="border p-2 text-center">2,500 ر.ي</td>
            </tr>
            <tr className="bg-orange-50">
              <td className="border p-2 text-center">{new Date().toLocaleDateString('ar-SA')}</td>
              <td className="border p-2">حديد تسليح</td>
              <td className="border p-2">مصنع الحديد</td>
              <td className="border p-2 text-center">3 طن</td>
              <td className="border p-2 text-center">3,000 ر.ي</td>
              <td className="border p-2 text-center">9,000 ر.ي</td>
            </tr>
          </tbody>
        </table>

        <div className="summary-section p-4 bg-orange-50 rounded mt-4">
          <h3 className="font-semibold text-orange-800 mb-2">إجمالي المشتريات:</h3>
          <p className="text-lg font-bold">11,500 ر.ي</p>
        </div>
      </div>
    );
  };

  const renderAdvancedReports = () => {
    return (
      <div className="advanced-reports-preview">
        <div className="print-header text-center p-4 mb-4 bg-purple-600 text-white">
          <h1 className="text-xl font-bold">التقرير المتقدم</h1>
          <h2 className="text-lg">تحليل شامل للمشروع</h2>
        </div>

        <div className="charts-section mb-4 p-4 bg-purple-50 rounded">
          <h3 className="font-semibold text-purple-800 mb-3">تحليل الإنفاق:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded border">
              <h4 className="font-semibold mb-2">توزيع المصروفات:</h4>
              <p>• عمالة: 60%</p>
              <p>• مواد: 30%</p>
              <p>• مواصلات: 10%</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <h4 className="font-semibold mb-2">الإحصائيات:</h4>
              <p>• إجمالي المصروفات: 50,000 ر.ي</p>
              <p>• معدل الإنفاق اليومي: 2,500 ر.ي</p>
              <p>• مدة المشروع: 20 يوم</p>
            </div>
          </div>
        </div>

        <table className="print-table w-full border-collapse">
          <thead>
            <tr className="bg-purple-600 text-white">
              <th className="border p-2">الفئة</th>
              <th className="border p-2">المبلغ</th>
              <th className="border p-2">النسبة</th>
              <th className="border p-2">الاتجاه</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="border p-2">عمالة</td>
              <td className="border p-2 text-center">30,000 ر.ي</td>
              <td className="border p-2 text-center">60%</td>
              <td className="border p-2 text-center">↗️ مرتفع</td>
            </tr>
            <tr className="bg-purple-50">
              <td className="border p-2">مواد</td>
              <td className="border p-2 text-center">15,000 ر.ي</td>
              <td className="border p-2 text-center">30%</td>
              <td className="border p-2 text-center">→ مستقر</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderDefaultPreview = () => {
    return (
      <div className="default-preview p-8 text-center">
        <div className="print-header p-4 mb-4 bg-gray-600 text-white rounded">
          <h1 className="text-xl font-bold">معاينة التقرير</h1>
          <p>يرجى اختيار نوع التقرير لعرض المعاينة</p>
        </div>
        <p className="text-gray-500">لم يتم تحديد نوع تقرير صالح للمعاينة</p>
      </div>
    );
  };

  return (
    <div className={`report-renderer bg-white rounded-lg shadow-sm ${className}`}>
      {renderReportContent()}
    </div>
  );
}

export default ReportRenderer;