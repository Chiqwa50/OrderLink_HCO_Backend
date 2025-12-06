# إضافة حقل createdBy إلى جدول الطلبات

## التاريخ: 2025-11-30 (التحديث الخامس)

## المشكلة

في جدول `orders` لا يوجد عمود يحفظ **المستخدم الذي أنشأ الطلب**. هذا يسبب:
- ❌ عدم معرفة من قام بإنشاء كل طلب
- ❌ صعوبة في تتبع الطلبات حسب المستخدم
- ❌ عدم إمكانية عرض اسم المستخدم في قائمة الطلبات

## الحل المطبق

تم إضافة حقل `createdBy` إلى جدول `orders` مع علاقة Foreign Key إلى جدول `users`.

### 1. تحديث Prisma Schema

#### في `Order` model:
```prisma
model Order {
  id           String      @id @default(uuid())
  orderNumber  String      @unique
  departmentId String
  createdBy    String      // ← جديد: معرف المستخدم الذي أنشأ الطلب
  status       OrderStatus @default(PENDING)
  notes        String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  // Relations
  department Department     @relation("DepartmentOrders", fields: [departmentId], references: [id])
  creator    User           @relation("CreatedOrders", fields: [createdBy], references: [id])  // ← جديد
  items      OrderItem[]
  history    OrderHistory[]

  @@map("orders")
}
```

#### في `User` model:
```prisma
model User {
  id           String   @id @default(uuid())
  phone        String   @unique
  password     String
  name         String
  role         UserRole
  departmentId String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  department            Department?            @relation(fields: [departmentId], references: [id])
  createdOrders         Order[]                @relation("CreatedOrders")  // ← جديد: الطلبات التي أنشأها المستخدم
  orderHistories        OrderHistory[]
  departmentSupervisors DepartmentSupervisor[]
  warehouseSupervisors  WarehouseSupervisor[]

  @@map("users")
}
```

### 2. إنشاء Migration

```bash
npx prisma migrate dev --name add_created_by_to_orders
```

**النتيجة**:
- ✅ تم إنشاء migration جديد
- ✅ تم إضافة عمود `createdBy` إلى جدول `orders`
- ✅ تم إضافة Foreign Key constraint
- ✅ تم تحديث Prisma Client

### 3. تحديث Backend Controller

#### في `createOrder`:
```typescript
const order = await prisma.order.create({
    data: {
        orderNumber,
        departmentId: departmentId,
        createdBy: userId,  // ← جديد: حفظ معرف المستخدم
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
        department: true,
    },
});
```

#### في `getOrders`:
```typescript
const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
        items: true,
        department: {
            select: {
                id: true,
                name: true,
                code: true,
            },
        },
        creator: {  // ← جديد: جلب معلومات المستخدم الذي أنشأ الطلب
            select: {
                id: true,
                name: true,
                phone: true,
            },
        },
    },
    orderBy: {
        createdAt: 'desc',
    },
});
```

#### في `getOrderById`:
```typescript
const order = await prisma.order.findUnique({
    where: { id },
    include: {
        items: true,
        department: true,
        creator: {  // ← جديد
            select: {
                id: true,
                name: true,
                phone: true,
            },
        },
        history: {
            include: {
                user: true,
            },
        },
    },
});
```

## الملفات المعدلة

### Backend
1. `/backend/prisma/schema.prisma`
   - إضافة `createdBy` في `Order` model
   - إضافة `creator` relation في `Order` model
   - إضافة `createdOrders` relation في `User` model

2. `/backend/src/controllers/orderController.ts`
   - تحديث `createOrder()` - حفظ `createdBy`
   - تحديث `getOrders()` - جلب `creator`
   - تحديث `getOrderById()` - جلب `creator`

3. `/backend/prisma/migrations/20251130104641_add_created_by_to_orders/`
   - Migration SQL جديد

## البيانات المتاحة الآن

بعد هذا التحديث، كل طلب يحتوي على:

```typescript
{
  "id": "order-123",
  "orderNumber": "ORD-20251130-0001",
  "departmentId": "dept-456",
  "createdBy": "user-789",  // ← جديد
  "status": "pending",
  "notes": "عاجل",
  "createdAt": "2025-11-30T10:00:00Z",
  "updatedAt": "2025-11-30T10:00:00Z",
  
  // Relations
  "department": {
    "id": "dept-456",
    "name": "قسم الطوارئ",
    "code": "DEPT-001"
  },
  "creator": {  // ← جديد
    "id": "user-789",
    "name": "أحمد محمد",
    "phone": "0900000003"
  },
  "items": [...],
  "history": [...]
}
```

## الفرق بين createdBy و departmentId

### createdBy (المستخدم الذي أنشأ الطلب)
- معرف **المستخدم** الذي قام بإنشاء الطلب
- مثال: `"user-789"`
- يستخدم في:
  - عرض اسم المستخدم في قائمة الطلبات
  - تتبع من قام بإنشاء كل طلب
  - الإحصائيات (كم طلب أنشأ كل مستخدم)

### departmentId (القسم الطالب)
- معرف **القسم** الذي ينتمي إليه الطلب
- مثال: `"dept-456"`
- يستخدم في:
  - فلترة الطلبات حسب القسم
  - ربط الطلب بالقسم
  - الصلاحيات

### العلاقة بينهما

```
User {
  id: "user-789"           ← createdBy
  name: "أحمد محمد"
  departmentId: "dept-456"
}

Order {
  createdBy: "user-789"    ← المستخدم الذي أنشأ الطلب
  departmentId: "dept-456" ← القسم الطالب
}
```

**ملاحظة**: عادةً `User.departmentId` و `Order.departmentId` يكونان نفس القيمة، لكن:
- `createdBy` يشير إلى **المستخدم** الفعلي
- `departmentId` يشير إلى **القسم**

## كيفية الاختبار

### 1. اختبار إنشاء طلب جديد

```bash
# الخطوات:
1. تسجيل الدخول كمشرف قسم
2. إنشاء طلب جديد
3. التحقق من حفظ الطلب بنجاح
```

### 2. اختبار عرض الطلبات

```bash
# الخطوات:
1. الانتقال إلى /orders/my-orders
2. التحقق من:
   ✅ ظهور الطلبات
   ✅ يمكن إضافة عمود "أنشأ بواسطة" في الجدول
```

### 3. اختبار API

```bash
# جلب الطلبات
curl -X GET http://localhost:5000/api/orders/my-orders \
  -H "Authorization: Bearer YOUR_TOKEN"

# الاستجابة المتوقعة:
{
  "orders": [
    {
      "id": "...",
      "orderNumber": "ORD-20251130-0001",
      "departmentId": "dept-456",
      "createdBy": "user-789",  // ← جديد
      "creator": {              // ← جديد
        "id": "user-789",
        "name": "أحمد محمد",
        "phone": "0900000003"
      },
      "department": {
        "id": "dept-456",
        "name": "قسم الطوارئ"
      },
      "items": [...],
      "status": "pending"
    }
  ]
}
```

## استخدامات مستقبلية

الآن يمكنك:

### 1. عرض اسم المستخدم في جدول الطلبات
```tsx
<TableCell>{order.creator.name}</TableCell>
```

### 2. فلترة الطلبات حسب المستخدم
```typescript
const myOrders = orders.filter(order => order.createdBy === userId);
```

### 3. إحصائيات المستخدمين
```typescript
const userStats = users.map(user => ({
  name: user.name,
  ordersCount: user.createdOrders.length,
}));
```

### 4. تقارير مفصلة
```typescript
// من أكثر المستخدمين إنشاءً للطلبات؟
const topUsers = await prisma.user.findMany({
  include: {
    _count: {
      select: { createdOrders: true }
    }
  },
  orderBy: {
    createdOrders: {
      _count: 'desc'
    }
  },
  take: 10
});
```

## ملاحظات مهمة

### 1. Migration آمن
- Migration يضيف عمود جديد
- لا يؤثر على البيانات الموجودة
- الطلبات القديمة ستحتاج لتحديث يدوي أو سكريبت

### 2. Validation
- `createdBy` مطلوب (required)
- يجب أن يكون معرف مستخدم موجود
- Foreign Key يضمن Data Integrity

### 3. الطلبات القديمة
إذا كان لديك طلبات قديمة بدون `createdBy`، يمكنك:
- تركها كما هي (ستظهر خطأ عند جلبها)
- أو تحديثها بسكريبت migration

## الخلاصة

تم إضافة حقل `createdBy` بنجاح! الآن:

✅ **كل طلب يحفظ** معرف المستخدم الذي أنشأه
✅ **يمكن جلب معلومات المستخدم** (الاسم، الهاتف)
✅ **يمكن عرض اسم المستخدم** في قائمة الطلبات
✅ **يمكن تتبع الطلبات** حسب المستخدم
✅ **Data Integrity محفوظة** (Foreign Key)

---

**التحديث تم بنجاح! الآن يمكن تتبع من قام بإنشاء كل طلب! 🎉**
