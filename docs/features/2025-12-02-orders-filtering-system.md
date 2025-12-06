# إضافة نظام الفلترة الشامل لصفحة إدارة الطلبيات

**التاريخ:** 2025-12-02  
**الملف:** `/frontend/src/app/(dashboard-layout)/orders/manage/page.tsx`

## الملخص

تم إضافة نظام فلترة شامل ومنظم لصفحة إدارة الطلبيات يسمح بالفلترة حسب القسم، المستخدم، المستودع، الحالة، والتاريخ (من - إلى) بطريقة متجاوبة للشاشات.

## الميزات المضافة

### 1. فلاتر متعددة

تم إضافة إمكانية الفلترة حسب:

#### أ. الحالة (Status)
- الكل
- قيد الانتظار (PENDING)
- معتمد (APPROVED)
- قيد التجهيز (PREPARING)
- جاهز (READY)
- تم التسليم (DELIVERED)
- مرفوض (REJECTED)

#### ب. القسم (Department)
- قائمة ديناميكية بجميع الأقسام الموجودة في الطلبيات
- يتم استخراجها تلقائياً من البيانات

#### ج. المستودع (Warehouse)
- قائمة ديناميكية بجميع المستودعات الموجودة في الطلبيات
- يتم استخراجها تلقائياً من البيانات

#### د. المستخدم (User)
- قائمة ديناميكية بجميع المستخدمين الذين أنشأوا طلبيات
- يتم استخراجها تلقائياً من البيانات

#### هـ. التاريخ (Date Range)
- **من تاريخ:** فلترة الطلبيات من تاريخ معين
- **إلى تاريخ:** فلترة الطلبيات حتى تاريخ معين
- يمكن استخدام أحدهما أو كليهما معاً

### 2. واجهة مستخدم منظمة

#### مكون الفلترة (Popover)
```typescript
<OrderFiltersComponent
  filters={filters}
  onFiltersChange={setFilters}
  departments={uniqueDepartments}
  warehouses={uniqueWarehouses}
  users={uniqueUsers}
  showDepartmentFilter={true}
  showWarehouseFilter={true}
  showUserFilter={true}
  showStatusFilter={true}
/>
```

**المميزات:**
- ✅ زر فلترة مع أيقونة Filter
- ✅ عداد للفلاتر النشطة (Badge)
- ✅ قائمة منبثقة (Popover) منظمة
- ✅ زر "مسح الكل" لإزالة جميع الفلاتر
- ✅ تصميم متجاوب للشاشات الصغيرة

### 3. منطق الفلترة المتقدم

#### استخراج القوائم الفريدة
```typescript
const uniqueDepartments = useMemo(() => 
  Array.from(
    new Map(orders.map((o) => [o.departmentId, { id: o.departmentId, name: o.departmentName }])).values()
  ),
  [orders]
)

const uniqueWarehouses = useMemo(() =>
  Array.from(
    new Map(orders.map((o) => [o.warehouseId, { id: o.warehouseId, name: o.warehouseName }])).values()
  ),
  [orders]
)

const uniqueUsers = useMemo(() =>
  Array.from(
    new Map(orders.map((o) => [o.createdBy, { id: o.createdBy, name: o.createdByName }])).values()
  ),
  [orders]
)
```

#### تطبيق الفلاتر
```typescript
const filteredOrders = useMemo(() => {
  return orders.filter((order) => {
    // Search filter
    const matchesSearch = /* ... */
    if (!matchesSearch) return false

    // Status filter
    if (filters.status && filters.status !== "ALL") {
      if (order.status !== filters.status) return false
    }

    // Department filter
    if (filters.departmentId && filters.departmentId !== "ALL") {
      if (order.departmentId !== filters.departmentId) return false
    }

    // Warehouse filter
    if (filters.warehouseId && filters.warehouseId !== "ALL") {
      if (order.warehouseId !== filters.warehouseId) return false
    }

    // User filter
    if (filters.createdBy && filters.createdBy !== "ALL") {
      if (order.createdBy !== filters.createdBy) return false
    }

    // Date from filter
    if (filters.dateFrom) {
      const orderDate = new Date(order.createdAt)
      const fromDate = new Date(filters.dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      if (orderDate < fromDate) return false
    }

    // Date to filter
    if (filters.dateTo) {
      const orderDate = new Date(order.createdAt)
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      if (orderDate > toDate) return false
    }

    return true
  })
}, [orders, searchTerm, filters])
```

### 4. مؤشرات بصرية

#### عداد الفلاتر النشطة
- يظهر على زر الفلترة
- يعرض عدد الفلاتر المطبقة حالياً
- لون أحمر للفت الانتباه

#### عرض النتائج المفلترة
```typescript
{(activeFilters || searchTerm) && (
  <div className="mb-4 flex items-center justify-between">
    <span className="text-sm text-muted-foreground">
      عرض {filteredOrders.length} من {orders.length} طلبية
    </span>
    {activeFilters && (
      <Button onClick={() => setFilters({})}>
        <XCircle className="h-3 w-3 ml-1" />
        مسح جميع الفلاتر
      </Button>
    )}
  </div>
)}
```

### 5. التصميم المتجاوب

#### للشاشات الكبيرة (Desktop)
```html
<div className="flex flex-col sm:flex-row gap-2 pt-4">
  <div className="relative flex-1">
    <!-- Search Input -->
  </div>
  <div className="flex gap-2">
    <!-- Filters Button -->
    <!-- Refresh Button -->
  </div>
</div>
```

#### للشاشات الصغيرة (Mobile)
- شريط البحث يأخذ العرض الكامل
- الأزرار تظهر في صف منفصل
- القائمة المنبثقة تتكيف مع حجم الشاشة

### 6. إعادة تعيين الصفحة

```typescript
// Reset to page 1 when search or filters change
useEffect(() => {
  setCurrentPage(1)
}, [searchTerm, filters])
```

عند تغيير أي فلتر أو البحث، يتم إعادة المستخدم إلى الصفحة الأولى تلقائياً.

## البنية التقنية

### State Management
```typescript
const [filters, setFilters] = useState<{
  status?: string
  departmentId?: string
  warehouseId?: string
  createdBy?: string
  dateFrom?: string
  dateTo?: string
}>({})
```

### Performance Optimization
- استخدام `useMemo` لحساب القوائم الفريدة
- استخدام `useMemo` لتطبيق الفلاتر
- تحديث فقط عند تغيير البيانات أو الفلاتر

## أمثلة الاستخدام

### مثال 1: فلترة الطلبيات المعلقة من قسم معين
1. افتح قائمة الفلترة
2. اختر القسم المطلوب
3. اختر الحالة "قيد الانتظار"
4. النتائج تظهر فوراً

### مثال 2: فلترة الطلبيات في فترة زمنية محددة
1. افتح قائمة الفلترة
2. حدد "من تاريخ" (مثلاً: 2025-12-01)
3. حدد "إلى تاريخ" (مثلاً: 2025-12-02)
4. النتائج تظهر فوراً

### مثال 3: فلترة متعددة
1. افتح قائمة الفلترة
2. اختر المستودع
3. اختر المستخدم
4. اختر الحالة
5. حدد نطاق التاريخ
6. جميع الفلاتر تعمل معاً

## الفوائد

### 1. تحسين تجربة المستخدم
- ✅ سهولة البحث عن طلبيات محددة
- ✅ توفير الوقت في العثور على البيانات
- ✅ واجهة منظمة وواضحة

### 2. كفاءة العمل
- ✅ فلترة سريعة ودقيقة
- ✅ إمكانية الجمع بين عدة فلاتر
- ✅ مسح الفلاتر بنقرة واحدة

### 3. التصميم الاحترافي
- ✅ متجاوب مع جميع الشاشات
- ✅ مؤشرات بصرية واضحة
- ✅ تجربة مستخدم سلسة

## الملفات المرتبطة

- `/frontend/src/components/orders/order-filters.tsx` - مكون الفلترة
- `/frontend/src/app/(dashboard-layout)/orders/manage/page.tsx` - الصفحة الرئيسية
- `/frontend/src/types/index.ts` - تعريفات الأنواع

## الملاحظات

1. **الأداء:** جميع العمليات محسّنة باستخدام `useMemo`
2. **التوافق:** يعمل مع جميع المتصفحات الحديثة
3. **الصيانة:** كود نظيف وسهل التعديل
4. **التوسع:** يمكن إضافة فلاتر جديدة بسهولة

## التوصيات المستقبلية

1. إضافة حفظ الفلاتر المفضلة
2. إضافة تصدير النتائج المفلترة إلى Excel/PDF
3. إضافة فلترة متقدمة بناءً على محتوى الطلبيات
4. إضافة إحصائيات للنتائج المفلترة
