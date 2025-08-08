# Arabic Construction Project Management System

## Overview
This is a comprehensive web application for managing construction projects in Arabic. Its primary purpose is to streamline project oversight, financial management, and workforce administration. Key capabilities include robust tools for expense tracking, worker management, supplier administration, and detailed reporting, all within an accurate Arabic interface and responsive design. The system aims to provide a complete solution for managing construction projects, from financial movements to workforce and supplier interactions.

## User Preferences
- اللغة الأساسية: العربية
- الاتجاه: من اليمين لليسار (RTL)
- التركيز على البساطة والوضوح في الواجهة
- التحسين المستمر للأداء
- التواصل: جميع الردود والملاحظات والتوجيهات يجب أن تكون باللغة العربية حصرياً
- أسلوب التفاعل: استخدام اللغة العربية الواضحة والمباشرة في جميع الاستجابات
- تحديث: 7 أغسطس 2025 - تأكيد المستخدم على التواصل باللغة العربية فقط في جلسة جديدة
- إصلاح مهم: 7 أغسطس 2025 - تم إصلاح حساب الإحصائيات المالية ليحسب المبالغ المدفوعة فعلياً (paid_amount) بدلاً من الأجور الكاملة (actual_wage) + فصل المشتريات النقدية عن الآجلة في جميع الحسابات
- **إصلاح حرج**: 7 أغسطس 2025 - تم إصلاح حساب أرصدة العمال في Frontend. كان هناك خطأ في حساب الرصيد حيث كان يُحسب كـ (المستلم - المحول للأهل) بدلاً من الصيغة الصحيحة (المستحق - المستلم - المحول للأهل). حوالات العمال هي دائماً من العامل إلى الأهل وليس العكس، لذلك تُخصم من رصيد العامل.
- **إصلاح مهم في سجل العمليات**: 8 أغسطس 2025 - تم إصلاح عرض أجور العمال في صفحة سجل العمليات (ProjectTransactionsSimple.tsx). الآن يعرض جميع أجور العمال حتى لو لم تُدفع، مع إظهار المبلغ المدفوع فعلياً (0 إذا لم يُدفع) وملاحظة "(لم يُدفع)". إجمالي المصاريف يحسب فقط المبالغ المدفوعة فعلياً وليس الأجور الكاملة.
- **خطة تطوير جديدة**: 7 أغسطس 2025 - بدء مشروع تحسين مكون تقرير تصفية العمال على 3 مراحل: (1) تحسين مؤشرات التحميل والتحقق من البيانات ورسائل الخطأ، (2) تحسين الأداء والواجهة المتدرجة وخيارات التصدير، (3) إضافة التحليلات والصلاحيات والتنبؤات الذكية
- **تحليل شامل لمكون ملخص المشروع**: 7 أغسطس 2025 - قام المطور بفحص تفصيلي لمكون "ملخص المشروع" في صفحة التقارير، تم تحديد الوضع الحالي والتحديات والفرص للتطوير المستقبلي (انظر: project-summary-analysis-report.md)

## System Architecture
The system is built as a comprehensive web application with distinct frontend and backend components, prioritizing an Arabic-first, Right-to-Left (RTL) design.

### UI/UX Decisions
The interface emphasizes simplicity, clarity, and full responsiveness across devices. Design elements include interactive tables with filtering and sorting, professional layouts for reports, and optimized print views to ensure a user-friendly experience. A specific component, "Project Summary," utilizes an attractive purple color scheme, PieChart icons, and advanced hover effects, designed for responsiveness.

### Technical Implementations
- **Project Management**: Tools for creating and tracking multiple construction projects.
- **Worker Management**: System for worker registration, attendance, wage calculation, and detailed account statements, including accurate balance calculation for workers.
- **Expense Tracking**: Detailed recording and categorization of project-related expenses, supporting both cash and deferred purchases.
- **Reporting System**: Comprehensive financial reports, daily summaries, and detailed account statements with filtering by project and date range, covering various expense categories (labor, petty cash, purchases, wages, transportation, engineers) and income (trust transfers). Reports feature interactive tables, Excel export, and print functionality. The "Project Summary" report is designed to provide comprehensive financial and operational statistics over a specific period.
- **Supplier Management**: System for managing suppliers, tracking debt, supporting cash and deferred transactions, and linking payments to projects, with smart autocompletion.
- **Advanced Autocompletion**: Provides smart suggestions based on previous usage across various input fields, with intelligent handling of data persistence.

### System Design Choices
- **Performance Optimization**: Achieved through optimized database indexing, intelligent cleanup, smart data limits for autocompletion, batch operations, and regular updates of materialized views for daily summaries and autocompletion statistics.
- **Data Unification**: Standardized Gregorian calendar dates and Yemeni Rial (ر.ي) currency.
- **Administrative Interface**: Provides system statistics, manual maintenance tools, and health monitoring.
- **Error Handling**: Detailed, user-friendly error messages with actionable advice.

## External Dependencies
- **Frontend**: React.js, TypeScript, Tailwind CSS, TanStack Query, Wouter
- **Backend**: Node.js, Express.js
- **Database**: Supabase PostgreSQL
- **ORM**: Drizzle ORM