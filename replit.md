# Arabic Construction Project Management System

## Overview
This is a comprehensive web application designed for managing construction projects in Arabic. Its core purpose is to streamline project oversight, financial management, and workforce administration. Key capabilities include robust tools for expense tracking, worker management, supplier administration, and detailed reporting. The system provides a complete solution for managing construction projects, from financial movements to workforce and supplier interactions, all within an accurate Arabic interface and responsive design.

## User Preferences
- اللغة الأساسية: العربية
- الاتجاه: من اليمين لليسار (RTL)
- التركيز على البساطة والوضوح في الواجهة
- التحسين المستمر للأداء
- التواصل: جميع الردود والملاحظات والتوجيهات يجب أن تكون باللغة العربية حصرياً
- أسلوب التفاعل: استخدام اللغة العربية الواضحة والمباشرة في جميع الاستجابات والتفاعلات
- طريقة التواصل: الأولوية للوضوح والبساطة، تجنب المصطلحات التقنية المعقدة

## System Architecture
The system is built as a comprehensive web application with distinct frontend and backend components, prioritizing an Arabic-first, Right-to-Left (RTL) design.

### UI/UX Decisions
The interface emphasizes simplicity, clarity, and full responsiveness across devices. Design elements include interactive tables with filtering and sorting, professional layouts for reports, and optimized print views to ensure a user-friendly experience. Specific components like "Project Summary" utilize attractive color schemes and advanced visual effects, designed for responsiveness.

### Recent Updates (August 12, 2025)
- **Enhanced Worker Reports**: Redesigned unified worker reports to match exact Excel template format provided by user
- **Template Matching**: Implemented pixel-perfect replica of Arabic construction company reports with proper column ordering
- **Print Optimization**: Enhanced print layouts with professional styling matching physical Excel templates
- **Data Structure**: Updated table structures to include proper fields: ملاحظات، المتبقي، المبلغ المستلم، المبلغ المستحق، etc.
- **Code Cleanup**: Comprehensive project cleanup to remove duplicate components and maintain only active features
- **Component Consolidation**: Removed duplicate worker account statement components while preserving /reports functionality
- **Duplicate Button Fix**: Resolved duplicate Export/Print buttons issue in reports page by removing redundant buttons from individual components
- **Mobile Optimization**: Enhanced responsive design for mobile devices with improved button layouts and touch-friendly interfaces
- **CSS Improvements**: Added comprehensive mobile CSS classes and responsive utilities for better user experience on smartphones

### Technical Implementations
- **Project Management**: Tools for creating and tracking multiple construction projects.
- **Worker Management**: System for worker registration, attendance, wage calculation, and detailed account statements with accurate balance calculation.
- **Expense Tracking**: Detailed recording and categorization of project-related expenses, supporting both cash and deferred purchases.
- **Reporting System**: Comprehensive financial reports, daily summaries, and detailed account statements with filtering by project and date range. Reports cover various expense categories (labor, petty cash, purchases, wages, transportation, engineers) and income (trust transfers), featuring interactive tables, professional Excel export, and print functionality.
- **Supplier Management**: System for managing suppliers, tracking debt, supporting cash and deferred transactions, and linking payments to projects, with smart autocompletion.
- **Advanced Autocompletion**: Provides intelligent suggestions based on previous usage across various input fields.

### System Design Choices
- **Performance Optimization**: Achieved through optimized database indexing, intelligent cleanup, smart data limits for autocompletion, batch operations, and regular updates of materialized views.
- **Data Unification**: Standardized Gregorian calendar dates and Yemeni Rial (ر.ي) currency.
- **Administrative Interface**: Provides system statistics, manual maintenance tools, and health monitoring.
- **Error Handling**: Detailed, user-friendly error messages with actionable advice.

## External Dependencies
- **Frontend**: React.js, TypeScript, Tailwind CSS, TanStack Query, Wouter
- **Backend**: Node.js, Express.js
- **Database**: Supabase PostgreSQL
- **ORM**: Drizzle ORM