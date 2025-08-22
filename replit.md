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

## Mobile Application (React Native)

### Recent Changes (August 22, 2025)
- **✅ Created Expo React Native App**: Full Arabic mobile application with professional UI
- **✅ EAS Build Configuration**: Ready for APK/AAB generation with eas.json setup
- **✅ Arabic UI Components**: RTL support with Material Design and Arabic typography
- **✅ Sample Project Management**: Interactive project list with add/refresh functionality
- **✅ Build Instructions**: Complete guide for APK generation outside Replit environment

### Mobile Architecture
- **Technology Stack**: React Native with Expo, TypeScript
- **Build System**: EAS Build for APK/AAB generation
- **UI Framework**: React Native core components with custom Arabic styling
- **Navigation**: Stack-based navigation with Arabic RTL support
- **State Management**: React hooks with local state management
- **File Structure**: 
  - `expo-app/ConstructionApp/App.tsx` (main application)
  - `expo-app/ConstructionApp/eas.json` (build configuration)
  - `expo-app/ConstructionApp/app.json` (app metadata)
  - `expo-app/ConstructionApp/BUILD_INSTRUCTIONS.md` (detailed build guide)

### Features Implemented
- **Project List Display**: Shows construction projects with Arabic names and status
- **Add New Project**: Interactive button to create test projects
- **Refresh Functionality**: Pull-to-refresh style data loading
- **Status Indicators**: Visual connection status with color-coded indicators
- **Arabic Typography**: Proper Arabic text rendering and RTL layout
- **Material Design**: Professional mobile interface with shadows and animations

### Build Process
- **Local Development**: Requires Node.js and Expo CLI on user's machine
- **Cloud Build**: EAS Build service for APK generation (10-15 minutes)
- **Testing**: Expo Go app for immediate testing during development
- **Distribution**: Direct APK installation or app store deployment

## External Dependencies
- **Database**: Supabase PostgreSQL
- **Frontend Libraries**: React.js, TypeScript, Tailwind CSS, shadcn/ui, React Query (@tanstack/react-query), Wouter, React Hook Form, Zod
- **Backend Libraries**: Express.js, TypeScript, Drizzle ORM
- **Mobile Libraries**: React Native, Expo SDK, @supabase/supabase-js (for mobile), @react-native-async-storage/async-storage
- **Export Libraries**: ExcelJS, jsPDF
- **Build Tools**: Vite (web), EAS Build (mobile)