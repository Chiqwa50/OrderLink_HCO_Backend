import { Router } from 'express';
import {
    createItem,
    getItems,
    getItemById,
    updateItem,
    deleteItem,
    getCategories,
    getUnits,
    getItemsForDepartment,
    getItemsByWarehouse,
} from '../controllers/itemController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// إنشاء مادة جديدة (المسؤول والمستودع فقط)
router.post(
    '/',
    authenticateToken,
    authorizeRoles(UserRole.ADMIN, UserRole.WAREHOUSE),
    createItem
);

// عرض جميع المواد (متاح للجميع المسجلين)
router.get('/', authenticateToken, getItems);

// عرض مادة محددة (متاح للجميع المسجلين)
router.get('/:id', authenticateToken, getItemById);

// تحديث مادة (المسؤول والمستودع فقط)
router.patch(
    '/:id',
    authenticateToken,
    authorizeRoles(UserRole.ADMIN, UserRole.WAREHOUSE),
    updateItem
);

// حذف مادة (المسؤول فقط)
router.delete(
    '/:id',
    authenticateToken,
    authorizeRoles(UserRole.ADMIN),
    deleteItem
);

// جلب جميع الفئات (متاح للجميع المسجلين)
router.get('/meta/categories', authenticateToken, getCategories);

// جلب جميع الوحدات (متاح للجميع المسجلين)
router.get('/meta/units', authenticateToken, getUnits);

// جلب المواد المتاحة لقسم معين
router.get('/department/:departmentId', authenticateToken, getItemsForDepartment);

// جلب المواد حسب المستودع
router.get('/warehouse/:warehouseId', authenticateToken, getItemsByWarehouse);

export default router;
