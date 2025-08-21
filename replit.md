# نظام إدارة المشاريع الإنشائية باللغة العربية

## Overview
A comprehensive construction project management system designed specifically for the Middle East with a full Arabic interface. It provides advanced financial management tools with accurate data tracking, focusing on responsive design and mobile-friendly interfaces. The project's vision is to offer advanced features like a QR Scanner system for tools, an Advanced Analytics Dashboard, AI-powered predictive maintenance, tool location and movement tracking, and smart notifications for maintenance and warranty.

## User Preferences
- **اللغة**: العربية في جميع الردود والملاحظات
- **التوجه**: RTL support كامل
- **التصميم**: Material Design مع ألوان مناسبة للثقافة العربية
- **التواصل**: استخدام اللغة العربية في جميع التفاعلات والتوجيهات
- **طريقة التطوير**: العمل المستقل والشامل مع حلول مفصلة باللغة العربية

## System Architecture

### Frontend
- **Technology Stack**: React.js with TypeScript, Tailwind CSS with shadcn/ui for styling, React Query for state management, Wouter for routing, React Hook Form with Zod for forms.
- **Direction**: RTL (Right-to-Left) for full Arabic support.
- **Navigation**: Bottom Navigation with a Floating Add Button.
- **Core Pages**: Dashboard, Projects, Workers, Worker Attendance, Daily Expenses, Material Purchase, Tools Management, Reports.
- **Advanced Features**: QR Scanner for tools, Advanced Analytics Dashboard, AI Predictive Maintenance, Tool Location Tracking, Smart Maintenance/Warranty Notifications, Intelligent Recommendations Engine, Smart Performance Optimizer, Advanced Notification System.
- **UI/UX Decisions**: Unified and consistent interfaces across the system, optimized screen space, consistent design pattern for statistics using separate rows with 2 columns each (two separate div grids with grid-cols-2), Material Design principles with culturally appropriate colors.

### Backend
- **Technology Stack**: Express.js with TypeScript.
- **API**: RESTful APIs with validation.
- **Authentication**: Express sessions.
- **File Structure**: `server/index.ts` (server entry point), `server/routes.ts` (API endpoints), `server/storage.ts` (data access layer), `server/db.ts` (database setup).

### Database
- **Technology**: Supabase PostgreSQL.
- **ORM**: Drizzle ORM.
- **Key Tables**: `users`, `projects`, `workers`, `worker_attendance`, `fund_transfers`, `material_purchases`, `transportation_expenses`, `worker_transfers`, `suppliers`, `supplier_payments`, `notification_read_states`.

### Technical Implementations
- **Project Management**: Create, edit, delete projects; track project status (active, completed, paused); comprehensive financial statistics per project.
- **Worker Management**: Worker registration by type; daily wage tracking; advanced attendance system; family remittances management.
- **Financial Management**: Various fund transfers; daily expense tracking; material and tool purchases; transportation expenses; supplier account management.
- **Reporting & Export**: Comprehensive financial reports; data export to Excel (using ExcelJS); report printing as PDF (using jsPDF).
- **Security**: Bcrypt encryption (SALT_ROUNDS = 12), SQL injection protection with Drizzle ORM, secure session management, Zod schema data validation.

## External Dependencies
- **Database**: Supabase PostgreSQL
- **Frontend Libraries**: React.js, TypeScript, Tailwind CSS, shadcn/ui, React Query (@tanstack/react-query), Wouter, React Hook Form, Zod
- **Backend Libraries**: Express.js, TypeScript, Drizzle ORM
- **Export Libraries**: ExcelJS, jsPDF
- **Build Tool**: Vite