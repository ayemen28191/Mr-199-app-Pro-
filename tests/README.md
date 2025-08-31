# 🧪 مجلد الاختبارات - tests/

## 🎯 الغرض
يحتوي على جميع اختبارات الوحدة والتكامل والطباعة للتطبيق.

## 📁 الهيكل المقترح
```
📁 tests/
├── 📁 unit/                 # اختبارات الوحدة
├── 📁 integration/          # اختبارات التكامل
├── 📁 print/               # اختبارات الطباعة
├── 📁 reports/             # اختبارات التقارير
├── 📁 fixtures/            # بيانات اختبار ثابتة
└── 📄 README.md            # هذا الملف
```

## 🔧 أنواع الاختبارات المطلوبة

### 🧩 اختبارات الوحدة (Unit Tests)
- اختبار المكونات الفردية
- التحقق من الوظائف المساعدة
- اختبار تنسيق البيانات
- التحقق من الحسابات المالية

### 🔗 اختبارات التكامل (Integration Tests)
- اختبار API endpoints
- التحقق من قاعدة البيانات
- اختبار تدفق البيانات
- التحقق من المصادقة

### 🖨️ اختبارات الطباعة (Print Tests)
- اختبار التصدير إلى Excel
- التحقق من تنسيق PDF
- اختبار أنماط الطباعة
- التحقق من RTL في الطباعة

### 📊 اختبارات التقارير (Report Tests)
- اختبار دقة البيانات
- التحقق من الحسابات
- اختبار التصدير المتعدد
- التحقق من الأنماط الموحدة

## 📝 خطة الاختبارات

### المرحلة الأولى - الأساسيات
1. **اختبار مكونات UI**
   - UnifiedReportTemplate
   - EnhancedWorkerAccountStatement
   - ExpenseSummary

2. **اختبار أدوات التصدير**
   - excel-export-utils
   - UnifiedExcelExporter
   - UnifiedPrintManager

### المرحلة الثانية - التكامل
1. **اختبار APIs**
   - مسارات التقارير
   - عمليات CRUD
   - معالجة الأخطاء

2. **اختبار قاعدة البيانات**
   - العلاقات بين الجداول
   - صحة البيانات
   - الفهارس والأداء

### المرحلة الثالثة - التقارير
1. **اختبار دقة البيانات**
   - حسابات المصروفات
   - أرصدة العمال
   - تقارير المواد

2. **اختبار التصدير**
   - جودة Excel
   - تنسيق PDF
   - طباعة A4

## 🛠️ أدوات الاختبار المقترحة

### للواجهة الأمامية
- **Jest**: إطار اختبار JavaScript
- **React Testing Library**: اختبار مكونات React
- **Puppeteer**: اختبار المتصفح الآلي

### للخادم
- **Jest**: اختبارات الوحدة
- **Supertest**: اختبار APIs
- **pg-mem**: قاعدة بيانات في الذاكرة للاختبار

### للطباعة
- **Puppeteer**: اختبار طباعة PDF
- **ExcelJS**: التحقق من ملفات Excel
- **Image comparison**: مقارنة الصور

## 📋 قائمة فحص الجودة

### ✅ معايير القبول العامة
- [ ] يعمل على جميع المتصفحات الرئيسية
- [ ] استجابة صحيحة لجميع أحجام الشاشات
- [ ] دعم كامل للغة العربية (RTL)
- [ ] ألوان متسقة مع النظام
- [ ] أداء سريع (< 2 ثانية تحميل)

### 🖨️ معايير الطباعة
- [ ] طباعة صحيحة على ورق A4
- [ ] هوامش صحيحة (15mm لجميع الجهات)
- [ ] خطوط واضحة ومقروءة
- [ ] جداول منظمة ومتناسقة
- [ ] عدم تقطيع الصفوف المهمة

### 📊 معايير التقارير
- [ ] دقة الحسابات المالية
- [ ] صحة عرض البيانات
- [ ] تنسيق التواريخ والأرقام
- [ ] معلومات العرض الصحيحة
- [ ] تصدير Excel خالٍ من الأخطاء

## 🚀 خطة التنفيذ

### الأسبوع الأول
- إنشاء البنية الأساسية للاختبارات
- كتابة اختبارات المكونات الأساسية
- إعداد بيانات اختبار ثابتة

### الأسبوع الثاني  
- اختبار أدوات التصدير والطباعة
- اختبار تكامل قاعدة البيانات
- اختبار APIs الرئيسية

### الأسبوع الثالث
- اختبار التقارير المعقدة
- اختبار الأداء والتحميل
- مراجعة شاملة وتحسينات

## 📝 نماذج الاختبارات

### مثال: اختبار مكون
```typescript
// tests/unit/UnifiedReportTemplate.test.tsx
import { render, screen } from '@testing-library/react';
import UnifiedReportTemplate from '@/components/unified-report-template';

describe('UnifiedReportTemplate', () => {
  const mockHeaderInfo = [
    { label: 'التاريخ', value: '2025-08-15' },
    { label: 'المشروع', value: 'مشروع اختبار' }
  ];

  it('يعرض العنوان بشكل صحيح', () => {
    render(
      <UnifiedReportTemplate 
        title="تقرير اختبار" 
        headerInfo={mockHeaderInfo}
      >
        محتوى اختبار
      </UnifiedReportTemplate>
    );
    
    expect(screen.getByText('تقرير اختبار')).toBeInTheDocument();
  });

  it('يطبق أنماط الطباعة', () => {
    const { container } = render(
      <UnifiedReportTemplate title="اختبار">
        محتوى
      </UnifiedReportTemplate>
    );
    
    expect(container.firstChild).toHaveClass('unified-report');
  });
});
```

### مثال: اختبار تصدير Excel
```typescript
// tests/integration/excel-export.test.ts
import { exportToExcel } from '@/reports/export/unified-excel-exporter';
import * as ExcelJS from 'exceljs';

describe('Excel Export', () => {
  const mockData = {
    date: '2025-08-15',
    projectName: 'مشروع اختبار',
    totalIncome: 10000,
    totalExpenses: 8000
  };

  it('ينتج ملف Excel صحيح', async () => {
    const buffer = await exportToExcel.dailyExpenses(mockData);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    expect(workbook.worksheets).toHaveLength(1);
    expect(workbook.worksheets[0].name).toBe('المصروفات اليومية');
  });
});
```

## 📊 تقارير الاختبارات

### تقرير التغطية المستهدف
- **المكونات**: 90% تغطية
- **APIs**: 95% تغطية  
- **أدوات التصدير**: 85% تغطية
- **الطباعة**: 80% تغطية (اختبار يدوي)

### تقارير الأداء
- زمن تحميل الصفحات
- استهلاك الذاكرة
- زمن تصدير التقارير
- زمن الطباعة

## 🔧 إعداد البيئة

### المتطلبات
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev puppeteer supertest pg-mem
npm install --save-dev @types/jest @types/supertest
```

### ملف الإعداد
```javascript
// tests/setup.ts
import '@testing-library/jest-dom';

// إعداد بيئة الاختبار
global.console = {
  ...console,
  // تجاهل رسائل التحذير في الاختبارات
  warn: jest.fn(),
  error: jest.fn(),
};
```

---
**المسؤول**: فريق ضمان الجودة  
**تاريخ الإنشاء**: 15 أغسطس 2025  
**الحالة**: مخطط ومعد للتنفيذ  
**الأولوية**: عالية جداً