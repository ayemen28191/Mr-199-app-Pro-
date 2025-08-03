# Arabic Construction Project Management System

## Overview
This is a comprehensive web application for managing construction projects in Arabic. It provides robust tools for expense tracking, worker management, supplier administration, and detailed reporting, emphasizing an accurate Arabic interface and responsive design. The system aims to streamline construction project oversight, financial management, and workforce administration.

### Recent Changes (أغسطس 2025)
- **إصلاح وتطوير نظام التكامل بين صفحة التقارير وإعدادات الطباعة (3 أغسطس 2025):**
  - **إصلاح آلية استقبال التقارير:** تطوير نظام متكامل لنقل التقارير من صفحة `/reports` إلى `/print-control`
  - **تحسين حفظ البيانات:** إضافة نظام حفظ تلقائي لجميع أنواع التقارير في localStorage
  - **معاينة محسنة:** تطوير واجهة معاينة متقدمة مع رسائل حالة وتأكيد استقبال البيانات
  - **معالجة الأخطاء:** إضافة تحقق شامل من وجود البيانات مع رسائل توضيحية
  - تحديث دوال إنشاء التقارير لحفظ البيانات تلقائياً (كشف المصاريف، حساب العامل، مشتريات المواد، ملخص المشروع)
  - إضافة معرفات ومعلومات إضافية لكل نوع تقرير (اسم العامل، فترة التقرير، معلومات المشروع)
  - **مكتمل:** النظام يعمل بالكامل مع نقل سلس للتقارير والمعاينة الفورية
- **نظام التحكم الشامل في طباعة الكشوف (3 أغسطس 2025):**
  - إنشاء صفحة تحكم متقدمة `/print-control` للتحكم الكامل في تنسيق الطباعة
  - إضافة جدول `print_settings` لحفظ إعدادات الطباعة المخصصة لكل نوع كشف
  - تطوير واجهة شاملة للتحكم في: حجم الصفحة، الهوامش، الخطوط، الألوان، الجداول، العناصر المرئية
  - معاينة فورية مع إمكانية التبديل بين وضع الشاشة ووضع الطباعة
  - نظام حفظ وتحميل الإعدادات مع إمكانية التصدير والاستيراد
  - تطبيق CSS ديناميكي للطباعة مع تحديث فوري عند تغيير الإعدادات
  - **نظام تحديد نوع التقرير المتطور:** إضافة قائمة اختيار لـ5 أنواع تقارير مختلفة مع إعدادات منفصلة لكل نوع
  - **إصلاح شامل لـ API calls:** تصحيح استدعاءات apiRequest وحل مشاكل fetch methods
  - **تحسين معالجة الأخطاء:** إضافة رسائل خطأ تفصيلية والتحقق من صحة البيانات
  - **مكتمل:** النظام يعمل بالكامل مع دعم جميع أنواع التقارير وحفظ الإعدادات
- **تطوير كشف حساب العامل الاحترافي المحسن الجديد (3 أغسطس 2025):**
  - إنشاء مكون جديد `EnhancedWorkerAccountStatement` مع تصميم مضغوط لصفحة A4 واحدة
  - تطوير ملف CSS متخصص `enhanced-worker-statement-print.css` للطباعة الاحترافية
  - دمج جميع البيانات المطلوبة في تخطيط مدروس وأنيق
  - إضافة إحصائيات العمل التفصيلية (أيام العمل، إجمالي الساعات، متوسط يومي)
  - تحسين عرض الحوالات المرسلة في جدول منفصل ومنسق
  - إضافة قسم التوقيعات والاعتماد للمستندات الرسمية
  - تحسين الملخص النهائي مع حساب الرصيد الموجب/السالب
  - ضبط أحجام النصوص والمسافات للاستفادة القصوى من مساحة الصفحة
- **تحسين شامل لتقرير كشف حساب العمال المهني:**
  - إضافة عنصر "المتبقي في ذمة الشركة" للملخص المالي
  - تحسين ملف CSS للطباعة الاحترافية مع دعم الصفحات المتعددة
  - تطوير نظام تكرار رؤوس الجداول تلقائياً في كل صفحة
  - إضافة تعليقات توضيحية شاملة باللغة العربية لجميع أنماط CSS
  - تحسين تذييل التقرير مع معلومات مفصلة عن النظام والعامل
  - ضمان طباعة الألوان بدقة عالية مع `print-color-adjust: exact`
  - تحسين التخطيط للغة العربية (RTL) والنصوص ثنائية الاتجاه
- إصلاح جذري لمشكلة العمود المفقود `total_debt` في جدول الموردين
- إنشاء استعلامات SQL شاملة لإصلاح هيكل قاعدة البيانات
- حل جميع مشاكل type safety والأخطاء في runtime
- استعادة وظائف إدارة مديونية الموردين بالكامل
- تحسين معالجة الأخطاء وfunctions التحقق من صحة البيانات

## User Preferences
- اللغة الأساسية: العربية
- الاتجاه: من اليمين لليسار (RTL)
- التركيز على البساطة والوضوح في الواجهة
- التحسين المستمر للأداء
- التواصل: جميع الردود والملاحظات يجب أن تكون باللغة العربية

## System Architecture
The system is built as a comprehensive web application with distinct frontend and backend components.

### UI/UX Decisions
The interface prioritizes simplicity and clarity, adhering to an Arabic-first, Right-to-Left (RTL) design. It is fully responsive to ensure compatibility across various devices. Key design elements include interactive tables with filtering and sorting, professional layouts for reports, and optimized print views.

### Technical Implementations
- **Project Management**: Create and track multiple construction projects.
- **Worker Management**: Comprehensive system for worker registration, attendance, and wages.
- **Expense Tracking**: Detailed recording of all expense types.
- **Reporting System**: Comprehensive financial reports and detailed account statements.
- **Advanced Autocompletion**: Smart suggestions based on previous usage.
- **Advanced Reporting**: Professional reporting system for expenses and income, with filtering by project and date range. Includes detailed categories for expenses (labor, petty cash, purchases, wages, transportation, engineers) and income (trust transfers, transaction details). Outputs are interactive tables with automatic totals, Excel export, and print functionality.
- **Supplier Management**: Full system for managing suppliers, including `total_debt` tracking, support for cash and deferred transactions, and linking to projects and payments. Includes supplier administration, account statements, and reports with smart autocompletion for contact persons, phone numbers, addresses, and payment terms (cash/30 days/60 days).

### System Design Choices
- **Performance Optimization**:
    - **Database Indexing**: Optimized indexes (`idx_autocomplete_category_usage`, `idx_autocomplete_value_search`, `idx_autocomplete_cleanup`, `idx_autocomplete_stats`) to improve search, sorting, and cleanup operations.
    - **Intelligent Cleanup System**: Automated deletion of old data (over 6 months and less than 3 uses) with daily and weekly scheduled maintenance.
    - **Smart Data Limits**: Maximum of 100 suggestions per category, with automatic deletion of least-used suggestions.
    - **Batch Operations**: Optimized batch deletions and insertions for hundreds of records, with operations split for large quantities (+100 records) and individual fallbacks.
    - **Materialized Views**: Used for daily summaries and autocompletion statistics, updated synchronously every 6 hours with optimized indexes.
    - **Database Performance**: Automatic VACUUM after large operations, monitoring table and index sizes, and automatic critical issue detection.
- **Project Statistics**: Utilizes the latest daily summary for accurate balance calculation, incorporating carried-over amounts from previous days.
- **Data Unification**: Standardized Gregorian calendar dates and Yemeni Rial (ر.ي) currency across the entire application for consistency in display and reporting.
- **Administrative Interface**: Provides detailed system statistics, manual maintenance tools, and system health monitoring.

## External Dependencies
- **Frontend**: React.js, TypeScript, Tailwind CSS, TanStack Query, Wouter
- **Backend**: Node.js, Express.js
- **Database**: Supabase PostgreSQL
- **ORM**: Drizzle ORM