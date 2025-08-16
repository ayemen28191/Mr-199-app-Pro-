# Overview

This is a comprehensive Arabic construction project management system built as a full-stack web application. The system manages multiple construction projects, tracking workers, materials, expenses, financial transfers, and generating detailed reports. It features a modern React frontend with TypeScript and a Node.js/Express backend using PostgreSQL with Drizzle ORM.

## Recent Updates (August 16, 2025)

### Final Professional Excel-Style Integration ✅
- **100% Excel Template Matching**: تم توحيد جميع التقارير لتطابق تصميم Excel المرفق بالصور تماماً
- **Unified Report Design**: تصميم موحد لجميع التقارير يتضمن:
  - جداول بحدود واضحة وألوان متطابقة مع Excel
  - رأس أزرق (Blue header) وإجماليات خضراء (Green totals) 
  - صفوف متبادلة رمادي/أبيض لسهولة القراءة
  - 11 أعمدة في تقرير تصفية العمال كما هو مطلوب

### Enhanced Export & Print Functions ✅
- **Excel Export with ExcelJS**: تصدير احترافي لملفات Excel بنفس التنسيق المطلوب
- **Professional Print Layout**: تصميم طباعة محسّن مع:
  - CSS مخصص للطباعة (`excel-print-styles.css`)
  - توقيعات منفصلة في صفحة ثانية
  - تنسيق A4 احترافي مع حواف مناسبة

### Unified Currency & Date Formatting ✅
- **Consistent Currency Display**: تنسيق موحد للعملة بـ "ريال" بدلاً من "YER"
- **Arabic Company Branding**: شعار الشركة "شركة الفتحي للمقاولات والاستشارات الهندسية"
- **Professional Headers**: رؤوس احترافية تطابق المواصفات المطلوبة

### Technical Improvements ✅
- **Border-Collapse Tables**: جداول بحدود منهارة للمظهر الاحترافي
- **Print-First Design**: تصميم يأخذ الطباعة في الاعتبار أولاً
- **Responsive Color Schemes**: ألوان تعمل بشكل مثالي في الشاشة والطباعة
- **Excel-Style Statistics Row**: صف الإحصائيات العلوي يطابق تماماً صور Excel

### Work Days Column & Calculation Fixes ✅ (Latest Update - August 16, 2025)
- **Fixed Work Days Logic**: إصلاح حساب عدد أيام العمل في جميع التقارير
  - استبدال `Number(record.workDays) || 1` بـ المنطق الصحيح لتجنب تحويل 0 إلى 1
  - استخدام: `record.workDays !== undefined && record.workDays !== null ? Number(record.workDays) : (record.isPresent || record.status === 'present' ? 1 : 0)`
- **Enhanced Excel Export**: تحسين تصدير Excel ليشمل عمود "عدد الأيام" بالحسابات الصحيحة
- **Accurate Totals**: إصلاح الإجماليات لتعكس أيام العمل الفعلية وليس القيم الافتراضية
- **Debug Logging**: إضافة console.log لتتبع الحسابات والتأكد من صحتها

### Daily Expenses Bulk Export Feature ✅ (Latest Update - August 16, 2025)
- **New Bulk Export Functionality**: إضافة ميزة تصدير المصروفات اليومية لفترة زمنية
  - مكون جديد: `client/src/components/daily-expenses-bulk-export.tsx`
  - تصدير فترة زمنية كاملة في ملف Excel واحد
  - كل يوم في ورقة منفصلة مع تفاصيل كاملة
  - شريط تقدم وإدارة أخطاء محسنة
- **Reports Page Integration**: دمج الميزة في صفحة التقارير
  - تبويب جديد "تصدير مجمع" في صفحة التقارير
  - واجهة سهلة لاختيار الفترة الزمنية والمشروع
  - تصميم متجاوب ومتوافق مع النظام الموحد

### Enhanced Daily Expenses Export Optimizations ✅ (Latest Update - August 16, 2025)
- **Report Layout Improvements**: تحسينات تصميم التقارير اليومية
  - إزالة صف "أجور مستحقة" من الجدول الرئيسي حسب متطلبات العميل
  - ضبط عرض الأعمدة لتناسب مقاس طباعة A4 بشكل مثالي
  - إضافة التفاف النص في جميع الخلايا مع زيادة ارتفاع الصفوف
- **Smart Notes Processing**: معالجة ذكية للملاحظات
  - إزالة التكرار في ملاحظات أجور العمال
  - استخدام الملاحظات المخزنة في النظام بدلاً من النصوص المتكررة
  - إضافة عدد أيام العمل بلون أزرق مميز لتمييزها عن الملاحظات العادية
- **A4 Print Optimization**: تحسين الطباعة لمقاس A4
  - ضبط أعمدة الجدول: المبلغ (12)، نوع الحساب (18)، نوع (10)، المتبقي (15)، ملاحظات (35)
  - تطبيق التفاف النص وتوسيط المحتوى على جميع الخلايا
  - زيادة ارتفاع الصفوف إلى 22 لراحة أكبر في القراءة
  - تقليل الهوامش لاستغلال أفضل لمساحة الصفحة
- **Enhanced Worker Transfer Display**: تحسين عرض تحويلات العمال
  - اسم الحساب يظهر: "حولة من حساب [المصدر] إلى [اسم العامل]"
  - الملاحظات تشمل: اسم المستلم، رقم الحوالة، وتاريخ التحويل
  - عرض تفاصيل شاملة لجميع بيانات التحويل المالي

### Critical Bug Fixes ✅ (Latest Update - August 16, 2025)
- **Fund Transfer Amount Display Fix**: إصلاح عدم ظهور مبلغ الحوالة
  - إصلاح مشكلة عدم ظهور المبلغ في صف "حولة نوع توريد"
  - تحسين معالجة البيانات المالية مع طباعة debug logs للتشخيص
  - ضمان عرض جميع الحوالات المالية بشكل صحيح
- **Number Formatting Enhancement**: تحسين تنسيق الأرقام لإزالة الأصفار الزائدة
  - إصلاح عرض أيام العمل من 1.50 إلى 1.5
  - إزالة الأصفار الزائدة من جميع الأرقام في التقرير
  - تطبيق التنسيق المحسن على الكميات في جدول المشتريات
  - تحسين دالة formatNumber() لمعالجة الأرقام العشرية بذكاء

### Files Updated ✅
- `client/src/components/enhanced-worker-account-statement-real-data.tsx` - إصلاح حسابات عدد الأيام
- `client/src/components/worker-filter-report.tsx` - إصلاح حسابات التقرير والإجماليات
- `client/src/components/worker-filter-report-real-data.tsx` - إصلاح حسابات البيانات الحقيقية
- `client/src/reports/templates/worker-statement-template.tsx` - إضافة عمود عدد الأيام
- `client/src/styles/excel-print-styles.css` - ملف CSS جديد للطباعة الاحترافية
- `client/src/components/daily-expenses-bulk-export.tsx` - مكون تصدير المصروفات المجمعة الجديد
- `client/src/pages/reports.tsx` - دمج ميزة التصدير المجمع في صفحة التقارير

# User Preferences

Preferred communication style: Simple, everyday language in Arabic. All responses and communication must be in Arabic.
Project management approach: Systematic organization with clear documentation.
Code organization: DRY principle (Don't Repeat Yourself) with unified components.
Architecture philosophy: Beginner-friendly structure with centralized control points.

# System Architecture

## Frontend Architecture

- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Library**: Shadcn/UI components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with RTL (right-to-left) support for Arabic content
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: React Router for client-side navigation
- **Forms**: React Hook Form with Zod validation for type-safe forms

## Backend Architecture

- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based auth with bcrypt password hashing
- **API Design**: RESTful endpoints with comprehensive CRUD operations

## Database Design

The system uses PostgreSQL with a comprehensive schema including:

### Core Entities
- **Projects**: Construction project management with financial tracking
- **Workers**: Employee management with different skill types and daily wages
- **Materials**: Construction materials inventory and purchasing
- **Suppliers**: Vendor management for material purchases

### Financial Tracking
- **Fund Transfers**: Money transfers to projects from external sources
- **Worker Attendance**: Daily work tracking with wage calculations
- **Material Purchases**: Purchase orders and inventory management
- **Daily Expense Summaries**: Automatic financial reconciliation per project per day
- **Worker Transfers**: Money transfers to workers and their families

### Advanced Features
- **Autocomplete System**: Smart suggestions for frequently used data
- **Print Settings**: Customizable report printing configurations
- **Backup System**: Automated data backup and recovery

## Key Architectural Decisions

### Database Schema Strategy
- **Normalized Design**: Separate tables for related entities to ensure data integrity
- **UUID Primary Keys**: Using UUIDs instead of auto-incrementing integers for better distributed system support
- **Audit Trail**: Created/updated timestamps on all major entities
- **Financial Integrity**: Automatic calculation of balances and daily summaries

### Performance Optimizations
- **Indexed Queries**: Strategic database indexes for frequently accessed data
- **Batch Operations**: Bulk insert/update operations for better performance
- **Cached Calculations**: Daily summaries to avoid expensive real-time calculations
- **Optimistic Updates**: Client-side optimistic updates for better UX

### Security Measures
- **Session-based Authentication**: Secure session management with express-session
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **Input Validation**: Comprehensive validation using Zod schemas
- **SQL Injection Prevention**: Parameterized queries through Drizzle ORM

### Reporting System
- **Multi-format Export**: PDF, Excel, and print-optimized HTML reports
- **Template-based**: Unified report templates for consistent formatting
- **Arabic RTL Support**: Proper right-to-left text layout for Arabic content
- **Print Optimization**: A4 page formatting with proper margins and page breaks

### Enhanced Report Components (Latest Update)
- **Worker Statement Template**: `client/src/reports/templates/worker-statement-template.tsx`
  - Added comprehensive remaining balance calculations for worker attendance
  - Improved error handling with null safety checks for all data properties
  - Enhanced table structure with 7 columns: التاريخ، اليوم، الحالة، الأجر المستحق، المدفوع، المتبقي، ملاحظات
  
- **Excel Export System**: `client/src/reports/export/unified-excel-exporter.ts`
  - Updated to include remaining balance column in attendance tracking
  - Enhanced data formatting with proper Arabic currency display
  - Improved table sizing and cell formatting for better readability
  
- **Print Styles**: `client/src/styles/unified-print-styles.css`
  - Comprehensive A4 print formatting with Arabic text optimization
  - Professional table styling with alternating row colors
  - Currency and number formatting for financial data display
  
- **Report Templates**: `client/src/components/unified-report-template.tsx`
  - Reusable components for consistent report formatting
  - Professional header and footer sections
  - Responsive grid layouts for report information display

## External Dependencies

### Primary Technologies
- **Database**: PostgreSQL (via Supabase or Neon Database)
- **ORM**: Drizzle ORM with TypeScript support
- **Authentication**: bcrypt for password hashing
- **Session Management**: express-session with connect-pg-simple

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Modern icon library
- **React Hook Form**: Form state management
- **TanStack Query**: Server state synchronization

### Development Tools
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety across the entire application
- **Tailwind CSS**: Utility-first CSS framework
- **ESLint/Prettier**: Code quality and formatting

### Reporting Libraries
- **ExcelJS**: Excel file generation
- **jsPDF**: PDF generation capabilities
- **html2canvas**: HTML to image conversion for reports

### Deployment & Infrastructure
- **Replit**: Development and hosting environment
- **PostgreSQL**: Primary database system
- **Node.js**: Server runtime environment

The architecture supports a scalable, maintainable construction management system with robust financial tracking, comprehensive reporting, and an intuitive Arabic-language interface optimized for construction industry workflows.