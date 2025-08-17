# Overview

This is a comprehensive Arabic construction project management system built as a full-stack web application. The system manages multiple construction projects, tracking workers, materials, expenses, financial transfers, and generating detailed reports. It aims to provide robust financial tracking, comprehensive reporting, and an intuitive Arabic-language interface optimized for construction industry workflows.

# User Preferences

Preferred communication style: Simple, everyday language in Arabic. All responses and communication must be in Arabic. All AI responses and notes must be in Arabic.
Project management approach: Systematic organization with clear documentation.
Code organization: DRY principle (Don't Repeat Yourself) with unified components.
Architecture philosophy: Beginner-friendly structure with centralized control points.

# System Architecture

## Frontend Architecture

- **Framework**: React 18 with TypeScript and Vite
- **UI Library**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS with RTL (right-to-left) support for Arabic content
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: React Router
- **Forms**: React Hook Form with Zod validation

## Backend Architecture

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM
- **Authentication**: Session-based auth with bcrypt
- **API Design**: RESTful endpoints with CRUD operations

## Database Design

The system uses PostgreSQL with a comprehensive schema for:

### Core Entities
- **Projects**: Construction project management and financial tracking
- **Workers**: Employee management with skill types and daily wages
- **Materials**: Construction materials inventory and purchasing
- **Suppliers**: Vendor management

### Financial Tracking
- **Fund Transfers**: Money transfers to projects
- **Worker Attendance**: Daily work tracking and wage calculations
- **Material Purchases**: Purchase orders and inventory
- **Daily Expense Summaries**: Automatic financial reconciliation
- **Worker Transfers**: Money transfers to workers

### Advanced Features
- **Autocomplete System**: Smart suggestions for data
- **Print Settings**: Customizable report printing
- **Backup System**: Automated data backup

## Key Architectural Decisions

### Database Schema Strategy
- **Normalized Design**: Separate tables for data integrity
- **UUID Primary Keys**: For distributed system support
- **Audit Trail**: Created/updated timestamps
- **Financial Integrity**: Automatic balance calculations

### Performance Optimizations
- **Indexed Queries**: Strategic database indexes
- **Batch Operations**: Bulk insert/update
- **Cached Calculations**: Daily summaries
- **Optimistic Updates**: Client-side for better UX

### Security Measures
- **Session-based Authentication**: Secure session management
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Comprehensive Zod schemas
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM

### Reporting System
- **Multi-format Export**: PDF, Excel, and print-optimized HTML reports
- **Template-based**: Unified report templates for consistent formatting
- **Professional Daily Expense Reports**: Matching industry standards, including company headers.
- **Streamlined UI**: Clean interface with consistent design.
- **Excel-Style Integration**: Reports unified to match Excel templates with professional design (blue header, green totals, alternating row colors, 11 columns in worker filter report).
- **Enhanced Export & Print Functions**: Professional Excel export with ExcelJS and enhanced print layouts with custom CSS and A4 formatting.
- **Unified Currency & Date Formatting**: Consistent currency display ("ريال"), company branding, and professional headers.
- **Enhanced Report Headers**: Company header "شركة الفتحي للمقاولات والاستشارات الهندسية", print date display, blue main table headers with white text, and inclusion of zero-payment workers in reports for complete tracking.

### UI/UX Decisions
- **RTL Support**: Full right-to-left support for Arabic content.
- **Unified Components**: Consistent design for project selectors, statistics cards (StatsCard), and floating action buttons across the application.
- **Professional Styling**: Gradient designs, shadow effects, color-coded icons, and optimized layouts for better user experience and information hierarchy.
- **Space Optimization**: Reduced card heights, smaller text, and icons for better space utilization.
- **Responsive Layout**: Optimized for various screen sizes.

# External Dependencies

### Primary Technologies
- **Database**: PostgreSQL (via Supabase or Neon Database)
- **ORM**: Drizzle ORM
- **Authentication**: bcrypt
- **Session Management**: express-session with connect-pg-simple

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **React Hook Form**: Form state management
- **TanStack Query**: Server state synchronization

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **ESLint/Prettier**: Code quality and formatting

### Reporting Libraries
- **ExcelJS**: Excel file generation
- **jsPDF**: PDF generation
- **html2canvas**: HTML to image conversion

### Deployment & Infrastructure
- **Replit**: Development and hosting environment
- **Node.js**: Server runtime environment