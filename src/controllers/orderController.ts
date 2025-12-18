import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, CreateOrderRequest, UpdateOrderStatusRequest } from '../types';
import { UserRole, OrderStatus } from '@prisma/client';
import { orderService } from '../services/orderService';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const userRole = authReq.user?.role;
        const departmentId = authReq.user?.departmentId;

        if (!userId || userRole !== UserRole.DEPARTMENT) {
            res.status(403).json({ error: 'فقط الأقسام يمكنها إنشاء الطلبات' });
            return;
        }

        if (!departmentId) {
            res.status(400).json({ error: 'المستخدم غير مرتبط بقسم' });
            return;
        }

        const { notes, items }: CreateOrderRequest = req.body;

        if (!items || items.length === 0) {
            res.status(400).json({ error: 'يجب إضافة مادة واحدة على الأقل' });
            return;
        }

        // استخدام OrderService لإنشاء الطلب مع التوزيع التلقائي
        const orders = await orderService.createOrder({
            departmentId,
            createdBy: userId,
            notes,
            items,
        });

        res.status(201).json({
            message: orders.length > 1
                ? `تم إنشاء ${orders.length} طلبات وتوزيعها على المستودعات بنجاح`
                : 'تم إنشاء الطلب بنجاح',
            orders,
            count: orders.length,
        });
    } catch (error: any) {
        console.error('Create order error:', error);
        res.status(500).json({
            error: error.message || 'حدث خطأ أثناء إنشاء الطلب'
        });
    }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const userRole = authReq.user?.role;
        const departmentId = authReq.user?.departmentId;

        if (!userId) {
            res.status(401).json({ error: 'غير مصرح' });
            return;
        }

        const { status, createdBy, dateFrom, dateTo, warehouseId: queryWarehouseId, departmentId: queryDepartmentId } = req.query;

        // بناء الفلاتر
        const filters: any = {
            userRole,
        };

        // فلترة حسب الدور
        if (userRole === UserRole.DEPARTMENT) {
            if (!departmentId) {
                res.status(400).json({ error: 'المستخدم غير مرتبط بقسم' });
                return;
            }
            // نمرر createdBy بدلاً من departmentId لدعم المستخدمين متعددي الأقسام
            // orderService.getOrders سيتعامل مع الأقسام المتعددة تلقائياً
            filters.createdBy = userId;
        } else if (userRole === UserRole.WAREHOUSE) {
            // جلب المستودعات التي يشرف عليها المستخدم
            const warehouseSupervisor = await prisma.warehouseSupervisor.findFirst({
                where: { userId },
            });

            if (warehouseSupervisor && warehouseSupervisor.warehouseId) {
                filters.warehouseId = warehouseSupervisor.warehouseId;
            }
        }

        // فلترة حسب الحالة إذا تم تحديدها
        if (status && typeof status === 'string') {
            filters.status = status as OrderStatus;
        }

        // فلترة حسب المستخدم الذي أنشأ الطلب (للمسؤولين فقط)
        if (createdBy && typeof createdBy === 'string' && userRole === UserRole.ADMIN) {
            filters.createdBy = createdBy;
        }

        // فلترة حسب نطاق التاريخ
        if (dateFrom && typeof dateFrom === 'string') {
            filters.dateFrom = dateFrom;
        }
        if (dateTo && typeof dateTo === 'string') {
            filters.dateTo = dateTo;
        }

        // فلترة حسب المستودع (للمسؤولين فقط)
        if (queryWarehouseId && typeof queryWarehouseId === 'string' && userRole === UserRole.ADMIN) {
            filters.warehouseId = queryWarehouseId;
        }

        // فلترة حسب القسم (للمسؤولين فقط)
        if (queryDepartmentId && typeof queryDepartmentId === 'string' && userRole === UserRole.ADMIN) {
            filters.departmentId = queryDepartmentId;
        }

        // تحديد عدد النتائج (Limit)
        const { limit } = req.query;
        if (limit) {
            filters.limit = Number(limit);
        }

        const orders = await orderService.getOrders(filters);

        res.json({ orders });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب الطلبات' });
    }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const userRole = authReq.user?.role;
        const departmentId = authReq.user?.departmentId;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'غير مصرح' });
            return;
        }

        const order = await prisma.order.findUnique({
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

        if (!order) {
            res.status(404).json({ error: 'الطلب غير موجود' });
            return;
        }

        // التحقق من الصلاحيات
        if (userRole === UserRole.DEPARTMENT && order.departmentId !== departmentId) {
            res.status(403).json({ error: 'ليس لديك صلاحية لعرض هذا الطلب' });
            return;
        }

        res.json({ order });
    } catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب الطلب' });
    }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const userRole = authReq.user?.role;
        const { id } = req.params;
        const { status, notes }: UpdateOrderStatusRequest = req.body;

        if (!userId) {
            res.status(401).json({ error: 'غير مصرح' });
            return;
        }

        // جلب الطلب أولاً
        const order = await prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            res.status(404).json({ error: 'الطلب غير موجود' });
            return;
        }

        // التحقق من الصلاحيات
        if (userRole === UserRole.DEPARTMENT) {
            // السماح لمسؤولي الأقسام باستلام الطلبيات الجاهزة إذا كان لديهم الصلاحية
            if (status === OrderStatus.DELIVERED && order.status === OrderStatus.READY) {
                const userRestrictionService = (await import('../services/userRestrictionService')).default;
                const canReceive = await userRestrictionService.canReceiveReadyOrders(userId);

                if (!canReceive) {
                    res.status(403).json({ error: 'ليس لديك صلاحية استلام الطلبيات الجاهزة' });
                    return;
                }
                // السماح بالمتابعة
            } else {
                res.status(403).json({ error: 'الأقسام لا يمكنها تغيير حالة الطلبات' });
                return;
            }
        }

        // التحقق من صلاحيات تغيير الحالة حسب الدور
        if (userRole === UserRole.ADMIN) {
            // المدير يمكنه فقط الموافقة أو الرفض على الطلبات المعلقة
            if (order.status !== OrderStatus.PENDING) {
                res.status(403).json({
                    error: 'يمكن للمدير فقط الموافقة أو الرفض على الطلبات المعلقة'
                });
                return;
            }
            if (status !== OrderStatus.APPROVED && status !== OrderStatus.REJECTED) {
                res.status(403).json({
                    error: 'المدير يمكنه فقط تغيير الحالة إلى معتمد أو مرفوض'
                });
                return;
            }
        } else if (userRole === UserRole.WAREHOUSE) {
            // التحقق من صلاحيات مسؤول المستودع
            const userRestrictionService = (await import('../services/userRestrictionService')).default;

            // إذا كان الطلب قيد المراجعة، تحقق من صلاحيات الموافقة/الرفض
            if (order.status === OrderStatus.PENDING) {
                if (status === OrderStatus.APPROVED) {
                    const canApprove = await userRestrictionService.canApproveOrders(userId);
                    if (!canApprove) {
                        res.status(403).json({
                            error: 'ليس لديك صلاحية قبول الطلبات'
                        });
                        return;
                    }
                    // السماح بالمتابعة
                } else if (status === OrderStatus.REJECTED) {
                    const canReject = await userRestrictionService.canRejectOrders(userId);
                    if (!canReject) {
                        res.status(403).json({
                            error: 'ليس لديك صلاحية رفض الطلبات'
                        });
                        return;
                    }
                    // السماح بالمتابعة
                } else {
                    res.status(403).json({
                        error: 'مسؤول المستودع يمكنه فقط قبول أو رفض الطلبات قيد المراجعة'
                    });
                    return;
                }
            } else {
                // للطلبات الأخرى، استخدم المنطق القديم
                const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
                    APPROVED: [OrderStatus.PREPARING, OrderStatus.READY],
                    PREPARING: [OrderStatus.READY],
                    PENDING: [],
                    READY: [],
                    DELIVERED: [],
                    REJECTED: [],
                };

                const allowed = allowedTransitions[order.status] || [];
                if (!allowed.includes(status)) {
                    res.status(403).json({
                        error: `لا يمكن تغيير الحالة من ${order.status} إلى ${status}`
                    });
                    return;
                }
            }
        }

        // إعداد بيانات التحديث
        const updateData: any = {
            status,
            history: {
                create: {
                    status,
                    changedBy: userId,
                    notes: notes || `تم تغيير الحالة إلى ${status}`,
                },
            },
        };

        // إذا تم تغيير الحالة إلى DELIVERED، قم بتعيين deliveredAt
        if (status === OrderStatus.DELIVERED) {
            updateData.deliveredAt = new Date();
        }

        // تحديث الطلب وإضافة سجل التغيير
        const updatedOrder = await prisma.order.update({
            where: { id },
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

        // تسجيل تغيير الحالة في سجلات التجهيز
        const { preparationLogService } = await import('../services/PreparationLogService');

        if (status === OrderStatus.APPROVED) {
            await preparationLogService.logPreparationAction({
                orderId: id,
                warehouseId: order.warehouseId, // استخدام warehouseId من الطلب
                preparedBy: userId,
                action: 'ORDER_APPROVED' as any,
                notes: notes || 'تم قبول الطلب',
            });
        } else if (status === OrderStatus.REJECTED) {
            await preparationLogService.logPreparationAction({
                orderId: id,
                warehouseId: order.warehouseId, // استخدام warehouseId من الطلب
                preparedBy: userId,
                action: 'ORDER_REJECTED' as any,
                notes: notes || 'تم رفض الطلب',
            });
        } else if (status === OrderStatus.PREPARING) {
            await preparationLogService.logPreparationAction({
                orderId: id,
                warehouseId: order.warehouseId,
                preparedBy: userId,
                action: 'STATUS_CHANGED' as any,
                notes: notes || 'تم تحويل الطلب إلى قيد التجهيز',
            });
        } else if (status === OrderStatus.READY) {
            await preparationLogService.logPreparationAction({
                orderId: id,
                warehouseId: order.warehouseId,
                preparedBy: userId,
                action: 'ORDER_COMPLETED' as any,
                notes: notes || 'تم تحويل الطلب إلى جاهز',
            });
        } else if (status === OrderStatus.DELIVERED) {
            // تسجيل التسليم في سجلات التجهيز فقط إذا كان warehouseId موجوداً
            if (order.warehouseId) {
                await preparationLogService.logPreparationAction({
                    orderId: id,
                    warehouseId: order.warehouseId,
                    preparedBy: userId,
                    action: 'ORDER_DELIVERED' as any,
                    notes: notes || 'تم تسليم الطلب',
                });
            }
        }

        res.json({
            message: 'تم تحديث حالة الطلب بنجاح',
            order: updatedOrder,
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء تحديث حالة الطلب' });
    }
};

export const getOrderHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const history = await prisma.orderHistory.findMany({
            where: { orderId: id },
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

        res.json({ history });
    } catch (error) {
        console.error('Get order history error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب سجل الطلب' });
    }
};

export const updateOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const userRole = authReq.user?.role;
        const { id } = req.params;
        const { items, notes } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'غير مصرح' });
            return;
        }

        // التحقق من الصلاحيات
        if (userRole === UserRole.DEPARTMENT) {
            res.status(403).json({ error: 'الأقسام لا يمكنها تعديل الطلبات' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!order) {
            res.status(404).json({ error: 'الطلب غير موجود' });
            return;
        }

        // لا يمكن تعديل الطلبات المكتملة أو المرفوضة
        if (['DELIVERED', 'REJECTED'].includes(order.status)) {
            res.status(400).json({
                error: 'لا يمكن تعديل الطلبات المكتملة أو المرفوضة'
            });
            return;
        }

        // تحديث الطلب
        const updateData: any = {};

        if (notes !== undefined) {
            updateData.notes = notes;
        }

        // حذف المواد القديمة وإضافة الجديدة إذا تم تحديثها
        if (items && Array.isArray(items)) {
            // حذف المواد القديمة
            await prisma.orderItem.deleteMany({
                where: { orderId: id },
            });

            // إضافة المواد الجديدة
            updateData.items = {
                create: items.map((item: any) => ({
                    itemName: item.name || item.itemName,
                    quantity: item.quantity,
                    unit: item.unit || 'piece',
                    notes: item.notes,
                })),
            };
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: updateData,
            include: {
                items: true,
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
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
            },
        });

        // إضافة سجل التعديل
        await prisma.orderHistory.create({
            data: {
                orderId: id,
                status: order.status,
                changedBy: userId,
                notes: 'تم تعديل تفاصيل الطلب',
            },
        });

        res.json({
            message: 'تم تعديل الطلب بنجاح',
            order: updatedOrder,
        });
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء تعديل الطلب' });
    }
};

export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const userRole = authReq.user?.role;
        const departmentId = authReq.user?.departmentId;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'غير مصرح' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            res.status(404).json({ error: 'الطلب غير موجود' });
            return;
        }

        // التحقق من الصلاحيات
        if (userRole === UserRole.DEPARTMENT) {
            if (order.departmentId !== departmentId) {
                res.status(403).json({ error: 'ليس لديك صلاحية لحذف هذا الطلب' });
                return;
            }
            // السماح بالحذف فقط إذا كان الطلب قيد المراجعة
            if (order.status !== OrderStatus.PENDING) {
                res.status(400).json({ error: 'لا يمكن حذف الطلب بعد بدء معالجته' });
                return;
            }
        }

        // حذف العناصر المرتبطة أولاً (بسبب القيود في قاعدة البيانات إذا لم تكن Cascade)
        // Prisma يتعامل مع Cascade Delete إذا تم إعداده في Schema، ولكن للأمان:
        await prisma.orderItem.deleteMany({
            where: { orderId: id },
        });

        await prisma.orderHistory.deleteMany({
            where: { orderId: id },
        });

        await prisma.order.delete({
            where: { id },
        });

        res.json({ message: 'تم حذف الطلب بنجاح' });
    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء حذف الطلب' });
    }
};

export const prepareOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const userRole = authReq.user?.role;
        const { id } = req.params;
        const { items, notes } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'غير مصرح' });
            return;
        }

        // فقط مسؤول المستودع يمكنه التجهيز
        if (userRole !== UserRole.WAREHOUSE) {
            res.status(403).json({ error: 'فقط مسؤول المستودع يمكنه تجهيز الطلبات' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!order) {
            res.status(404).json({ error: 'الطلب غير موجود' });
            return;
        }

        // يجب أن يكون الطلب معتمداً
        if (order.status !== OrderStatus.APPROVED) {
            res.status(400).json({ error: 'يمكن تجهيز الطلبات المعتمدة فقط' });
            return;
        }

        // حذف المواد القديمة وإضافة الجديدة
        await prisma.orderItem.deleteMany({
            where: { orderId: id },
        });

        // إضافة المواد المحدثة (فقط المتوفرة)
        const availableItems = items.filter((item: any) => !item.isUnavailable);

        await prisma.orderItem.createMany({
            data: availableItems.map((item: any) => ({
                orderId: id,
                itemName: item.name || item.itemName,
                quantity: item.availableQuantity || item.quantity,
                unit: item.unit || 'piece',
                notes: item.notes,
            })),
        });

        // تحديث حالة الطلب إلى قيد التجهيز
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                status: OrderStatus.PREPARING,
                history: {
                    create: {
                        status: OrderStatus.PREPARING,
                        changedBy: userId,
                        notes: notes || 'تم بدء تجهيز الطلب',
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

        res.json({
            message: 'تم بدء تجهيز الطلب بنجاح',
            order: updatedOrder,
        });
    } catch (error) {
        console.error('Prepare order error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء تجهيز الطلب' });
    }
};

export const updateOrderItems = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const userRole = authReq.user?.role;
        const { id } = req.params;
        const { items } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'غير مصرح' });
            return;
        }

        // فقط مسؤول المستودع يمكنه تحديث المواد
        if (userRole !== UserRole.WAREHOUSE) {
            res.status(403).json({ error: 'فقط مسؤول المستودع يمكنه تحديث مواد الطلب' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            res.status(404).json({ error: 'الطلب غير موجود' });
            return;
        }

        // يمكن تحديث المواد فقط أثناء التجهيز
        if (order.status !== OrderStatus.PREPARING) {
            res.status(400).json({ error: 'يمكن تحديث المواد فقط أثناء التجهيز' });
            return;
        }

        // حذف المواد القديمة
        await prisma.orderItem.deleteMany({
            where: { orderId: id },
        });

        // إضافة المواد المحدثة
        const availableItems = items.filter((item: any) => item.isAvailable !== false);

        await prisma.orderItem.createMany({
            data: availableItems.map((item: any) => ({
                orderId: id,
                itemName: item.name || item.itemName,
                quantity: item.quantity,
                unit: item.unit || 'piece',
                notes: item.notes,
            })),
        });

        const updatedOrder = await prisma.order.findUnique({
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
            },
        });

        res.json({
            message: 'تم تحديث مواد الطلب بنجاح',
            order: updatedOrder,
        });
    } catch (error) {
        console.error('Update order items error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء تحديث مواد الطلب' });
    }
};

export const markOrderReady = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const userRole = authReq.user?.role;
        const { id } = req.params;
        const { notes } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'غير مصرح' });
            return;
        }

        // فقط مسؤول المستودع يمكنه تحويل الطلب إلى جاهز
        if (userRole !== UserRole.WAREHOUSE) {
            res.status(403).json({ error: 'فقط مسؤول المستودع يمكنه تحويل الطلب إلى جاهز' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            res.status(404).json({ error: 'الطلب غير موجود' });
            return;
        }

        // يمكن تحويل الطلب إلى جاهز من حالة معتمد أو قيد التجهيز
        if (order.status !== OrderStatus.APPROVED && order.status !== OrderStatus.PREPARING) {
            res.status(400).json({
                error: 'يمكن تحويل الطلبات المعتمدة أو قيد التجهيز فقط إلى جاهز'
            });
            return;
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                status: OrderStatus.READY,
                history: {
                    create: {
                        status: OrderStatus.READY,
                        changedBy: userId,
                        notes: notes || 'تم تحويل الطلب إلى جاهز',
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

        // تسجيل اكتمال التجهيز في سجلات التجهيز
        const { preparationLogService } = await import('../services/PreparationLogService');
        await preparationLogService.logPreparationAction({
            orderId: id,
            warehouseId: order.warehouseId,
            preparedBy: userId,
            action: 'ORDER_COMPLETED' as any,
            notes: notes || 'تم تحويل الطلب إلى جاهز مباشرة',
        });

        res.json({
            message: 'تم تحويل الطلب إلى جاهز بنجاح',
            order: updatedOrder,
        });
    } catch (error) {
        console.error('Mark order ready error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء تحويل الطلب إلى جاهز' });
    }
};

export const prepareOrderWithWizard = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const userRole = authReq.user?.role;
        const { id } = req.params;
        const { items, notes } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'غير مصرح' });
            return;
        }

        // فقط مسؤول المستودع يمكنه التجهيز
        if (userRole !== UserRole.WAREHOUSE) {
            res.status(403).json({ error: 'فقط مسؤول المستودع يمكنه تجهيز الطلبات' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!order) {
            res.status(404).json({ error: 'الطلب غير موجود' });
            return;
        }

        // يمكن التجهيز من حالة معتمد أو قيد التجهيز
        if (order.status !== OrderStatus.APPROVED && order.status !== OrderStatus.PREPARING) {
            res.status(400).json({ error: 'يمكن تجهيز الطلبات المعتمدة أو قيد التجهيز فقط' });
            return;
        }

        // استيراد خدمة السجلات
        const { preparationLogService } = await import('../services/PreparationLogService');

        // ملاحظة: المواد تم تسجيلها بالفعل في الوقت الفعلي من خلال /prepare-item
        // هنا نقوم فقط بتحديث الطلب وتسجيل الاكتمال

        // حذف المواد القديمة
        await prisma.orderItem.deleteMany({
            where: { orderId: id },
        });

        // إضافة المواد المتوفرة فقط
        const availableItems = items.filter((item: any) => !item.isUnavailable);

        if (availableItems.length > 0) {
            await prisma.orderItem.createMany({
                data: availableItems.map((item: any) => ({
                    orderId: id,
                    itemName: item.name || item.itemName,
                    quantity: item.availableQuantity,
                    unit: item.unit || 'piece',
                    notes: item.notes,
                })),
            });
        }

        // تحديث حالة الطلب إلى READY
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                status: OrderStatus.READY,
                history: {
                    create: {
                        status: OrderStatus.READY,
                        changedBy: userId,
                        notes: notes || 'تم تجهيز الطلب بنجاح',
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

        // تسجيل اكتمال التجهيز
        await preparationLogService.logPreparationAction({
            orderId: id,
            warehouseId: order.warehouseId,
            preparedBy: userId,
            action: 'ORDER_COMPLETED' as any,
            notes: notes || 'تم إكمال تجهيز الطلب',
        });

        res.json({
            message: 'تم تجهيز الطلب بنجاح',
            order: updatedOrder,
        });
    } catch (error) {
        console.error('Prepare order with wizard error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء تجهيز الطلب' });
    }
};

export const logItemPreparation = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const userRole = authReq.user?.role;
        const { id } = req.params;
        const { itemName, isUnavailable, requestedQty, availableQty, notes } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'غير مصرح' });
            return;
        }

        // فقط مسؤول المستودع يمكنه التجهيز
        if (userRole !== UserRole.WAREHOUSE) {
            res.status(403).json({ error: 'فقط مسؤول المستودع يمكنه تجهيز الطلبات' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            res.status(404).json({ error: 'الطلب غير موجود' });
            return;
        }

        // يمكن تسجيل المواد فقط أثناء التجهيز
        if (order.status !== OrderStatus.PREPARING) {
            res.status(400).json({ error: 'يمكن تسجيل المواد فقط أثناء التجهيز' });
            return;
        }

        // استيراد خدمة السجلات
        const { preparationLogService } = await import('../services/PreparationLogService');

        // تسجيل المادة فوراً - سجل واحد فقط يحتوي على جميع المعلومات
        if (isUnavailable) {
            await preparationLogService.logPreparationAction({
                orderId: id,
                warehouseId: order.warehouseId,
                preparedBy: userId,
                itemName,
                action: 'ITEM_UNAVAILABLE' as any,
                requestedQty,
                availableQty: 0,
                notes: notes || 'المادة غير متوفرة',
            });
        } else {
            // تسجيل المادة المتوفرة مع الكميات (المطلوب والمتوفر)
            // إذا كانت الكمية مختلفة، سيظهر ذلك في نفس السجل
            await preparationLogService.logPreparationAction({
                orderId: id,
                warehouseId: order.warehouseId,
                preparedBy: userId,
                itemName,
                action: availableQty !== requestedQty ? 'QUANTITY_ADJUSTED' as any : 'ITEM_AVAILABLE' as any,
                requestedQty,
                availableQty,
                notes,
            });
        }

        res.json({ success: true, message: 'تم تسجيل المادة بنجاح' });
    } catch (error) {
        console.error('Log item preparation error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء تسجيل المادة' });
    }
};


export const getPreparationLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        console.log('📥 Getting preparation logs for order:', id);

        // استيراد خدمة السجلات
        const { preparationLogService } = await import('../services/PreparationLogService');

        const logs = await preparationLogService.getOrderPreparationLogs(id);

        console.log('📊 Retrieved logs count:', logs.length);
        if (logs.length > 0) {
            console.log('📦 First log sample:');
            console.log('  - ID:', logs[0].id);
            console.log('  - Action:', logs[0].action);
            console.log('  - PreparedBy ID:', logs[0].preparedBy);
            console.log('  - User object:', logs[0].user);
            console.log('  - Warehouse object:', logs[0].warehouse);
        }

        res.json({ logs });
    } catch (error) {
        console.error('Get preparation logs error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب سجلات التجهيز' });
    }
};
