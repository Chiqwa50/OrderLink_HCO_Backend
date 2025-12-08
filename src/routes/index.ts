import { Router } from 'express';
import { register, login, getMe, updateMe } from '../controllers/authController';
import {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    updateOrder,
    getOrderHistory,
    deleteOrder,
    prepareOrder,
    updateOrderItems,
    markOrderReady,
    prepareOrderWithWizard,
    getPreparationLogs,
    logItemPreparation,
} from '../controllers/orderController';
import { generateOrderPDF } from '../services/pdfService';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import userRoutes from './userRoutes';
import itemRoutes from './itemRoutes';
import departmentRoutes from './departmentRoutes';
import warehouseRoutes from './warehouseRoutes';
import userRestrictionRoutes from './userRestrictionRoutes';

const router = Router();


// ==================== Auth Routes ====================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticateToken, getMe);
router.put('/auth/me', authenticateToken, updateMe);

// ==================== User Routes ====================
router.use('/users', userRoutes);

// ==================== User Restriction Routes ====================
router.use('/user-restrictions', userRestrictionRoutes);

// ==================== Item Routes ====================
router.use('/items', itemRoutes);

// ==================== Department Routes ====================
router.use('/departments', departmentRoutes);

// ==================== Warehouse Routes ====================
router.use('/warehouses', warehouseRoutes);

// ==================== Order Routes ====================
// إنشاء طلب جديد (الأقسام فقط)
router.post(
    '/orders',
    authenticateToken,
    authorizeRoles(UserRole.DEPARTMENT),
    createOrder
);

// عرض طلبيات القسم الخاص بالمستخدم (للأقسام فقط)
router.get(
    '/orders/my-orders',
    authenticateToken,
    authorizeRoles(UserRole.DEPARTMENT),
    getOrders
);

// عرض جميع الطلبات (حسب الدور)
router.get('/orders', authenticateToken, getOrders);

// عرض طلب محدد
router.get('/orders/:id', authenticateToken, getOrderById);

// تحديث حالة الطلب (المستودع والسائقون والمدير والأقسام)
router.patch(
    '/orders/:id/status',
    authenticateToken,
    authorizeRoles(UserRole.WAREHOUSE, UserRole.DRIVER, UserRole.ADMIN, UserRole.DEPARTMENT),
    updateOrderStatus
);

// تجهيز الطلب (مسؤول المستودع فقط)
router.post(
    '/orders/:id/prepare',
    authenticateToken,
    authorizeRoles(UserRole.WAREHOUSE),
    prepareOrder
);

// تحديث مواد الطلب أثناء التجهيز (مسؤول المستودع فقط)
router.patch(
    '/orders/:id/items',
    authenticateToken,
    authorizeRoles(UserRole.WAREHOUSE),
    updateOrderItems
);

// تحويل الطلب إلى جاهز (مسؤول المستودع فقط)
router.post(
    '/orders/:id/mark-ready',
    authenticateToken,
    authorizeRoles(UserRole.WAREHOUSE),
    markOrderReady
);

// تجهيز الطلب مع المعالج (مسؤول المستودع فقط)
router.post(
    '/orders/:id/prepare-wizard',
    authenticateToken,
    authorizeRoles(UserRole.WAREHOUSE),
    prepareOrderWithWizard
);

// تسجيل تجهيز مادة واحدة (مسؤول المستودع فقط)
router.post(
    '/orders/:id/prepare-item',
    authenticateToken,
    authorizeRoles(UserRole.WAREHOUSE),
    logItemPreparation
);

// عرض سجل التجهيز للطلب
router.get('/orders/:id/preparation-logs', authenticateToken, getPreparationLogs);

// عرض سجل الطلب
router.get('/orders/:id/history', authenticateToken, getOrderHistory);

// توليد PDF للطلب
router.get('/orders/:id/pdf', authenticateToken, async (req, res) => {
    await generateOrderPDF(req.params.id, res);
});

// تعديل طلب (للمسؤولين والمستودعات فقط)
router.put(
    '/orders/:id',
    authenticateToken,
    authorizeRoles(UserRole.WAREHOUSE, UserRole.ADMIN),
    updateOrder
);

// حذف طلب (للأقسام في حالة PENDING فقط، أو للمسؤولين)
router.delete(
    '/orders/:id',
    authenticateToken,
    authorizeRoles(UserRole.DEPARTMENT, UserRole.ADMIN),
    deleteOrder
);

export default router;
