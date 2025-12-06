import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

/**
 * خدمة إدارة المستخدمين
 * تطبق مبادئ البرمجة الكائنية (OOP)
 */
class UserService {
    /**
     * جلب جميع المستخدمين
     */
    async getAllUsers() {
        const users = await prisma.user.findMany({
            include: {
                department: true,
                departmentSupervisors: {
                    include: {
                        department: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                },
                warehouseSupervisors: {
                    include: {
                        warehouse: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                type: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // إزالة كلمات المرور من النتائج
        return users.map(user => {
            const { password, ...safeUser } = user;
            return safeUser;
        });
    }

    /**
     * جلب مستخدم بواسطة المعرف
     */
    async getUserById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                department: true,
                departmentSupervisors: {
                    include: {
                        department: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                },
                warehouseSupervisors: {
                    include: {
                        warehouse: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                type: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new Error('المستخدم غير موجود');
        }

        const { password, ...safeUser } = user;
        return safeUser;
    }

    /**
     * إنشاء مستخدم جديد
     */
    async createUser(data: {
        name: string;
        phone: string;
        password: string;
        role: UserRole;
        departmentId?: string;
        departmentIds?: string[];
        warehouseIds?: string[];
        isGlobalWarehouseSupervisor?: boolean;
    }) {
        // التحقق من عدم وجود رقم الهاتف مسبقاً
        const existingUser = await prisma.user.findUnique({
            where: { phone: data.phone },
        });

        if (existingUser) {
            throw new Error('رقم الهاتف مسجل مسبقاً');
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

        // تحديد departmentId الرئيسي
        let mainDepartmentId = data.departmentId || null;

        // إذا كان المستخدم من نوع DEPARTMENT ولم يتم تحديد departmentId
        // نستخدم أول قسم من departmentIds
        if (data.role === UserRole.DEPARTMENT && !mainDepartmentId && data.departmentIds && data.departmentIds.length > 0) {
            mainDepartmentId = data.departmentIds[0];
        }

        // إنشاء المستخدم مع العلاقات
        const user = await prisma.user.create({
            data: {
                name: data.name,
                phone: data.phone,
                password: hashedPassword,
                role: data.role,
                departmentId: mainDepartmentId,
            },
            include: {
                department: true,
            },
        });

        // إضافة علاقات مشرفي الأقسام
        if (data.role === UserRole.DEPARTMENT && data.departmentIds && data.departmentIds.length > 0) {
            await this.updateDepartmentSupervisors(user.id, data.departmentIds);
        }

        // إضافة علاقات مشرفي المستودعات
        if (data.role === UserRole.WAREHOUSE) {
            if (data.isGlobalWarehouseSupervisor) {
                await this.setGlobalWarehouseSupervisor(user.id);
            } else if (data.warehouseIds && data.warehouseIds.length > 0) {
                await this.updateWarehouseSupervisors(user.id, data.warehouseIds);
            }
        }

        return await this.getUserById(user.id);
    }

    /**
     * تحديث بيانات المستخدم
     */
    async updateUser(
        id: string,
        data: {
            name?: string;
            phone?: string;
            password?: string;
            role?: UserRole;
            departmentId?: string;
            departmentIds?: string[];
            warehouseIds?: string[];
            isGlobalWarehouseSupervisor?: boolean;
        }
    ) {
        // التحقق من وجود المستخدم
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            throw new Error('المستخدم غير موجود');
        }

        // إعداد بيانات التحديث
        const updateData: any = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.role !== undefined) updateData.role = data.role;

        // تحديد departmentId
        if (data.departmentId !== undefined) {
            updateData.departmentId = data.departmentId || null;
        } else if (data.role === UserRole.DEPARTMENT && data.departmentIds && data.departmentIds.length > 0) {
            // إذا كان المستخدم من نوع DEPARTMENT ولم يتم تحديد departmentId
            // نستخدم أول قسم من departmentIds
            updateData.departmentId = data.departmentIds[0];
        }

        // تشفير كلمة المرور إذا تم توفيرها
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
        }

        // تحديث المستخدم
        await prisma.user.update({
            where: { id },
            data: updateData,
        });

        // تحديث علاقات مشرفي الأقسام
        if (data.role === UserRole.DEPARTMENT && data.departmentIds !== undefined) {
            await this.updateDepartmentSupervisors(id, data.departmentIds);
        }

        // تحديث علاقات مشرفي المستودعات
        if (data.role === UserRole.WAREHOUSE) {
            if (data.isGlobalWarehouseSupervisor !== undefined) {
                if (data.isGlobalWarehouseSupervisor) {
                    await this.setGlobalWarehouseSupervisor(id);
                } else if (data.warehouseIds !== undefined) {
                    await this.updateWarehouseSupervisors(id, data.warehouseIds);
                }
            } else if (data.warehouseIds !== undefined) {
                await this.updateWarehouseSupervisors(id, data.warehouseIds);
            }
        }

        return await this.getUserById(id);
    }

    /**
     * حذف مستخدم
     */
    async deleteUser(id: string) {
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            throw new Error('المستخدم غير موجود');
        }

        // حذف المستخدم (سيتم حذف العلاقات تلقائياً بسبب onDelete: Cascade)
        await prisma.user.delete({
            where: { id },
        });

        return { message: 'تم حذف المستخدم بنجاح' };
    }

    /**
     * تحديث علاقات مشرفي الأقسام
     */
    private async updateDepartmentSupervisors(userId: string, departmentIds: string[]) {
        // حذف جميع العلاقات الحالية
        await prisma.departmentSupervisor.deleteMany({
            where: { userId },
        });

        // إضافة العلاقات الجديدة
        if (departmentIds.length > 0) {
            await prisma.departmentSupervisor.createMany({
                data: departmentIds.map(departmentId => ({
                    userId,
                    departmentId,
                })),
            });
        }
    }

    /**
     * تحديث علاقات مشرفي المستودعات
     */
    private async updateWarehouseSupervisors(userId: string, warehouseIds: string[]) {
        // حذف جميع العلاقات الحالية
        await prisma.warehouseSupervisor.deleteMany({
            where: { userId },
        });

        // إضافة العلاقات الجديدة
        if (warehouseIds.length > 0) {
            await prisma.warehouseSupervisor.createMany({
                data: warehouseIds.map(warehouseId => ({
                    userId,
                    warehouseId,
                    isGlobal: false,
                })),
            });
        }
    }

    /**
     * تعيين المستخدم كمشرف عام على جميع المستودعات
     */
    private async setGlobalWarehouseSupervisor(userId: string) {
        // حذف جميع العلاقات الحالية
        await prisma.warehouseSupervisor.deleteMany({
            where: { userId },
        });

        // إضافة علاقة مشرف عام
        await prisma.warehouseSupervisor.create({
            data: {
                userId,
                warehouseId: null,
                isGlobal: true,
            },
        });
    }

    /**
     * جلب الأقسام المرتبطة بمشرف قسم
     */
    async getUserDepartments(userId: string) {
        const supervisors = await prisma.departmentSupervisor.findMany({
            where: { userId },
            include: {
                department: true,
            },
        });

        return supervisors.map((s: any) => s.department);
    }

    /**
     * جلب المستودعات المرتبطة بمشرف مستودع
     */
    async getUserWarehouses(userId: string) {
        const supervisors = await prisma.warehouseSupervisor.findMany({
            where: { userId },
            include: {
                warehouse: true,
            },
        });

        // التحقق من وجود مشرف عام
        const globalSupervisor = supervisors.find((s: any) => s.isGlobal);
        if (globalSupervisor) {
            // إرجاع جميع المستودعات النشطة
            return await prisma.warehouse.findMany({
                where: { isActive: true },
            });
        }

        return supervisors.map((s: any) => s.warehouse).filter((w: any) => w !== null);
    }
}

export default new UserService();
