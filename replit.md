# نظام إدارة المشاريع الإنشائية باللغة العربية

## Overview
A comprehensive construction project management system designed for the Middle East, featuring a full Arabic interface. Its primary purpose is to provide advanced financial management tools, accurate data tracking, and responsive design optimized for mobile. The system aims to integrate advanced features such as QR scanning for tools, an AI-powered predictive maintenance dashboard, tool location tracking, and smart notifications for maintenance and warranty. The vision is to offer a robust, intelligent platform that provides data-driven insights and recommendations for efficient project execution.

## User Preferences
- **اللغة**: العربية في جميع الردود والملاحظات
- **التوجه**: RTL support كامل
- **التصميم**: Material Design مع ألوان مناسبة للثقافة العربية
- **التواصل**: استخدام اللغة العربية في جميع التفاعلات والتوجيهات
- **طريقة التطوير**: العمل المستقل والشامل مع حلول مفصلة باللغة العربية

## System Architecture

### Frontend
- **Technology Stack**: React.js with TypeScript, Tailwind CSS with shadcn/ui, React Query, Wouter, React Hook Form with Zod.
- **UI/UX Decisions**: Full RTL (Right-to-Left) support, bottom navigation with a floating add button, consistent Material Design principles, optimized screen space, and culturally appropriate color schemes.
- **Core Features**: Dashboard, Projects, Workers, Worker Attendance, Daily Expenses, Material Purchase, Tools Management, and Reports.
- **Advanced Features**: QR Scanner for tools, Advanced Analytics Dashboard, AI Predictive Maintenance, Tool Location Tracking, Smart Maintenance/Warranty Notifications, Intelligent Recommendations Engine, Smart Performance Optimizer, and an Advanced Notification System.

### Backend
- **Technology Stack**: Express.js with TypeScript.
- **API**: RESTful APIs with robust validation.
- **Authentication**: JWT-based authentication for secure session management.
- **Core Functionality**: Project management (create, edit, delete, track status), worker management (registration, wage tracking, attendance, remittances), financial management (fund transfers, expenses, purchases, supplier accounts), and comprehensive reporting with Excel/PDF export.
- **Security**: Bcrypt encryption (SALT_ROUNDS = 12), SQL injection protection via Drizzle ORM, secure session management, Zod schema validation, and an automated secret key management system.
- **Smart System**: Integrated intelligent features for data analysis and generating smart decisions and recommendations.

### Database
- **Technology**: Supabase PostgreSQL with Drizzle ORM.
- **Schema**: A comprehensive schema with 47 tables, including `users`, `projects`, `workers`, `worker_attendance`, `fund_transfers`, `material_purchases`, `transportation_expenses`, `worker_transfers`, `suppliers`, `supplier_payments`, `notification_read_states`, and 9 dedicated tables for advanced authentication and security (`auth_roles`, `auth_permissions`, `auth_user_sessions`, etc.).

### Mobile Application
- **Technology Stack**: React Native with Expo 52.0, TypeScript, React Navigation.
- **Functionality**: 100% identical to the web application in features and design, including RTL support and Arabic UI.
- **Screens**: 26 screens covering all main and sub-screens (e.g., Dashboard, Projects, Workers, Suppliers, Daily Expenses, Material Purchase).
- **Data Synchronization**: Direct connection to the same Supabase database, ensuring real-time synchronization with the web application.

### Secret Key Management System
- **Functionality**: Automatically checks for and adds missing required secret keys (JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY) at server startup, ensuring secure values are always present.
- **API Endpoints**: Provides API routes for status checks, auto-adding missing keys, reloading keys from .env, and adding new required keys.

## External Dependencies
- **Database**: Supabase PostgreSQL
- **Frontend Libraries**: React.js, TypeScript, Tailwind CSS, shadcn/ui, React Query (@tanstack/react-query), Wouter, React Hook Form, Zod
- **Backend Libraries**: Express.js, TypeScript, Drizzle ORM, jsonwebtoken, bcrypt
- **Mobile Libraries**: React Native, Expo SDK, @supabase/supabase-js, @react-native-async-storage/async-storage, speakeasy
- **Export Libraries**: ExcelJS, jsPDF
- **Build Tools**: Vite (web), EAS Build (mobile)
- **Security & Utilities**: crypto (Node.js built-in), dotenv