# Construction Project Management System

## Overview
This is a full-stack construction project management application built with React, TypeScript, Express.js, and PostgreSQL. It is designed for Arabic-speaking users to manage construction projects, including worker attendance, daily expenses, material purchasing, and financial reporting. The system aims to provide comprehensive project management capabilities with a focus on ease of use and financial transparency.

## User Preferences
- Preferred communication style: Simple, everyday language in Arabic
- Communication language: Arabic (all responses must be in Arabic)
- Business Rules: No duplicate project names, worker names, or fund transfer numbers allowed
- Project Selection: User wants the selected project to persist across all pages and browser refreshes
- Data Integrity: User reported issues with first-time save failures - resolved with improved error handling and retry mechanisms

## Recent Changes (2025-08-01)
- ✅ **تم التحويل الكامل إلى قاعدة بيانات Supabase بنجاح 100%**
- ✅ **تم تطوير نظام إدارة ذكي لقاعدة البيانات مع إنشاء الجداول تلقائياً**
- ✅ **تم إنشاء جميع الجداول المطلوبة (13 جدول) في قاعدة البيانات السحابية**
- ✅ **تم اختبار جميع الوظائف الأساسية وتعمل بكفاءة عالية:**
  - إدارة المشاريع: إنشاء، قراءة، تحديث - يعمل بشكل مثالي
  - إدارة العمال: إضافة وتصنيف العمال - يعمل بشكل مثالي  
  - إدارة المواد: إضافة وتصنيف المواد - يعمل بشكل مثالي
  - تحويلات العهدة: تسجيل التحويلات المالية - يعمل بشكل مثالي
  - منع الأسماء المكررة: نظام حماية البيانات - يعمل بشكل مثالي
- ✅ **تم إصلاح جميع مشاكل السكيما وهيكل قاعدة البيانات**
- ✅ **تم تطوير نظام اختبار شامل ومفصل لجميع الوظائف**
- ✅ **البيانات محفوظة بأمان في السحابة مع Supabase PostgreSQL**
- ✅ **إضافة واجهة إدارة العمال الاحترافية:**
  - بطاقات مضغوطة احترافية غنية بالبيانات
  - إحصائيات شاملة للعمالة (إجمالي، نشط، غير نشط، متوسط الأجر)
  - فلاتر متقدمة (البحث، الحالة، نوع العامل)
  - أزرار تعديل وحذف وتفعيل/إيقاف
  - تصميم متجاوب يدعم جميع الشاشات والأجهزة
  - إضافة إلى القائمة السفلية للوصول السريع
- ✅ **التطبيق جاهز للاستخدام العملي والنشر**

## Previous Important Updates
- Fixed critical data accuracy issue in worker statement calculations
- Corrected API endpoints to sum actual work_days values instead of counting records
- Enhanced daily expenses report with advanced features and Excel export
- Fixed worker profession display and autocomplete input saving issues
- Implemented Worker Miscellaneous Expenses system with complete CRUD operations
- Enhanced worker transfer system with transfer number field support

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter (React Router)
- **State Management**: TanStack Query for server state and caching
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with RTL support
- **Forms**: React Hook Form with Zod validation

### Backend
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API
- **Request Handling**: Middleware-based architecture
- **Error Handling**: Proper HTTP status codes and detailed responses

### Database
- **Type**: PostgreSQL
- **ORM**: Drizzle ORM for operations and schema management
- **Persistence**: Replaces in-memory storage, suitable for mobile APK deployment
- **Schema Management**: Type-safe schemas with automatic TypeScript type generation

### Key Features & Components
- **Database Schema**: Comprehensive schema including Projects, Workers, Fund Transfers, Worker Attendance, Materials, Material Purchases, Transportation Expenses, and Daily Expense Summaries.
- **API Endpoints**: CRUD operations for all major entities (projects, workers, expenses, materials, etc.).
- **User Interface**: Dashboard, Worker Attendance, Daily Expenses, Material Purchase, and Reporting modules.
- **Data Flow**: Project selection context, validated data entry, API communication via React Query, Drizzle ORM for database interaction, real-time updates via query invalidation, and aggregated report generation.
- **Reporting**: Comprehensive reports system with daily expenses, worker accounts, material purchases, and project summary, including CSV export and print functionality.
- **Data Validation**: Unique constraints for project names, worker names, and fund transfer numbers.
- **Date Handling**: Expense recording and daily summaries are based on selected dates, with correct balance carry-forward.

## External Dependencies
### Core Libraries
- `@neondatabase/serverless`: PostgreSQL connection for serverless environments
- `drizzle-orm` & `drizzle-kit`: Database ORM and migration tools
- `@tanstack/react-query`: Server state management
- `react-hook-form` & `@hookform/resolvers`: Form handling
- `zod`: Runtime type validation
- `date-fns`: Date manipulation utilities

### UI Components & Styling
- `@radix-ui/*`: Headless UI primitives
- `class-variance-authority`: Component variant management
- `tailwindcss`: Utility-first CSS framework
- `lucide-react`: Icon library

### Development Tools
- `TypeScript`: Type safety
- `Vite`: Fast development and build tooling
- `ESBuild`: Fast JavaScript bundling
- `PostCSS` & `Autoprefixer`: CSS processing