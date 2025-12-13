import prisma from '../config/database';
import { OrderStatus } from '@prisma/client';

const TIMEZONE = 'Africa/Tripoli';

// Helper to get date string in Tripoli timezone
function getTripoliDateString(date: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

// Helper to get start of day in Tripoli timezone as a Date object (in UTC)
function getTripoliStartOfDay(date: Date): Date {
    // Get the date string in Tripoli (e.g., "2023-10-27")
    const dateStr = getTripoliDateString(date);

    // Create a date object for that day at 00:00:00 in Tripoli
    // We can't easily construct a Date object from timezone parts without a library,
    // but we can find the UTC equivalent.
    // Tripoli is UTC+2. So 00:00 Tripoli is 22:00 UTC previous day.
    // However, offsets can change (DST).
    // Safe approach: Parse the date string as UTC, then subtract the offset.
    // But getting the offset natively is tricky for a specific past/future date without a library.

    // Alternative: We only need to compare dates.
    // For database queries, we need a Date object.

    // Let's use a simpler approach for the query:
    // We want orders where the Tripoli date is >= today's Tripoli date.

    // 1. Get "Today" in Tripoli: "2023-10-27"
    // 2. We need to find the UTC timestamp that corresponds to "2023-10-27 00:00:00 Africa/Tripoli"

    // We can iterate/binary search or just use a fixed offset if we assume standard time, but that's risky.
    // Better native way:
    // Create a date in UTC that looks like the target date, then adjust.
    // Or, since we are only looking back a few days, we can just fetch a bit more data (buffer) 
    // and filter in memory using the accurate `getTripoliDateString`.

    // For `getOrdersTimeline`, we fetch `days` amount of data.
    // Let's fetch `days + 1` in UTC to be safe, then filter/group in memory.

    return new Date(); // Placeholder, logic moved inside methods
}

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
        // لتحديد "طلبات اليوم"، نحتاج لمعرفة متى بدأ "اليوم" في طرابلس
        // سنقوم بجلب الطلبات التي تم إنشاؤها في الـ 24 ساعة الماضية (تقريباً)
        // ثم نفلترها يدوياً للتأكد من أنها تنتمي لليوم الحالي في طرابلس

        const now = new Date();
        const todayTripoliStr = getTripoliDateString(now);

        // تقدير بداية اليوم: نعود 24 ساعة للوراء لضمان تغطية اليوم
        const queryStartDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [
            totalOrders,
            recentOrders, // طلبات الـ 24 ساعة الأخيرة
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

            // طلبات محتملة لليوم (سنفلترها لاحقاً)
            prisma.order.findMany({
                where: {
                    createdAt: {
                        gte: queryStartDate,
                    },
                },
                select: { createdAt: true }
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

        // فلترة طلبات اليوم بدقة حسب توقيت طرابلس
        const todayOrders = recentOrders.filter(order =>
            getTripoliDateString(order.createdAt) === todayTripoliStr
        ).length;

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
        // نريد عرض آخر `days` أيام بتوقيت طرابلس
        // بما في ذلك اليوم الحالي

        const now = new Date();
        const timelineDates: string[] = [];

        // توليد تواريخ الأيام المطلوبة (من الأقدم للأحدث)
        // نعود للوراء `days - 1` يوم
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            // ملاحظة: الطرح المباشر للأيام قد لا يكون دقيقاً 100% مع تغييرات التوقيت الصيفي
            // لكننا سنستخدم getTripoliDateString لتصحيح التاريخ الفعلي
            // الأفضل: نولد التواريخ بناءً على التاريخ الحالي في طرابلس
        }

        // إعادة بناء المنطق لتوليد التواريخ بشكل صحيح
        const todayTripoliStr = getTripoliDateString(now);
        // نحتاج لتحويل string إلى تاريخ للتلاعب به، لكن هذا صعب بدون مكتبة
        // الحل: نستخدم UTC timestamps ونطرح 24 ساعة، ثم نحول لطرابلس
        // ونأخذ القيم الفريدة (لأن يومين UTC قد يقعان في نفس يوم طرابلس أو العكس)

        const dateMap = new Map<string, number>();

        // نملأ الخريطة بالتواريخ المستهدفة
        // نبدأ من اليوم ونعود للوراء
        let currentDate = new Date(now);
        for (let i = 0; i < days; i++) {
            const dateStr = getTripoliDateString(currentDate);
            // إذا كان التاريخ موجوداً بالفعل (بسبب التوقيت الصيفي/الشتوي أو الفروقات)،
            // فهذا يعني أننا لم نعد يوماً كاملاً للوراء بما يكفي لتغيير اليوم في طرابلس
            // أو عدنا كثيراً.
            // لضمان الحصول على أيام مختلفة، نطرح 24 ساعة ونكرر حتى يتغير التاريخ

            if (!dateMap.has(dateStr)) {
                dateMap.set(dateStr, 0);
            } else {
                // إذا تكرر التاريخ، نزيد i لتعويض الدورة الضائعة ونستمر في الطرح
                // لكننا نريد بالضبط `days` أيام فريدة.
                // لذا سنستخدم while loop لجمع `days` تواريخ فريدة
            }
            currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
        }

        // الطريقة الأضمن:
        const targetDates: string[] = [];
        let d = new Date(now);
        while (targetDates.length < days) {
            const s = getTripoliDateString(d);
            if (!targetDates.includes(s)) {
                targetDates.push(s);
            }
            d = new Date(d.getTime() - 24 * 60 * 60 * 1000);
        }
        // targetDates الآن تحتوي على التواريخ من الأحدث للأقدم
        // نعكسها لتكون من الأقدم للأحدث ونملأ الـ Map
        targetDates.reverse().forEach(date => dateMap.set(date, 0));

        // تحديد نطاق البحث في قاعدة البيانات
        // نأخذ تاريخاً قديماً بما يكفي لتغطية الفترة
        // (عدد الأيام + 2 يوم احتياطي)
        const fetchStartDate = new Date(now.getTime() - (days + 2) * 24 * 60 * 60 * 1000);

        // جلب جميع الطلبات في الفترة المحددة
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: fetchStartDate,
                },
            },
            select: {
                createdAt: true,
            },
        });

        // حساب عدد الطلبات لكل يوم
        orders.forEach(order => {
            const dateStr = getTripoliDateString(order.createdAt);
            // نعد فقط إذا كان التاريخ ضمن النطاق المستهدف
            if (dateMap.has(dateStr)) {
                dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
            }
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

    /**
     * الحصول على أفضل موظفي المستودعات بناءً على سرعة التجهيز
     * @param limit عدد الموظفين (افتراضي: 5)
     * يتم جمع جميع طلبات الموظف من جميع المستودعات في بطاقة واحدة
     */
    async getTopWarehouseUsers(limit: number = 5): Promise<Array<{
        userId: string;
        userName: string;
        warehousesLabel: string; // "مستودع دوائي، طبي" أو "جميع المستودعات"
        completedOrders: number;
        avgPreparationTime: number; // بالدقائق
    }>> {
        // جلب جميع الطلبات المكتملة مع سجلات التجهيز
        const completedOrders = await prisma.order.findMany({
            where: {
                status: {
                    in: ['READY', 'DELIVERED']
                }
            },
            include: {
                preparationLogs: {
                    orderBy: {
                        timestamp: 'asc'
                    }
                }
            }
        });

        // تجميع البيانات حسب الموظف فقط (جمع جميع المستودعات)
        const userStats = new Map<string, {
            userId: string;
            userName: string;
            totalTime: number; // بالمللي ثانية
            completedOrders: number;
        }>();

        for (const order of completedOrders) {
            if (order.preparationLogs.length < 2) continue;

            // البحث عن أول إجراء (بداية التجهيز) وآخر إجراء (اكتمال التجهيز)
            const firstLog = order.preparationLogs.find(log =>
                log.action === 'ITEM_CHECKED' || log.action === 'ITEM_AVAILABLE'
            );
            const completionLog = order.preparationLogs.find(log =>
                log.action === 'ORDER_COMPLETED'
            );

            if (!firstLog || !completionLog) continue;

            // حساب الفرق الزمني
            const prepTime = completionLog.timestamp.getTime() - firstLog.timestamp.getTime();

            // استخدام الموظف الذي أكمل الطلب
            const userId = completionLog.preparedBy;

            if (!userStats.has(userId)) {
                // جلب اسم الموظف
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { name: true }
                });

                if (!user) continue;

                userStats.set(userId, {
                    userId,
                    userName: user.name,
                    totalTime: 0,
                    completedOrders: 0
                });
            }

            const stats = userStats.get(userId)!;
            stats.totalTime += prepTime;
            stats.completedOrders += 1;
        }

        // حساب المتوسطات وترتيب النتائج
        const sortedUsers = Array.from(userStats.values())
            .filter(stat => stat.completedOrders > 0)
            .map(stat => ({
                userId: stat.userId,
                userName: stat.userName,
                completedOrders: stat.completedOrders,
                avgPreparationTime: Math.round((stat.totalTime / stat.completedOrders) / 60000) // تحويل إلى دقائق
            }))
            .sort((a, b) => a.avgPreparationTime - b.avgPreparationTime) // الأسرع أولاً
            .slice(0, limit);

        // جلب صلاحيات المستودعات لكل موظف
        const results = await Promise.all(
            sortedUsers.map(async (user) => {
                const warehouseSupervisors = await prisma.warehouseSupervisor.findMany({
                    where: { userId: user.userId },
                    include: {
                        warehouse: {
                            select: { name: true }
                        }
                    }
                });

                let warehousesLabel = '';

                // التحقق من وجود مشرف عام على جميع المستودعات
                const isGlobalSupervisor = warehouseSupervisors.some(ws => ws.isGlobal);

                if (isGlobalSupervisor) {
                    warehousesLabel = 'جميع المستودعات';
                } else if (warehouseSupervisors.length > 0) {
                    // جمع أسماء المستودعات
                    const warehouseNames = warehouseSupervisors
                        .filter(ws => ws.warehouse)
                        .map(ws => ws.warehouse!.name);
                    warehousesLabel = warehouseNames.join('، ');
                } else {
                    warehousesLabel = 'غير محدد';
                }

                return {
                    userId: user.userId,
                    userName: user.userName,
                    warehousesLabel,
                    completedOrders: user.completedOrders,
                    avgPreparationTime: user.avgPreparationTime
                };
            })
        );

        return results;
    }
}

export const dashboardService = new DashboardService();
export default dashboardService;
