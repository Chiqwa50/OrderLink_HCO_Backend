import { Request, Response } from 'express';
import userService from '../services/userService';

/**
 * جلب جميع المستخدمين
 */
export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await userService.getAllUsers();
        res.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'فشل جلب المستخدمين' });
    }
};

/**
 * جلب مستخدم بواسطة المعرف
 */
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await userService.getUserById(id);
        res.json({ user });
    } catch (error) {
        console.error('Error fetching user:', error);
        if (error instanceof Error && error.message === 'المستخدم غير موجود') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'فشل جلب المستخدم' });
    }
};

/**
 * إنشاء مستخدم جديد
 */
export const createUser = async (req: Request, res: Response) => {
    try {
        const {
            name,
            phone,
            password,
            role,
            departmentId,
            departmentIds,
            warehouseIds,
            isGlobalWarehouseSupervisor,
        } = req.body;

        const user = await userService.createUser({
            name,
            phone,
            password,
            role,
            departmentId,
            departmentIds,
            warehouseIds,
            isGlobalWarehouseSupervisor,
        });

        res.status(201).json({ user, message: 'تم إنشاء المستخدم بنجاح' });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error instanceof Error && error.message === 'رقم الهاتف مسجل مسبقاً') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'فشل إنشاء المستخدم' });
    }
};

/**
 * تحديث بيانات المستخدم
 */
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name,
            phone,
            password,
            role,
            departmentId,
            departmentIds,
            warehouseIds,
            isGlobalWarehouseSupervisor,
        } = req.body;

        const user = await userService.updateUser(id, {
            name,
            phone,
            password,
            role,
            departmentId,
            departmentIds,
            warehouseIds,
            isGlobalWarehouseSupervisor,
        });

        res.json({ user, message: 'تم تحديث المستخدم بنجاح' });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error instanceof Error && error.message === 'المستخدم غير موجود') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'فشل تحديث المستخدم' });
    }
};

/**
 * حذف مستخدم
 */
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await userService.deleteUser(id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting user:', error);
        if (error instanceof Error && error.message === 'المستخدم غير موجود') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'فشل حذف المستخدم' });
    }
};

/**
 * جلب الأقسام المرتبطة بمشرف قسم
 */
export const getUserDepartments = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const departments = await userService.getUserDepartments(id);
        res.json({ departments });
    } catch (error) {
        console.error('Error fetching user departments:', error);
        res.status(500).json({ error: 'فشل جلب أقسام المستخدم' });
    }
};

/**
 * جلب أقسام المستخدم الحالي
 */
export const getCurrentUserDepartments = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'غير مصرح' });
        }
        const departments = await userService.getUserDepartments(userId);
        res.json({ departments });
    } catch (error) {
        console.error('Error fetching current user departments:', error);
        res.status(500).json({ error: 'فشل جلب أقسام المستخدم' });
    }
};

/**
 * جلب المستودعات المرتبطة بمشرف مستودع
 */
export const getUserWarehouses = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const warehouses = await userService.getUserWarehouses(id);
        res.json({ warehouses });
    } catch (error) {
        console.error('Error fetching user warehouses:', error);
        res.status(500).json({ error: 'فشل جلب مستودعات المستخدم' });
    }
};
