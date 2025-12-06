import express from 'express';
import { UserRole } from '@prisma/client';
import userRestrictionService from '../services/userRestrictionService';

const router = express.Router();

/**
 * GET /api/user-restrictions/:userId
 * جلب قيود مستخدم معين
 */
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const restrictions = await userRestrictionService.getRestrictions(userId);

        res.json(restrictions);
    } catch (error: any) {
        console.error('Error fetching user restrictions:', error);
        res.status(500).json({ error: error.message || 'حدث خطأ أثناء جلب القيود' });
    }
});

/**
 * GET /api/user-restrictions/role/:role
 * جلب جميع القيود حسب الدور
 */
router.get('/role/:role', async (req, res) => {
    try {
        const { role } = req.params;

        // التحقق من صحة الدور
        if (!Object.values(UserRole).includes(role as UserRole)) {
            return res.status(400).json({ error: 'دور غير صحيح' });
        }

        const restrictions = await userRestrictionService.getRestrictionsByRole(role as UserRole);

        res.json(restrictions);
    } catch (error: any) {
        console.error('Error fetching restrictions by role:', error);
        res.status(500).json({ error: error.message || 'حدث خطأ أثناء جلب القيود' });
    }
});

/**
 * PUT /api/user-restrictions/:userId
 * تحديث أو إنشاء قيود المستخدم
 */
router.put('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const data = req.body;

        const restrictions = await userRestrictionService.updateRestrictions(userId, data);

        res.json(restrictions);
    } catch (error: any) {
        console.error('Error updating user restrictions:', error);
        res.status(400).json({ error: error.message || 'حدث خطأ أثناء تحديث القيود' });
    }
});

/**
 * DELETE /api/user-restrictions/:userId
 * حذف قيود المستخدم
 */
router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await userRestrictionService.deleteRestrictions(userId);

        res.json(result);
    } catch (error: any) {
        console.error('Error deleting user restrictions:', error);
        res.status(400).json({ error: error.message || 'حدث خطأ أثناء حذف القيود' });
    }
});

/**
 * POST /api/user-restrictions/:userId/check-rate-limit
 * التحقق من معدل الطلبات
 */
router.post('/:userId/check-rate-limit', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await userRestrictionService.checkOrderRateLimit(userId);

        res.json(result);
    } catch (error: any) {
        console.error('Error checking rate limit:', error);
        res.status(500).json({ error: error.message || 'حدث خطأ أثناء التحقق من معدل الطلبات' });
    }
});

/**
 * GET /api/user-restrictions/:userId/can-view-all-orders
 * التحقق من إمكانية رؤية جميع طلبيات القسم
 */
router.get('/:userId/can-view-all-orders', async (req, res) => {
    try {
        const { userId } = req.params;
        const canView = await userRestrictionService.canViewAllDepartmentOrders(userId);

        res.json({ canViewAllOrders: canView });
    } catch (error: any) {
        console.error('Error checking order visibility:', error);
        res.status(500).json({ error: error.message || 'حدث خطأ أثناء التحقق' });
    }
});

/**
 * GET /api/user-restrictions/:userId/can-receive-ready-orders
 * التحقق من إمكانية استلام الطلبيات الجاهزة
 */
router.get('/:userId/can-receive-ready-orders', async (req, res) => {
    try {
        const { userId } = req.params;
        const canReceive = await userRestrictionService.canReceiveReadyOrders(userId);

        res.json({ canReceiveReadyOrders: canReceive });
    } catch (error: any) {
        console.error('Error checking receive ready orders:', error);
        res.status(500).json({ error: error.message || 'حدث خطأ أثناء التحقق' });
    }
});

/**
 * GET /api/user-restrictions/:userId/can-view-pending-orders
 * التحقق من إمكانية رؤية الطلبات قيد المراجعة (لمسؤول المستودع)
 */
router.get('/:userId/can-view-pending-orders', async (req, res) => {
    try {
        const { userId } = req.params;
        const canView = await userRestrictionService.canViewPendingOrders(userId);

        res.json({ canViewPendingOrders: canView });
    } catch (error: any) {
        console.error('Error checking view pending orders:', error);
        res.status(500).json({ error: error.message || 'حدث خطأ أثناء التحقق' });
    }
});

/**
 * GET /api/user-restrictions/:userId/can-approve-orders
 * التحقق من إمكانية قبول الطلبات (لمسؤول المستودع)
 */
router.get('/:userId/can-approve-orders', async (req, res) => {
    try {
        const { userId } = req.params;
        const canApprove = await userRestrictionService.canApproveOrders(userId);

        res.json({ canApproveOrders: canApprove });
    } catch (error: any) {
        console.error('Error checking approve orders:', error);
        res.status(500).json({ error: error.message || 'حدث خطأ أثناء التحقق' });
    }
});

/**
 * GET /api/user-restrictions/:userId/can-reject-orders
 * التحقق من إمكانية رفض الطلبات (لمسؤول المستودع)
 */
router.get('/:userId/can-reject-orders', async (req, res) => {
    try {
        const { userId } = req.params;
        const canReject = await userRestrictionService.canRejectOrders(userId);

        res.json({ canRejectOrders: canReject });
    } catch (error: any) {
        console.error('Error checking reject orders:', error);
        res.status(500).json({ error: error.message || 'حدث خطأ أثناء التحقق' });
    }
});

export default router;
