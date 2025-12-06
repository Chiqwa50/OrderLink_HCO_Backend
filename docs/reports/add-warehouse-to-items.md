# إضافة حقل المستودع إلى المواد

## التاريخ
2025-11-30

## الملخص
تم إضافة حقل المستودع (warehouse) كحقل إجباري لكل مادة في النظام. الآن عند إضافة مادة جديدة، يجب تحديد المستودع الذي تنتمي إليه المادة.

## التغييرات المنفذة

### 1. قاعدة البيانات (Prisma Schema)

#### تحديث نموذج Item
```prisma
model Item {
  id          String   @id @default(uuid())
  name        String
  description String?
  sku         String   @unique
  quantity    Int      @default(0)
  category    String?
  unit        String?
  warehouseId String   // إجباري - معرف المستودع
  isActive    Boolean  @default(true)
  createdBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  creator     User?      @relation("CreatedItems", fields: [createdBy], references: [id])
  warehouse   Warehouse  @relation("WarehouseItems", fields: [warehouseId], references: [id])

  @@map("items")
}
```

#### تحديث نموذج Warehouse
```prisma
model Warehouse {
  // ... الحقول الموجودة
  
  // Relations
  warehouseSupervisors WarehouseSupervisor[]
  items                Item[]                @relation("WarehouseItems") // المواد في هذا المستودع
}
```

### 2. Migration
تم إنشاء migration خاص للتعامل مع البيانات الموجودة:
- إذا لم يكن هناك مستودعات، يتم إنشاء مستودع افتراضي باسم "المستودع الرئيسي"
- يتم تعيين جميع المواد الموجودة إلى أول مستودع في النظام
- يتم إضافة قيد foreign key للحفاظ على سلامة البيانات

### 3. Backend

#### تحديث ItemService
- إضافة `warehouseId` كحقل إجباري في `createItem()`
- إضافة `warehouseId` كحقل اختياري في `updateItem()`
- تضمين معلومات المستودع في `getItems()` و `getItemById()`

```typescript
async createItem(data: {
    name: string;
    warehouseId: string; // إجباري
    // ... باقي الحقول
}): Promise<Item>
```

### 4. Frontend

#### تحديث Types
```typescript
export interface Item {
  // ... الحقول الموجودة
  warehouseId: string
  warehouse?: {
    id: string
    name: string
    code: string
    type: WarehouseType
  }
}

export interface CreateItemRequest {
  name: string
  warehouseId: string // إجباري
  // ... باقي الحقول
}
```

#### تحديث صفحة إضافة مادة جديدة
- إضافة حقل اختيار المستودع (Select)
- جلب المستودعات النشطة من API
- التحقق من اختيار المستودع قبل الإرسال
- عرض اسم ورمز المستودع في القائمة المنسدلة

```tsx
<Select
  value={formData.warehouseId}
  onValueChange={(value) => handleChange("warehouseId", value)}
  disabled={isLoadingWarehouses}
>
  <SelectTrigger>
    <SelectValue placeholder="اختر المستودع" />
  </SelectTrigger>
  <SelectContent>
    {warehouses.map((warehouse) => (
      <SelectItem key={warehouse.id} value={warehouse.id}>
        {warehouse.name} ({warehouse.code})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

## الفوائد

1. **تنظيم أفضل للمواد**: كل مادة الآن مرتبطة بمستودع محدد
2. **إمكانية الفلترة**: يمكن الآن فلترة المواد حسب المستودع
3. **إدارة المخزون**: تسهيل إدارة المخزون لكل مستودع على حدة
4. **التقارير**: إمكانية إنشاء تقارير مفصلة لكل مستودع
5. **الصلاحيات**: في المستقبل يمكن ربط صلاحيات المستخدمين بالمستودعات

## الخطوات التالية المقترحة

1. تحديث صفحة إدارة المواد لعرض معلومات المستودع
2. إضافة فلتر للمواد حسب المستودع
3. تحديث صفحة تعديل المادة لتمكين تغيير المستودع
4. إنشاء تقارير المخزون لكل مستودع
5. ربط صلاحيات المستخدمين بالمستودعات

## الملفات المعدلة

### Backend
- `/backend/prisma/schema.prisma`
- `/backend/src/services/itemService.ts`
- `/backend/prisma/migrations/20251130191347_add_warehouse_to_items/migration.sql`

### Frontend
- `/frontend/src/types.ts`
- `/frontend/src/app/(dashboard-layout)/items/add/page.tsx`

## ملاحظات
- جميع المواد الموجودة تم تعيينها تلقائيًا إلى أول مستودع في النظام
- إذا لم يكن هناك مستودعات، تم إنشاء مستودع افتراضي تلقائيًا
- الحقل إجباري ولا يمكن إضافة مادة بدون تحديد المستودع
