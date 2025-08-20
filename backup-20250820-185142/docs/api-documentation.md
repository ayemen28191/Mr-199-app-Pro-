# 📡 توثيق API نظام إدارة الأدوات والمعدات

## 🎯 نظرة عامة
هذا المستند يحتوي على توثيق شامل لجميع APIs المتعلقة بنظام إدارة الأدوات والمعدات.

## 🔧 APIs الأدوات الرئيسية

### 1. جلب جميع الأدوات
```http
GET /api/tools
```

**الاستجابة:**
```json
[
  {
    "id": "uuid",
    "sku": "string",
    "name": "string",
    "description": "string",
    "categoryId": "uuid",
    "projectId": "uuid",
    "unit": "string",
    "purchasePrice": 0,
    "currentValue": 0,
    "purchaseDate": "YYYY-MM-DD",
    "warrantyExpiry": "YYYY-MM-DD",
    "status": "available|in_use|maintenance|damaged|retired",
    "condition": "excellent|good|fair|poor|damaged",
    "locationType": "string",
    "locationId": "string",
    "serialNumber": "string",
    "barcode": "string",
    "qrCode": "string",
    "specifications": {},
    "usageCount": 0,
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

### 2. إضافة أداة جديدة
```http
POST /api/tools
Content-Type: application/json
```

**البيانات المطلوبة:**
```json
{
  "name": "string (مطلوب)",
  "description": "string",
  "categoryId": "uuid",
  "projectId": "uuid",
  "sku": "string",
  "unit": "string (افتراضي: قطعة)",
  "purchasePrice": number,
  "currentValue": number,
  "depreciationRate": number,
  "purchaseDate": "YYYY-MM-DD",
  "warrantyExpiry": "YYYY-MM-DD",
  "maintenanceInterval": number,
  "status": "available|in_use|maintenance|damaged|retired",
  "condition": "excellent|good|fair|poor|damaged",
  "locationType": "string",
  "locationId": "string",
  "serialNumber": "string",
  "barcode": "string",
  "specifications": {}
}
```

### 3. تحديث أداة
```http
PUT /api/tools/:id
Content-Type: application/json
```

**المعاملات:**
- `id`: معرف الأداة (UUID)

**البيانات:** نفس بيانات الإضافة

### 4. حذف أداة
```http
DELETE /api/tools/:id
```

**المعاملات:**
- `id`: معرف الأداة (UUID)

### 5. جلب تفاصيل أداة واحدة
```http
GET /api/tools/:id
```

**المعاملات:**
- `id`: معرف الأداة (UUID)

## 📊 APIs الإحصائيات

### 1. إحصائيات الأدوات العامة
```http
GET /api/tools/stats
```

**الاستجابة:**
```json
{
  "totalTools": number,
  "availableTools": number,
  "inUseTools": number,
  "maintenanceTools": number,
  "damagedTools": number,
  "totalValue": number,
  "categoriesCount": number
}
```

### 2. تقرير الاستخدام
```http
GET /api/tools/usage-report/:days/:category
```

**المعاملات:**
- `days`: عدد الأيام (number)
- `category`: معرف التصنيف أو "all"

**الاستجابة:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "category": "string",
    "usageCount": number,
    "lastUsed": "timestamp",
    "status": "string",
    "location": "string"
  }
]
```

### 3. إحصائيات التصنيفات
```http
GET /api/tools/categories-stats/:days
```

**المعاملات:**
- `days`: عدد الأيام (number)

## 📂 APIs تصنيفات الأدوات

### 1. جلب جميع التصنيفات
```http
GET /api/tool-categories
```

**الاستجابة:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "icon": "string",
    "color": "string",
    "parentId": "uuid",
    "isActive": boolean,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

### 2. إضافة تصنيف جديد
```http
POST /api/tool-categories
Content-Type: application/json
```

**البيانات المطلوبة:**
```json
{
  "name": "string (مطلوب)",
  "description": "string",
  "icon": "string",
  "color": "string",
  "parentId": "uuid"
}
```

### 3. تحديث تصنيف
```http
PUT /api/tool-categories/:id
Content-Type: application/json
```

### 4. حذف تصنيف
```http
DELETE /api/tool-categories/:id
```

## 🚛 APIs حركات الأدوات

### 1. جلب حركات أداة
```http
GET /api/tool-movements/:toolId
```

**المعاملات:**
- `toolId`: معرف الأداة (UUID)

**الاستجابة:**
```json
[
  {
    "id": "uuid",
    "toolId": "uuid",
    "movementType": "purchase|transfer|return|consume|adjust|maintenance|lost",
    "quantity": number,
    "fromType": "warehouse|project|external|supplier|none",
    "fromId": "uuid",
    "toType": "warehouse|project|external|maintenance|none",
    "toId": "uuid",
    "projectId": "uuid",
    "reason": "string",
    "notes": "string",
    "referenceNumber": "string",
    "performedBy": "string",
    "performedAt": "timestamp"
  }
]
```

### 2. إضافة حركة جديدة
```http
POST /api/tool-movements
Content-Type: application/json
```

**البيانات المطلوبة:**
```json
{
  "toolId": "uuid (مطلوب)",
  "movementType": "string (مطلوب)",
  "quantity": number,
  "fromType": "string",
  "fromId": "uuid",
  "toType": "string",
  "toId": "uuid",
  "projectId": "uuid",
  "reason": "string",
  "notes": "string",
  "performedBy": "string (مطلوب)"
}
```

## 🔔 APIs الإشعارات

### 1. جلب إشعارات الأدوات
```http
GET /api/tool-notifications
```

**الاستجابة:**
```json
[
  {
    "id": "uuid",
    "type": "maintenance|warranty|stock|unused|damaged",
    "title": "string",
    "message": "string",
    "toolId": "uuid",
    "toolName": "string",
    "priority": "low|medium|high|critical",
    "timestamp": "timestamp",
    "isRead": boolean,
    "actionRequired": boolean
  }
]
```

### 2. تحديد إشعار كمقروء
```http
POST /api/notifications/:id/mark-read
```

**المعاملات:**
- `id`: معرف الإشعار (UUID)

## 🔍 APIs الإكمال التلقائي

### 1. جلب اقتراحات الإكمال التلقائي
```http
GET /api/autocomplete/:category
```

**المعاملات:**
- `category`: فئة البيانات (toolNames, toolDescriptions, toolSkus, etc.)

**معاملات الاستعلام:**
- `search`: نص البحث (optional)
- `limit`: حد النتائج (default: 10)

**الاستجابة:**
```json
[
  {
    "id": "uuid",
    "category": "string",
    "value": "string",
    "usageCount": number,
    "lastUsed": "timestamp"
  }
]
```

### 2. إضافة قيمة إكمال تلقائي
```http
POST /api/autocomplete
Content-Type: application/json
```

**البيانات المطلوبة:**
```json
{
  "category": "string (مطلوب)",
  "value": "string (مطلوب)",
  "usageCount": number
}
```

## 📦 APIs مخزون الأدوات

### 1. جلب مخزون أداة
```http
GET /api/tool-stock/:toolId
```

**المعاملات:**
- `toolId`: معرف الأداة (UUID)

**الاستجابة:**
```json
[
  {
    "id": "uuid",
    "toolId": "uuid",
    "locationType": "warehouse|project|external|maintenance|none",
    "locationId": "uuid",
    "locationName": "string",
    "quantity": number,
    "availableQuantity": number,
    "reservedQuantity": number,
    "notes": "string",
    "lastVerifiedAt": "timestamp",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

### 2. تحديث مخزون أداة
```http
PUT /api/tool-stock/:id
Content-Type: application/json
```

**البيانات:**
```json
{
  "quantity": number,
  "availableQuantity": number,
  "reservedQuantity": number,
  "notes": "string"
}
```

## 🔧 APIs الصيانة

### 1. جلب سجل صيانة أداة
```http
GET /api/tool-maintenance/:toolId
```

**المعاملات:**
- `toolId`: معرف الأداة (UUID)

### 2. إضافة سجل صيانة
```http
POST /api/tool-maintenance
Content-Type: application/json
```

**البيانات المطلوبة:**
```json
{
  "toolId": "uuid (مطلوب)",
  "maintenanceType": "preventive|corrective|emergency",
  "description": "string",
  "cost": number,
  "performedBy": "string",
  "performedAt": "timestamp",
  "nextScheduledDate": "YYYY-MM-DD"
}
```

## 📋 APIs التقارير

### 1. تصدير تقرير Excel
```http
GET /api/tools/export/excel
```

**معاملات الاستعلام:**
- `category`: معرف التصنيف (optional)
- `status`: حالة الأداة (optional)
- `project`: معرف المشروع (optional)

**الاستجابة:** ملف Excel

### 2. تصدير تقرير PDF
```http
GET /api/tools/export/pdf
```

**معاملات الاستعلام:** نفس معاملات Excel

**الاستجابة:** ملف PDF

## ⚠️ رموز الأخطاء

### أخطاء عامة
- `400`: بيانات غير صحيحة
- `401`: غير مصرح به
- `403`: محظور
- `404`: غير موجود
- `500`: خطأ في الخادم

### أخطاء خاصة بالأدوات
- `TOOL_NOT_FOUND`: الأداة غير موجودة
- `TOOL_SKU_EXISTS`: SKU موجود مسبقاً
- `TOOL_IN_USE`: الأداة مستخدمة حالياً
- `CATEGORY_NOT_FOUND`: التصنيف غير موجود
- `PROJECT_NOT_FOUND`: المشروع غير موجود

## 🔒 المصادقة والأمان

### Headers مطلوبة
```http
Authorization: Bearer <token>
Content-Type: application/json
```

### معدل الطلبات
- 1000 طلب في الدقيقة لكل IP
- 10000 طلب في الساعة لكل مستخدم

### التشفير
- جميع البيانات الحساسة مشفرة
- HTTPS إجباري في الإنتاج
- JWT tokens للمصادقة

## 📝 أمثلة كاملة

### إضافة أداة جديدة
```javascript
const response = await fetch('/api/tools', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    name: 'مطرقة هيدروليكية',
    description: 'مطرقة هيدروليكية 20 طن',
    categoryId: 'category-uuid',
    projectId: 'project-uuid',
    sku: 'HH-20T-001',
    unit: 'قطعة',
    purchasePrice: 5000,
    status: 'available',
    condition: 'excellent',
    locationType: 'مخزن',
    specifications: {
      power: '20 طن',
      weight: '50 كغ',
      brand: 'CAT'
    }
  })
});

const tool = await response.json();
console.log('تم إنشاء الأداة:', tool);
```

### نقل أداة بين المشاريع
```javascript
const response = await fetch('/api/tool-movements', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    toolId: 'tool-uuid',
    movementType: 'transfer',
    quantity: 1,
    fromType: 'project',
    fromId: 'project1-uuid',
    toType: 'project',
    toId: 'project2-uuid',
    reason: 'انتهاء العمل في المشروع الأول',
    performedBy: 'أحمد محمد'
  })
});

const movement = await response.json();
console.log('تم نقل الأداة:', movement);
```

### جلب تقرير الاستخدام
```javascript
const response = await fetch('/api/tools/usage-report/30/all', {
  headers: {
    'Authorization': 'Bearer your-token'
  }
});

const usageReport = await response.json();
console.log('تقرير الاستخدام لآخر 30 يوم:', usageReport);
```

---

**تاريخ التوثيق:** 20 أغسطس 2025  
**النسخة:** 1.0  
**الحالة:** تم التحقق والاختبار