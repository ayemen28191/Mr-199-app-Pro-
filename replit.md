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