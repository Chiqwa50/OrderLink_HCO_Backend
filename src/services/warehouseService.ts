import { PrismaClient, Warehouse, WarehouseType } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateWarehouseData {
    name: string;
    code: string;
    type: WarehouseType;
    description?: string;
    location?: string;
}

export interface UpdateWarehouseData {
    name?: string;
    code?: string;
    type?: WarehouseType;
    description?: string;
    location?: string;
}

export interface WarehouseFilters {
    isActive?: boolean;
    type?: WarehouseType;
    search?: string;
}

class WarehouseService {
    // Get all warehouses with optional filters
    async getWarehouses(filters?: WarehouseFilters): Promise<Warehouse[]> {
        const where: any = {};

        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { code: { contains: filters.search, mode: 'insensitive' } },
                { location: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return await prisma.warehouse.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    // Get warehouse by ID
    async getWarehouseById(id: string): Promise<Warehouse | null> {
        return await prisma.warehouse.findUnique({
            where: { id },
        });
    }

    // Create new warehouse
    async createWarehouse(data: CreateWarehouseData): Promise<Warehouse> {
        // Check if code already exists
        const existing = await prisma.warehouse.findUnique({
            where: { code: data.code },
        });

        if (existing) {
            throw new Error('رمز المستودع موجود مسبقاً');
        }

        // Check if name already exists
        const existingName = await prisma.warehouse.findUnique({
            where: { name: data.name },
        });

        if (existingName) {
            throw new Error('اسم المستودع موجود مسبقاً');
        }

        return await prisma.warehouse.create({
            data: {
                name: data.name,
                code: data.code,
                type: data.type,
                description: data.description,
                location: data.location,
            },
        });
    }

    // Update warehouse
    async updateWarehouse(id: string, data: UpdateWarehouseData): Promise<Warehouse> {
        // Check if warehouse exists
        const warehouse = await prisma.warehouse.findUnique({ where: { id } });
        if (!warehouse) {
            throw new Error('المستودع غير موجود');
        }

        // Check if new code already exists (if code is being updated)
        if (data.code && data.code !== warehouse.code) {
            const existing = await prisma.warehouse.findUnique({
                where: { code: data.code },
            });
            if (existing) {
                throw new Error('رمز المستودع موجود مسبقاً');
            }
        }

        // Check if new name already exists (if name is being updated)
        if (data.name && data.name !== warehouse.name) {
            const existing = await prisma.warehouse.findUnique({
                where: { name: data.name },
            });
            if (existing) {
                throw new Error('اسم المستودع موجود مسبقاً');
            }
        }

        return await prisma.warehouse.update({
            where: { id },
            data,
        });
    }

    // Toggle warehouse status (activate/deactivate)
    async toggleWarehouseStatus(id: string, isActive: boolean): Promise<Warehouse> {
        const warehouse = await prisma.warehouse.findUnique({ where: { id } });
        if (!warehouse) {
            throw new Error('المستودع غير موجود');
        }

        return await prisma.warehouse.update({
            where: { id },
            data: { isActive },
        });
    }

    // Delete warehouse
    async deleteWarehouse(id: string): Promise<Warehouse> {
        const warehouse = await prisma.warehouse.findUnique({
            where: { id },
        });

        if (!warehouse) {
            throw new Error('المستودع غير موجود');
        }

        // Delete warehouse
        return await prisma.warehouse.delete({
            where: { id },
        });
    }
}

export const warehouseService = new WarehouseService();
