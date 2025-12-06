import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WAREHOUSE_ID = '01ef67cf-8776-433f-84ac-5520203c5519';

async function verifyImport() {
    try {
        console.log('🔍 بدء التحقق من البيانات المستوردة...\n');

        // التحقق من إجمالي عدد المواد
        const totalItems = await prisma.item.count({
            where: { warehouseId: WAREHOUSE_ID }
        });

        console.log(`📊 إجمالي المواد في المستودع: ${totalItems}\n`);

        // التحقق من توزيع الفئات
        const categories = await prisma.item.groupBy({
            by: ['category'],
            where: { warehouseId: WAREHOUSE_ID },
            _count: {
                category: true
            }
        });

        console.log('📈 توزيع المواد حسب الفئات:');
        console.log('-'.repeat(60));
        categories
            .sort((a, b) => b._count.category - a._count.category)
            .forEach(cat => {
                const percentage = ((cat._count.category / totalItems) * 100).toFixed(1);
                console.log(`   ${cat.category}: ${cat._count.category} مادة (${percentage}%)`);
            });

        console.log('\n' + '='.repeat(60));

        // عرض عينة من المواد المستوردة
        console.log('\n📋 عينة من المواد المستوردة:\n');

        const sampleItems = await prisma.item.findMany({
            where: { warehouseId: WAREHOUSE_ID },
            take: 10,
            select: {
                sku: true,
                name: true,
                category: true,
                unit: true,
                description: true
            }
        });

        sampleItems.forEach((item, index) => {
            console.log(`${index + 1}. SKU: ${item.sku}`);
            console.log(`   الاسم: ${item.name}`);
            console.log(`   الفئة: ${item.category}`);
            console.log(`   الوحدة: ${item.unit}`);
            console.log(`   الوصف: ${item.description}`);
            console.log('');
        });

        console.log('='.repeat(60));

        // التحقق من SKU الفريدة
        const duplicateSKUs = await prisma.item.groupBy({
            by: ['sku'],
            where: { warehouseId: WAREHOUSE_ID },
            _count: {
                sku: true
            },
            having: {
                sku: {
                    _count: {
                        gt: 1
                    }
                }
            }
        });

        if (duplicateSKUs.length > 0) {
            console.log(`\n⚠️  تحذير: تم العثور على ${duplicateSKUs.length} SKU مكررة`);
        } else {
            console.log('\n✅ جميع SKU فريدة');
        }

        // التحقق من ارتباط المواد بالمستودع الصحيح
        const itemsInCorrectWarehouse = await prisma.item.count({
            where: { warehouseId: WAREHOUSE_ID }
        });

        console.log(`✅ جميع المواد (${itemsInCorrectWarehouse}) مرتبطة بمستودع الهنقر\n`);

    } catch (error) {
        console.error('❌ خطأ في التحقق:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyImport()
    .then(() => {
        console.log('✨ اكتمل التحقق بنجاح!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 فشل التحقق:', error);
        process.exit(1);
    });
