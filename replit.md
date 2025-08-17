# Overview

This is a comprehensive Arabic construction project management system built as a full-stack web application. The system manages multiple construction projects, tracking workers, materials, expenses, financial transfers, and generating detailed reports. It aims to provide robust financial tracking, comprehensive reporting, and an intuitive Arabic-language interface optimized for construction industry workflows.

# User Preferences

Preferred communication style: Simple, everyday language in Arabic. All responses and communication must be in Arabic - confirmed August 17, 2025. User explicitly requested all interactions to be in Arabic language. CONFIRMED: All AI responses and notes must be in Arabic.
Project management approach: Systematic organization with clear documentation.
Code organization: DRY principle (Don't Repeat Yourself) with unified components.
Architecture philosophy: Beginner-friendly structure with centralized control points.

# System Architecture

## Frontend Architecture

- **Framework**: React 18 with TypeScript and Vite
- **UI Library**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS with RTL (right-to-left) support for Arabic content
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: React Router
- **Forms**: React Hook Form with Zod validation

## Backend Architecture

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM
- **Authentication**: Session-based auth with bcrypt
- **API Design**: RESTful endpoints with CRUD operations

## Database Design

The system uses PostgreSQL with a comprehensive schema for:

### Core Entities
- **Projects**: Construction project management and financial tracking
- **Workers**: Employee management with skill types and daily wages
- **Materials**: Construction materials inventory and purchasing
- **Suppliers**: Vendor management

### Financial Tracking
- **Fund Transfers**: Money transfers to projects
- **Worker Attendance**: Daily work tracking and wage calculations
- **Material Purchases**: Purchase orders and inventory
- **Daily Expense Summaries**: Automatic financial reconciliation
- **Worker Transfers**: Money transfers to workers

### Advanced Features
- **Autocomplete System**: Smart suggestions for data
- **Print Settings**: Customizable report printing
- **Backup System**: Automated data backup

## Key Architectural Decisions

### Database Schema Strategy
- **Normalized Design**: Separate tables for data integrity
- **UUID Primary Keys**: For distributed system support
- **Audit Trail**: Created/updated timestamps
- **Financial Integrity**: Automatic balance calculations

### Performance Optimizations
- **Indexed Queries**: Strategic database indexes
- **Batch Operations**: Bulk insert/update
- **Cached Calculations**: Daily summaries
- **Optimistic Updates**: Client-side for better UX

### Security Measures
- **Session-based Authentication**: Secure session management
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Comprehensive Zod schemas
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM

### Reporting System
- **Multi-format Export**: PDF, Excel, and print-optimized HTML reports
- **Template-based**: Unified report templates for consistent formatting
- **Professional Daily Expense Reports**: New professional template (ProfessionalDailyExpenseReport.tsx) matching industry standards
- **Streamlined UI**: Removed duplicate buttons for cleaner interface experience

## Recent Changes (August 17, 2025)

### إضافة الزر العائم التفاعلي في الصفحة الرئيسية (أغسطس 17، 2025)
- **أُضيف**: زر عائم في الصفحة الرئيسية مع قائمة خيارات تفاعلية
- **الميزات**: 
  - عرض قائمة خيارات عند النقر (إضافة عامل / إضافة مشروع)
  - تصميم عائم أنيق مع خلفية شفافة
  - انتقال سلس للصفحات المطلوبة
  - إغلاق تلقائي عند النقر على الخلفية أو اختيار خيار
- **التحسينات**: أيقونات ملونة (أزرق للعمال، أخضر للمشاريع) مع تأثيرات الحوم
- **تحسين تجربة المستخدم**: وصول سريع لأهم وظائف النظام من الصفحة الرئيسية

## Recent Changes (August 17, 2025)

### صفحة حسابات التوريد - تحسين وضغط التصميم (أغسطس 17، 2025)
- **حُسِنت**: صفحة حسابات التوريد بتصميم مضغوط ومُحسن
- **أُضيفت**: مكونات إحصائيات موحدة (StatsCard) لعرض إجمالي المشتريات والمدفوع والمتبقي
- **ضُغط**: التصميم العام مع تقليل المساحات والخطوط لاستغلال أفضل للشاشة
- **حُسنت**: الجداول بتصميم مضغوط (نص أصغر، صفوف أقل ارتفاعاً)
- **وُحدت**: استخدام الألوان والأيقونات مع باقي النظام
- **خصائص**:
  - فلاتر بحث مضغوطة بحقول أصغر (h-8)
  - معلومات المورد في شبكة مدمجة
  - إحصائيات بتصميم StatsCard الموحد
  - جدول مضغوط مع نصوص أصغر (text-xs)
  - حالة فارغة مُحسنة ومضغوطة

### إصلاح صفحة حسابات الموردين وجلب البيانات (أغسطس 17، 2025)
- **أُصلحت**: مشكلة عدم جلب بيانات المشتريات في صفحة حسابات الموردين
- **السبب**: البيانات محفوظة بـ `supplierName` وليس `supplierId` في جدول material_purchases
- **الحل**: تحديث دالة `getMaterialPurchasesWithFilters` للبحث بـ `supplierName` بدلاً من `supplierId`
- **أُضيفت**: API جديد لجلب نطاق التواريخ التلقائي من قاعدة البيانات (/api/material-purchases/date-range)
- **حُسنت**: تحديد التواريخ تلقائياً عند اختيار مورد (من: 2025-08-04 إلى: 2025-08-16)
- **صُححت**: عرض العملة بالريال اليمني وإزالة العنوان المكرر من الصفحة
- **النتيجة**: النظام يجلب الآن 30 مشترى بنجاح مع جميع البيانات والفلاتر والإحصائيات

### إصلاح عرض أسماء المواد في التصدير وتحسين الطباعة A4 (أغسطس 17، 2025)
- **أُصلحت**: مشكلة عرض أكواد المواد بدلاً من أسماء المواد في ملف Excel المُصدر
- **الحل**: تحديث كود التصدير لاستخدام `materialName` من قاعدة البيانات
- **حُسنت**: إعدادات طباعة Excel لورقة A4 مع تقليل الهوامش إلى أقصى حد
- **خصائص التحسين**:
  - تقليل الهوامش: يسار/يمين 0.2، أعلى/أسفل 0.3
  - تصغير النص: خط 8 للبيانات، خط 9 لرؤوس الجداول
  - تقليل ارتفاع الصفوف: 15 للبيانات، 20 لرؤوس الجداول
  - ضبط عرض الأعمدة للطباعة المثلى على A4
  - مقياس طباعة 80% لاستغلال أفضل للمساحة
- **النتيجة**: تصدير محسن مع أسماء مواد صحيحة وطباعة مضغوطة على A4

### توحيد مكونات اختيار المشروع والإحصائيات (أغسطس 17، 2025)
- **أُضيفت**: مكونات اختيار المشروع مع إطار وعنوان موحد في جميع الصفحات
- **حُسنت**: صفحة worker-attendance.tsx بإطار "اختر المشروع" مع أيقونة ChartGantt
- **حُسنت**: صفحة material-purchase.tsx بإطار "اختر المشروع" مع أيقونة ChartGantt
- **أُضيفت**: إحصائيات عامة لصفحة projects.tsx (إجمالي المشاريع، النشطة، الرصيد، العمال)
- **أُضيفت**: مكون اختيار المشروع لصفحة ProjectTransfers.tsx مع إحصائيات التحويلات
- **حُدثت**: صفحة ProjectTransactionsPage.tsx لتستخدم التصميم الموحد
- **وُحدت**: جميع الصفحات تستخدم مكون ChartGantt والتصميم المطلوب

### Worker Accounts Project Selector Enhancement (August 17, 2025)
- **Enhanced**: Worker Accounts page project selector to match main dashboard design
- **Implemented**: Premium variant of ProjectSelector component with professional styling
- **Added**: Smart "All Projects" toggle button with gradient design and clear visual feedback
- **Improved**: User experience consistency across all pages using unified ProjectSelector component
- **Features**: 
  - Premium card design with gradient backgrounds and shadow effects
  - Professional icon integration with colored backgrounds
  - Smart project filtering with intuitive "All Projects" option
  - Responsive layout matching main dashboard aesthetics
  - Enhanced Arabic RTL support and proper text alignment

### Professional Daily Expense Report Improvements
- **Created**: New professional daily expense report template (ProfessionalDailyExpenseReport.tsx)
- **Enhanced**: Report formatting to match professional construction industry standards
- **Added**: Company header with "شركة الفني للمقاولات والاستشارات الهندسية"
- **Improved**: Table layout with proper Arabic formatting and currency display
- **Organized**: Clear expense categorization with summary sections

### UI/UX Enhancements - Unified Statistics Design
- **Created**: New unified StatsCard component (client/src/components/ui/stats-card.tsx)
- **Implemented**: Consistent statistics design across all pages matching attached reference image
- **Features**: Circular colored icons, left border accents, professional card layout
- **Updated Pages**: Dashboard, Suppliers, Workers, Reports pages now use unified design
- **Standardized**: Color scheme (blue, green, orange, red, purple, teal, indigo) for different metrics
- **Enhanced**: User experience with consistent visual design language
- **Improved**: Information hierarchy and readability
- **Space Optimization**: Reduced card heights (p-4 instead of p-6), smaller text and icons for better space utilization
- **Responsive Layout**: Grid layout changed to 2x2 on mobile, 4 columns on larger screens for optimal space usage

### Advanced Data Export System (August 17, 2025)
- **Created**: New AdvancedDataExport.tsx component with comprehensive export capabilities
- **Features**: Multi-project selection, date range filtering, content customization
- **Export Formats**: Excel (.xlsx), PDF, and print-ready HTML reports
- **Data Integration**: Real-time data fetching from multiple projects with financial summaries
- **UI/UX**: Professional interface with project selection checkboxes and date pickers

### Interface Cleanup and Optimization (August 17, 2025)
- **Fixed**: All LSP errors in codebase for clean development environment
- **Removed**: Duplicate page titles from within page content (Reports page, Worker Accounts page)
- **Optimized**: Floating button usage - added where needed, removed where unnecessary
- **Enhanced**: Floating buttons for Project Transfers page to add new transfers
- **Cleaned**: Removed floating buttons from view-only pages (Project Transactions, Supplier Accounts, Reports)
- **Improved**: Overall user experience by reducing visual clutter and redundancy

### Project Selector Unification (August 17, 2025)
- **Standardized**: Project selector component across all pages to match main dashboard design
- **Updated**: Reports page now uses default ProjectSelector component with proper card styling
- **Enhanced**: Worker Accounts page maintains custom functionality for "All Projects" option while using standard styling
- **Achieved**: 100% visual consistency of project selection interface across the entire application
- **Removed**: Custom inline Select components in favor of unified ProjectSelector component

### System Status
- **Status**: All systems operational with 21 database tables
- **Performance**: No LSP errors, clean codebase
- **Database**: Connected to Supabase PostgreSQL with 5 active projects
- **Reports**: Professional daily expense reporting + advanced multi-project export fully functional
- **New Features**: Advanced export system with multi-project support and comprehensive data export
- **Arabic RTL Support**: Proper right-to-left text layout
- **Print Optimization**: A4 page formatting with proper margins and page breaks
- **Excel-Style Integration**: Reports unified to match Excel templates with professional design (blue header, green totals, alternating row colors, 11 columns in worker filter report)
- **Enhanced Export & Print Functions**: Professional Excel export with ExcelJS and enhanced print layouts with custom CSS and A4 formatting.
- **Unified Currency & Date Formatting**: Consistent currency display ("ريال"), company branding, and professional headers.
- **Enhanced Report Headers (Aug 2025)**: Company header "شركة الفتحي للمقاولات والاستشارات الهندسية", print date display, blue main table headers with white text, and inclusion of zero-payment workers in reports for complete tracking.

# External Dependencies

### Primary Technologies
- **Database**: PostgreSQL (via Supabase or Neon Database)
- **ORM**: Drizzle ORM
- **Authentication**: bcrypt
- **Session Management**: express-session with connect-pg-simple

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **React Hook Form**: Form state management
- **TanStack Query**: Server state synchronization

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **ESLint/Prettier**: Code quality and formatting

### Reporting Libraries
- **ExcelJS**: Excel file generation
- **jsPDF**: PDF generation
- **html2canvas**: HTML to image conversion

### Deployment & Infrastructure
- **Replit**: Development and hosting environment
- **Node.js**: Server runtime environment