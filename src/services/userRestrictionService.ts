import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * خدمة إدارة قيود المستخدمين
 */
class UserRestrictionService {
    /**
     * جلب قيود مستخدم معين
     */
    async getRestrictions(userId: string) {
        const restrictions = await prisma.userRestriction.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        role: true,
                    },
                },
            },
        });

        return restrictions;
    }

    /**
     * جلب جميع القيود حسب الدور
     */
    async getRestrictionsByRole(role: UserRole) {
        const restrictions = await prisma.userRestriction.findMany({
            where: { role },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return restrictions;
    }

    /**
     * تحديث أو إنشاء قيود المستخدم
     */
    async updateRestrictions(
        userId: string,
        data: {
            orderRateLimit?: number | null;
            orderRatePeriodHours?: number | null;
            canViewAllOrders?: boolean;
            canReceiveReadyOrders?: boolean;
            canViewPendingOrders?: boolean;
            canApproveOrders?: boolean;
            canRejectOrders?: boolean;
            maxDeliveriesPerDay?: number | null;
        }
    ) {
        // التحقق من وجود المستخدم
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('المستخدم غير موجود');
        }

        // التحقق من صحة البيانات
        if (data.orderRateLimit !== undefined && data.orderRateLimit !== null) {
            if (data.orderRateLimit < 1) {
                throw new Error('عدد الطلبات يجب أن يكون أكبر من 0');
            }
        }

        if (data.orderRatePeriodHours !== undefined && data.orderRatePeriodHours !== null) {
            if (data.orderRatePeriodHours < 1) {
                throw new Error('الفترة الزمنية يجب أن تكون أكبر من 0 ساعة');
            }
        }

        if (data.maxDeliveriesPerDay !== undefined && data.maxDeliveriesPerDay !== null) {
            if (data.maxDeliveriesPerDay < 1) {
                throw new Error('عدد التوصيلات يجب أن يكون أكبر من 0');
            }
        }

        // إنشاء أو تحديث القيود
        const restrictions = await prisma.userRestriction.upsert({
            where: { userId },
            create: {
                userId,
                role: user.role,
                ...data,
            },
            update: data,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        role: true,
                    },
                },
            },
        });

        return restrictions;
    }

    /**
     * حذف قيود المستخدم
     */
    async deleteRestrictions(userId: string) {
        const restrictions = await prisma.userRestriction.findUnique({
            where: { userId },
        });

        if (!restrictions) {
            throw new Error('لا توجد قيود لهذا المستخدم');
        }

        await prisma.userRestriction.delete({
            where: { userId },
        });

        return { message: 'تم حذف القيود بنجاح' };
    }

    /**
     * التحقق من معدل الطلبات (Rate Limit Check)
     * يستخدم نافذة متحركة (Sliding Window)
     */
    async checkOrderRateLimit(userId: string): Promise<{
        allowed: boolean;
        remaining: number;
        resetAt?: Date;
        message?: string;
    }> {
        // جلب قيود المستخدم
        const restrictions = await this.getRestrictions(userId);

        // إذا لم تكن هناك قيود، السماح بالطلب
        if (!restrictions || !restrictions.orderRateLimit || !restrictions.orderRatePeriodHours) {
            return {
                allowed: true,
                remaining: -1, // غير محدود
            };
        }

        const { orderRateLimit, orderRatePeriodHours } = restrictions;

        // حساب الفترة الزمنية
        const periodStart = new Date();
        periodStart.setHours(periodStart.getHours() - orderRatePeriodHours);

        // عد الطلبات في الفترة الزمنية
        const ordersCount = await prisma.order.count({
            where: {
                createdBy: userId,
                createdAt: {
                    gte: periodStart,
                },
            },
        });

        const remaining = orderRateLimit - ordersCount;
        const allowed = remaining > 0;

        // حساب وقت إعادة التعيين (أقدم طلب + الفترة الزمنية)
        let resetAt: Date | undefined;
        if (!allowed) {
            const oldestOrder = await prisma.order.findFirst({
                where: {
                    createdBy: userId,
                    createdAt: {
                        gte: periodStart,
                    },
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });

            if (oldestOrder) {
                resetAt = new Date(oldestOrder.createdAt);
                resetAt.setHours(resetAt.getHours() + orderRatePeriodHours);
            }
        }

        return {
            allowed,
            remaining: Math.max(0, remaining),
            resetAt,
            message: allowed
                ? `يمكنك إرسال ${remaining} طلبية إضافية`
                : `لقد تجاوزت الحد المسموح (${orderRateLimit} طلبات كل ${orderRatePeriodHours} ساعة). يمكنك الطلب مرة أخرى في ${resetAt?.toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })}`,
        };
    }

    /**
     * التحقق من إمكانية رؤية جميع طلبيات القسم
     */
    async canViewAllDepartmentOrders(userId: string): Promise<boolean> {
        const restrictions = await this.getRestrictions(userId);

        // إذا لم تكن هناك قيود، القيمة الافتراضية false
        if (!restrictions) {
            return false;
        }

        return restrictions.canViewAllOrders;
    }

    /**
     * التحقق من إمكانية استلام الطلبيات الجاهزة
     */
    async canReceiveReadyOrders(userId: string): Promise<boolean> {
        const restrictions = await this.getRestrictions(userId);

        // إذا لم تكن هناك قيود، القيمة الافتراضية false
        if (!restrictions) {
            return false;
        }

        return restrictions.canReceiveReadyOrders;
    }

    /**
     * التحقق من إمكانية رؤية الطلبات قيد المراجعة (لمسؤول المستودع)
     */
    async canViewPendingOrders(userId: string): Promise<boolean> {
        const restrictions = await this.getRestrictions(userId);

        // إذا لم تكن هناك قيود، القيمة الافتراضية false
        if (!restrictions) {
            return false;
        }

        return restrictions.canViewPendingOrders;
    }

    /**
     * التحقق من إمكانية قبول الطلبات (لمسؤول المستودع)
     */
    async canApproveOrders(userId: string): Promise<boolean> {
        const restrictions = await this.getRestrictions(userId);

        // إذا لم تكن هناك قيود، القيمة الافتراضية true
        if (!restrictions) {
            return true;
        }

        return restrictions.canApproveOrders;
    }

    /**
     * التحقق من إمكانية رفض الطلبات (لمسؤول المستودع)
     */
    async canRejectOrders(userId: string): Promise<boolean> {
        const restrictions = await this.getRestrictions(userId);

        // إذا لم تكن هناك قيود، القيمة الافتراضية true
        if (!restrictions) {
            return true;
        }

        return restrictions.canRejectOrders;
    }
}

export default new UserRestrictionService();
