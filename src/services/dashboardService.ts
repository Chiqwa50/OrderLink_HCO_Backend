import prisma from '../config/database';
import { OrderStatus } from '@prisma/client';

interface DashboardStats {
    totalOrders: number;
    todayOrders: number;
    pendingOrders: number;
    preparingOrders: number;
    readyOrders: number;
    deliveredOrders: number;
    activeDrivers: number;
    activeDepartments: number;
    activeWarehouses: number;
}

interface TimelineData {
    date: string;
    count: number;
}

interface DepartmentActivity {
    departmentId: string;
    departmentName: string;
    departmentCode: string;
    orderCount: number;
}

interface TopItem {
    itemName: string;
    totalQuantity: number;
    orderCount: number;
}

interface StatusDistribution {
    status: OrderStatus;
    count: number;
    percentage: number;
}

class DashboardService {
    /**
     * الحصول على الإحصائيات العامة للـ Dashboard
     */
    async getDashboardStats(): Promise<DashboardStats> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalOrders,
            todayOrders,
            pendingOrders,
            preparingOrders,
            readyOrders,
            deliveredOrders,
            activeDrivers,
            activeDepartments,
            activeWarehouses,
        ] = await Promise.all([
            // إجمالي الطلبات
            prisma.order.count(),

            // طلبات اليوم
            prisma.order.count({
                where: {
                    createdAt: {
                        gte: today,
                    },
                },
            }),

            // الطلبات قيد المراجعة
            prisma.order.count({
                where: { status: OrderStatus.PENDING },
            }),

            // الطلبات قيد التجهيز
            prisma.order.count({
                where: { status: OrderStatus.PREPARING },
            }),

            // الطلبات الجاهزة
            prisma.order.count({
                where: { status: OrderStatus.READY },
            }),

            // الطلبات المسلمة
            prisma.order.count({
                where: { status: OrderStatus.DELIVERED },
            }),

            // السائقون النشطون
            prisma.user.count({
                where: { role: 'DRIVER' },
            }),

            // الأقسام النشطة
            prisma.department.count({
                where: { isActive: true },
            }),

            // المستودعات النشطة
            prisma.warehouse.count({
                where: { isActive: true },
            }),
        ]);

        return {
            totalOrders,
            todayOrders,
            pendingOrders,
            preparingOrders,
            readyOrders,
            deliveredOrders,
            activeDrivers,
            activeDepartments,
            activeWarehouses,
        };
    }

    /**
     * الحصول على بيانات الطلبات حسب الأيام
     * @param days عدد الأيام (افتراضي: 7)
     */
    async getOrdersTimeline(days: number = 7): Promise<TimelineData[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // جلب جميع الطلبات في الفترة المحددة
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                },
            },
            select: {
                createdAt: true,
            },
        });

        // تجميع الطلبات حسب التاريخ
        const dateMap = new Map<string, number>();

        // تهيئة جميع الأيام بصفر
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - 1 - i));
            const dateStr = date.toISOString().split('T')[0];
            dateMap.set(dateStr, 0);
        }

        // حساب عدد الطلبات لكل يوم
        orders.forEach(order => {
            const dateStr = order.createdAt.toISOString().split('T')[0];
            const currentCount = dateMap.get(dateStr) || 0;
            dateMap.set(dateStr, currentCount + 1);
        });

        // تحويل Map إلى Array
        const timeline: TimelineData[] = Array.from(dateMap.entries()).map(([date, count]) => ({
            date,
            count,
        }));

        return timeline;
    }

    /**
     * الحصول على نشاط الأقسام
     * @param limit عدد الأقسام (افتراضي: 10)
     */
    async getDepartmentActivity(limit: number = 10): Promise<DepartmentActivity[]> {
        const departments = await prisma.department.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { orders: true },
                },
            },
            orderBy: {
                orders: {
                    _count: 'desc',
                },
            },
            take: limit,
        });

        return departments.map(dept => ({
            departmentId: dept.id,
            departmentName: dept.name,
            departmentCode: dept.code,
            orderCount: dept._count.orders,
        }));
    }

    /**
     * الحصول على أكثر المواد طلباً
     * @param limit عدد المواد (افتراضي: 5)
     */
    async getTopItems(limit: number = 5): Promise<TopItem[]> {
        // جلب جميع مواد الطلبات
        const orderItems = await prisma.orderItem.findMany({
            select: {
                itemName: true,
                quantity: true,
            },
        });

        // تجميع المواد وحساب الكميات
        const itemMap = new Map<string, { totalQuantity: number; orderCount: number }>();

        orderItems.forEach(item => {
            const current = itemMap.get(item.itemName) || { totalQuantity: 0, orderCount: 0 };
            itemMap.set(item.itemName, {
                totalQuantity: current.totalQuantity + item.quantity,
                orderCount: current.orderCount + 1,
            });
        });

        // تحويل إلى Array وترتيب حسب الكمية الإجمالية
        const topItems: TopItem[] = Array.from(itemMap.entries())
            .map(([itemName, data]) => ({
                itemName,
                totalQuantity: data.totalQuantity,
                orderCount: data.orderCount,
            }))
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, limit);

        return topItems;
    }

    /**
     * الحصول على توزيع حالات الطلبات
     */
    async getOrderStatusDistribution(): Promise<StatusDistribution[]> {
        const totalOrders = await prisma.order.count();

        if (totalOrders === 0) {
            return [];
        }

        const statusCounts = await prisma.order.groupBy({
            by: ['status'],
            _count: {
                status: true,
            },
        });

        return statusCounts.map(item => ({
            status: item.status,
            count: item._count.status,
            percentage: Math.round((item._count.status / totalOrders) * 100 * 10) / 10,
        }));
    }
}

export const dashboardService = new DashboardService();
export default dashboardService;
