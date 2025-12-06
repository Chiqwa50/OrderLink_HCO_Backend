# إضافة عمود المستودع في صفحة إدارة المواد

## التاريخ
2025-11-30

## الملخص
تم إضافة عمود **المستودع** في جدول إدارة المواد لعرض المستودع الذي تنتمي إليه كل مادة.

## التغييرات المنفذة

### 1. إضافة المستودع إلى الأعمدة المرئية افتراضياً
```tsx
const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
  new Set(["sku", "name", "category", "warehouse", "unit", "isActive", "creator"])
)
```

### 2. إضافة خيار المستودع في قائمة عرض/إخفاء الأعمدة
```tsx
<DropdownMenuCheckboxItem
  checked={visibleColumns.has("warehouse")}
  onCheckedChange={() => toggleColumnVisibility("warehouse")}
>
  المستودع
</DropdownMenuCheckboxItem>
```

### 3. إضافة رأس عمود المستودع (TableHead)
- عمود قابل للترتيب (تصاعدي/تنازلي)
- يظهر بعد عمود الفئة
- يحتوي على أيقونة فلتر للترتيب

```tsx
{visibleColumns.has("warehouse") && (
  <TableHead className="h-10 text-center">
    <div className="flex items-center justify-center gap-1">
      <span>المستودع</span>
      <DropdownMenu>
        {/* خيارات الترتيب */}
      </DropdownMenu>
    </div>
  </TableHead>
)}
```

### 4. إضافة خلية المستودع (TableCell)
- عرض اسم المستودع
- عرض رمز المستودع بين قوسين
- معالجة الحالات التي لا يوجد فيها مستودع (عرض "-")

```tsx
{visibleColumns.has("warehouse") && (
  <TableCell className="py-2.5 text-center">
    <span className="text-xs">
      {item.warehouse?.name || "-"}
    </span>
    {item.warehouse?.code && (
      <span className="text-xs text-muted-foreground block">
        ({item.warehouse.code})
      </span>
    )}
  </TableCell>
)}
```

### 5. دعم الترتيب حسب المستودع
تم تحديث دالة الترتيب لدعم ترتيب المواد حسب اسم المستودع:

```tsx
// Handle nested warehouse name
if (sortColumn === "warehouse") {
  aValue = a.warehouse?.name || ""
  bValue = b.warehouse?.name || ""
}
```

## المزايا

1. **رؤية واضحة**: يمكن للمستخدمين رؤية المستودع الذي تنتمي إليه كل مادة مباشرة
2. **الترتيب**: إمكانية ترتيب المواد حسب المستودع (أ-ي أو ي-أ)
3. **التحكم في العرض**: يمكن إخفاء/إظهار عمود المستودع حسب الحاجة
4. **معلومات كاملة**: عرض اسم ورمز المستودع معاً

## الشكل النهائي

في جدول إدارة المواد، سيظهر عمود المستودع بالشكل التالي:

```
| المستودع          |
|-------------------|
| مستودع الأدوية    |
| (WH-PHARMA)       |
|-------------------|
| المستودع الرئيسي  |
| (WH-001)          |
```

## الملفات المعدلة

- `/frontend/src/app/(dashboard-layout)/items/manage/page.tsx`

## الخطوات التالية المقترحة

1. إضافة فلتر للمواد حسب المستودع
2. إضافة إحصائيات عدد المواد لكل مستودع
3. إمكانية نقل المواد بين المستودعات
4. تقارير المخزون لكل مستودع
