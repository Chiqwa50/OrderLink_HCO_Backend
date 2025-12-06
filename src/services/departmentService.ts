import { PrismaClient, Department } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateDepartmentData {
    name: string;
    code: string;
    description?: string;
    warehouses?: {
        warehouseId: string;
        priority: number;
        isPrimary: boolean;
    }[];
}

export interface UpdateDepartmentData {
    name?: string;
    code?: string;
    description?: string;
    warehouses?: {
        warehouseId: string;
        priority: number;
        isPrimary: boolean;
    }[];
}

export interface DepartmentFilters {
    isActive?: boolean;
    search?: string;
}

class DepartmentService {
    // Get all departments with optional filters
    async getDepartments(filters?: DepartmentFilters): Promise<Department[]> {
        const where: any = {};

        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { code: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return await prisma.department.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        users: true,
                        orders: true,
                    },
                },
            },
        });
    }

    // Get department by ID
    async getDepartmentById(id: string): Promise<Department | null> {
        return await prisma.department.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        role: true,
                    },
                },
                departmentWarehouses: {
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
                    orderBy: {
                        priority: 'asc',
                    },
                },
                _count: {
                    select: {
                        orders: true,
                    },
                },
            },
        });
    }

    // Create new department
    async createDepartment(data: CreateDepartmentData): Promise<Department> {
        // Check if code already exists
        const existing = await prisma.department.findUnique({
            where: { code: data.code },
        });

        if (existing) {
            throw new Error('رمز القسم موجود مسبقاً');
        }

        // Check if name already exists
        const existingName = await prisma.department.findUnique({
            where: { name: data.name },
        });

        if (existingName) {
            throw new Error('اسم القسم موجود مسبقاً');
        }

        // إنشاء القسم مع ربط المستودعات
        return await prisma.department.create({
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                departmentWarehouses: data.warehouses
                    ? {
                        create: data.warehouses.map((w) => ({
                            warehouseId: w.warehouseId,
                            priority: w.priority,
                            isPrimary: w.isPrimary,
                        })),
                    }
                    : undefined,
            },
            include: {
                departmentWarehouses: {
                    include: {
                        warehouse: true,
                    },
                },
            },
        });
    }

    // Update department
    async updateDepartment(id: string, data: UpdateDepartmentData): Promise<Department> {
        // Check if department exists
        const department = await prisma.department.findUnique({ where: { id } });
        if (!department) {
            throw new Error('القسم غير موجود');
        }

        // Check if new code already exists (if code is being updated)
        if (data.code && data.code !== department.code) {
            const existing = await prisma.department.findUnique({
                where: { code: data.code },
            });
            if (existing) {
                throw new Error('رمز القسم موجود مسبقاً');
            }
        }

        // Check if new name already exists (if name is being updated)
        if (data.name && data.name !== department.name) {
            const existing = await prisma.department.findUnique({
                where: { name: data.name },
            });
            if (existing) {
                throw new Error('اسم القسم موجود مسبقاً');
            }
        }

        // تحديث القسم
        const updateData: any = {
            name: data.name,
            code: data.code,
            description: data.description,
        };

        // إذا تم تحديث المستودعات، نحذف القديمة ونضيف الجديدة
        if (data.warehouses) {
            // حذف جميع الروابط القديمة
            await prisma.departmentWarehouse.deleteMany({
                where: { departmentId: id },
            });

            // إضافة الروابط الجديدة
            updateData.departmentWarehouses = {
                create: data.warehouses.map((w) => ({
                    warehouseId: w.warehouseId,
                    priority: w.priority,
                    isPrimary: w.isPrimary,
                })),
            };
        }

        return await prisma.department.update({
            where: { id },
            data: updateData,
            include: {
                departmentWarehouses: {
                    include: {
                        warehouse: true,
                    },
                    orderBy: {
                        priority: 'asc',
                    },
                },
            },
        });
    }

    // Toggle department status (activate/deactivate)
    async toggleDepartmentStatus(id: string, isActive: boolean): Promise<Department> {
        const department = await prisma.department.findUnique({ where: { id } });
        if (!department) {
            throw new Error('القسم غير موجود');
        }

        return await prisma.department.update({
            where: { id },
            data: { isActive },
        });
    }

    // Delete department (soft delete by deactivating)
    async deleteDepartment(id: string): Promise<Department> {
        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        users: true,
                        orders: true,
                    },
                },
            },
        });

        if (!department) {
            throw new Error('القسم غير موجود');
        }

        // Check if department has users or orders
        if (department._count.users > 0 || department._count.orders > 0) {
            // Soft delete by deactivating
            return await prisma.department.update({
                where: { id },
                data: { isActive: false },
            });
        }

        // حذف روابط المستودعات أولاً
        await prisma.departmentWarehouse.deleteMany({
            where: { departmentId: id },
        });

        // Hard delete if no dependencies
        return await prisma.department.delete({
            where: { id },
        });
    }

    /**
     * جلب المستودعات المرتبطة بقسم معين
     */
    async getDepartmentWarehouses(departmentId: string) {
        return await prisma.departmentWarehouse.findMany({
            where: { departmentId },
            include: {
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        type: true,
                        isActive: true,
                    },
                },
            },
            orderBy: {
                priority: 'asc',
            },
        });
    }

    /**
     * ربط مستودع بقسم
     */
    async linkWarehouseToDepartment(
        departmentId: string,
        warehouseId: string,
        priority: number = 1,
        isPrimary: boolean = false
    ) {
        return await prisma.departmentWarehouse.create({
            data: {
                departmentId,
                warehouseId,
                priority,
                isPrimary,
            },
            include: {
                warehouse: true,
                department: true,
            },
        });
    }

    /**
     * إلغاء ربط مستودع من قسم
     */
    async unlinkWarehouseFromDepartment(departmentId: string, warehouseId: string) {
        return await prisma.departmentWarehouse.deleteMany({
            where: {
                departmentId,
                warehouseId,
            },
        });
    }
}

export const departmentService = new DepartmentService();
