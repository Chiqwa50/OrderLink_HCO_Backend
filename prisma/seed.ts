import { PrismaClient, UserRole, WarehouseType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create Departments
    const emergencyDept = await prisma.department.upsert({
        where: { code: 'EMRG' },
        update: {},
        create: {
            name: 'قسم الطوارئ',
            code: 'EMRG',
            description: 'قسم الطوارئ والحالات الحرجة',
            isActive: true,
        },
    });
    console.log('✅ Created department:', emergencyDept.name);

    const surgeryDept = await prisma.department.upsert({
        where: { code: 'SURG' },
        update: {},
        create: {
            name: 'قسم العمليات',
            code: 'SURG',
            description: 'قسم العمليات الجراحية',
            isActive: true,
        },
    });
    console.log('✅ Created department:', surgeryDept.name);

    const icuDept = await prisma.department.upsert({
        where: { code: 'ICU' },
        update: {},
        create: {
            name: 'قسم العناية المركزة',
            code: 'ICU',
            description: 'قسم العناية المركزة',
            isActive: true,
        },
    });
    console.log('✅ Created department:', icuDept.name);

    // Create Warehouses
    const pharmaWarehouse = await prisma.warehouse.upsert({
        where: { code: 'WH-PHARMA' },
        update: {},
        create: {
            name: 'مستودع الأدوية',
            code: 'WH-PHARMA',
            type: WarehouseType.PHARMACEUTICAL,
            description: 'مستودع الأدوية والمستلزمات الطبية',
            location: 'الطابق الأرضي - الجناح الشرقي',
            isActive: true,
        },
    });
    console.log('✅ Created warehouse:', pharmaWarehouse.name);

    const equipmentWarehouse = await prisma.warehouse.upsert({
        where: { code: 'WH-EQUIP' },
        update: {},
        create: {
            name: 'مستودع الأجهزة',
            code: 'WH-EQUIP',
            type: WarehouseType.EQUIPMENT,
            description: 'مستودع الأجهزة الطبية',
            location: 'الطابق الأول - الجناح الغربي',
            isActive: true,
        },
    });
    console.log('✅ Created warehouse:', equipmentWarehouse.name);

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { phone: '0900000000' },
        update: {},
        create: {
            phone: '0900000000',
            password: adminPassword,
            name: 'مدير النظام',
            role: UserRole.ADMIN,
        },
    });
    console.log('✅ Created admin user:', admin.name);

    // Create Warehouse User
    const warehousePassword = await bcrypt.hash('warehouse123', 10);
    const warehouse = await prisma.user.upsert({
        where: { phone: '0900000001' },
        update: {},
        create: {
            phone: '0900000001',
            password: warehousePassword,
            name: 'موظف المستودع',
            role: UserRole.WAREHOUSE,
        },
    });
    console.log('✅ Created warehouse user:', warehouse.name);

    // Create Driver User
    const driverPassword = await bcrypt.hash('driver123', 10);
    const driver = await prisma.user.upsert({
        where: { phone: '0900000002' },
        update: {},
        create: {
            phone: '0900000002',
            password: driverPassword,
            name: 'سائق التوصيل',
            role: UserRole.DRIVER,
        },
    });
    console.log('✅ Created driver user:', driver.name);

    // Create Department Users
    const dept1Password = await bcrypt.hash('dept123', 10);
    const department1 = await prisma.user.upsert({
        where: { phone: '0900000003' },
        update: {},
        create: {
            phone: '0900000003',
            password: dept1Password,
            name: 'أحمد محمد',
            role: UserRole.DEPARTMENT,
            departmentId: emergencyDept.id,
        },
    });
    console.log('✅ Created department user:', department1.name, '-', emergencyDept.name);

    const dept2Password = await bcrypt.hash('dept123', 10);
    const department2 = await prisma.user.upsert({
        where: { phone: '0900000004' },
        update: {},
        create: {
            phone: '0900000004',
            password: dept2Password,
            name: 'فاطمة علي',
            role: UserRole.DEPARTMENT,
            departmentId: surgeryDept.id,
        },
    });
    console.log('✅ Created department user:', department2.name, '-', surgeryDept.name);

    const dept3Password = await bcrypt.hash('dept123', 10);
    const department3 = await prisma.user.upsert({
        where: { phone: '0900000005' },
        update: {},
        create: {
            phone: '0900000005',
            password: dept3Password,
            name: 'خالد سعيد',
            role: UserRole.DEPARTMENT,
            departmentId: icuDept.id,
        },
    });
    console.log('✅ Created department user:', department3.name, '-', icuDept.name);

    console.log('\n📊 Seed Summary:');
    console.log('================');
    console.log('🏢 Departments: 3');
    console.log('🏭 Warehouses: 2');
    console.log('👤 Total users created: 6');
    console.log('   - 1 Admin');
    console.log('   - 1 Warehouse');
    console.log('   - 1 Driver');
    console.log('   - 3 Departments');
    console.log('\n🔑 Test Credentials:');
    console.log('================');
    console.log('Admin:      0900000000 / admin123');
    console.log('Warehouse:  0900000001 / warehouse123');
    console.log('Driver:     0900000002 / driver123');
    console.log('Department: 0900000003 / dept123 (قسم الطوارئ)');
    console.log('Department: 0900000004 / dept123 (قسم العمليات)');
    console.log('Department: 0900000005 / dept123 (قسم العناية المركزة)');
    console.log('\n✨ Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
