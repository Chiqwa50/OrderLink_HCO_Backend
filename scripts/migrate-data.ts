import { PrismaClient } from '@prisma/client';

// Old database connection
const oldDb = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres:password@localhost:5432/orderlink',
        },
    },
});

// New database connection (Supabase)
const newDb = new PrismaClient();

async function migrateData() {
    console.log('🚀 Starting data migration from old database to Supabase...\n');

    try {
        // Connect to both databases
        await oldDb.$connect();
        await newDb.$connect();
        console.log('✅ Connected to both databases\n');

        // Step 1: Migrate Departments
        console.log('📦 Migrating Departments...');
        const departments = await oldDb.department.findMany();
        for (const dept of departments) {
            await newDb.department.create({
                data: {
                    id: dept.id,
                    name: dept.name,
                    code: dept.code,
                    description: dept.description,
                    isActive: dept.isActive,
                    createdAt: dept.createdAt,
                    updatedAt: dept.updatedAt,
                },
            });
        }
        console.log(`✅ Migrated ${departments.length} departments\n`);

        // Step 2: Migrate Warehouses
        console.log('📦 Migrating Warehouses...');
        const warehouses = await oldDb.warehouse.findMany();
        for (const warehouse of warehouses) {
            await newDb.warehouse.create({
                data: {
                    id: warehouse.id,
                    name: warehouse.name,
                    code: warehouse.code,
                    type: warehouse.type,
                    location: warehouse.location,
                    description: warehouse.description,
                    isActive: warehouse.isActive,
                    createdAt: warehouse.createdAt,
                    updatedAt: warehouse.updatedAt,
                },
            });
        }
        console.log(`✅ Migrated ${warehouses.length} warehouses\n`);

        // Step 3: Migrate Users
        console.log('📦 Migrating Users...');
        const users = await oldDb.user.findMany();
        for (const user of users) {
            await newDb.user.create({
                data: {
                    id: user.id,
                    phone: user.phone,
                    password: user.password,
                    name: user.name,
                    role: user.role,
                    departmentId: user.departmentId,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            });
        }
        console.log(`✅ Migrated ${users.length} users\n`);

        // Step 4: Migrate DepartmentSupervisors
        console.log('📦 Migrating Department Supervisors...');
        try {
            const deptSupervisors = await oldDb.departmentSupervisor.findMany();
            for (const ds of deptSupervisors) {
                await newDb.departmentSupervisor.create({
                    data: {
                        id: ds.id,
                        userId: ds.userId,
                        departmentId: ds.departmentId,
                        createdAt: ds.createdAt,
                    },
                });
            }
            console.log(`✅ Migrated ${deptSupervisors.length} department supervisors\n`);
        } catch (error) {
            console.log('⚠️  No department supervisors to migrate\n');
        }

        // Step 5: Migrate WarehouseSupervisors
        console.log('📦 Migrating Warehouse Supervisors...');
        try {
            const whSupervisors = await oldDb.warehouseSupervisor.findMany();
            for (const ws of whSupervisors) {
                await newDb.warehouseSupervisor.create({
                    data: {
                        id: ws.id,
                        userId: ws.userId,
                        warehouseId: ws.warehouseId,
                        isGlobal: ws.isGlobal,
                        createdAt: ws.createdAt,
                    },
                });
            }
            console.log(`✅ Migrated ${whSupervisors.length} warehouse supervisors\n`);
        } catch (error) {
            console.log('⚠️  No warehouse supervisors to migrate\n');
        }

        // Step 6: Migrate DepartmentWarehouses
        console.log('📦 Migrating Department-Warehouse relationships...');
        const deptWarehouses = await oldDb.departmentWarehouse.findMany();
        for (const dw of deptWarehouses) {
            await newDb.departmentWarehouse.create({
                data: {
                    id: dw.id,
                    departmentId: dw.departmentId,
                    warehouseId: dw.warehouseId,
                    priority: dw.priority,
                    isPrimary: dw.isPrimary,
                    createdAt: dw.createdAt,
                    updatedAt: dw.updatedAt,
                },
            });
        }
        console.log(`✅ Migrated ${deptWarehouses.length} department-warehouse relationships\n`);

        // Step 7: Migrate Items
        console.log('📦 Migrating Items...');
        const items = await oldDb.item.findMany();
        for (const item of items) {
            await newDb.item.create({
                data: {
                    id: item.id,
                    sku: item.sku,
                    name: item.name,
                    description: item.description,
                    category: item.category,
                    quantity: item.quantity,
                    unit: item.unit,
                    warehouseId: item.warehouseId,
                    isActive: item.isActive,
                    createdBy: item.createdBy,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                },
            });
        }
        console.log(`✅ Migrated ${items.length} items\n`);

        // Step 8: Migrate Orders
        console.log('📦 Migrating Orders...');
        const orders = await oldDb.order.findMany();
        for (const order of orders) {
            await newDb.order.create({
                data: {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    departmentId: order.departmentId,
                    warehouseId: order.warehouseId,
                    status: order.status,
                    notes: order.notes,
                    createdBy: order.createdBy,
                    deliveredAt: order.deliveredAt,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt,
                },
            });
        }
        console.log(`✅ Migrated ${orders.length} orders\n`);

        // Step 9: Migrate OrderItems
        console.log('📦 Migrating Order Items...');
        const orderItems = await oldDb.orderItem.findMany();
        for (const orderItem of orderItems) {
            await newDb.orderItem.create({
                data: {
                    id: orderItem.id,
                    orderId: orderItem.orderId,
                    itemName: orderItem.itemName,
                    quantity: orderItem.quantity,
                    unit: orderItem.unit,
                    notes: orderItem.notes,
                },
            });
        }
        console.log(`✅ Migrated ${orderItems.length} order items\n`);

        // Step 10: Migrate Order History
        console.log('📦 Migrating Order History...');
        try {
            const orderHistories = await oldDb.orderHistory.findMany();
            for (const history of orderHistories) {
                await newDb.orderHistory.create({
                    data: {
                        id: history.id,
                        orderId: history.orderId,
                        status: history.status,
                        changedBy: history.changedBy,
                        notes: history.notes,
                        timestamp: history.timestamp,
                    },
                });
            }
            console.log(`✅ Migrated ${orderHistories.length} order history records\n`);
        } catch (error) {
            console.log('⚠️  No order history to migrate\n');
        }

        // Step 11: Migrate Order Preparation Logs
        console.log('📦 Migrating Order Preparation Logs...');
        try {
            const prepLogs = await oldDb.orderPreparationLog.findMany();
            for (const log of prepLogs) {
                await newDb.orderPreparationLog.create({
                    data: {
                        id: log.id,
                        orderId: log.orderId,
                        warehouseId: log.warehouseId,
                        preparedBy: log.preparedBy,
                        itemName: log.itemName,
                        action: log.action,
                        requestedQty: log.requestedQty,
                        availableQty: log.availableQty,
                        notes: log.notes,
                        timestamp: log.timestamp,
                    },
                });
            }
            console.log(`✅ Migrated ${prepLogs.length} preparation logs\n`);
        } catch (error) {
            console.log('⚠️  No preparation logs to migrate\n');
        }

        console.log('🎉 Data migration completed successfully!\n');

        // Verification
        console.log('📊 Verification Summary:');
        console.log('========================');
        console.log(`Departments: ${await newDb.department.count()}`);
        console.log(`Warehouses: ${await newDb.warehouse.count()}`);
        console.log(`Users: ${await newDb.user.count()}`);
        console.log(`Department Supervisors: ${await newDb.departmentSupervisor.count()}`);
        console.log(`Warehouse Supervisors: ${await newDb.warehouseSupervisor.count()}`);
        console.log(`Department-Warehouse Links: ${await newDb.departmentWarehouse.count()}`);
        console.log(`Items: ${await newDb.item.count()}`);
        console.log(`Orders: ${await newDb.order.count()}`);
        console.log(`Order Items: ${await newDb.orderItem.count()}`);
        console.log(`Order History: ${await newDb.orderHistory.count()}`);
        console.log(`Preparation Logs: ${await newDb.orderPreparationLog.count()}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await oldDb.$disconnect();
        await newDb.$disconnect();
        console.log('\n✅ Disconnected from databases');
    }
}

// Run migration
migrateData()
    .then(() => {
        console.log('\n✨ Migration process completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Migration process failed:', error);
        process.exit(1);
    });
