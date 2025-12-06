# نظام ربط المستخدمين بالأقسام والمستودعات - دليل سريع

## 📋 نظرة عامة

تم تطوير نظام متقدم يسمح بربط المستخدمين (المشرفين) بعدة أقسام أو مستودعات:

### مشرف القسم (Department Supervisor)
- ✅ يمكن ربطه بقسم واحد أو عدة أقسام
- ✅ علاقة Many-to-Many

### مشرف المستودع (Warehouse Supervisor)
- ✅ يمكن ربطه بمستودع واحد أو عدة مستودعات
- ✅ خيار "مشرف عام" لجميع المستودعات
- ✅ علاقة Many-to-Many

---

## 🗄️ قاعدة البيانات

### جداول جديدة

#### `department_supervisors`
```sql
CREATE TABLE department_supervisors (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, department_id)
);
```

#### `warehouse_supervisors`
```sql
CREATE TABLE warehouse_supervisors (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, warehouse_id)
);
```

---

## 🔧 تطبيق التغييرات

```bash
# 1. توليد Prisma Client
cd backend
npx prisma generate

# 2. تطبيق التغييرات على قاعدة البيانات
npx prisma db push

# 3. (اختياري) فتح Prisma Studio للتحقق
npx prisma studio
```

---

## 🚀 الاستخدام

### إنشاء مشرف قسم

```typescript
POST /api/users
{
  "name": "أحمد محمد",
  "phone": "0501234567",
  "password": "password123",
  "role": "DEPARTMENT",
  "departmentIds": ["dept-id-1", "dept-id-2", "dept-id-3"]
}
```

### إنشاء مشرف مستودع عام

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

### إنشاء مشرف مستودع محدد

```typescript
POST /api/users
{
  "name": "خالد سعيد",
  "phone": "0505555555",
  "password": "password123",
  "role": "WAREHOUSE",
  "warehouseIds": ["warehouse-id-1", "warehouse-id-2"]
}
```

### جلب أقسام المستخدم

```typescript
GET /api/users/{userId}/departments
```

### جلب مستودعات المستخدم

```typescript
GET /api/users/{userId}/warehouses
```

---

## 📱 واجهة المستخدم

### صفحة إضافة المستخدم

1. **اختر الدور**: مشرف قسم أو مشرف مستودع
2. **مشرف قسم**:
   - تظهر قائمة بجميع الأقسام النشطة
   - اختر قسم واحد أو أكثر باستخدام Checkboxes
3. **مشرف مستودع**:
   - خيار 1: مشرف عام على جميع المستودعات
   - خيار 2: اختر مستودع واحد أو أكثر

---

## 📁 الملفات المعدلة

### Backend
- ✅ `backend/prisma/schema.prisma`
- ✅ `backend/src/services/userService.ts` (جديد)
- ✅ `backend/src/controllers/userController.ts`
- ✅ `backend/src/routes/userRoutes.ts`

### Frontend
- ✅ `frontend/src/types.ts`
- ✅ `frontend/src/services/user-service.ts`
- ✅ `frontend/src/app/(dashboard-layout)/users/add/page.tsx`

---

## 📚 التوثيق الكامل

للحصول على التوثيق الكامل، راجع:
- [user-department-warehouse-relations.md](./user-department-warehouse-relations.md)

---

## ✅ الخطوات التالية

- [ ] تحديث صفحة تعديل المستخدم
- [ ] تحديث صفحة عرض المستخدم
- [ ] إضافة تقارير للمشرفين
- [ ] إضافة صلاحيات مخصصة

---

## 🧪 الاختبار

```bash
# 1. تشغيل Backend
cd backend
npm run dev

# 2. تشغيل Frontend
cd frontend
npm run dev

# 3. تسجيل الدخول كمسؤول
# 4. الانتقال إلى "إدارة المستخدمين" → "إضافة مستخدم"
# 5. اختبار إنشاء مشرف قسم ومشرف مستودع
```

---

**تم التطوير بواسطة**: Antigravity AI  
**التاريخ**: 2025-11-29
