import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_USER_ID = '3c2506ff-1268-45f9-9851-7bd2dcf57b71';
const WAREHOUSE_ID = '01ef67cf-8776-433f-84ac-5520203c5519';

async function updateItemsCreator() {
    try {
        console.log('🔄 بدء تحديث منشئ المواد...\n');

        // التحقق من وجود المستخدم المدير
        const adminUser = await prisma.user.findUnique({
            where: { id: ADMIN_USER_ID },
            select: { id: true, name: true, role: true }
        });

        if (!adminUser) {
            console.error(`❌ خطأ: المستخدم بالمعرف ${ADMIN_USER_ID} غير موجود`);
            return;
        }

        console.log(`✅ تم العثور على المستخدم: ${adminUser.name} (${adminUser.role})\n`);

        // تحديث جميع المواد في مستودع الهنقر
        const result = await prisma.item.updateMany({
            where: {
                warehouseId: WAREHOUSE_ID
            },
            data: {
                createdBy: ADMIN_USER_ID
            }
        });

        console.log('='.repeat(60));
        console.log('📊 نتيجة التحديث:');
        console.log('='.repeat(60));
        console.log(`✅ تم تحديث ${result.count} مادة`);
        console.log(`👤 المنشئ: ${adminUser.name}`);
        console.log(`🆔 معرف المستخدم: ${ADMIN_USER_ID}`);
        console.log('='.repeat(60) + '\n');

        // التحقق من التحديث
        const updatedItems = await prisma.item.count({
            where: {
                warehouseId: WAREHOUSE_ID,
                createdBy: ADMIN_USER_ID
            }
        });

        console.log(`✅ التحقق: ${updatedItems} مادة مرتبطة بالمستخدم المدير\n`);

    } catch (error) {
        console.error('❌ خطأ في التحديث:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateItemsCreator()
    .then(() => {
        console.log('✨ اكتمل التحديث بنجاح!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 فشل التحديث:', error);
        process.exit(1);
    });
