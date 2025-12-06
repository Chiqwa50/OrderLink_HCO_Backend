import { PrismaClient, Item } from '@prisma/client';

const prisma = new PrismaClient();

export class ItemService {
    /**
     * توليد رمز SKU تلقائي
     */
    private async generateSKU(): Promise<string> {
        // جلب آخر مادة تم إنشاؤها
        const lastItem = await prisma.item.findFirst({
            orderBy: {
                createdAt: 'desc',
            },
        });

        // إذا لم توجد مواد، ابدأ من 1
        if (!lastItem) {
            return 'ITM-0001';
        }

        // استخراج الرقم من آخر SKU
        const lastSKU = lastItem.sku;
        const match = lastSKU.match(/ITM-(\d+)/);

        if (match) {
            const lastNumber = parseInt(match[1], 10);
            const newNumber = lastNumber + 1;
            return `ITM-${newNumber.toString().padStart(4, '0')}`;
        }

        // في حالة عدم تطابق النمط، ابدأ من 1
        return 'ITM-0001';
    }

    /**
     * إنشاء مادة جديدة
     */
    async createItem(data: {
        name: string;
        description?: string;
        sku?: string; // اختياري الآن
        quantity?: number; // اختياري الآن
        category?: string;
        unit?: string;
        warehouseId: string; // إجباري
        isActive?: boolean;
        createdBy?: string;
    }): Promise<Item> {
        // توليد SKU تلقائياً إذا لم يتم توفيره
        const sku = data.sku || await this.generateSKU();

        return await prisma.item.create({
            data: {
                name: data.name,
                description: data.description,
                sku,
                quantity: 0, // دائماً 0 عند الإنشاء
                category: data.category,
                unit: data.unit,
                warehouseId: data.warehouseId,
                isActive: data.isActive ?? true,
                createdBy: data.createdBy,
            },
        });
    }

    /**
     * جلب جميع المواد
     */
    async getItems(): Promise<Item[]> {
        return await prisma.item.findMany({
            include: {
                creator: {
                    select: {
                        name: true,
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
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    /**
     * جلب مادة محددة بواسطة ID
     */
    async getItemById(id: string): Promise<Item | null> {
        return await prisma.item.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        name: true,
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
            },
        });
    }

    /**
     * تحديث مادة موجودة
     */
    async updateItem(
        id: string,
        data: {
            name?: string;
            description?: string;
            quantity?: number;
            category?: string;
            unit?: string;
            warehouseId?: string;
            isActive?: boolean;
        }
    ): Promise<Item> {
        return await prisma.item.update({
            where: { id },
            data,
        });
    }

    /**
     * حذف مادة
     */
    async deleteItem(id: string): Promise<Item> {
        return await prisma.item.delete({
            where: { id },
        });
    }

    /**
     * البحث في المواد
     */
    async searchItems(query: string): Promise<Item[]> {
        return await prisma.item.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { sku: { contains: query, mode: 'insensitive' } },
                    { category: { contains: query, mode: 'insensitive' } },
                ],
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    /**
     * جلب المواد حسب الفئة
     */
    async getItemsByCategory(category: string): Promise<Item[]> {
        return await prisma.item.findMany({
            where: { category },
            orderBy: {
                name: 'asc',
            },
        });
    }

    /**
     * جلب جميع الفئات الفريدة
     */
    async getCategories(): Promise<string[]> {
        const items = await prisma.item.findMany({
            where: {
                category: {
                    not: null,
                },
            },
            select: {
                category: true,
            },
            distinct: ['category'],
        });

        return items
            .map((item) => item.category)
            .filter((category): category is string => category !== null)
            .sort();
    }

    /**
     * جلب جميع الوحدات الفريدة
     */
    async getUnits(): Promise<string[]> {
        const items = await prisma.item.findMany({
            where: {
                unit: {
                    not: null,
                },
            },
            select: {
                unit: true,
            },
            distinct: ['unit'],
        });

        return items
            .map((item) => item.unit)
            .filter((unit): unit is string => unit !== null)
            .sort();
    }

    /**
     * جلب المواد المتاحة لقسم معين
     * بناءً على المستودعات المرتبطة بالقسم
     */
    async getItemsForDepartment(departmentId: string): Promise<Item[]> {
        // جلب المستودعات المرتبطة بالقسم
        const departmentWarehouses = await prisma.departmentWarehouse.findMany({
            where: {
                departmentId,
            },
            select: {
                warehouseId: true,
            },
            orderBy: {
                priority: 'asc',
            },
        });

        if (departmentWarehouses.length === 0) {
            return [];
        }

        const warehouseIds = departmentWarehouses.map((dw) => dw.warehouseId);

        // جلب المواد من هذه المستودعات فقط
        return await prisma.item.findMany({
            where: {
                warehouseId: {
                    in: warehouseIds,
                },
                isActive: true,
            },
            include: {
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
                        name: true,
                    },
                },
            },
            orderBy: [
                {
                    warehouse: {
                        name: 'asc',
                    },
                },
                {
                    name: 'asc',
                },
            ],
        });
    }

    /**
     * جلب المواد حسب المستودع مع دعم Pagination والبحث
     */
    async getItemsByWarehouse(
        warehouseId: string,
        page: number = 1,
        limit: number = 20,
        search: string = ''
    ): Promise<{
        items: Item[];
        total: number;
        page: number;
        totalPages: number;
        hasMore: boolean;
    }> {
        const skip = (page - 1) * limit;

        // Build where clause with search
        const whereClause: any = {
            warehouseId,
            isActive: true,
        };

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.item.findMany({
                where: whereClause,
                include: {
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
                            name: true,
                        },
                    },
                },
                orderBy: {
                    name: 'asc',
                },
                skip,
                take: limit,
            }),
            prisma.item.count({
                where: whereClause,
            }),
        ]);

        const totalPages = Math.ceil(total / limit);
        const hasMore = page < totalPages;

        return {
            items,
            total,
            page,
            totalPages,
            hasMore,
        };
    }
}
