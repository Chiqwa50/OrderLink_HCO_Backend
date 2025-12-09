import { PrismaClient, Order, OrderStatus, OrderItem } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * واجهة بيانات إنشاء الطلب
 */
export interface CreateOrderData {
    departmentId: string;
    createdBy: string;
    notes?: string;
    items: {
        itemName: string;
        quantity: number;
        unit?: string;
        notes?: string;
    }[];
}

/**
 * واجهة الطلب الموزع على المستودعات
 */
interface DistributedOrder {
    warehouseId: string;
    warehouseName: string;
    items: {
        itemName: string;
        quantity: number;
        unit: string;
        notes?: string;
    }[];
}

/**
 * خدمة إدارة الطلبات
 * تطبق مبادئ OOP وتحتوي على منطق توزيع الطلبات التلقائي
 */
export class OrderService {
    /**
     * توليد رقم طلب فريد
     */
    private async generateOrderNumber(): Promise<string> {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // عد الطلبات اليوم
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const todayOrdersCount = await prisma.order.count({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });

        const orderNum = String(todayOrdersCount + 1).padStart(4, '0');
        return `ORD-${year}${month}${day}-${orderNum}`;
    }

    /**
     * جلب المستودعات المرتبطة بالقسم مرتبة حسب الأولوية
     */
    private async getDepartmentWarehouses(departmentId: string) {
        const departmentWarehouses = await prisma.departmentWarehouse.findMany({
            where: {
                departmentId,
            },
            include: {
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        isActive: true,
                    },
                },
            },
            orderBy: {
                priority: 'asc', // ترتيب تصاعدي حسب الأولوية (1 = الأعلى)
            },
        });

        // فلترة المستودعات النشطة فقط
        return departmentWarehouses.filter(dw => dw.warehouse.isActive);
    }

    /**
     * توزيع المواد على المستودعات بناءً على warehouse_id الخاص بكل مادة
     */
    private async distributeItemsToWarehouses(
        items: CreateOrderData['items'],
        departmentWarehouses: Awaited<ReturnType<typeof this.getDepartmentWarehouses>>
    ): Promise<DistributedOrder[]> {
        const warehouseMap = new Map<string, DistributedOrder>();

        for (const orderItem of items) {
            // البحث عن المادة في قاعدة البيانات للحصول على warehouse_id
            const item = await prisma.item.findFirst({
                where: {
                    name: orderItem.itemName,
                    isActive: true,
                },
                select: {
                    warehouseId: true,
                    warehouse: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            if (!item) {
                throw new Error(`المادة "${orderItem.itemName}" غير موجودة أو غير نشطة`);
            }

            // التحقق من أن المستودع مرتبط بالقسم
            const isWarehouseLinked = departmentWarehouses.some(
                dw => dw.warehouseId === item.warehouseId
            );

            if (!isWarehouseLinked) {
                throw new Error(
                    `المادة "${orderItem.itemName}" تنتمي لمستودع غير مرتبط بهذا القسم`
                );
            }

            // إضافة المادة إلى المستودع المناسب
            if (!warehouseMap.has(item.warehouseId)) {
                warehouseMap.set(item.warehouseId, {
                    warehouseId: item.warehouseId,
                    warehouseName: item.warehouse.name,
                    items: [],
                });
            }

            warehouseMap.get(item.warehouseId)!.items.push({
                itemName: orderItem.itemName,
                quantity: orderItem.quantity,
                unit: orderItem.unit || 'piece',
                notes: orderItem.notes,
            });
        }

        return Array.from(warehouseMap.values());
    }

    /**
     * إنشاء طلب جديد مع التوزيع التلقائي على المستودعات
     */
    async createOrder(data: CreateOrderData): Promise<Order[]> {
        // 0. التحقق من قيود معدل الطلبات
        const userRestrictionService = (await import('./userRestrictionService')).default;
        const rateLimitCheck = await userRestrictionService.checkOrderRateLimit(data.createdBy);

        if (!rateLimitCheck.allowed) {
            throw new Error(rateLimitCheck.message || 'لقد تجاوزت الحد المسموح من الطلبات');
        }

        // 1. جلب المستودعات المرتبطة بالقسم
        const departmentWarehouses = await this.getDepartmentWarehouses(data.departmentId);

        if (departmentWarehouses.length === 0) {
            throw new Error('لا يوجد مستودع مرتبط بهذا القسم، الرجاء مراجعة الإدارة');
        }

        // 2. توزيع المواد على المستودعات
        const distributedOrders = await this.distributeItemsToWarehouses(
            data.items,
            departmentWarehouses
        );

        // 3. إنشاء طلب لكل مستودع
        const createdOrders: Order[] = [];

        for (const distributedOrder of distributedOrders) {
            let retries = 3;
            while (retries > 0) {
                try {
                    const orderNumber = await this.generateOrderNumber();

                    const order = await prisma.order.create({
                        data: {
                            orderNumber,
                            departmentId: data.departmentId,
                            warehouseId: distributedOrder.warehouseId,
                            createdBy: data.createdBy,
                            notes: data.notes
                                ? `${data.notes} (موزع تلقائياً - ${distributedOrder.warehouseName})`
                                : `موزع تلقائياً إلى ${distributedOrder.warehouseName}`,
                            status: OrderStatus.PENDING,
                            items: {
                                create: distributedOrder.items,
                            },
                            history: {
                                create: {
                                    status: OrderStatus.PENDING,
                                    changedBy: data.createdBy,
                                    notes: `تم إنشاء الطلب وتوجيهه إلى ${distributedOrder.warehouseName}`,
                                },
                            },
                        },
                        include: {
                            items: true,
                            department: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                },
                            },
                            warehouse: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                },
                            },
                        },
                    });

                    createdOrders.push(order);
                    break; // Success, exit retry loop
                } catch (error: any) {
                    // Check for unique constraint violation on orderNumber
                    if (
                        error.code === 'P2002' &&
                        error.meta?.target?.includes('orderNumber')
                    ) {
                        retries--;
                        if (retries === 0) {
                            throw new Error(
                                'فشل في إنشاء رقم طلب فريد بعد عدة محاولات. الرجاء المحاولة مرة أخرى.'
                            );
                        }
                        // Wait a small random amount of time before retrying to reduce collision probability
                        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
                        continue;
                    }
                    throw error; // Re-throw other errors
                }
            }
        }

        return createdOrders;
    }

    /**
     * جلب الطلبات حسب الدور والصلاحيات
     */
    async getOrders(filters: {
        departmentId?: string;
        warehouseId?: string;
        status?: OrderStatus;
        statuses?: OrderStatus[];
        userRole?: string;
        createdBy?: string;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<Order[]> {
        const whereClause: any = {};

        // فلترة حسب المستخدم الذي أنشأ الطلب - نتحقق من هذا أولاً
        let shouldApplyDepartmentFilter = true;

        if (filters.createdBy && filters.userRole === 'DEPARTMENT') {
            // التحقق من قيد رؤية الطلبيات لمستخدمي الأقسام
            const userRestrictionService = (await import('./userRestrictionService')).default;
            const canViewAll = await userRestrictionService.canViewAllDepartmentOrders(filters.createdBy);

            if (!canViewAll) {
                // إذا لم يكن لديه صلاحية رؤية جميع الطلبيات، نعرض طلبياته فقط
                whereClause.createdBy = filters.createdBy;
            } else {
                // إذا كان لديه الصلاحية، نعرض جميع طلبيات جميع أقسامه
                // جلب جميع أقسام المستخدم
                const userDepartments = await prisma.departmentSupervisor.findMany({
                    where: { userId: filters.createdBy },
                    select: { departmentId: true },
                });

                if (userDepartments.length > 0) {
                    const departmentIds = userDepartments.map(d => d.departmentId);
                    whereClause.departmentId = {
                        in: departmentIds,
                    };
                    shouldApplyDepartmentFilter = false; // لا نطبق فلتر departmentId من filters
                }
                // إزالة فلتر createdBy ليرى جميع طلبيات الأقسام
            }
        } else if (filters.createdBy) {
            // للأدوار الأخرى، نطبق الفلتر كما هو
            whereClause.createdBy = filters.createdBy;
        }

        // تطبيق فلتر departmentId فقط إذا لم يتم تطبيق فلتر الأقسام المتعددة
        if (filters.departmentId && shouldApplyDepartmentFilter) {
            whereClause.departmentId = filters.departmentId;
        }

        if (filters.warehouseId) {
            whereClause.warehouseId = filters.warehouseId;
        }

        if (filters.status) {
            whereClause.status = filters.status;
        }

        // فلترة حسب عدة حالات
        if (filters.statuses && filters.statuses.length > 0) {
            whereClause.status = {
                in: filters.statuses,
            };
        }

        // فلترة حسب نطاق التاريخ
        if (filters.dateFrom || filters.dateTo) {
            whereClause.createdAt = {};
            if (filters.dateFrom) {
                whereClause.createdAt.gte = new Date(filters.dateFrom);
            }
            if (filters.dateTo) {
                // إضافة يوم كامل للتاريخ النهائي
                const endDate = new Date(filters.dateTo);
                endDate.setHours(23, 59, 59, 999);
                whereClause.createdAt.lte = endDate;
            }
        }

        // فلترة خاصة للسائقين
        if (filters.userRole === 'DRIVER') {
            whereClause.status = {
                in: [OrderStatus.READY, OrderStatus.DELIVERED],
            };
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                items: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        type: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                preparationLogs: {
                    where: {
                        action: {
                            in: ['ITEM_AVAILABLE', 'ITEM_UNAVAILABLE'],
                        },
                    },
                    select: {
                        id: true,
                        itemName: true,
                        action: true,
                    },
                },
                history: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                    orderBy: {
                        timestamp: 'desc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // إضافة معلومات التقدم وتحويل البيانات لكل طلب
        const ordersWithProgress = orders.map(order => {
            const totalItems = order.items.length;
            const loggedItems = new Set(order.preparationLogs.map(log => log.itemName)).size;

            const progress = {
                total: totalItems,
                logged: loggedItems,
                hasPartialPreparation: loggedItems > 0 && loggedItems < totalItems,
            };

            // Debug log
            if (progress.hasPartialPreparation) {
                console.log(`Order ${order.orderNumber}: ${loggedItems}/${totalItems} items logged`);
            }

            // تحويل البيانات إلى الصيغة المتوقعة في الـ frontend
            const transformedOrder = {
                ...order,
                departmentName: order.department.name,
                warehouseName: order.warehouse.name,
                warehouseCode: order.warehouse.code,
                warehouseType: order.warehouse.type,
                createdByName: order.creator.name,
                preparationProgress: progress,
            };

            // Debug: log deliveredAt for DELIVERED orders
            if (order.status === 'DELIVERED') {
                console.log(`[Order ${order.orderNumber}] deliveredAt:`, order.deliveredAt);
            }

            return transformedOrder;
        });

        return ordersWithProgress as any;
    }

    /**
     * جلب طلب محدد بواسطة ID
     */
    async getOrderById(id: string): Promise<Order | null> {
        return await prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        type: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                history: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                    orderBy: {
                        timestamp: 'desc',
                    },
                },
            },
        });
    }

    /**
     * تحديث حالة الطلب
     */
    async updateOrderStatus(
        orderId: string,
        status: OrderStatus,
        changedBy: string,
        notes?: string
    ): Promise<Order> {
        // إعداد بيانات التحديث
        const updateData: any = {
            status,
            history: {
                create: {
                    status,
                    changedBy,
                    notes: notes || `تم تغيير الحالة إلى ${status}`,
                },
            },
        };

        // إذا تم تغيير الحالة إلى DELIVERED، قم بتعيين deliveredAt
        if (status === OrderStatus.DELIVERED) {
            updateData.deliveredAt = new Date();
        }

        return await prisma.order.update({
            where: { id: orderId },
            data: updateData,
            include: {
                items: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                history: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                    orderBy: {
                        timestamp: 'desc',
                    },
                },
            },
        });
    }

    /**
     * جلب سجل تغييرات الطلب
     */
    async getOrderHistory(orderId: string) {
        return await prisma.orderHistory.findMany({
            where: { orderId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
        });
    }
}

export const orderService = new OrderService();
