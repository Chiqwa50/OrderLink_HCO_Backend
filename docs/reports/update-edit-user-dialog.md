# تحديث واجهة تعديل المستخدم

## التاريخ: 2025-11-29 (التحديث الثالث)

## المشكلة

في واجهة **تعديل المستخدم** (Edit Dialog):
- كان يتم استخدام `Select` dropdown عادي
- يسمح باختيار **قسم واحد فقط** أو **مستودع واحد فقط**
- هذا يختلف عن واجهة **إنشاء المستخدم** التي تستخدم `Checkbox` وتسمح باختيار **عدة أقسام/مستودعات**

### التناقض:
| الواجهة | القسم | المستودع |
|---------|-------|----------|
| إنشاء مستخدم | ✅ Checkbox (متعدد) | ✅ Checkbox (متعدد) |
| تعديل مستخدم | ❌ Select (واحد فقط) | ❌ غير موجود |

## الحل المطبق

تم تحديث واجهة **تعديل المستخدم** لتكون متطابقة مع واجهة **إنشاء المستخدم**:

### 1. تحديث State Management

**قبل:**
```typescript
const [editFormData, setEditFormData] = useState<UpdateUserRequest>({})

const handleEdit = (user: User) => {
    setEditFormData({
        name: user.name,
        phone: user.phone,
        role: user.role,
        departmentId: user.departmentId || "",  // ← قسم واحد فقط
    })
}
```

**بعد:**
```typescript
const [editFormData, setEditFormData] = useState<UpdateUserRequest>({})
const [warehouses, setWarehouses] = useState<Warehouse[]>([])

const handleEdit = async (user: User) => {
    // جلب الأقسام والمستودعات المرتبطة بالمستخدم
    let userDepartmentIds: string[] = []
    let userWarehouseIds: string[] = []
    
    if (user.role === "DEPARTMENT") {
        const userDepts = await userService.getUserDepartments(user.id)
        userDepartmentIds = userDepts.map((d) => d.id)
    } else if (user.role === "WAREHOUSE") {
        const userWarehs = await userService.getUserWarehouses(user.id)
        userWarehouseIds = userWarehs.map((w) => w.id)
    }

    setEditFormData({
        name: user.name,
        phone: user.phone,
        role: user.role,
        departmentIds: userDepartmentIds,      // ← عدة أقسام
        warehouseIds: userWarehouseIds,        // ← عدة مستودعات
        isGlobalWarehouseSupervisor: isGlobal,
    })
}
```

### 2. إضافة Toggle Handlers

```typescript
const handleDepartmentToggle = (departmentId: string) => {
    setEditFormData((prev) => ({
        ...prev,
        departmentIds: prev.departmentIds?.includes(departmentId)
            ? prev.departmentIds.filter((id) => id !== departmentId)
            : [...(prev.departmentIds || []), departmentId],
    }))
}

const handleWarehouseToggle = (warehouseId: string) => {
    setEditFormData((prev) => ({
        ...prev,
        warehouseIds: prev.warehouseIds?.includes(warehouseId)
            ? prev.warehouseIds.filter((id) => id !== warehouseId)
            : [...(prev.warehouseIds || []), warehouseId],
    }))
}
```

### 3. تحديث Edit Dialog UI

**قبل:**
```tsx
{editFormData.role === "DEPARTMENT" && (
    <div className="space-y-2">
        <Label>القسم</Label>
        <Select
            value={editFormData.departmentId}
            onValueChange={(value) => setEditFormData({ ...editFormData, departmentId: value })}
        >
            {/* ... */}
        </Select>
    </div>
)}
```

**بعد:**
```tsx
{editFormData.role === "DEPARTMENT" && (
    <div className="space-y-2">
        <Label>الأقسام المشرف عليها *</Label>
        <p className="text-sm text-muted-foreground mb-2">
            اختر قسم واحد أو عدة أقسام
        </p>
        <div className="border rounded-md p-4 space-y-3 max-h-60 overflow-y-auto">
            {departments.map((dept) => (
                <div key={dept.id} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                        id={`edit-dept-${dept.id}`}
                        checked={editFormData.departmentIds?.includes(dept.id) || false}
                        onCheckedChange={() => handleDepartmentToggle(dept.id)}
                    />
                    <label htmlFor={`edit-dept-${dept.id}`}>
                        {dept.name} ({dept.code})
                    </label>
                </div>
            ))}
        </div>
    </div>
)}
```

### 4. إضافة دعم المستودعات

تم إضافة قسم كامل لاختيار المستودعات (لم يكن موجودًا من قبل):

```tsx
{editFormData.role === "WAREHOUSE" && (
    <div className="space-y-4">
        {/* خيار المشرف العام */}
        <Checkbox
            id="edit-global-supervisor"
            checked={editFormData.isGlobalWarehouseSupervisor || false}
            onCheckedChange={(checked) => {/* ... */}}
        />
        
        {/* اختيار المستودعات */}
        {!editFormData.isGlobalWarehouseSupervisor && (
            <div className="border rounded-md p-4 space-y-3 max-h-60 overflow-y-auto">
                {warehouses.map((warehouse) => (
                    <Checkbox
                        id={`edit-warehouse-${warehouse.id}`}
                        checked={editFormData.warehouseIds?.includes(warehouse.id)}
                        onCheckedChange={() => handleWarehouseToggle(warehouse.id)}
                    />
                ))}
            </div>
        )}
    </div>
)}
```

### 5. تحسينات إضافية

1. **حقل كلمة المرور**:
   - تم إضافة حقل لتغيير كلمة المرور (اختياري)
   - يمكن تركه فارغًا إذا لم يرد المستخدم تغييرها

2. **حجم Dialog**:
   - تم زيادة العرض: `max-w-2xl`
   - تم إضافة scroll: `max-h-[90vh] overflow-y-auto`

3. **تسميات أفضل**:
   - "موظف قسم" → "مشرف قسم"
   - "موظف مستودع" → "مشرف مستودع"

## الملفات المعدلة

### Frontend
- `/frontend/src/app/(dashboard-layout)/users/manage/page.tsx`
  - تحديث imports (إضافة warehouseService, Warehouse, Checkbox)
  - تحديث state management
  - إضافة loadWarehouses()
  - تحديث handleEdit() لجلب العلاقات
  - إضافة handleDepartmentToggle() و handleWarehouseToggle()
  - تحديث Edit Dialog UI بالكامل

## المميزات الجديدة

| الميزة | قبل | بعد |
|--------|-----|-----|
| اختيار الأقسام | ❌ قسم واحد فقط | ✅ عدة أقسام |
| اختيار المستودعات | ❌ غير موجود | ✅ عدة مستودعات + مشرف عام |
| تغيير كلمة المرور | ❌ غير موجود | ✅ حقل اختياري |
| حجم Dialog | ❌ صغير | ✅ كبير مع scroll |
| التوافق مع صفحة الإنشاء | ❌ مختلف | ✅ متطابق |

## كيفية الاختبار

### 1. اختبار تعديل مستخدم قسم

```bash
1. انتقل إلى /users/manage
2. اضغط على "تعديل" لمستخدم من نوع "مشرف قسم"
3. تحقق من:
   - ظهور الأقسام المحددة مسبقًا كـ checked
   - إمكانية إضافة/إزالة أقسام
   - حفظ التعديلات بنجاح
```

### 2. اختبار تعديل مستخدم مستودع

```bash
1. انتقل إلى /users/manage
2. اضغط على "تعديل" لمستخدم من نوع "مشرف مستودع"
3. تحقق من:
   - ظهور المستودعات المحددة مسبقًا
   - خيار "مشرف عام على جميع المستودعات"
   - إمكانية إضافة/إزالة مستودعات
   - حفظ التعديلات بنجاح
```

### 3. اختبار تغيير كلمة المرور

```bash
1. افتح تعديل أي مستخدم
2. أدخل كلمة مرور جديدة في الحقل
3. احفظ التعديلات
4. حاول تسجيل الدخول بكلمة المرور الجديدة
```

### 4. اختبار تغيير الدور

```bash
1. افتح تعديل مستخدم
2. غير الدور من "مشرف قسم" إلى "مشرف مستودع"
3. تحقق من:
   - اختفاء قسم الأقسام
   - ظهور قسم المستودعات
   - إعادة تعيين الاختيارات
```

## ملاحظات مهمة

### 1. جلب العلاقات
- يتم جلب الأقسام/المستودعات المرتبطة بالمستخدم عند فتح Dialog
- يتم استخدام `userService.getUserDepartments()` و `userService.getUserWarehouses()`

### 2. التوافق
- الواجهة الآن متطابقة تمامًا مع صفحة إنشاء المستخدم
- نفس الـ UX ونفس الـ functionality

### 3. الأداء
- يتم تحميل المستودعات مرة واحدة عند تحميل الصفحة
- يتم جلب علاقات المستخدم فقط عند فتح Dialog

## الخلاصة

تم تحديث واجهة تعديل المستخدم بنجاح! الآن:

✅ **متطابقة** مع واجهة إنشاء المستخدم
✅ **تدعم اختيار عدة أقسام** لمشرف القسم
✅ **تدعم اختيار عدة مستودعات** لمشرف المستودع
✅ **تدعم تغيير كلمة المرور** (اختياري)
✅ **واجهة أكبر وأسهل** في الاستخدام
✅ **تجربة مستخدم موحدة** عبر جميع الواجهات

---

**جميع التحديثات تمت بنجاح! 🎉**
