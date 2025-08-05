# Arabic Construction Project Management System

## Overview
This is a comprehensive web application designed for managing construction projects in Arabic. Its primary purpose is to streamline project oversight, financial management, and workforce administration. Key capabilities include robust tools for expense tracking, worker management, supplier administration, and detailed reporting, all within an accurate Arabic interface and responsive design. The system aims to provide a complete solution for managing construction projects, from financial movements to workforce and supplier interactions.

## User Preferences
- اللغة الأساسية: العربية
- الاتجاه: من اليمين لليسار (RTL)
- التركيز على البساطة والوضوح في الواجهة
- التحسين المستمر للأداء
- التواصل: جميع الردود والملاحظات والتوجيهات يجب أن تكون باللغة العربية حصرياً
- أسلوب التفاعل: استخدام اللغة العربية الواضحة والمباشرة في جميع الاستجابات

## System Architecture
The system is built as a comprehensive web application with distinct frontend and backend components, prioritizing an Arabic-first, Right-to-Left (RTL) design.

### UI/UX Decisions
The interface emphasizes simplicity, clarity, and full responsiveness across devices. Design elements include interactive tables with filtering and sorting, professional layouts for reports, and optimized print views to ensure a user-friendly experience.

### Technical Implementations
- **Project Management**: Comprehensive tools for creating and tracking multiple construction projects.
- **Worker Management**: A complete system for worker registration, attendance, wage calculation, and detailed account statements.
- **Expense Tracking**: Detailed recording and categorization of all project-related expenses, including handling of deferred purchases.
- **Reporting System**: Comprehensive financial reports, daily summaries, and detailed account statements for various entities. This includes advanced reporting with filtering by project and date range, detailed expense categories (labor, petty cash, purchases, wages, transportation, engineers), and income tracking (trust transfers, transaction details). Reports offer interactive tables with automatic totals, Excel export, and print functionality.
- **Supplier Management**: A full system for managing suppliers, including tracking `total_debt`, support for cash and deferred transactions, and linking payments to projects. Features supplier administration, account statements, and smart autocompletion for contact details and payment terms.
- **Advanced Autocompletion**: Provides smart suggestions based on previous usage across various input fields, with intelligent handling of data persistence.

### System Design Choices
- **Performance Optimization**: Achieved through optimized database indexing, intelligent cleanup system, smart data limits for autocompletion suggestions, and batch operations for efficient data handling. Materialized views are used for daily summaries and autocompletion statistics, updated regularly.
- **Project Statistics**: Accurate balance calculation based on the latest daily summaries, including carried-over amounts.
- **Data Unification**: Standardized Gregorian calendar dates and Yemeni Rial (ر.ي) currency for consistency across the application.
- **Administrative Interface**: Provides detailed system statistics, manual maintenance tools, and system health monitoring capabilities.
- **Error Handling**: Detailed and user-friendly error messages with clear reasons and actionable advice.

## External Dependencies
- **Frontend**: React.js, TypeScript, Tailwind CSS, TanStack Query, Wouter
- **Backend**: Node.js, Express.js
- **Database**: Supabase PostgreSQL
- **ORM**: Drizzle ORM