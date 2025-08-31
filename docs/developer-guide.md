# 💻 دليل المطور - Developer Guide

## 🎯 مقدمة للمطورين

هذا الدليل مخصص للمطورين الذين يريدون فهم النظام والمساهمة في تطويره أو صيانته. النظام مبني بتقنيات حديثة ويتبع أفضل الممارسات في البرمجة.

## 🏗️ هيكل المشروع

### الهيكل العام
```
project-root/
├── 📁 client/                 # Frontend React Application
├── 📁 server/                 # Backend Express Server  
├── 📁 shared/                 # مشاركة الأنواع والمخططات
├── 📁 mobile-app/             # React Native Mobile App
├── 📁 docs/                   # التوثيق الشامل
├── 📄 package.json           # تبعيات المشروع
├── 📄 replit.md              # تاريخ المشروع والتفضيلات
└── 📄 README.md              # معلومات المشروع
```

### Frontend Structure (client/)
```
client/
├── src/
│   ├── components/           # المكونات القابلة للإعادة
│   │   ├── ui/              # مكونات shadcn/ui
│   │   ├── forms/           # نماذج مخصصة
│   │   ├── layout/          # مكونات التخطيط
│   │   └── notifications/   # نظام الإشعارات
│   ├── pages/               # صفحات التطبيق
│   ├── hooks/               # Custom React Hooks
│   ├── lib/                 # مكتبات مساعدة
│   ├── utils/               # أدوات مفيدة
│   ├── types/               # تعريف الأنواع
│   └── styles/              # ملفات CSS
├── public/                  # الملفات العامة
└── index.html              # HTML الرئيسي
```

### Backend Structure (server/)
```
server/
├── auth/                    # نظام المصادقة
│   ├── auth-service.ts     # خدمات المصادقة
│   ├── jwt-utils.ts        # إدارة JWT
│   └── crypto-utils.ts     # التشفير
├── routes/                 # مسارات API
│   ├── auth.ts            # مسارات المصادقة
│   └── api.ts             # مسارات البيانات
├── services/               # خدمات المنطق التجاري
├── middleware/             # البرمجيات الوسيطة
├── db/                     # قاعدة البيانات
│   └── migrations/        # هجرة البيانات
├── index.ts               # نقطة دخول الخادم
├── db.ts                  # إعداد قاعدة البيانات
├── storage.ts             # طبقة الوصول للبيانات
└── routes.ts              # تعريف المسارات
```

## 🛠️ إعداد بيئة التطوير

### المتطلبات الأساسية
```bash
# Node.js 18+ و npm
node --version  # يجب أن يكون >= 18.0.0
npm --version   # يجب أن يكون >= 8.0.0

# Git للتحكم في الإصدار
git --version
```

### إعداد المشروع محلياً
```bash
# 1. تنزيل المشروع
git clone <repository-url>
cd project-directory

# 2. تثبيت التبعيات
npm install

# 3. إعداد متغيرات البيئة
cp .env.example .env
# عدل الملف وأضف قيم حقيقية

# 4. تشغيل في وضع التطوير
npm run dev
```

### أدوات التطوير المطلوبة
```bash
# أدوات VS Code المستحسنة
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension ms-vscode.vscode-typescript-next

# أدوات الفحص والتحليل
npm run lint          # فحص الكود
npm run type-check    # فحص أنواع TypeScript
npm run format        # تنسيق الكود
```

## 🔧 التقنيات والمكتبات

### Frontend Stack
```typescript
// React Ecosystem
"react": "^18.0.0"              // مكتبة UI الرئيسية
"react-dom": "^18.0.0"          // DOM renderer
"typescript": "^5.0.0"          // النوع الآمن

// Styling & UI
"tailwindcss": "^3.3.0"         // CSS utility framework
"@tailwindcss/typography": "^0.5.0"
"tailwindcss-animate": "^1.0.0"
"lucide-react": "^0.263.0"      // مجموعة الأيقونات

// State Management & Data Fetching
"@tanstack/react-query": "^4.0.0"  // إدارة البيانات
"wouter": "^2.8.0"                 // التوجيه البسيط
"react-hook-form": "^7.0.0"        // إدارة النماذج
"zod": "^3.0.0"                    // التحقق من البيانات

// Utilities
"date-fns": "^2.29.0"           // التعامل مع التواريخ
"clsx": "^1.2.0"                // دمج CSS classes
"class-variance-authority": "^0.7.0"  // أنماط متغيرة
```

### Backend Stack
```typescript
// Server Framework
"express": "^4.18.0"            // إطار عمل الخادم
"typescript": "^5.0.0"          // النوع الآمن
"tsx": "^3.12.0"               // تشغيل TypeScript

// Database & ORM  
"drizzle-orm": "^0.28.0"        // ORM حديث وسريع
"@neondatabase/serverless": "^0.4.0"  // عميل قاعدة البيانات
"drizzle-kit": "^0.19.0"       // أدوات إدارة قاعدة البيانات

// Authentication & Security
"jsonwebtoken": "^9.0.0"       // JWT tokens
"bcrypt": "^5.1.0"             // تشفير كلمات المرور
"speakeasy": "^2.0.0"          // TOTP للـ MFA
"express-session": "^1.17.0"   // إدارة الجلسات

// File Processing
"exceljs": "^4.3.0"            // إنشاء ملفات Excel
"jspdf": "^2.5.0"              // إنشاء ملفات PDF
"html2canvas": "^1.4.0"        // تحويل HTML إلى صورة
```

### Database & Infrastructure
```typescript
// Database
"PostgreSQL 15+"               // قاعدة البيانات الرئيسية
"Supabase"                    // منصة قاعدة البيانات السحابية

// Build Tools
"vite": "^4.0.0"              // أداة البناء والتطوير
"@vitejs/plugin-react": "^4.0.0"
"autoprefixer": "^10.4.0"     // CSS prefixes تلقائية
"postcss": "^8.4.0"          // معالج CSS
```

## 📝 أنماط البرمجة والمعايير

### معايير TypeScript
```typescript
// استخدام interfaces للكائنات العامة
interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  createdAt: Date;
}

// استخدام types للأنواع المشتقة
type CreateUserRequest = Omit<User, 'id' | 'createdAt'>;
type UserResponse = Pick<User, 'id' | 'email' | 'name'>;

// استخدام enums للقيم الثابتة
enum UserRole {
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  ACCOUNTANT = 'accountant',
  VIEWER = 'viewer'
}

// استخدام const assertions للكائنات الثابتة
const API_ENDPOINTS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  PROJECTS: '/api/projects'
} as const;
```

### معايير React Components
```typescript
// استخدام FC interface و proper typing
interface ComponentProps {
  title: string;
  isActive?: boolean;
  onAction: (id: string) => void;
  children?: React.ReactNode;
}

const MyComponent: React.FC<ComponentProps> = ({ 
  title, 
  isActive = false, 
  onAction,
  children 
}) => {
  // استخدام custom hooks للمنطق المعقد
  const { data, isLoading, error } = useData();
  
  // استخدام useMemo للحسابات المعقدة
  const processedData = useMemo(() => {
    return data?.map(item => processItem(item));
  }, [data]);
  
  // استخدام useCallback للدوال المرسلة كـ props
  const handleClick = useCallback((id: string) => {
    onAction(id);
  }, [onAction]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="component-container">
      <h2 className="text-xl font-bold">{title}</h2>
      {processedData?.map(item => (
        <ItemComponent 
          key={item.id} 
          item={item} 
          onClick={handleClick}
        />
      ))}
      {children}
    </div>
  );
};

export default MyComponent;
```

### معايير API Routes
```typescript
// استخدام proper error handling و validation
import { Request, Response } from 'express';
import { z } from 'zod';

// تعريف schema للتحقق
const CreateProjectSchema = z.object({
  name: z.string().min(1, 'اسم المشروع مطلوب'),
  location: z.string().min(1, 'موقع المشروع مطلوب'),
  budget: z.number().positive('الميزانية يجب أن تكون موجبة'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

export const createProject = async (req: Request, res: Response) => {
  try {
    // التحقق من البيانات
    const validatedData = CreateProjectSchema.parse(req.body);
    
    // التحقق من الصلاحيات
    const user = req.user; // من middleware
    if (!hasPermission(user, 'CREATE_PROJECT')) {
      return res.status(403).json({
        success: false,
        message: 'لا تملك صلاحية إنشاء مشروع جديد'
      });
    }
    
    // تنفيذ العملية
    const project = await projectService.create(validatedData, user.id);
    
    // إرجاع النتيجة
    res.status(201).json({
      success: true,
      data: project,
      message: 'تم إنشاء المشروع بنجاح'
    });
  } catch (error) {
    // معالجة الأخطاء
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: error.errors
      });
    }
    
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ داخلي في الخادم'
    });
  }
};
```

## 🗄️ إدارة قاعدة البيانات

### استخدام Drizzle ORM
```typescript
// تعريف المخططات في shared/schema.ts
import { pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  budget: integer('budget').notNull(),
  status: text('status').notNull().default('active'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// استخدام في الاستعلامات
import { db } from './db';
import { projects } from '../shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

// استعلام بسيط
const allProjects = await db.select().from(projects);

// استعلام مع شروط
const activeProjects = await db
  .select()
  .from(projects)
  .where(eq(projects.status, 'active'));

// استعلام معقد مع joins
const projectsWithWorkers = await db
  .select({
    project: projects,
    workerCount: sql<number>`count(${workers.id})`
  })
  .from(projects)
  .leftJoin(workers, eq(projects.id, workers.projectId))
  .groupBy(projects.id);
```

### هجرة قاعدة البيانات
```typescript
// إنشاء هجرة جديدة
npm run db:generate

// تطبيق الهجرات
npm run db:migrate

// إعادة تعيين قاعدة البيانات (تطوير فقط)
npm run db:reset
```

## 🔐 نظام المصادقة والأمان

### JWT Token Management
```typescript
// في server/auth/jwt-utils.ts
export const generateTokens = (payload: JWTPayload) => {
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: '15m'
  });
  
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });
  
  return { accessToken, refreshToken };
};

export const verifyToken = (token: string, secret: string) => {
  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

### Middleware للمصادقة
```typescript
// في server/middleware/auth.ts
export const authenticateToken = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const payload = verifyToken(token, JWT_ACCESS_SECRET);
    
    // التحقق من صحة الجلسة
    const session = await getActiveSession(payload.sessionId);
    if (!session) {
      return res.status(401).json({ message: 'Session expired' });
    }
    
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};
```

## 📊 إدارة الحالة والبيانات

### React Query Setup
```typescript
// في client/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 دقائق
      cacheTime: 10 * 60 * 1000,    // 10 دقائق
      retry: (failureCount, error) => {
        // لا تعيد المحاولة للأخطاء 4xx
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      }
    },
    mutations: {
      retry: false,
      onError: (error) => {
        console.error('Mutation error:', error);
        // يمكن إضافة toast notification هنا
      }
    }
  }
});

// API request helper
export const apiRequest = async (url: string, options?: RequestInit) => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`/api${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
};
```

### Custom Hooks للبيانات
```typescript
// في client/src/hooks/useProjects.ts
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => apiRequest('/projects'),
    select: (data) => data.projects as Project[]
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (projectData: CreateProjectRequest) => 
      apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData)
      }),
    onSuccess: () => {
      // تحديث الكاش
      queryClient.invalidateQueries(['projects']);
      
      // إظهار رسالة نجاح
      toast.success('تم إنشاء المشروع بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};
```

## 🎨 تطوير UI Components

### استخدام shadcn/ui
```typescript
// إنشاء مكون جديد باستخدام shadcn
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add data-table

// استخدام المكونات
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ProjectDialog: React.FC<ProjectDialogProps> = ({ 
  open, 
  onOpenChange, 
  project 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {project ? 'تحرير المشروع' : 'مشروع جديد'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="اسم المشروع"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {/* باقي الحقول */}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
            <Button type="submit">
              حفظ
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

### أنماط Tailwind المخصصة
```css
/* في client/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* الألوان المخصصة */
    --primary: 212 100% 48%;      /* أزرق أساسي */
    --primary-foreground: 0 0% 98%;
    --secondary: 147 51% 36%;     /* أخضر ثانوي */
    --muted: 220 13% 91%;         /* رمادي فاتح */
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --radius: 0.5rem;
  }
  
  .dark {
    --primary: 212 100% 48%;
    --primary-foreground: 0 0% 98%;
    /* باقي الألوان للوضع المظلم */
  }
}

@layer components {
  /* مكونات مخصصة */
  .btn-primary {
    @apply bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors;
  }
  
  .card {
    @apply bg-card text-card-foreground border rounded-lg p-6 shadow-sm;
  }
  
  .form-field {
    @apply flex flex-col space-y-2;
  }
  
  .form-label {
    @apply text-sm font-medium text-right;
  }
  
  .form-input {
    @apply px-3 py-2 border rounded-md text-right;
  }
}

@layer utilities {
  /* أدوات RTL */
  .rtl {
    direction: rtl;
  }
  
  .text-ar {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    direction: rtl;
    text-align: right;
  }
}
```

## 🧪 الاختبار والجودة

### إعداد الاختبارات
```typescript
// تثبيت أدوات الاختبار
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

// في vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true
  }
});
```

### مثال على اختبار مكون
```typescript
// في client/src/components/__tests__/ProjectCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectCard } from '../ProjectCard';

describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    name: 'مشروع تجريبي',
    status: 'active' as const,
    budget: 100000,
    workerCount: 5
  };

  const renderWithProvider = (component: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('يعرض معلومات المشروع بشكل صحيح', () => {
    renderWithProvider(<ProjectCard project={mockProject} />);
    
    expect(screen.getByText('مشروع تجريبي')).toBeInTheDocument();
    expect(screen.getByText('5 عمال')).toBeInTheDocument();
    expect(screen.getByText('100,000 ر.ي')).toBeInTheDocument();
  });

  it('يستدعي onEdit عند الضغط على زر التحرير', () => {
    const mockOnEdit = vi.fn();
    
    renderWithProvider(
      <ProjectCard project={mockProject} onEdit={mockOnEdit} />
    );
    
    const editButton = screen.getByRole('button', { name: /تحرير/i });
    fireEvent.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockProject);
  });
});
```

### فحص الكود والتنسيق
```json
// في package.json
{
  "scripts": {
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit"
  }
}
```

## 🚀 البناء والنشر

### البناء للإنتاج
```bash
# بناء المشروع للإنتاج
npm run build

# معاينة البناء محلياً
npm run preview

# فحص حجم الملفات المنتجة
npm run analyze
```

### متغيرات البيئة للإنتاج
```bash
# في .env.production
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-production-key
JWT_ACCESS_SECRET=your-production-secret
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_KEY=your-encryption-key
```

## 📚 موارد إضافية

### الوثائق والمراجع
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [React Query](https://tanstack.com/query/latest)

### أدوات مفيدة للتطوير
```bash
# مولد مكونات سريع
npx create-react-component ComponentName

# فحص الأمان
npm audit

# تحديث التبعيات
npm update

# فحص التبعيات غير المستخدمة
npx depcheck
```

---

**آخر تحديث**: 27 أغسطس 2025  
**مستوى الدليل**: متوسط إلى متقدم  
**الجمهور المستهدف**: مطورين Frontend/Backend