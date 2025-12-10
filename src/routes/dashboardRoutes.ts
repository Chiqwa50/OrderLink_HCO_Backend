import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getDashboardStats,
    getOrdersTimeline,
    getDepartmentActivity,
    getTopItems,
    getOrderStatusDistribution,
    getTopWarehouseUsers,
} from '../controllers/dashboardController';

const router = Router();

// جميع routes تحتاج إلى مصادقة
router.use(authenticateToken);

// GET /api/dashboard/stats - الإحصائيات العامة
router.get('/stats', getDashboardStats);

// GET /api/dashboard/timeline?days=7 - الطلبات حسب الأيام
router.get('/timeline', getOrdersTimeline);

// GET /api/dashboard/departments?limit=10 - نشاط الأقسام
router.get('/departments', getDepartmentActivity);

// GET /api/dashboard/top-items?limit=5 - أكثر المواد طلباً
router.get('/top-items', getTopItems);

// GET /api/dashboard/status-distribution - توزيع حالات الطلبات
router.get('/status-distribution', getOrderStatusDistribution);

// GET /api/dashboard/top-warehouse-users?limit=5 - أفضل موظفي المستودعات
router.get('/top-warehouse-users', getTopWarehouseUsers);

export default router;
