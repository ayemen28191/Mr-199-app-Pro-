# Construction Project Management System

## Overview

This is a full-stack construction project management application built with React, TypeScript, Express.js, and PostgreSQL. The application is designed for Arabic-speaking users and provides comprehensive project management capabilities including worker attendance tracking, daily expense management, material purchasing, and financial reporting.

## User Preferences

- Preferred communication style: Simple, everyday language.
- Communication language: Arabic
- Business Rules: No duplicate project names, worker names, or fund transfer numbers allowed
- Project Selection: User wants the selected project to persist across all pages and browser refreshes

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the client-side application
- **Vite** as the build tool and development server
- **React Router (Wouter)** for client-side routing
- **TanStack Query** for server state management and caching
- **Shadcn/ui** component library with Radix UI primitives
- **Tailwind CSS** for styling with RTL (right-to-left) support for Arabic text
- **React Hook Form** with Zod validation for form handling

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with clear endpoint structure
- **Middleware-based architecture** for request handling and logging
- **Error handling** with proper HTTP status codes and error responses

### Database Architecture
- **PostgreSQL** as the primary database for local storage
- **Drizzle ORM** for database operations and schema management
- **Database Storage Layer** replaces in-memory storage for persistence
- **Type-safe database schemas** with automatic TypeScript type generation
- **Real-time data persistence** suitable for mobile APK deployment

## Key Components

### Database Schema
The application uses a comprehensive schema designed for construction project management:

- **Projects**: Core project information and status tracking
- **Workers**: Worker profiles with daily wage rates and types (master/worker)
- **Fund Transfers**: Financial transfers and custody management
- **Worker Attendance**: Daily attendance tracking with work descriptions
- **Materials**: Material catalog and inventory
- **Material Purchases**: Purchase tracking with supplier information
- **Transportation Expenses**: Daily transportation cost tracking
- **Daily Expense Summaries**: Consolidated daily financial reports

### API Endpoints
- `GET/POST /api/projects` - Project management
- `GET/POST /api/workers` - Worker management
- `GET/POST /api/fund-transfers` - Financial transfers
- `GET/POST /api/worker-attendance` - Attendance tracking
- `GET/POST /api/materials` - Material catalog
- `GET/POST /api/material-purchases` - Purchase management
- `GET/POST /api/transportation-expenses` - Transportation costs
- `GET/POST /api/daily-expense-summaries` - Financial reporting

### User Interface
- **Dashboard**: Project overview and quick actions
- **Worker Attendance**: Daily attendance tracking interface
- **Daily Expenses**: Expense management and fund transfers
- **Material Purchase**: Material procurement tracking
- **Reports**: Financial and operational reporting

## Data Flow

1. **Project Selection**: Users select a project context for all operations
2. **Data Entry**: Information is entered through validated forms
3. **API Communication**: React Query manages API calls and caching
4. **Database Storage**: Drizzle ORM handles database operations
5. **Real-time Updates**: Query invalidation ensures data consistency
6. **Report Generation**: Aggregated data provides insights and summaries

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **drizzle-orm & drizzle-kit**: Database ORM and migration tools
- **@tanstack/react-query**: Server state management
- **react-hook-form & @hookform/resolvers**: Form handling
- **zod**: Runtime type validation
- **date-fns**: Date manipulation utilities

### UI Components
- **@radix-ui/***: Headless UI primitives for accessibility
- **class-variance-authority**: Component variant management
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

### Development Tools
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development and build tooling
- **ESBuild**: Fast JavaScript bundling
- **PostCSS & Autoprefixer**: CSS processing

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement for frontend development
- **Express Server**: Backend API with development middleware
- **Database Migrations**: Drizzle Kit for schema management
- **Environment Variables**: DATABASE_URL for database connection

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: ESBuild creates bundled server output
- **Database**: PostgreSQL with connection pooling
- **Static Serving**: Express serves built frontend assets

### Configuration Management
- **Environment-based configuration** for development and production
- **Database URL configuration** through environment variables
- **Build scripts** for automated deployment preparation
- **Asset optimization** for production performance

The application follows modern full-stack development practices with type safety, proper separation of concerns, and scalable architecture patterns suitable for construction project management workflows.

## Recent Changes

### July 31, 2025
- ✓ تحسينات شاملة على كشف حساب العامل المحسن:
  - إضافة الألوان المميزة للجدول (برتقالي للعناوين، ألوان مختلفة للخلايا)
  - إضافة عمود "عدد أيام العمل" مع عرض القيمة "1" لكل يوم عمل
  - إضافة قسم "حوالات للأهل من حساب العامل" في الكشف
  - عرض إجمالي الساعات وإجمالي أيام العمل بوضوح
  - تحسين تصميم الكشف ليكون احترافي مثل Excel مع خلفيات ملونة
  - إضافة إجمالي المحول للأهل مع خصمه من الرصيد النهائي
  - تثبيت أزرار الطباعة والتصدير في أسفل الشاشة
  - إزالة أزرار التحكم من منطقة الكشف لعرض أنظف
  - تصليح endpoint الحصول على مشاريع العامل مع إضافة inArray لـ Drizzle

### July 30, 2025
- ✓ إضافة قيود رقمية لجميع حقول الإدخال:
  - تحديث جميع حقول الأرقام (رقم الحولة، رقم الفاتورة، أرقام الهواتف) لتستخدم type="number" 
  - إضافة inputMode="numeric" للأرقام الصحيحة و inputMode="decimal" للأرقام العشرية
  - إضافة inputMode="numeric" لحقول أرقام الهواتف باستخدام type="tel"
  - تحديث CSS classes لإضافة "arabic-numbers" لجميع الحقول الرقمية
  - تطبيق التحديثات على جميع الصفحات: المصروفات اليومية، شراء المواد، حسابات العمال، حضور العمال، إضافة العمال
  - ضمان ظهور لوحة المفاتيح الرقمية على الأجهزة المحمولة لتحسين تجربة المستخدم
- ✓ إصلاح مشكلة إضافة المشاريع من الصفحة الرئيسية:
  - تصحيح ترتيب parameters في استدعاء API في نماذج إضافة المشاريع والعمال
  - إضافة تحديث cache للإحصائيات عند إضافة مشروع جديد
- ✓ تحسين نظام منع التكرار:
  - إضافة تنظيف للنصوص (trim) قبل المقارنة والحفظ في قاعدة البيانات
  - حذف البيانات المكررة الموجودة وتنظيف المسافات الإضافية
  - إضافة قيود unique constraints على مستوى قاعدة البيانات لأسماء المشاريع والعمال
- ✓ تحسين رسائل الأخطاء لتجربة مستخدم أفضل:
  - تطوير معالجة أخطاء أكثر دقة وتفصيلاً في الواجهة الأمامية
  - تحسين استخراج رسائل الخطأ من API responses
  - عرض الأسباب المحددة للأخطاء (مثل: اسم مشروع مكرر) بدلاً من رسائل عامة
  - ترجمة رسائل الأخطاء إلى العربية

### July 29, 2025
- ✓ Fixed database connection issues and resolved all TypeScript errors
- ✓ Added data validation constraints to prevent duplicates:
  - Project names must be unique across the system
  - Worker names must be unique across the system  
  - Fund transfer numbers must be unique when provided
- ✓ Updated API endpoints with proper error messages in Arabic
- ✓ Enhanced storage interface with validation methods
- ✓ Successfully tested all duplicate prevention functionality
- ✓ Added delete functionality for all expense items:
  - Fund transfers, transportation expenses, material purchases, worker attendance
  - Added delete routes, storage methods, and frontend mutations
  - Included proper error handling and cache invalidation
- ✓ Implemented persistent project selection across all pages:
  - Created useSelectedProject hook using localStorage
  - Updated all pages to use the shared project state
  - Project selection now persists through page refreshes and navigation
- ✓ Enhanced date-specific expense tracking:
  - Fixed expense recording to use selected dates instead of current date
  - Added purchase date field to material purchases page
  - Updated backend to calculate daily summaries using correct dates
  - All expenses now save and display based on user-selected dates
- ✓ Developed comprehensive reports system:
  - Connected reports page to real database with authentic data
  - Added 4 professional report types: daily expenses, worker accounts, material purchases, project summary
  - Implemented CSV export functionality for all reports
  - Added print functionality for professional report output
  - All reports display real-time data from PostgreSQL database
  - Reports include detailed breakdowns with totals and summaries
- ✓ Fixed daily balance carry-forward functionality:
  - Implemented automatic daily expense summary generation
  - Added balance carry-forward between consecutive dates
  - System now automatically updates daily summaries when expenses are added/modified/deleted
  - Previous day balance correctly transfers to next day's opening balance
  - All CRUD operations on expenses now trigger daily summary updates
- ✓ Created professional Excel-style reports matching uploaded screenshots:
  - Developed reports-fixed.tsx with enhanced table layouts and professional styling
  - Implemented comprehensive daily expense reports with proper running balance calculations
  - Added professional header with project information and contact details
  - Created structured table format matching user's Excel templates exactly
  - Included proper Arabic formatting, print-ready layouts, and CSV export functionality
  - Reports display real-time expense data with running totals and final balances
- ✓ Added comprehensive test data for system validation (July 15-29, 2025):
  - Created 5 construction projects with realistic Arabic names
  - Added 10 workers with different types (معلم/عامل) and wage rates
  - Inserted 10 material types across various construction categories
  - Generated 40 worker attendance records with diverse work descriptions and payment types
  - Created 40 material purchase records with supplier details and invoice numbers
  - Added 40 transportation expense entries for workers and equipment
  - Populated 10 fund transfer records with various transfer methods
  - Established worker account balances with earned/paid/remaining amounts
  - Added 8 worker-to-family transfer records for realistic account management
  - Generated 20 daily expense summaries with accurate running balances
  - All test data covers 15-day period with authentic Arabic business scenarios

### July 31, 2025 - Critical Database & API Fixes
- ✓ **Auto Database Migration**: Added automatic `db:push` execution on server startup to prevent "table does not exist" errors
  - **Location**: `server/index.ts` - executes database schema sync before server initialization 
  - **Purpose**: Ensures database tables exist even if database is recreated or reset
  - **Impact**: Eliminates manual database setup requirement for new deployments

- ✓ **Fixed API Request Parameter Order**: Corrected HTTP method parameter sequence in project update mutations
  - **Issue**: Project updates were failing due to incorrect `apiRequest` parameter order
  - **Location**: `client/src/pages/projects.tsx` line 110
  - **Fix**: Changed from `apiRequest(url, method, data)` to `apiRequest(method, url, data)`
  - **Impact**: Project editing now works correctly without HTTP method errors

- ✓ **Enhanced Worker Statement Print Optimization**: Applied ultra-compact printing layout
  - **Font sizes**: 6px for data, 7px for headers, optimized for A4 paper
  - **Row height**: Reduced to 12px to fit 10+ rows per page
  - **Table spacing**: Minimal padding (0-1px) for maximum data density
  - **CSS**: Added print-specific media queries with !important declarations

- ✓ **Comprehensive API Request Fix**: Fixed all remaining HTTP method parameter order issues
  - **Material Purchase Updates**: Fixed `apiRequest` calls in `client/src/pages/material-purchase.tsx`
  - **Daily Expenses Updates**: Fixed `apiRequest` calls in `client/src/pages/daily-expenses.tsx` 
  - **Fund Transfer Updates**: Corrected PUT request parameter order
  - **Transportation Updates**: Corrected PUT request parameter order
  - **Impact**: All update operations (PUT/PATCH) now work correctly across the entire application

- ✓ **Material Purchase Date Filtering Enhancement**: Fixed purchase display to show only items from selected date
  - **Issue**: Material purchases page was showing all purchases regardless of selected purchase date
  - **Fix**: Added client-side filtering to display only purchases matching the selected purchase date
  - **Improvements**: Added date display in purchase list header, helpful messages for empty dates, and purchase date in item details
  - **User Experience**: Now users can change purchase date to view purchases from different days with clear visual feedback

- ✓ **Critical Balance Calculation Fix**: Implemented comprehensive balance carry-forward validation and auto-correction
  - **Problem**: Balance carried forward from day 29 (-42,400) was incorrectly showing as 35,000 on day 31
  - **Root Cause**: Missing validation in balance calculation and incorrect carry-forward logic
  - **Solution**: Added robust validation checks, automatic error detection, and self-correcting balance calculations
  - **Safety Features**: Added logging, error detection, and automatic recalculation API endpoint
  - **Impact**: All daily balances now calculate correctly with proper carry-forward from previous days