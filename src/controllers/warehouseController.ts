import { Request, Response } from 'express';
import { warehouseService } from '../services/warehouseService';
import { WarehouseType } from '@prisma/client';

export const createWarehouse = async (req: Request, res: Response) => {
    try {
        const warehouse = await warehouseService.createWarehouse(req.body);
        res.status(201).json({ message: 'تم إنشاء المستودع بنجاح', warehouse });
    } catch (error: any) {
        console.error('Error creating warehouse:', error);
        res.status(500).json({ error: 'فشل إنشاء المستودع', details: error.message });
    }
};

export const getWarehouses = async (req: Request, res: Response) => {
    try {
        const { isActive, type, search } = req.query;

        const filters: any = {};
        if (isActive !== undefined) {
            filters.isActive = isActive === 'true';
        }
        if (type && typeof type === 'string') {
            filters.type = type as WarehouseType;
        }
        if (search && typeof search === 'string') {
            filters.search = search;
        }

        const warehouses = await warehouseService.getWarehouses(filters);
        res.json({ warehouses });
    } catch (error: any) {
        console.error('Error fetching warehouses:', error);
        res.status(500).json({ error: 'فشل جلب المستودعات', details: error.message });
    }
};

export const getWarehouseById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const warehouse = await warehouseService.getWarehouseById(id);

        if (!warehouse) {
            res.status(404).json({ error: 'المستودع غير موجود' });
            return;
        }

        res.json({ warehouse });
    } catch (error: any) {
        console.error('Error fetching warehouse:', error);
        res.status(500).json({ error: 'فشل جلب المستودع', details: error.message });
    }
};

export const updateWarehouse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const warehouse = await warehouseService.updateWarehouse(id, req.body);
        res.json({ message: 'تم تحديث المستودع بنجاح', warehouse });
    } catch (error: any) {
        console.error('Error updating warehouse:', error);
        res.status(500).json({ error: 'فشل تحديث المستودع', details: error.message });
    }
};

export const toggleWarehouseStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const warehouse = await warehouseService.toggleWarehouseStatus(id, isActive);
        res.json({ message: 'تم تحديث حالة المستودع بنجاح', warehouse });
    } catch (error: any) {
        console.error('Error toggling warehouse status:', error);
        res.status(500).json({ error: 'فشل تحديث حالة المستودع', details: error.message });
    }
};

export const deleteWarehouse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await warehouseService.deleteWarehouse(id);
        res.json({ message: 'تم حذف المستودع بنجاح' });
    } catch (error: any) {
        console.error('Error deleting warehouse:', error);
        res.status(500).json({ error: 'فشل حذف المستودع', details: error.message });
    }
};
