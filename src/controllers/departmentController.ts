import { Request, Response } from 'express';
import { departmentService } from '../services/departmentService';

export const createDepartment = async (req: Request, res: Response) => {
    try {
        const department = await departmentService.createDepartment(req.body);
        res.status(201).json({ message: 'تم إنشاء القسم بنجاح', department });
    } catch (error: any) {
        console.error('Error creating department:', error);
        res.status(500).json({ error: 'فشل إنشاء القسم', details: error.message });
    }
};

export const getDepartments = async (req: Request, res: Response) => {
    try {
        const { isActive, search } = req.query;

        const filters: any = {};
        if (isActive !== undefined) {
            filters.isActive = isActive === 'true';
        }
        if (search && typeof search === 'string') {
            filters.search = search;
        }

        const departments = await departmentService.getDepartments(filters);
        res.json({ departments });
    } catch (error: any) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'فشل جلب الأقسام', details: error.message });
    }
};

export const getDepartmentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const department = await departmentService.getDepartmentById(id);

        if (!department) {
            res.status(404).json({ error: 'القسم غير موجود' });
            return;
        }

        res.json({ department });
    } catch (error: any) {
        console.error('Error fetching department:', error);
        res.status(500).json({ error: 'فشل جلب القسم', details: error.message });
    }
};

export const updateDepartment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const department = await departmentService.updateDepartment(id, req.body);
        res.json({ message: 'تم تحديث القسم بنجاح', department });
    } catch (error: any) {
        console.error('Error updating department:', error);
        res.status(500).json({ error: 'فشل تحديث القسم', details: error.message });
    }
};

export const toggleDepartmentStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const department = await departmentService.toggleDepartmentStatus(id, isActive);
        res.json({ message: 'تم تحديث حالة القسم بنجاح', department });
    } catch (error: any) {
        console.error('Error toggling department status:', error);
        res.status(500).json({ error: 'فشل تحديث حالة القسم', details: error.message });
    }
};

export const deleteDepartment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await departmentService.deleteDepartment(id);
        res.json({ message: 'تم حذف القسم بنجاح' });
    } catch (error: any) {
        console.error('Error deleting department:', error);
        res.status(500).json({ error: 'فشل حذف القسم', details: error.message });
    }
};

// ============================================
// إدارة المستودعات المرتبطة بالأقسام
// ============================================

/**
 * جلب المستودعات المرتبطة بقسم معين
 */
export const getDepartmentWarehouses = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const warehouses = await departmentService.getDepartmentWarehouses(id);
        res.json({ warehouses });
    } catch (error: any) {
        console.error('Error fetching department warehouses:', error);
        res.status(500).json({ error: 'فشل جلب المستودعات', details: error.message });
    }
};

/**
 * ربط مستودع بقسم
 */
export const linkWarehouseToDepartment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { warehouseId, priority, isPrimary } = req.body;

        if (!warehouseId) {
            res.status(400).json({ error: 'معرف المستودع مطلوب' });
            return;
        }

        const link = await departmentService.linkWarehouseToDepartment(
            id,
            warehouseId,
            priority || 1,
            isPrimary || false
        );

        res.status(201).json({
            message: 'تم ربط المستودع بنجاح',
            link
        });
    } catch (error: any) {
        console.error('Error linking warehouse:', error);
        res.status(500).json({ error: 'فشل ربط المستودع', details: error.message });
    }
};

/**
 * إلغاء ربط مستودع من قسم
 */
export const unlinkWarehouseFromDepartment = async (req: Request, res: Response) => {
    try {
        const { id, warehouseId } = req.params;

        await departmentService.unlinkWarehouseFromDepartment(id, warehouseId);

        res.json({ message: 'تم إلغاء ربط المستودع بنجاح' });
    } catch (error: any) {
        console.error('Error unlinking warehouse:', error);
        res.status(500).json({ error: 'فشل إلغاء ربط المستودع', details: error.message });
    }
};
