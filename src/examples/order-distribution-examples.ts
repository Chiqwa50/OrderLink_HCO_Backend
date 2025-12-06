/**
 * أمثلة عملية على استخدام نظام توزيع الطلبات التلقائي
 * OrderLink - Automatic Order Distribution Examples
 */

import { orderService } from '../services/orderService';
import { departmentService } from '../services/departmentService';
import { ItemService } from '../services/itemService';
import { Order, OrderItem } from '@prisma/client';

const itemService = new ItemService();

// Types for examples
type DepartmentWithWarehouses = any;
type OrderWithRelations = any;

// ============================================
// مثال 1: إنشاء قسم مع ربط مستودعات
// ============================================

async function example1_CreateDepartmentWithWarehouses() {
    console.log('📦 مثال 1: إنشاء قسم مع ربط مستودعات\n');

    try {
        const department = await departmentService.createDepartment({
            name: 'قسم الطوارئ',
            code: 'EMRG-001',
            description: 'قسم الطوارئ الرئيسي',
            warehouses: [
                {
                    warehouseId: 'warehouse-pharmacy-id',
                    priority: 1, // أولوية عالية
                    isPrimary: true, // المستودع الرئيسي
                },
                {
                    warehouseId: 'warehouse-logistics-id',
                    priority: 2, // أولوية متوسطة
                    isPrimary: false,
                },
                {
                    warehouseId: 'warehouse-equipment-id',
                    priority: 3, // أولوية منخفضة
                    isPrimary: false,
                },
            ],
        });

        const dept = department as DepartmentWithWarehouses;
        console.log('✅ تم إنشاء القسم بنجاح:');
        console.log(`   - الاسم: ${dept.name}`);
        console.log(`   - الكود: ${dept.code}`);
        console.log(`   - عدد المستودعات المرتبطة: ${dept.departmentWarehouses?.length || 0}`);
        console.log('\n');
    } catch (error: any) {
        console.error('❌ خطأ:', error.message);
    }
}

// ============================================
// مثال 2: تحديث المستودعات المرتبطة بقسم
// ============================================

async function example2_UpdateDepartmentWarehouses() {
    console.log('🔄 مثال 2: تحديث المستودعات المرتبطة بقسم\n');

    try {
        const departmentId = 'existing-department-id';

        const updatedDepartment = await departmentService.updateDepartment(departmentId, {
            warehouses: [
                {
                    warehouseId: 'warehouse-pharmacy-id',
                    priority: 1,
                    isPrimary: true,
                },
                {
                    warehouseId: 'warehouse-medical-id',
                    priority: 2,
                    isPrimary: false,
                },
            ],
        });

        const dept = updatedDepartment as DepartmentWithWarehouses;
        console.log('✅ تم تحديث المستودعات بنجاح');
        console.log(`   - القسم: ${dept.name}`);
        console.log(`   - المستودعات الجديدة: ${dept.departmentWarehouses?.length || 0}`);
        console.log('\n');
    } catch (error: any) {
        console.error('❌ خطأ:', error.message);
    }
}

// ============================================
// مثال 3: إنشاء طلب - سيناريو مستودع واحد
// ============================================

async function example3_CreateOrderSingleWarehouse() {
    console.log('📝 مثال 3: إنشاء طلب من مستودع واحد\n');

    try {
        // جميع المواد من نفس المستودع (الصيدلية)
        const orders = await orderService.createOrder({
            departmentId: 'dept-emergency-id',
            createdBy: 'user-123',
            notes: 'طلب عاجل - أدوية',
            items: [
                {
                    itemName: 'باراسيتامول 500mg',
                    quantity: 100,
                    unit: 'box',
                    notes: 'للحمى',
                },
                {
                    itemName: 'أيبوبروفين 400mg',
                    quantity: 50,
                    unit: 'box',
                },
                {
                    itemName: 'أموكسيسيلين 500mg',
                    quantity: 30,
                    unit: 'box',
                    notes: 'مضاد حيوي',
                },
            ],
        });

        const order = orders[0] as OrderWithRelations;
        console.log('✅ تم إنشاء الطلب بنجاح');
        console.log(`   - عدد الطلبات: ${orders.length}`);
        console.log(`   - رقم الطلب: ${order.orderNumber}`);
        console.log(`   - المستودع: ${order.warehouse?.name || 'غير محدد'}`);
        console.log(`   - عدد المواد: ${order.items?.length || 0}`);
        console.log('\n');
    } catch (error: any) {
        console.error('❌ خطأ:', error.message);
    }
}

// ============================================
// مثال 4: إنشاء طلب - سيناريو عدة مستودعات
// ============================================

async function example4_CreateOrderMultipleWarehouses() {
    console.log('📝 مثال 4: إنشاء طلب من عدة مستودعات (توزيع تلقائي)\n');

    try {
        // المواد من مستودعات مختلفة
        const orders = await orderService.createOrder({
            departmentId: 'dept-emergency-id',
            createdBy: 'user-123',
            notes: 'طلب شامل',
            items: [
                // من مستودع الصيدلية
                {
                    itemName: 'باراسيتامول 500mg',
                    quantity: 100,
                    unit: 'box',
                },
                {
                    itemName: 'أيبوبروفين 400mg',
                    quantity: 50,
                    unit: 'box',
                },
                // من المستودع اللوجستي
                {
                    itemName: 'قفازات طبية',
                    quantity: 500,
                    unit: 'piece',
                },
                {
                    itemName: 'كمامات N95',
                    quantity: 200,
                    unit: 'piece',
                },
                // من مستودع الأجهزة
                {
                    itemName: 'ترمومتر رقمي',
                    quantity: 10,
                    unit: 'piece',
                },
            ],
        });

        console.log('✅ تم توزيع الطلب تلقائياً على المستودعات');
        console.log(`   - عدد الطلبات المنشأة: ${orders.length}`);
        console.log('\n');

        orders.forEach((order, index) => {
            const o = order as OrderWithRelations;
            console.log(`   طلب ${index + 1}:`);
            console.log(`   - رقم الطلب: ${o.orderNumber}`);
            console.log(`   - المستودع: ${o.warehouse?.name || 'غير محدد'}`);
            console.log(`   - عدد المواد: ${o.items?.length || 0}`);
            console.log(`   - المواد:`);
            o.items?.forEach((item: any) => {
                console.log(`     • ${item.itemName} (${item.quantity} ${item.unit})`);
            });
            console.log('\n');
        });
    } catch (error: any) {
        console.error('❌ خطأ:', error.message);
    }
}

// ============================================
// مثال 5: معالجة خطأ - لا يوجد مستودع مرتبط
// ============================================

async function example5_ErrorNoWarehouseLinked() {
    console.log('⚠️  مثال 5: معالجة خطأ - قسم بدون مستودعات مرتبطة\n');

    try {
        // محاولة إنشاء طلب لقسم غير مرتبط بأي مستودع
        const orders = await orderService.createOrder({
            departmentId: 'dept-without-warehouses',
            createdBy: 'user-123',
            items: [
                {
                    itemName: 'أي مادة',
                    quantity: 10,
                    unit: 'piece',
                },
            ],
        });
    } catch (error: any) {
        console.log('❌ الخطأ المتوقع:');
        console.log(`   "${error.message}"`);
        console.log('\n');
    }
}

// ============================================
// مثال 6: معالجة خطأ - مادة من مستودع غير مرتبط
// ============================================

async function example6_ErrorItemFromUnlinkedWarehouse() {
    console.log('⚠️  مثال 6: معالجة خطأ - مادة من مستودع غير مرتبط\n');

    try {
        // القسم مرتبط بمستودع الصيدلية فقط
        // لكن المادة المطلوبة من مستودع الأجهزة
        const orders = await orderService.createOrder({
            departmentId: 'dept-pharmacy-only',
            createdBy: 'user-123',
            items: [
                {
                    itemName: 'جهاز قياس ضغط', // من مستودع الأجهزة
                    quantity: 5,
                    unit: 'piece',
                },
            ],
        });
    } catch (error: any) {
        console.log('❌ الخطأ المتوقع:');
        console.log(`   "${error.message}"`);
        console.log('\n');
    }
}

// ============================================
// مثال 7: جلب المواد المتاحة لقسم معين
// ============================================

async function example7_GetItemsForDepartment() {
    console.log('📋 مثال 7: جلب المواد المتاحة لقسم معين\n');

    try {
        const departmentId = 'dept-emergency-id';

        // جلب المواد من المستودعات المرتبطة بالقسم فقط
        const items = await itemService.getItemsForDepartment(departmentId);

        console.log('✅ المواد المتاحة للقسم:');
        console.log(`   - عدد المواد: ${items.length}`);
        console.log('\n');

        // تجميع حسب المستودع
        const itemsByWarehouse = items.reduce((acc: any, item: any) => {
            const warehouseName = item.warehouse.name;
            if (!acc[warehouseName]) {
                acc[warehouseName] = [];
            }
            acc[warehouseName].push(item);
            return acc;
        }, {});

        Object.entries(itemsByWarehouse).forEach(([warehouse, warehouseItems]: [string, any]) => {
            console.log(`   📦 ${warehouse}:`);
            warehouseItems.forEach((item: any) => {
                console.log(`      • ${item.name} (SKU: ${item.sku})`);
            });
            console.log('\n');
        });
    } catch (error: any) {
        console.error('❌ خطأ:', error.message);
    }
}

// ============================================
// مثال 8: جلب طلبات المستودع
// ============================================

async function example8_GetWarehouseOrders() {
    console.log('📊 مثال 8: جلب طلبات مستودع معين\n');

    try {
        const warehouseId = 'warehouse-pharmacy-id';

        // جلب الطلبات الموجهة لهذا المستودع فقط
        const orders = await orderService.getOrders({
            warehouseId,
        });

        console.log('✅ طلبات المستودع:');
        console.log(`   - عدد الطلبات: ${orders.length}`);
        console.log('\n');

        orders.forEach((order) => {
            const o = order as OrderWithRelations;
            console.log(`   📄 ${o.orderNumber}`);
            console.log(`      - القسم: ${o.department?.name || 'غير محدد'}`);
            console.log(`      - الحالة: ${o.status}`);
            console.log(`      - عدد المواد: ${o.items?.length || 0}`);
            console.log('\n');
        });
    } catch (error: any) {
        console.error('❌ خطأ:', error.message);
    }
}

// ============================================
// مثال 9: ربط/إلغاء ربط مستودع بقسم
// ============================================

async function example9_LinkUnlinkWarehouse() {
    console.log('🔗 مثال 9: ربط وإلغاء ربط مستودع\n');

    try {
        const departmentId = 'dept-emergency-id';
        const warehouseId = 'warehouse-new-id';

        // ربط مستودع جديد
        console.log('1️⃣ ربط مستودع جديد...');
        await departmentService.linkWarehouseToDepartment(
            departmentId,
            warehouseId,
            4, // أولوية منخفضة
            false // ليس رئيسي
        );
        console.log('   ✅ تم الربط بنجاح\n');

        // إلغاء الربط
        console.log('2️⃣ إلغاء ربط المستودع...');
        await departmentService.unlinkWarehouseFromDepartment(departmentId, warehouseId);
        console.log('   ✅ تم إلغاء الربط بنجاح\n');
    } catch (error: any) {
        console.error('❌ خطأ:', error.message);
    }
}

// ============================================
// مثال 10: سيناريو كامل - من البداية للنهاية
// ============================================

async function example10_CompleteScenario() {
    console.log('🎯 مثال 10: سيناريو كامل\n');
    console.log('='.repeat(60));
    console.log('\n');

    try {
        // 1. إنشاء قسم جديد
        console.log('1️⃣ إنشاء قسم جديد...');
        const department = await departmentService.createDepartment({
            name: 'قسم العناية المركزة',
            code: 'ICU-001',
            description: 'وحدة العناية المركزة',
            warehouses: [
                {
                    warehouseId: 'warehouse-pharmacy-id',
                    priority: 1,
                    isPrimary: true,
                },
                {
                    warehouseId: 'warehouse-equipment-id',
                    priority: 2,
                    isPrimary: false,
                },
            ],
        });
        console.log(`   ✅ تم إنشاء القسم: ${department.name}\n`);

        // 2. جلب المواد المتاحة
        console.log('2️⃣ جلب المواد المتاحة للقسم...');
        const items = await itemService.getItemsForDepartment(department.id);
        console.log(`   ✅ عدد المواد المتاحة: ${items.length}\n`);

        // 3. إنشاء طلب
        console.log('3️⃣ إنشاء طلب جديد...');
        const orders = await orderService.createOrder({
            departmentId: department.id,
            createdBy: 'user-icu-supervisor',
            notes: 'طلب يومي',
            items: [
                {
                    itemName: 'أدرينالين 1mg',
                    quantity: 20,
                    unit: 'ampule',
                },
                {
                    itemName: 'جهاز مراقبة القلب',
                    quantity: 2,
                    unit: 'piece',
                },
            ],
        });
        console.log(`   ✅ تم إنشاء ${orders.length} طلب/طلبات\n`);

        // 4. عرض تفاصيل الطلبات
        console.log('4️⃣ تفاصيل الطلبات:');
        orders.forEach((order, index) => {
            const o = order as OrderWithRelations;
            console.log(`\n   طلب ${index + 1}:`);
            console.log(`   - رقم: ${o.orderNumber}`);
            console.log(`   - مستودع: ${o.warehouse?.name || 'غير محدد'}`);
            console.log(`   - حالة: ${o.status}`);
            console.log(`   - مواد:`);
            o.items?.forEach((item: any) => {
                console.log(`     • ${item.itemName} × ${item.quantity}`);
            });
        });

        console.log('\n');
        console.log('='.repeat(60));
        console.log('✅ السيناريو اكتمل بنجاح!');
        console.log('='.repeat(60));
    } catch (error: any) {
        console.error('❌ خطأ في السيناريو:', error.message);
    }
}

// ============================================
// تشغيل جميع الأمثلة
// ============================================

export async function runAllExamples() {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   أمثلة نظام توزيع الطلبات التلقائي - OrderLink       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n');

    await example1_CreateDepartmentWithWarehouses();
    await example2_UpdateDepartmentWarehouses();
    await example3_CreateOrderSingleWarehouse();
    await example4_CreateOrderMultipleWarehouses();
    await example5_ErrorNoWarehouseLinked();
    await example6_ErrorItemFromUnlinkedWarehouse();
    await example7_GetItemsForDepartment();
    await example8_GetWarehouseOrders();
    await example9_LinkUnlinkWarehouse();
    await example10_CompleteScenario();

    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    انتهت الأمثلة                         ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n');
}

// تصدير الأمثلة الفردية
export {
    example1_CreateDepartmentWithWarehouses,
    example2_UpdateDepartmentWarehouses,
    example3_CreateOrderSingleWarehouse,
    example4_CreateOrderMultipleWarehouses,
    example5_ErrorNoWarehouseLinked,
    example6_ErrorItemFromUnlinkedWarehouse,
    example7_GetItemsForDepartment,
    example8_GetWarehouseOrders,
    example9_LinkUnlinkWarehouse,
    example10_CompleteScenario,
};
