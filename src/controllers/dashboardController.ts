import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';

/**
 * الحصول على الإحصائيات العامة للـ Dashboard
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await dashboardService.getDashboardStats();
        res.json({ stats });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب الإحصائيات' });
    }
};

/**
 * الحصول على بيانات الطلبات حسب الأيام
 */
export const getOrdersTimeline = async (req: Request, res: Response): Promise<void> => {
    try {
        const days = req.query.days ? parseInt(req.query.days as string) : 7;

        // التحقق من صحة القيمة
        if (isNaN(days) || days < 1 || days > 365) {
            res.status(400).json({ error: 'عدد الأيام يجب أن يكون بين 1 و 365' });
            return;
        }

        const timeline = await dashboardService.getOrdersTimeline(days);
        res.json({ timeline, days });
    } catch (error) {
        console.error('Get orders timeline error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب بيانات الطلبات' });
    }
};

/**
 * الحصول على نشاط الأقسام
 */
export const getDepartmentActivity = async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

        // التحقق من صحة القيمة
        if (isNaN(limit) || limit < 1 || limit > 50) {
            res.status(400).json({ error: 'الحد الأقصى يجب أن يكون بين 1 و 50' });
            return;
        }

        const departments = await dashboardService.getDepartmentActivity(limit);
        res.json({ departments, limit });
    } catch (error) {
        console.error('Get department activity error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب نشاط الأقسام' });
    }
};

/**
 * الحصول على أكثر المواد طلباً
 */
export const getTopItems = async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

        // التحقق من صحة القيمة
        if (isNaN(limit) || limit < 1 || limit > 20) {
            res.status(400).json({ error: 'الحد الأقصى يجب أن يكون بين 1 و 20' });
            return;
        }

        const items = await dashboardService.getTopItems(limit);
        res.json({ items, limit });
    } catch (error) {
        console.error('Get top items error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب أكثر المواد طلباً' });
    }
};

/**
 * الحصول على توزيع حالات الطلبات
 */
export const getOrderStatusDistribution = async (req: Request, res: Response): Promise<void> => {
    try {
        const distribution = await dashboardService.getOrderStatusDistribution();
        res.json({ distribution });
    } catch (error) {
        console.error('Get order status distribution error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب توزيع حالات الطلبات' });
    }
};

/**
 * الحصول على أفضل موظفي المستودعات
 */
export const getTopWarehouseUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

        // التحقق من صحة القيمة
        if (isNaN(limit) || limit < 1 || limit > 20) {
            res.status(400).json({ error: 'الحد الأقصى يجب أن يكون بين 1 و 20' });
            return;
        }

        const users = await dashboardService.getTopWarehouseUsers(limit);
        res.json({ users, limit });
    } catch (error) {
        console.error('Get top warehouse users error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب أفضل موظفي المستودعات' });
    }
};
