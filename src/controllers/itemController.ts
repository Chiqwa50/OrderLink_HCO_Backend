import { Request, Response } from 'express';
import { ItemService } from '../services/itemService';

const itemService = new ItemService();

export const createItem = async (req: Request, res: Response) => {
    try {
        // نفترض أن middleware المصادقة يضيف بيانات المستخدم إلى req.user
        const userId = (req as any).user?.id;

        const itemData = {
            ...req.body,
            createdBy: userId
        };

        const item = await itemService.createItem(itemData);
        res.status(201).json({ message: 'تم إنشاء المادة بنجاح', item });
    } catch (error: any) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'فشل إنشاء المادة', details: error.message });
    }
};

export const getItems = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;

        let items;
        if (search && typeof search === 'string') {
            items = await itemService.searchItems(search);
        } else {
            items = await itemService.getItems();
        }

        res.json({ items });
    } catch (error: any) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'فشل جلب المواد', details: error.message });
    }
};

export const getItemById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await itemService.getItemById(id);

        if (!item) {
            res.status(404).json({ error: 'المادة غير موجودة' });
            return;
        }

        res.json({ item });
    } catch (error: any) {
        console.error('Error fetching item:', error);
        res.status(500).json({ error: 'فشل جلب المادة', details: error.message });
    }
};

export const updateItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await itemService.updateItem(id, req.body);
        res.json({ message: 'تم تحديث المادة بنجاح', item });
    } catch (error: any) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'فشل تحديث المادة', details: error.message });
    }
};

export const deleteItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await itemService.deleteItem(id);
        res.json({ message: 'تم حذف المادة بنجاح' });
    } catch (error: any) {
        console.error('Error deleting item:', error);
        if (error.message.includes('لا يمكن حذف هذه المادة')) {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'فشل حذف المادة', details: error.message });
        }
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await itemService.getCategories();
        res.json({ categories });
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'فشل جلب الفئات', details: error.message });
    }
};

export const getUnits = async (req: Request, res: Response) => {
    try {
        const units = await itemService.getUnits();
        res.json({ units });
    } catch (error: any) {
        console.error('Error fetching units:', error);
        res.status(500).json({ error: 'فشل جلب الوحدات', details: error.message });
    }
};

/**
 * جلب المواد المتاحة لقسم معين
 */
export const getItemsForDepartment = async (req: Request, res: Response) => {
    try {
        const { departmentId } = req.params;
        const items = await itemService.getItemsForDepartment(departmentId);
        res.json({ items, count: items.length });
    } catch (error: any) {
        console.error('Error fetching items for department:', error);
        res.status(500).json({ error: 'فشل جلب المواد', details: error.message });
    }
};

/**
 * جلب المواد حسب المستودع مع دعم Pagination والبحث
 */
export const getItemsByWarehouse = async (req: Request, res: Response) => {
    try {
        const { warehouseId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string || '';

        const result = await itemService.getItemsByWarehouse(warehouseId, page, limit, search);
        res.json(result);
    } catch (error: any) {
        console.error('Error fetching items by warehouse:', error);
        res.status(500).json({ error: 'فشل جلب المواد', details: error.message });
    }
};
