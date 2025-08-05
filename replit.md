# Arabic Construction Project Management System

## Recent Updates (أغسطس 2025)
- **إصلاح شامل لتنسيق التواريخ في جميع التقارير (5 أغسطس 2025):**
  - **تحويل كامل للتنسيق الإنجليزي DD/MM/YYYY:** تطبيق التنسيق المطلوب 05/08/2025
  - **إصلاح مشكلة الصفحات الفارغة:** تحديد منطقة الطباعة بدقة بناءً على البيانات الفعلية
  - **توحيد تنسيق الوقت:** استخدام en-GB مع التوقيت 24 ساعة
  - **إزالة التنسيقات الصينية:** تحويل جميع التواريخ من التنسيق الأمريكي MM/DD/YYYY
- **تطوير احترافي شامل لتقرير كشف حساب العامل Excel (5 أغسطس 2025):**
  - **تصميم احترافي متطور:** هيدر بتدرج لوني وشعار مؤسسي مع معلومات شاملة
  - **عمود عدد الأيام المحسن:** عرض تفصيلي (يوم كامل، نصف، ربع) مع رموز بصرية
  - **حساب الأجر الذكي:** حساب دقيق للأجر المستحق بناءً على عدد الأيام الفعلية
  - **أسماء ومهن حقيقية:** عرض بيانات العمال الفعلية من قاعدة البيانات
  - **تحويل إنجليزي كامل:** جميع الأرقام والتواريخ بالتنسيق الإنجليزي
  - **مؤشرات كفاءة:** عمود تقييم أداء العامل (ممتاز، جيد، يحتاج تحسين)
  - **12 عمود شامل:** بيانات مفصلة تشمل الكفاءة والملاحظات والحالة
  - **ألوان ذكية:** تلوين تلقائي حسب حالة الدفع ومستوى الأداء
  - **طباعة A4 محسنة:** مقياس 85% وهوامش مضغوطة لاستغلال أمثل للمساحة
  - **إحصائيات شاملة:** إجمالي الأيام، الكفاءة العامة، الحالة المالية
  - **تذييل احترافي:** معلومات النظام مع خط فاصل أنيق وتوقيت الإصدار
- **تحسين عرض بيانات المواصلات في تقرير Excel (4 أغسطس 2025):**
  - إزالة النص الثابت للرأس والتذييل من تقارير Excel
  - تحسين عرض تفاصيل المواصلات لإظهار البيانات الفعلية المدخلة
  - عرض المسافة والتفاصيل الحقيقية بدلاً من النصوص الافتراضية
- **تحسين شامل واحترافي لتقرير Excel المصروفات اليومية (4 أغسطس 2025):**
  - **إعداد طباعة A4 محسن:** ضبط مقاسات وهوامش مثالية مع رأس وتذييل تلقائي
  - **جداول احترافية محسنة:** تنسيق بصري متقدم مع ألوان متدرجة وحدود واضحة
  - **عرض أعمدة ديناميكي محسن:** عرض مُحَسّن (6-30 وحدة) لاستغلال مساحة A4 أمثل
  - **بيانات حقيقية شاملة:** عرض أسماء العمال الفعلية، المهن، ساعات وأيام العمل
  - **أقسام منظمة ملونة:** تقسيم المصروفات (عمال، مواد، نقل) مع رموز مميزة
  - **ملخص مالي مُصحح:** إصلاح حسابات الواردات والمتبقي مع عرض دقيق للبيانات
  - **ارتفاع صفوف محسن:** زيادة ارتفاع الصفوف (30-35 وحدة) لاستغلال أمثل للمساحة
  - **تفاصيل شاملة:** عرض عدد ساعات وأيام العمل، رقم الفاتورة، الطريق للنقل
  - **تنسيق أرقام احترافي:** عملة بفواصل آلاف وعشريين مع توسيط مثالي
  - **أسماء ملفات ذكية:** تتضمن اسم المشروع والتاريخ للتنظيم الأمثل
- **إصلاح نهائي لحقل carried_forward_amount (4 أغسطس 2025):**
  - تم حل المشكلة الجذرية في قاعدة بيانات Supabase بنجاح كامل
  - إضافة الحقل بمواصفات decimal(10,2) مع فهارس محسنة للأداء
  - تحديث جميع السجلات الموجودة وإزالة الكود المؤقت

## Overview
This is a comprehensive web application designed for managing construction projects in Arabic. Its primary purpose is to streamline project oversight, financial management, and workforce administration. Key capabilities include robust tools for expense tracking, worker management, supplier administration, and detailed reporting, all within an accurate Arabic interface and responsive design. The system aims to provide a complete solution for managing construction projects, from financial movements to workforce and supplier interactions.

## User Preferences
- اللغة الأساسية: العربية
- الاتجاه: من اليمين لليسار (RTL)
- التركيز على البساطة والوضوح في الواجهة
- التحسين المستمر للأداء
- التواصل: جميع الردود والملاحظات والتوجيهات يجب أن تكون باللغة العربية حصرياً

## System Architecture
The system is built as a comprehensive web application with distinct frontend and backend components, prioritizing an Arabic-first, Right-to-Left (RTL) design.

### UI/UX Decisions
The interface emphasizes simplicity, clarity, and full responsiveness across devices. Design elements include interactive tables with filtering and sorting, professional layouts for reports, and optimized print views to ensure a user-friendly experience.

### Technical Implementations
- **Project Management**: Comprehensive tools for creating and tracking multiple construction projects.
- **Worker Management**: A complete system for worker registration, attendance, wage calculation, and detailed account statements.
- **Expense Tracking**: Detailed recording and categorization of all project-related expenses.
- **Reporting System**: Comprehensive financial reports, daily summaries, and detailed account statements for various entities. This includes advanced reporting with filtering by project and date range, detailed expense categories (labor, petty cash, purchases, wages, transportation, engineers), and income tracking (trust transfers, transaction details). Reports offer interactive tables with automatic totals, Excel export, and print functionality.
- **Supplier Management**: A full system for managing suppliers, including tracking `total_debt`, support for cash and deferred transactions, and linking payments to projects. Features supplier administration, account statements, and smart autocompletion for contact details and payment terms.
- **Advanced Autocompletion**: Provides smart suggestions based on previous usage across various input fields.

### System Design Choices
- **Performance Optimization**: Achieved through optimized database indexing (for search, sorting, and cleanup), an intelligent cleanup system for old data, smart data limits for autocompletion suggestions, and batch operations for efficient data handling. Materialized views are used for daily summaries and autocompletion statistics, updated regularly. Database performance is further ensured by automatic VACUUM operations and monitoring.
- **Project Statistics**: Accurate balance calculation based on the latest daily summaries, including carried-over amounts.
- **Data Unification**: Standardized Gregorian calendar dates and Yemeni Rial (ر.ي) currency for consistency across the application.
- **Administrative Interface**: Provides detailed system statistics, manual maintenance tools, and system health monitoring capabilities.

## External Dependencies
- **Frontend**: React.js, TypeScript, Tailwind CSS, TanStack Query, Wouter
- **Backend**: Node.js, Express.js
- **Database**: Supabase PostgreSQL
- **ORM**: Drizzle ORM