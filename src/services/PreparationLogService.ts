import { PrismaClient, PreparationAction, OrderPreparationLog } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * واجهة بيانات تسجيل إجراء التجهيز
 */
export interface LogPreparationActionData {
    orderId: string;
    warehouseId: string;
    preparedBy: string;
    itemName?: string;
    action: PreparationAction;
    requestedQty?: number;
    availableQty?: number;
    notes?: string;
}

/**
 * واجهة إحصائيات التجهيز
 */
export interface PreparationStats {
    totalOrders: number;
    totalItems: number;
    availableItems: number;
    unavailableItems: number;
    quantityAdjustments: number;
}

/**
 * خدمة إدارة سجلات التجهيز
 * تطبق مبادئ OOP وتحتوي على منطق تسجيل حركات التجهيز
 */
export class PreparationLogService {
    /**
     * تسجيل إجراء تجهيز
     * يقوم بتحديث السجل الموجود إذا كانت المادة مسجلة مسبقاً، أو إنشاء سجل جديد
     */
    async logPreparationAction(data: LogPreparationActionData): Promise<OrderPreparationLog> {
        // البحث عن سجل موجود لنفس المادة في نفس الطلب
        const existingLog = await prisma.orderPreparationLog.findFirst({
            where: {
                orderId: data.orderId,
                itemName: data.itemName,
                action: {
                    in: ['ITEM_AVAILABLE', 'ITEM_UNAVAILABLE'],
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
        });

        if (existingLog) {
            // تحديث السجل الموجود
            return await prisma.orderPreparationLog.update({
                where: { id: existingLog.id },
                data: {
                    action: data.action,
                    requestedQty: data.requestedQty,
                    availableQty: data.availableQty,
                    notes: data.notes,
                    timestamp: new Date(), // تحديث الوقت
                },
                include: {
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                        },
                    },
                    warehouse: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
        } else {
            // إنشاء سجل جديد
            return await prisma.orderPreparationLog.create({
                data: {
                    orderId: data.orderId,
                    warehouseId: data.warehouseId,
                    preparedBy: data.preparedBy,
                    itemName: data.itemName,
                    action: data.action,
                    requestedQty: data.requestedQty,
                    availableQty: data.availableQty,
                    notes: data.notes,
                },
                include: {
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                        },
                    },
                    warehouse: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
        }
    }

    /**
     * تسجيل إجراءات متعددة دفعة واحدة
     */
    async logMultipleActions(actions: LogPreparationActionData[]): Promise<void> {
        await prisma.orderPreparationLog.createMany({
            data: actions.map(action => ({
                orderId: action.orderId,
                warehouseId: action.warehouseId,
                preparedBy: action.preparedBy,
                itemName: action.itemName,
                action: action.action,
                requestedQty: action.requestedQty,
                availableQty: action.availableQty,
                notes: action.notes,
            })),
        });
    }

    /**
     * جلب سجل التجهيز لطلب معين
     */
    async getOrderPreparationLogs(orderId: string) {
        return await prisma.orderPreparationLog.findMany({
            where: { orderId },
            include: {
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                timestamp: 'asc',
            },
        });
    }

    /**
     * جلب إحصائيات التجهيز لمستودع معين
     */
    async getWarehousePreparationStats(
        warehouseId: string,
        dateFrom?: Date,
        dateTo?: Date
    ): Promise<PreparationStats> {
        const whereClause: any = {
            warehouseId,
        };

        if (dateFrom || dateTo) {
            whereClause.timestamp = {};
            if (dateFrom) {
                whereClause.timestamp.gte = dateFrom;
            }
            if (dateTo) {
                whereClause.timestamp.lte = dateTo;
            }
        }

        const logs = await prisma.orderPreparationLog.findMany({
            where: whereClause,
        });

        // حساب الإحصائيات
        const uniqueOrders = new Set(logs.map(log => log.orderId));
        const totalItems = logs.filter(log => log.itemName !== null).length;
        const availableItems = logs.filter(log => log.action === 'ITEM_AVAILABLE').length;
        const unavailableItems = logs.filter(log => log.action === 'ITEM_UNAVAILABLE').length;
        const quantityAdjustments = logs.filter(log => log.action === 'QUANTITY_ADJUSTED').length;

        return {
            totalOrders: uniqueOrders.size,
            totalItems,
            availableItems,
            unavailableItems,
            quantityAdjustments,
        };
    }

    /**
     * جلب آخر سجلات التجهيز لمسؤول مستودع
     */
    async getRecentPreparationLogs(
        preparedBy: string,
        limit: number = 50
    ): Promise<OrderPreparationLog[]> {
        return await prisma.orderPreparationLog.findMany({
            where: { preparedBy },
            include: {
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                    },
                },
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: limit,
        });
    }

    /**
     * حذف سجلات التجهيز لطلب معين
     * (يستخدم عند حذف الطلب - Cascade Delete يتعامل معه تلقائياً)
     */
    async deleteOrderPreparationLogs(orderId: string): Promise<void> {
        await prisma.orderPreparationLog.deleteMany({
            where: { orderId },
        });
    }
}

export const preparationLogService = new PreparationLogService();
