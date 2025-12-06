# API Documentation - Order Distribution System

## 📚 نظرة عامة

هذا التوثيق يغطي جميع الـ API Endpoints الجديدة المضافة لنظام توزيع الطلبات التلقائي.

---

## 🏢 Department Warehouses API

### 1. جلب المستودعات المرتبطة بقسم

**Endpoint:** `GET /api/departments/:id/warehouses`

**المصادقة:** مطلوبة (جميع المستخدمين المسجلين)

**Parameters:**
- `id` (path) - معرف القسم

**Response:**
```json
{
  "warehouses": [
    {
      "id": "dw-uuid",
      "departmentId": "dept-uuid",
      "warehouseId": "warehouse-uuid",
      "priority": 1,
      "isPrimary": true,
      "createdAt": "2025-12-01T10:00:00.000Z",
      "updatedAt": "2025-12-01T10:00:00.000Z",
      "warehouse": {
        "id": "warehouse-uuid",
        "name": "مستودع الصيدلية",
        "code": "PHARM-001",
        "type": "PHARMACEUTICAL",
        "isActive": true
      }
    }
  ]
}
```

---

### 2. ربط مستودع بقسم

**Endpoint:** `POST /api/departments/:id/warehouses`

**المصادقة:** مطلوبة (ADMIN فقط)

**Parameters:**
- `id` (path) - معرف القسم

**Request Body:**
```json
{
  "warehouseId": "warehouse-uuid",
  "priority": 1,
  "isPrimary": true
}
```

**Response:**
```json
{
  "message": "تم ربط المستودع بنجاح",
  "link": {
    "id": "dw-uuid",
    "departmentId": "dept-uuid",
    "warehouseId": "warehouse-uuid",
    "priority": 1,
    "isPrimary": true,
    "warehouse": { ... },
    "department": { ... }
  }
}
```

**Errors:**
- `400` - معرف المستودع مطلوب
- `403` - غير مصرح (ليس ADMIN)
- `500` - فشل ربط المستودع

---

### 3. إلغاء ربط مستودع من قسم

**Endpoint:** `DELETE /api/departments/:id/warehouses/:warehouseId`

**المصادقة:** مطلوبة (ADMIN فقط)

**Parameters:**
- `id` (path) - معرف القسم
- `warehouseId` (path) - معرف المستودع

**Response:**
```json
{
  "message": "تم إلغاء ربط المستودع بنجاح"
}
```

---

## 📦 Items API

### 4. جلب المواد المتاحة لقسم معين

**Endpoint:** `GET /api/items/department/:departmentId`

**المصادقة:** مطلوبة

**Parameters:**
- `departmentId` (path) - معرف القسم

**الوصف:**
يعيد فقط المواد من المستودعات المرتبطة بهذا القسم، مرتبة حسب أولوية المستودعات.

**Response:**
```json
{
  "items": [
    {
      "id": "item-uuid",
      "name": "باراسيتامول 500mg",
      "sku": "ITM-0001",
      "description": "مسكن للألم",
      "quantity": 100,
      "category": "أدوية",
      "unit": "box",
      "warehouseId": "warehouse-uuid",
      "isActive": true,
      "createdAt": "2025-12-01T10:00:00.000Z",
      "warehouse": {
        "id": "warehouse-uuid",
        "name": "مستودع الصيدلية",
        "code": "PHARM-001",
        "type": "PHARMACEUTICAL"
      },
      "creator": {
        "name": "أحمد محمد"
      }
    }
  ],
  "count": 25
}
```

---

### 5. جلب المواد حسب المستودع

**Endpoint:** `GET /api/items/warehouse/:warehouseId`

**المصادقة:** مطلوبة

**Parameters:**
- `warehouseId` (path) - معرف المستودع

**Response:**
```json
{
  "items": [ ... ],
  "count": 15
}
```

---

## 📋 Orders API (محدث)

### 6. إنشاء طلب جديد

**Endpoint:** `POST /api/orders`

**المصادقة:** مطلوبة (DEPARTMENT فقط)

**Request Body:**
```json
{
  "notes": "طلب عاجل",
  "items": [
    {
      "itemName": "باراسيتامول 500mg",
      "quantity": 10,
      "unit": "box",
      "notes": "للحمى"
    },
    {
      "itemName": "قفازات طبية",
      "quantity": 100,
      "unit": "piece"
    }
  ]
}
```

**الوصف:**
- يتم توزيع الطلب تلقائياً على المستودعات بناءً على المواد
- قد يتم إنشاء طلب واحد أو أكثر
- يتم التحقق من ربط المستودعات بالقسم

**Response (طلب واحد):**
```json
{
  "message": "تم إنشاء الطلب بنجاح",
  "orders": [
    {
      "id": "order-uuid",
      "orderNumber": "ORD-20251201-0001",
      "departmentId": "dept-uuid",
      "warehouseId": "warehouse-uuid",
      "createdBy": "user-uuid",
      "status": "PENDING",
      "notes": "طلب عاجل",
      "items": [ ... ],
      "department": { ... },
      "warehouse": { ... }
    }
  ],
  "count": 1
}
```

**Response (عدة طلبات):**
```json
{
  "message": "تم إنشاء 2 طلبات وتوزيعها على المستودعات بنجاح",
  "orders": [
    {
      "id": "order-1",
      "orderNumber": "ORD-20251201-0001",
      "warehouseId": "warehouse-pharmacy",
      "items": [ /* أدوية */ ]
    },
    {
      "id": "order-2",
      "orderNumber": "ORD-20251201-0002",
      "warehouseId": "warehouse-logistics",
      "items": [ /* قفازات */ ]
    }
  ],
  "count": 2
}
```

**Errors:**
- `400` - يجب إضافة مادة واحدة على الأقل
- `400` - المستخدم غير مرتبط بقسم
- `403` - فقط الأقسام يمكنها إنشاء الطلبات
- `500` - لا يوجد مستودع مرتبط بهذا القسم
- `500` - المادة "X" تنتمي لمستودع غير مرتبط بهذا القسم
- `500` - المادة "X" غير موجودة أو غير نشطة

---

### 7. جلب الطلبات (محدث)

**Endpoint:** `GET /api/orders`

**المصادقة:** مطلوبة

**Query Parameters:**
- `status` (optional) - فلترة حسب الحالة

**الوصف:**
- مستخدمو DEPARTMENT: يرون طلبات قسمهم فقط
- مستخدمو WAREHOUSE: يرون الطلبات الموجهة لمستودعهم فقط
- مستخدمو DRIVER: يرون الطلبات READY و DELIVERED فقط
- ADMIN: يرى جميع الطلبات

**Response:**
```json
{
  "orders": [
    {
      "id": "order-uuid",
      "orderNumber": "ORD-20251201-0001",
      "departmentId": "dept-uuid",
      "warehouseId": "warehouse-uuid",
      "status": "PENDING",
      "items": [ ... ],
      "department": { ... },
      "warehouse": { ... },
      "creator": { ... }
    }
  ]
}
```

---

## 🔐 الصلاحيات

| Endpoint | ADMIN | WAREHOUSE | DEPARTMENT | DRIVER |
|----------|-------|-----------|------------|--------|
| GET /departments/:id/warehouses | ✅ | ✅ | ✅ | ✅ |
| POST /departments/:id/warehouses | ✅ | ❌ | ❌ | ❌ |
| DELETE /departments/:id/warehouses/:warehouseId | ✅ | ❌ | ❌ | ❌ |
| GET /items/department/:departmentId | ✅ | ✅ | ✅ | ✅ |
| GET /items/warehouse/:warehouseId | ✅ | ✅ | ✅ | ✅ |
| POST /orders | ❌ | ❌ | ✅ | ❌ |
| GET /orders | ✅ (all) | ✅ (warehouse) | ✅ (dept) | ✅ (limited) |

---

## 📝 أمثلة عملية

### مثال 1: إنشاء قسم مع ربط مستودعات

```bash
# 1. إنشاء القسم
POST /api/departments
{
  "name": "قسم الطوارئ",
  "code": "EMRG-001",
  "description": "قسم الطوارئ الرئيسي",
  "warehouses": [
    {
      "warehouseId": "warehouse-pharmacy-id",
      "priority": 1,
      "isPrimary": true
    },
    {
      "warehouseId": "warehouse-logistics-id",
      "priority": 2,
      "isPrimary": false
    }
  ]
}
```

### مثال 2: جلب المواد المتاحة للقسم

```bash
GET /api/items/department/dept-emergency-id

# Response: فقط المواد من المستودعات المرتبطة
```

### مثال 3: إنشاء طلب يتم توزيعه تلقائياً

```bash
POST /api/orders
{
  "items": [
    { "itemName": "دواء A", "quantity": 10, "unit": "box" },
    { "itemName": "قفازات", "quantity": 100, "unit": "piece" }
  ]
}

# إذا كانت المواد من مستودعات مختلفة:
# Response: 2 orders created
```

### مثال 4: جلب طلبات المستودع

```bash
GET /api/orders
# (كمستخدم WAREHOUSE)

# Response: فقط الطلبات الموجهة لمستودع المستخدم
```

---

## ⚠️ ملاحظات مهمة

1. **التوزيع التلقائي:**
   - يتم تلقائياً بناءً على `Item.warehouseId`
   - لا يحتاج المستخدم لتحديد المستودع

2. **الفلترة:**
   - مستخدمو الأقسام يرون فقط مواد مستودعاتهم
   - مستخدمو المستودعات يرون فقط طلباتهم

3. **الأولوية:**
   - رقم أقل = أولوية أعلى (1 أعلى من 2)
   - تستخدم في ترتيب المواد والمستودعات

4. **المستودع الرئيسي:**
   - يمكن تعيين مستودع واحد فقط كرئيسي لكل قسم
   - يستخدم في الواجهة الأمامية للعرض الافتراضي

---

## 🐛 معالجة الأخطاء

جميع الـ endpoints تعيد أخطاء بالصيغة التالية:

```json
{
  "error": "رسالة الخطأ بالعربية",
  "details": "تفاصيل تقنية (اختياري)"
}
```

**أكواد الأخطاء الشائعة:**
- `400` - Bad Request (بيانات غير صحيحة)
- `401` - Unauthorized (غير مسجل)
- `403` - Forbidden (غير مصرح)
- `404` - Not Found (غير موجود)
- `500` - Internal Server Error (خطأ في الخادم)

---

**آخر تحديث:** 2025-12-01  
**الإصدار:** 2.0.0
