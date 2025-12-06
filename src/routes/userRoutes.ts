import { Router } from 'express';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserDepartments,
    getCurrentUserDepartments,
    getUserWarehouses,
} from '../controllers/userController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// المسارات المتاحة لجميع المستخدمين المصادق عليهم
router.get('/me/departments', authenticateToken, getCurrentUserDepartments);

// جميع المسارات التالية تتطلب مصادقة وصلاحية مسؤول
router.use(authenticateToken);
router.use(authorizeRoles(UserRole.ADMIN));

// الحصول على جميع المستخدمين
router.get('/', getUsers);

// الحصول على مستخدم محدد
router.get('/:id', getUserById);

// الحصول على أقسام المستخدم (مشرف قسم)
router.get('/:id/departments', getUserDepartments);

// الحصول على مستودعات المستخدم (مشرف مستودع)
router.get('/:id/warehouses', getUserWarehouses);

// إنشاء مستخدم جديد
router.post('/', createUser);

// تحديث بيانات مستخدم
router.put('/:id', updateUser);

// حذف مستخدم
router.delete('/:id', deleteUser);

export default router;

