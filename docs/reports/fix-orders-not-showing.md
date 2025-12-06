# إصلاح مشكلة عدم ظهور الطلبات للمستخدم

## التاريخ: 2025-11-30 (التحديث الرابع)

## المشكلة

بعد إنشاء طلب جديد:
- ✅ يتم حفظ الطلب في قاعدة البيانات بنجاح
- ❌ لا يظهر الطلب في صفحة "طلبياتي" للمستخدم
- ❌ المستخدم لا يستطيع رؤية طلباته

### السبب

كان هناك **خطأ منهجي** في استخدام المعرفات:
- عند **إنشاء** الطلب: يتم استخدام `departmentId` ✅
- عند **جلب** الطلبات: يتم استخدام `userId` ❌

هذا التناقض يسبب:
```
Order.departmentId = "dept-123"  // ← القيمة المحفوظة
Filter: departmentId = "user-456"  // ← القيمة المستخدمة في البحث
Result: لا توجد نتائج!
```

## الأخطاء المكتشفة

### 1. في `createOrder` (تم إصلاحه سابقاً)
```typescript
// ❌ الكود القديم
departmentId: userId  // خطأ!

// ✅ الكود الجديد
departmentId: departmentId  // صحيح!
```

### 2. في `getOrders` (تم إصلاحه الآن)
```typescript
// ❌ الكود القديم
if (userRole === UserRole.DEPARTMENT) {
    whereClause.departmentId = userId;  // خطأ!
}

// ✅ الكود الجديد
if (userRole === UserRole.DEPARTMENT) {
    if (!departmentId) {
        res.status(400).json({ error: 'المستخدم غير مرتبط بقسم' });
        return;
    }
    whereClause.departmentId = departmentId;  // صحيح!
}
```

### 3. في `getOrderById` (تم إصلاحه الآن)
```typescript
// ❌ الكود القديم
if (userRole === UserRole.DEPARTMENT && order.departmentId !== userId) {
    // خطأ!
}

// ✅ الكود الجديد
if (userRole === UserRole.DEPARTMENT && order.departmentId !== departmentId) {
    // صحيح!
}
```

## الحل المطبق

تم تحديث جميع الدوال في `orderController.ts` لاستخدام `departmentId` بشكل متسق:

### 1. تحديث `createOrder`

```typescript
export const createOrder = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const userRole = authReq.user?.role;
    const departmentId = authReq.user?.departmentId;  // ← استخراج departmentId

    // التحقق من وجود departmentId
    if (!departmentId) {
        res.status(400).json({ error: 'المستخدم غير مرتبط بقسم' });
        return;
    }

    // استخدام departmentId الصحيح
    const order = await prisma.order.create({
        data: {
            orderNumber,
            departmentId: departmentId,  // ← صحيح!
            // ...
        },
    });
};
```

### 2. تحديث `getOrders`

```typescript
export const getOrders = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const userRole = authReq.user?.role;
    const departmentId = authReq.user?.departmentId;  // ← استخراج departmentId

    let whereClause: any = {};

    if (userRole === UserRole.DEPARTMENT) {
        // التحقق من وجود departmentId
        if (!departmentId) {
            res.status(400).json({ error: 'المستخدم غير مرتبط بقسم' });
            return;
        }
        whereClause.departmentId = departmentId;  // ← صحيح!
    }

    const orders = await prisma.order.findMany({
        where: whereClause,
        // ...
    });
};
```

### 3. تحديث `getOrderById`

```typescript
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const userRole = authReq.user?.role;
    const departmentId = authReq.user?.departmentId;  // ← استخراج departmentId

    const order = await prisma.order.findUnique({
        where: { id },
        // ...
    });

    // التحقق من الصلاحيات
    if (userRole === UserRole.DEPARTMENT && order.departmentId !== departmentId) {
        res.status(403).json({ error: 'ليس لديك صلاحية لعرض هذا الطلب' });
        return;
    }
};
```

## الملفات المعدلة

### Backend
- `/backend/src/controllers/orderController.ts`
  - تحديث `createOrder()` - السطور 30-99
  - تحديث `getOrders()` - السطور 102-160
  - تحديث `getOrderById()` - السطور 161-217

## التأثير

| الدالة | قبل الإصلاح | بعد الإصلاح |
|--------|-------------|-------------|
| **createOrder** | ❌ `departmentId = userId` | ✅ `departmentId = departmentId` |
| **getOrders** | ❌ `filter by userId` | ✅ `filter by departmentId` |
| **getOrderById** | ❌ `check userId` | ✅ `check departmentId` |

## كيفية الاختبار

### 1. اختبار إنشاء وعرض الطلبات

```bash
# الخطوات:
1. تسجيل الدخول كمشرف قسم
2. الانتقال إلى /orders/new
3. إنشاء طلب جديد
4. التحقق من:
   ✅ ظهور رسالة "تم إرسال الطلب بنجاح!"
   ✅ التحويل إلى /orders/my-orders
   ✅ ظهور الطلب الجديد في القائمة
```

### 2. اختبار عرض تفاصيل الطلب

```bash
# الخطوات:
1. من صفحة "طلبياتي"
2. اضغط على أي طلب لعرض التفاصيل
3. التحقق من:
   ✅ ظهور تفاصيل الطلب
   ✅ عدم ظهور خطأ 403 (Forbidden)
```

### 3. اختبار API مباشرة

```bash
# جلب طلبات المستخدم
curl -X GET http://localhost:5000/api/orders/my-orders \
  -H "Authorization: Bearer YOUR_TOKEN"

# الاستجابة المتوقعة:
{
  "orders": [
    {
      "id": "...",
      "orderNumber": "ORD-20251130-0001",
      "departmentId": "dept-123",  // ← يجب أن يطابق departmentId في الـ token
      "department": {
        "id": "dept-123",
        "name": "قسم الطوارئ",
        "code": "DEPT-001"
      },
      "items": [...],
      "status": "pending"
    }
  ]
}
```

## الفرق بين userId و departmentId

### userId (معرف المستخدم)
- معرف فريد للمستخدم نفسه
- مثال: `"user-abc123"`
- يستخدم في:
  - تسجيل الدخول
  - تتبع من قام بالإجراء (history)
  - الصلاحيات

### departmentId (معرف القسم)
- معرف القسم الذي ينتمي إليه المستخدم
- مثال: `"dept-456"`
- يستخدم في:
  - ربط الطلبات بالأقسام
  - فلترة الطلبات حسب القسم
  - العلاقات (Foreign Keys)

### العلاقة بينهما

```
User {
  id: "user-abc123"           ← userId
  name: "أحمد محمد"
  role: "DEPARTMENT"
  departmentId: "dept-456"    ← departmentId (القسم الذي ينتمي إليه)
}

Department {
  id: "dept-456"              ← نفس departmentId
  name: "قسم الطوارئ"
  code: "DEPT-001"
}

Order {
  id: "order-789"
  orderNumber: "ORD-20251130-0001"
  departmentId: "dept-456"    ← يجب أن يطابق User.departmentId
}
```

## ملاحظات مهمة

### 1. JWT Token Payload
يجب أن يحتوي الـ token على `departmentId`:
```typescript
const token = jwt.sign({
    id: user.id,              // userId
    phone: user.phone,
    role: user.role,
    name: user.name,
    departmentId: user.departmentId,  // ← مهم جداً!
}, JWT_SECRET, { expiresIn: '7d' });
```

### 2. Validation
تم إضافة validation في جميع الدوال:
```typescript
if (!departmentId) {
    res.status(400).json({ error: 'المستخدم غير مرتبط بقسم' });
    return;
}
```

### 3. Data Integrity
الآن جميع الطلبات:
- ✅ تُحفظ مع `departmentId` الصحيح
- ✅ تُجلب باستخدام `departmentId` الصحيح
- ✅ تُفلتر بشكل صحيح حسب القسم

## الخلاصة

تم إصلاح المشكلة بنجاح! الآن:

✅ **الطلبات تُحفظ** مع departmentId الصحيح
✅ **الطلبات تُجلب** باستخدام departmentId الصحيح
✅ **المستخدمون يرون طلباتهم** في صفحة "طلبياتي"
✅ **الصلاحيات تعمل** بشكل صحيح
✅ **Data Integrity محفوظة** (Foreign Keys صحيحة)

---

**المشكلة تم حلها! الآن يمكن للمستخدمين رؤية طلباتهم بنجاح! 🎉**
