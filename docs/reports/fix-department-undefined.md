# إصلاح مشكلة "القسم غير محدد"

## التاريخ: 2025-11-29 (التحديث الثاني)

## المشكلة

عند إنشاء أو تعديل مستخدم من نوع "مشرف قسم" (DEPARTMENT):
- يتم تخزين البيانات في جدول `DepartmentSupervisor` بنجاح
- لكن حقل `departmentId` في جدول `User` يبقى `null`
- نتيجة لذلك:
  - في واجهة قائمة المستخدمين: عمود "القسم" يظهر "-"
  - في واجهة الطلب الجديد: "القسم الطالب" يظهر "غير محدد"

## السبب الجذري

النظام يستخدم نموذجين للعلاقة بين المستخدم والقسم:

1. **علاقة One-to-One**: `User.departmentId` → `Department.id`
   - تُستخدم لتحديد القسم الرئيسي للمستخدم
   - تُستخدم في عرض معلومات المستخدم

2. **علاقة Many-to-Many**: `DepartmentSupervisor` (جدول وسيط)
   - تُستخدم لتحديد جميع الأقسام التي يشرف عليها المستخدم
   - مستخدم واحد يمكن أن يشرف على عدة أقسام

المشكلة كانت:
- الـ Frontend يرسل فقط `departmentIds` (مصفوفة)
- الـ Backend يحفظ في جدول `DepartmentSupervisor` فقط
- لكن لا يتم تعيين `departmentId` في جدول `User`

## الحل

تم تحديث `userService.ts` في الـ Backend:

### 1. دالة `createUser`

```typescript
// تحديد departmentId الرئيسي
let mainDepartmentId = data.departmentId || null;

// إذا كان المستخدم من نوع DEPARTMENT ولم يتم تحديد departmentId
// نستخدم أول قسم من departmentIds
if (data.role === UserRole.DEPARTMENT && !mainDepartmentId && data.departmentIds && data.departmentIds.length > 0) {
    mainDepartmentId = data.departmentIds[0];
}

// إنشاء المستخدم مع departmentId
const user = await prisma.user.create({
    data: {
        // ...
        departmentId: mainDepartmentId,
    },
});
```

### 2. دالة `updateUser`

```typescript
// تحديد departmentId
if (data.departmentId !== undefined) {
    updateData.departmentId = data.departmentId || null;
} else if (data.role === UserRole.DEPARTMENT && data.departmentIds && data.departmentIds.length > 0) {
    // إذا كان المستخدم من نوع DEPARTMENT ولم يتم تحديد departmentId
    // نستخدم أول قسم من departmentIds
    updateData.departmentId = data.departmentIds[0];
}
```

## النتيجة

الآن عند إنشاء أو تعديل مستخدم من نوع "مشرف قسم":

1. ✅ يتم حفظ `departmentId` في جدول `User` (أول قسم من القائمة)
2. ✅ يتم حفظ جميع الأقسام في جدول `DepartmentSupervisor`
3. ✅ في واجهة قائمة المستخدمين: يظهر اسم القسم بشكل صحيح
4. ✅ في واجهة الطلب الجديد: يظهر اسم القسم بدلاً من "غير محدد"
5. ✅ في `/auth/me` و `/auth/login`: يتم إرجاع معلومات القسم

## الملفات المعدلة

### Backend
- `/backend/src/services/userService.ts`
  - تحديث `createUser()` - السطور 119-128
  - تحديث `updateUser()` - السطور 190-200

## كيفية الاختبار

### 1. اختبار إنشاء مستخدم جديد

```bash
# الخطوات:
1. الانتقال إلى /users/add
2. ملء البيانات:
   - الاسم: "أحمد محمد"
   - الهاتف: "0912345678"
   - كلمة المرور: "123456"
   - الدور: "مشرف قسم"
   - اختيار قسم واحد أو أكثر
3. حفظ المستخدم
4. التحقق من:
   - في قائمة المستخدمين: يظهر اسم القسم في عمود "القسم"
   - تسجيل الدخول بالمستخدم الجديد
   - الانتقال إلى /orders/new
   - التحقق من ظهور اسم القسم في "القسم الطالب"
```

### 2. اختبار تعديل مستخدم موجود

```bash
# الخطوات:
1. الانتقال إلى /users/manage
2. اختيار مستخدم من نوع "مشرف قسم" بدون قسم
3. تعديل بياناته وإضافة قسم
4. حفظ التعديلات
5. التحقق من ظهور اسم القسم في الجدول
```

### 3. اختبار API مباشرة

```bash
# إنشاء مستخدم جديد
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد محمد",
    "phone": "0912345678",
    "password": "123456",
    "role": "DEPARTMENT",
    "departmentIds": ["DEPARTMENT_ID_1", "DEPARTMENT_ID_2"]
  }'

# التحقق من الاستجابة - يجب أن تحتوي على:
{
  "user": {
    "id": "...",
    "name": "أحمد محمد",
    "departmentId": "DEPARTMENT_ID_1",  // ← يجب أن يكون موجود
    "department": {
      "id": "DEPARTMENT_ID_1",
      "name": "اسم القسم",
      "code": "DEPT-001"
    }
  }
}
```

## ملاحظات مهمة

### 1. اختيار القسم الرئيسي
- عند اختيار عدة أقسام، يتم تعيين **أول قسم** كقسم رئيسي
- هذا منطقي لأن المستخدم يجب أن يكون له قسم رئيسي واحد
- يمكن تعديل هذا السلوك لاحقًا إذا لزم الأمر

### 2. التوافق مع الكود الموجود
- جميع التعديلات متوافقة مع الكود الموجود
- لا حاجة لتعديل قاعدة البيانات أو الـ schema
- لا حاجة لتعديل الـ Frontend

### 3. المستخدمون الموجودون
- المستخدمون الذين تم إنشاؤهم قبل هذا الإصلاح قد يكون لديهم `departmentId = null`
- يمكن إصلاحهم عن طريق:
  - تعديل بياناتهم من واجهة إدارة المستخدمين
  - أو تشغيل سكريبت migration لتحديث البيانات

## سكريبت Migration (اختياري)

إذا كنت تريد تحديث المستخدمين الموجودين تلقائيًا:

```typescript
// scripts/fix-department-users.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDepartmentUsers() {
  // جلب جميع مستخدمي الأقسام بدون departmentId
  const users = await prisma.user.findMany({
    where: {
      role: 'DEPARTMENT',
      departmentId: null,
    },
    include: {
      departmentSupervisors: {
        include: {
          department: true,
        },
      },
    },
  });

  console.log(`Found ${users.length} users to fix`);

  for (const user of users) {
    if (user.departmentSupervisors.length > 0) {
      const firstDepartmentId = user.departmentSupervisors[0].departmentId;
      
      await prisma.user.update({
        where: { id: user.id },
        data: { departmentId: firstDepartmentId },
      });

      console.log(`Fixed user ${user.name} - set departmentId to ${firstDepartmentId}`);
    }
  }

  console.log('Done!');
}

fixDepartmentUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

تشغيل السكريبت:
```bash
npx ts-node scripts/fix-department-users.ts
```

## الخلاصة

تم حل المشكلة بنجاح! الآن:
- ✅ يتم حفظ `departmentId` تلقائيًا عند إنشاء/تعديل مستخدم قسم
- ✅ يظهر اسم القسم في جميع الواجهات
- ✅ لا حاجة لتعديل الـ Frontend
- ✅ متوافق مع الكود الموجود
