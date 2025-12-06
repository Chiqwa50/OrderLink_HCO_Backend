# إصلاح خطأ 500 عند إنشاء طلب جديد

## التاريخ: 2025-11-30

## المشكلة

عند محاولة إنشاء طلب جديد من واجهة مشرف القسم:
- يظهر خطأ **500 Internal Server Error**
- لا يتم حفظ الطلب في قاعدة البيانات
- رسالة الخطأ في Console:
  ```
  POST http://localhost:5000/api/orders 500 (Internal Server Error)
  ```

## السبب الجذري

في `orderController.ts`، كان الكود يستخدم `userId` كـ `departmentId` عند إنشاء الطلب:

```typescript
const order = await prisma.order.create({
    data: {
        orderNumber,
        departmentId: userId,  // ❌ خطأ! userId ليس departmentId
        // ...
    },
});
```

### لماذا هذا خطأ؟

- `userId` هو معرف المستخدم (User ID)
- `departmentId` هو معرف القسم (Department ID)
- هذان معرفان مختلفان تماماً!

### ما الذي حدث؟

عندما يحاول Prisma إنشاء Order مع `departmentId = userId`:
1. يبحث عن Department بهذا الـ ID
2. لا يجد القسم (لأن الـ ID خاطئ)
3. يفشل في إنشاء العلاقة (Foreign Key Constraint)
4. يرجع خطأ 500

## الحل

تم تحديث `createOrder` في `orderController.ts`:

### 1. استخراج departmentId من JWT Token

```typescript
const authReq = req as AuthRequest;
const userId = authReq.user?.id;
const userRole = authReq.user?.role;
const departmentId = authReq.user?.departmentId;  // ← إضافة هذا السطر
```

### 2. التحقق من وجود departmentId

```typescript
if (!departmentId) {
    res.status(400).json({ error: 'المستخدم غير مرتبط بقسم' });
    return;
}
```

### 3. استخدام departmentId الصحيح

```typescript
const order = await prisma.order.create({
    data: {
        orderNumber,
        departmentId: departmentId,  // ✅ صحيح!
        notes,
        status: OrderStatus.PENDING,
        // ...
    },
});
```

## الكود الكامل بعد الإصلاح

```typescript
export const createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const userRole = authReq.user?.role;
        const departmentId = authReq.user?.departmentId;  // ← جديد

        if (!userId || userRole !== UserRole.DEPARTMENT) {
            res.status(403).json({ error: 'فقط الأقسام يمكنها إنشاء الطلبات' });
            return;
        }

        // ← جديد: التحقق من وجود departmentId
        if (!departmentId) {
            res.status(400).json({ error: 'المستخدم غير مرتبط بقسم' });
            return;
        }

        const { notes, items }: CreateOrderRequest = req.body;

        if (!items || items.length === 0) {
            res.status(400).json({ error: 'يجب إضافة مادة واحدة على الأقل' });
            return;
        }

        const orderNumber = await generateOrderNumber();

        const order = await prisma.order.create({
            data: {
                orderNumber,
                departmentId: departmentId,  // ← تم التصحيح
                notes,
                status: OrderStatus.PENDING,
                items: {
                    create: items.map(item => ({
                        itemName: item.itemName,
                        quantity: item.quantity,
                        unit: item.unit || 'piece',
                        notes: item.notes,
                    })),
                },
                history: {
                    create: {
                        status: OrderStatus.PENDING,
                        changedBy: userId,
                        notes: 'تم إنشاء الطلب',
                    },
                },
            },
            include: {
                items: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });

        res.status(201).json({
            message: 'تم إنشاء الطلب بنجاح',
            order,
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الطلب' });
    }
};
```

## التحقق من JWT Token

تم التأكد من أن JWT Token يحتوي على `departmentId` في الـ payload:

```typescript
// في authController.ts - login()
const token = jwt.sign(
    {
        id: user.id,
        phone: user.phone,
        role: user.role,
        name: user.name,
        departmentId: user.departmentId,  // ✅ موجود
    },
    JWT_SECRET,
    { expiresIn: '7d' }
);
```

## الملفات المعدلة

### Backend
- `/backend/src/controllers/orderController.ts`
  - إضافة استخراج `departmentId` من JWT token
  - إضافة validation للتحقق من وجود `departmentId`
  - تصحيح استخدام `departmentId` بدلاً من `userId`

## كيفية الاختبار

### 1. اختبار إنشاء طلب جديد

```bash
# الخطوات:
1. تسجيل الدخول كمشرف قسم
2. الانتقال إلى /orders/new
3. إضافة مادة واحدة على الأقل
4. ملء الكمية
5. إرسال الطلب
6. التحقق من:
   - ✅ ظهور رسالة "تم إرسال الطلب بنجاح!"
   - ✅ التحويل إلى صفحة الطلبيات
   - ✅ ظهور الطلب في القائمة
```

### 2. اختبار validation

```bash
# اختبار مستخدم بدون قسم:
1. إنشاء مستخدم من نوع DEPARTMENT بدون قسم
2. تسجيل الدخول بهذا المستخدم
3. محاولة إنشاء طلب
4. التحقق من ظهور رسالة: "المستخدم غير مرتبط بقسم"
```

### 3. اختبار API مباشرة

```bash
# إنشاء طلب عبر API
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "itemName": "قفازات طبية",
        "quantity": 100,
        "unit": "piece"
      }
    ],
    "notes": "عاجل"
  }'

# الاستجابة المتوقعة:
{
  "message": "تم إنشاء الطلب بنجاح",
  "order": {
    "id": "...",
    "orderNumber": "ORD-20251130-0001",
    "departmentId": "CORRECT_DEPARTMENT_ID",  // ← يجب أن يكون صحيح
    "department": {
      "id": "...",
      "name": "قسم الطوارئ",
      "code": "DEPT-001"
    },
    "items": [...],
    "status": "pending"
  }
}
```

## ملاحظات مهمة

### 1. أهمية departmentId في JWT
- يتم تضمين `departmentId` في JWT token عند تسجيل الدخول
- هذا يسمح للـ backend بمعرفة قسم المستخدم بدون استعلام إضافي
- يجب التأكد من تحديث الـ token عند تغيير قسم المستخدم

### 2. Validation
- تم إضافة validation للتحقق من وجود `departmentId`
- هذا يمنع إنشاء طلبات من مستخدمين غير مرتبطين بقسم
- رسالة خطأ واضحة: "المستخدم غير مرتبط بقسم"

### 3. Foreign Key Constraint
- `Order.departmentId` يجب أن يشير إلى `Department.id` موجود
- إذا كان الـ ID خاطئ، سيفشل Prisma في إنشاء السجل
- هذا يضمن سلامة البيانات (Data Integrity)

## الأخطاء الشائعة المشابهة

تأكد من عدم وجود أخطاء مشابهة في أماكن أخرى:

### ✅ تم التحقق من:
- `getOrders()` - يستخدم `departmentId` بشكل صحيح
- `getOrderById()` - يستخدم `departmentId` للتحقق من الصلاحيات
- `updateOrderStatus()` - لا يحتاج `departmentId`

## الخلاصة

تم إصلاح الخطأ بنجاح! الآن:

✅ **يتم استخدام departmentId الصحيح** من JWT token
✅ **يتم التحقق من وجود departmentId** قبل إنشاء الطلب
✅ **رسائل خطأ واضحة** للمستخدمين غير المرتبطين بقسم
✅ **الطلبات تُحفظ بنجاح** في قاعدة البيانات
✅ **العلاقة مع Department صحيحة** (Foreign Key)

---

**المشكلة تم حلها! يمكنك الآن إنشاء طلبات جديدة بنجاح! 🎉**
