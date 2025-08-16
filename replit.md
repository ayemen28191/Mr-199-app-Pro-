# Overview

This is a comprehensive Arabic construction project management system built as a full-stack web application. The system manages multiple construction projects, tracking workers, materials, expenses, financial transfers, and generating detailed reports. It features a modern React frontend with TypeScript and a Node.js/Express backend using PostgreSQL with Drizzle ORM.

## Recent Updates (August 16, 2025)

- **Fixed Worker Filtering Issue**: Resolved problem where workers weren't displaying in report filters
- **Enhanced Report Tabs**: Improved tab design with gradient colors and better responsive layout
- **Simplified Worker Search**: Replaced complex filter system with straightforward search functionality
- **Better Error Handling**: Added comprehensive error states for empty worker lists and connection issues
- **Visual Improvements**: Added worker count indicators and enhanced UI feedback
- **Enhanced Worker Account Statement**: Added "المتبقي" (Remaining Balance) column to worker attendance tracking
- **Improved Excel Export**: Updated Excel export system to include remaining balance calculations
- **Unified Report Templates**: Refined report templates with better financial tracking and print optimization

# User Preferences

Preferred communication style: Simple, everyday language in Arabic.
Project management approach: Systematic organization with clear documentation.
Code organization: DRY principle (Don't Repeat Yourself) with unified components.
Architecture philosophy: Beginner-friendly structure with centralized control points.

# System Architecture

## Frontend Architecture

- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Library**: Shadcn/UI components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with RTL (right-to-left) support for Arabic content
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: React Router for client-side navigation
- **Forms**: React Hook Form with Zod validation for type-safe forms

## Backend Architecture

- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based auth with bcrypt password hashing
- **API Design**: RESTful endpoints with comprehensive CRUD operations

## Database Design

The system uses PostgreSQL with a comprehensive schema including:

### Core Entities
- **Projects**: Construction project management with financial tracking
- **Workers**: Employee management with different skill types and daily wages
- **Materials**: Construction materials inventory and purchasing
- **Suppliers**: Vendor management for material purchases

### Financial Tracking
- **Fund Transfers**: Money transfers to projects from external sources
- **Worker Attendance**: Daily work tracking with wage calculations
- **Material Purchases**: Purchase orders and inventory management
- **Daily Expense Summaries**: Automatic financial reconciliation per project per day
- **Worker Transfers**: Money transfers to workers and their families

### Advanced Features
- **Autocomplete System**: Smart suggestions for frequently used data
- **Print Settings**: Customizable report printing configurations
- **Backup System**: Automated data backup and recovery

## Key Architectural Decisions

### Database Schema Strategy
- **Normalized Design**: Separate tables for related entities to ensure data integrity
- **UUID Primary Keys**: Using UUIDs instead of auto-incrementing integers for better distributed system support
- **Audit Trail**: Created/updated timestamps on all major entities
- **Financial Integrity**: Automatic calculation of balances and daily summaries

### Performance Optimizations
- **Indexed Queries**: Strategic database indexes for frequently accessed data
- **Batch Operations**: Bulk insert/update operations for better performance
- **Cached Calculations**: Daily summaries to avoid expensive real-time calculations
- **Optimistic Updates**: Client-side optimistic updates for better UX

### Security Measures
- **Session-based Authentication**: Secure session management with express-session
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **Input Validation**: Comprehensive validation using Zod schemas
- **SQL Injection Prevention**: Parameterized queries through Drizzle ORM

### Reporting System
- **Multi-format Export**: PDF, Excel, and print-optimized HTML reports
- **Template-based**: Unified report templates for consistent formatting
- **Arabic RTL Support**: Proper right-to-left text layout for Arabic content
- **Print Optimization**: A4 page formatting with proper margins and page breaks

### Enhanced Report Components (Latest Update)
- **Worker Statement Template**: `client/src/reports/templates/worker-statement-template.tsx`
  - Added comprehensive remaining balance calculations for worker attendance
  - Improved error handling with null safety checks for all data properties
  - Enhanced table structure with 7 columns: التاريخ، اليوم، الحالة، الأجر المستحق، المدفوع، المتبقي، ملاحظات
  
- **Excel Export System**: `client/src/reports/export/unified-excel-exporter.ts`
  - Updated to include remaining balance column in attendance tracking
  - Enhanced data formatting with proper Arabic currency display
  - Improved table sizing and cell formatting for better readability
  
- **Print Styles**: `client/src/styles/unified-print-styles.css`
  - Comprehensive A4 print formatting with Arabic text optimization
  - Professional table styling with alternating row colors
  - Currency and number formatting for financial data display
  
- **Report Templates**: `client/src/components/unified-report-template.tsx`
  - Reusable components for consistent report formatting
  - Professional header and footer sections
  - Responsive grid layouts for report information display

## External Dependencies

### Primary Technologies
- **Database**: PostgreSQL (via Supabase or Neon Database)
- **ORM**: Drizzle ORM with TypeScript support
- **Authentication**: bcrypt for password hashing
- **Session Management**: express-session with connect-pg-simple

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Modern icon library
- **React Hook Form**: Form state management
- **TanStack Query**: Server state synchronization

### Development Tools
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety across the entire application
- **Tailwind CSS**: Utility-first CSS framework
- **ESLint/Prettier**: Code quality and formatting

### Reporting Libraries
- **ExcelJS**: Excel file generation
- **jsPDF**: PDF generation capabilities
- **html2canvas**: HTML to image conversion for reports

### Deployment & Infrastructure
- **Replit**: Development and hosting environment
- **PostgreSQL**: Primary database system
- **Node.js**: Server runtime environment

The architecture supports a scalable, maintainable construction management system with robust financial tracking, comprehensive reporting, and an intuitive Arabic-language interface optimized for construction industry workflows.