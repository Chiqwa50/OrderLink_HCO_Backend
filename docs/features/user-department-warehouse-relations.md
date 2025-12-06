# نظام ربط المستخدمين بالأقسام والمستودعات

**التاريخ**: 2025-11-29  
**الإصدار**: 1.0  
**الحالة**: مُنفذ

---

## نظرة عامة

تم تطوير نظام متقدم لربط المستخدمين (المشرفين) بالأقسام والمستودعات، مما يسمح بما يلي:

### 1. مشرف القسم (Department Supervisor)
- يمكن ربط المستخدم بقسم واحد أو عدة أقسام
- العلاقة Many-to-Many بين المستخدمين والأقسام
- يتم تخزين العلاقات في جدول `department_supervisors`

### 2. مشرف المستودع (Warehouse Supervisor)
- يمكن ربط المستخدم بمستودع واحد أو عدة مستودعات
- خيار "مشرف عام" للإشراف على جميع المستودعات
- العلاقة Many-to-Many بين المستخدمين والمستودعات
- يتم تخزين العلاقات في جدول `warehouse_supervisors`

---

## التغييرات في قاعدة البيانات

### جداول جديدة

#### 1. `department_supervisors`
```prisma
model DepartmentSupervisor {
  id           String   @id @default(uuid())
  userId       String
  departmentId String
  createdAt    DateTime @default(now())

  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  department Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)

  @@unique([userId, departmentId])
  @@map("department_supervisors")
}
```

**الحقول:**
- `id`: معرف فريد للعلاقة
- `userId`: معرف المستخدم (المشرف)
- `departmentId`: معرف القسم
- `createdAt`: تاريخ إنشاء العلاقة

**القيود:**
- `@@unique([userId, departmentId])`: منع تكرار نفس العلاقة
- `onDelete: Cascade`: حذف العلاقة تلقائياً عند حذف المستخدم أو القسم

#### 2. `warehouse_supervisors`
```prisma
model WarehouseSupervisor {
  id          String   @id @default(uuid())
  userId      String
  warehouseId String?
  isGlobal    Boolean  @default(false)
  createdAt   DateTime @default(now())

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  warehouse Warehouse? @relation(fields: [warehouseId], references: [id], onDelete: Cascade)

  @@unique([userId, warehouseId])
  @@map("warehouse_supervisors")
}
```

**الحقول:**
- `id`: معرف فريد للعلاقة
- `userId`: معرف المستخدم (المشرف)
- `warehouseId`: معرف المستودع (null للمشرف العام)
- `isGlobal`: هل المستخدم مشرف عام على جميع المستودعات؟
- `createdAt`: تاريخ إنشاء العلاقة

**القيود:**
- `@@unique([userId, warehouseId])`: منع تكرار نفس العلاقة
- `onDelete: Cascade`: حذف العلاقة تلقائياً عند حذف المستخدم أو المستودع

---

## التغييرات في Backend

### 1. خدمة المستخدمين (UserService)

تم إنشاء خدمة جديدة `userService.ts` تطبق مبادئ البرمجة الكائنية (OOP):

**الملف**: `/backend/src/services/userService.ts`

**الوظائف الرئيسية:**

#### `getAllUsers()`
- جلب جميع المستخدمين مع العلاقات
- يتضمن الأقسام والمستودعات المرتبطة

#### `getUserById(id: string)`
- جلب مستخدم محدد مع جميع العلاقات

#### `createUser(data)`
- إنشاء مستخدم جديد
- إضافة العلاقات مع الأقسام/المستودعات تلقائياً

**معاملات الإدخال:**
```typescript
{
  name: string
  phone: string
  password: string
  role: UserRole
  departmentId?: string          // للتوافق مع النظام القديم
  departmentIds?: string[]       // قائمة الأقسام (مشرف قسم)
  warehouseIds?: string[]        // قائمة المستودعات (مشرف مستودع)
  isGlobalWarehouseSupervisor?: boolean  // مشرف عام
}
```

#### `updateUser(id: string, data)`
- تحديث بيانات المستخدم
- تحديث العلاقات مع الأقسام/المستودعات

#### `deleteUser(id: string)`
- حذف المستخدم
- حذف العلاقات تلقائياً (Cascade)

#### `getUserDepartments(userId: string)`
- جلب جميع الأقسام المرتبطة بمشرف قسم

#### `getUserWarehouses(userId: string)`
- جلب جميع المستودعات المرتبطة بمشرف مستودع
- إذا كان مشرف عام، يُرجع جميع المستودعات النشطة

### 2. تحديث Controllers

**الملف**: `/backend/src/controllers/userController.ts`

تم تحديث جميع الوظائف لاستخدام `UserService`:
- `getUsers()`
- `getUserById()`
- `createUser()`
- `updateUser()`
- `deleteUser()`
- `getUserDepartments()` ← جديد
- `getUserWarehouses()` ← جديد

### 3. تحديث Routes

**الملف**: `/backend/src/routes/userRoutes.ts`

**مسارات جديدة:**
```typescript
GET /api/users/:id/departments    // جلب أقسام المستخدم
GET /api/users/:id/warehouses     // جلب مستودعات المستخدم
```

---

## التغييرات في Frontend

### 1. تحديث الأنواع (Types)

**الملف**: `/frontend/src/types.ts`

**أنواع جديدة:**

```typescript
export interface DepartmentSupervisor {
  id: string
  userId: string
  departmentId: string
  department: {
    id: string
    name: string
    code: string
  }
  createdAt: string
}

export interface WarehouseSupervisor {
  id: string
  userId: string
  warehouseId: string | null
  isGlobal: boolean
  warehouse: {
    id: string
    name: string
    code: string
    type: WarehouseType
  } | null
  createdAt: string
}
```

**تحديث User:**
```typescript
export interface User {
  // ... الحقول الموجودة
  departmentSupervisors?: DepartmentSupervisor[]
  warehouseSupervisors?: WarehouseSupervisor[]
}
```

**تحديث CreateUserRequest:**
```typescript
export interface CreateUserRequest {
  // ... الحقول الموجودة
  departmentIds?: string[]
  warehouseIds?: string[]
  isGlobalWarehouseSupervisor?: boolean
}
```

### 2. تحديث خدمة المستخدمين

**الملف**: `/frontend/src/services/user-service.ts`

**وظائف جديدة:**

```typescript
// جلب أقسام المستخدم
async getUserDepartments(userId: string): Promise<Department[]>

// جلب مستودعات المستخدم
async getUserWarehouses(userId: string): Promise<Warehouse[]>
```

### 3. صفحة إضافة المستخدم

**الملف**: `/frontend/src/app/(dashboard-layout)/users/add/page.tsx`

**الميزات الجديدة:**

#### لمشرف القسم:
- قائمة بجميع الأقسام النشطة
- إمكانية اختيار قسم واحد أو عدة أقسام باستخدام Checkboxes
- التحقق من اختيار قسم واحد على الأقل

#### لمشرف المستودع:
- خيار "مشرف عام على جميع المستودعات"
- قائمة بجميع المستودعات النشطة
- إمكانية اختيار مستودع واحد أو عدة مستودعات
- التحقق من اختيار مستودع واحد على الأقل أو تحديد مشرف عام

**واجهة المستخدم:**
```tsx
{/* اختيار الأقسام */}
{formData.role === "DEPARTMENT" && (
  <div className="border rounded-md p-4 space-y-3">
    {departments.map((dept) => (
      <div key={dept.id} className="flex items-center">
        <Checkbox
          checked={formData.departmentIds.includes(dept.id)}
          onCheckedChange={() => handleDepartmentToggle(dept.id)}
        />
        <label>{dept.name} ({dept.code})</label>
      </div>
    ))}
  </div>
)}

{/* اختيار المستودعات */}
{formData.role === "WAREHOUSE" && (
  <>
    <Checkbox
      checked={formData.isGlobalWarehouseSupervisor}
      label="مشرف عام على جميع المستودعات"
    />
    {!formData.isGlobalWarehouseSupervisor && (
      <div className="border rounded-md p-4 space-y-3">
        {warehouses.map((warehouse) => (
          <div key={warehouse.id} className="flex items-center">
            <Checkbox
              checked={formData.warehouseIds.includes(warehouse.id)}
              onCheckedChange={() => handleWarehouseToggle(warehouse.id)}
            />
            <label>{warehouse.name} ({warehouse.code})</label>
          </div>
        ))}
      </div>
    )}
  </>
)}
```

---

## سير العمل

### 1. إنشاء مشرف قسم

```
1. المسؤول يختار دور "مشرف قسم"
2. تظهر قائمة بجميع الأقسام النشطة
3. المسؤول يختار قسم واحد أو أكثر
4. عند الحفظ:
   - يتم إنشاء المستخدم
   - يتم إنشاء سجلات في department_supervisors
```

### 2. إنشاء مشرف مستودع

```
1. المسؤول يختار دور "مشرف مستودع"
2. خياران:
   أ. مشرف عام:
      - تحديد "مشرف عام على جميع المستودعات"
      - يتم إنشاء سجل واحد مع isGlobal=true و warehouseId=null
   
   ب. مشرف محدد:
      - اختيار مستودع واحد أو أكثر
      - يتم إنشاء سجل لكل مستودع في warehouse_supervisors
```

### 3. تعديل المستخدم

```
1. فتح صفحة تعديل المستخدم
2. عرض الأقسام/المستودعات المرتبطة حالياً
3. إمكانية إضافة/حذف الارتباطات
4. عند الحفظ:
   - حذف جميع العلاقات القديمة
   - إنشاء العلاقات الجديدة
```

---

## أمثلة على الاستخدام

### Backend - إنشاء مشرف قسم

```typescript
POST /api/users
{
  "name": "أحمد محمد",
  "phone": "0501234567",
  "password": "password123",
  "role": "DEPARTMENT",
  "departmentIds": [
    "dept-uuid-1",
    "dept-uuid-2",
    "dept-uuid-3"
  ]
}
```

### Backend - إنشاء مشرف مستودع عام

```typescript
POST /api/users
{
  "name": "فاطمة علي",
  "phone": "0509876543",
  "password": "password123",
  "role": "WAREHOUSE",
  "isGlobalWarehouseSupervisor": true
}
```

### Backend - إنشاء مشرف مستودع محدد

```typescript
POST /api/users
{
  "name": "خالد سعيد",
  "phone": "0505555555",
  "password": "password123",
  "role": "WAREHOUSE",
  "warehouseIds": [
    "warehouse-uuid-1",
    "warehouse-uuid-2"
  ]
}
```

### Backend - جلب أقسام المستخدم

```typescript
GET /api/users/{userId}/departments

Response:
{
  "departments": [
    {
      "id": "dept-uuid-1",
      "name": "قسم الطوارئ",
      "code": "EMRG",
      "description": "...",
      "isActive": true
    },
    // ...
  ]
}
```

---

## التحقق من صحة البيانات

### في Backend (UserService)

1. **عند إنشاء مستخدم:**
   - التحقق من عدم وجود رقم الهاتف مسبقاً
   - تشفير كلمة المرور
   - التحقق من صحة الأقسام/المستودعات المحددة

2. **عند تحديث مستخدم:**
   - التحقق من وجود المستخدم
   - التحقق من صحة البيانات الجديدة

### في Frontend

1. **صفحة إضافة المستخدم:**
   - التحقق من ملء جميع الحقول المطلوبة
   - التحقق من اختيار قسم واحد على الأقل (مشرف قسم)
   - التحقق من اختيار مستودع أو تحديد مشرف عام (مشرف مستودع)
   - التحقق من طول كلمة المرور (6 أحرف على الأقل)

---

## الأمان

1. **المصادقة:**
   - جميع المسارات تتطلب JWT Token صالح
   - فقط المسؤولون (ADMIN) يمكنهم إدارة المستخدمين

2. **التشفير:**
   - كلمات المرور مشفرة باستخدام bcrypt (10 rounds)

3. **الحذف الآمن:**
   - Cascade Delete للعلاقات
   - لا يمكن حذف مستخدم له طلبات نشطة (يمكن إضافة هذا لاحقاً)

---

## الخطوات التالية (Future Enhancements)

1. **صفحة تعديل المستخدم:**
   - تطبيق نفس واجهة الاختيار المتعدد
   - عرض العلاقات الحالية

2. **صفحة عرض المستخدم:**
   - عرض جميع الأقسام/المستودعات المرتبطة
   - إحصائيات عن نشاط المستخدم

3. **التقارير:**
   - تقرير بجميع مشرفي الأقسام
   - تقرير بجميع مشرفي المستودعات
   - تقرير بالأقسام بدون مشرفين

4. **الصلاحيات:**
   - تحديد صلاحيات مخصصة لكل مشرف
   - قيود على العمليات حسب القسم/المستودع

---

## الملفات المعدلة

### Backend
- ✅ `/backend/prisma/schema.prisma`
- ✅ `/backend/src/services/userService.ts` (جديد)
- ✅ `/backend/src/controllers/userController.ts`
- ✅ `/backend/src/routes/userRoutes.ts`

### Frontend
- ✅ `/frontend/src/types.ts`
- ✅ `/frontend/src/services/user-service.ts`
- ✅ `/frontend/src/app/(dashboard-layout)/users/add/page.tsx`

### Documentation
- ✅ `/docs/features/user-department-warehouse-relations.md` (هذا الملف)

---

## الاختبار

### اختبارات Backend

```bash
# اختبار إنشاء مشرف قسم
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد محمد",
    "phone": "0501234567",
    "password": "password123",
    "role": "DEPARTMENT",
    "departmentIds": ["dept-id-1", "dept-id-2"]
  }'

# اختبار جلب أقسام المستخدم
curl -X GET http://localhost:5000/api/users/{userId}/departments \
  -H "Authorization: Bearer {token}"
```

### اختبارات Frontend

1. تسجيل الدخول كمسؤول
2. الانتقال إلى "إدارة المستخدمين" → "إضافة مستخدم"
3. اختيار دور "مشرف قسم"
4. التحقق من ظهور قائمة الأقسام
5. اختيار عدة أقسام
6. حفظ المستخدم
7. التحقق من حفظ العلاقات في قاعدة البيانات

---

## الخلاصة

تم تطوير نظام متكامل لربط المستخدمين بالأقسام والمستودعات مع:
- ✅ قاعدة بيانات محسّنة (Many-to-Many Relations)
- ✅ Backend بمبادئ OOP
- ✅ Frontend بواجهة سهلة الاستخدام
- ✅ التحقق من صحة البيانات
- ✅ الأمان والمصادقة
- ✅ توثيق شامل

النظام جاهز للاستخدام ويمكن توسيعه مستقبلاً حسب الحاجة.
