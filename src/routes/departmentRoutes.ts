import { Router } from 'express';
import {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    toggleDepartmentStatus,
    deleteDepartment,
    getDepartmentWarehouses,
    linkWarehouseToDepartment,
    unlinkWarehouseFromDepartment,
} from '../controllers/departmentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Get all departments (authenticated users)
router.get('/', authenticateToken, getDepartments);

// Get department by ID (authenticated users)
router.get('/:id', authenticateToken, getDepartmentById);

// Create new department (Admin only)
router.post(
    '/',
    authenticateToken,
    authorizeRoles(UserRole.ADMIN),
    createDepartment
);

// Update department (Admin only)
router.put(
    '/:id',
    authenticateToken,
    authorizeRoles(UserRole.ADMIN),
    updateDepartment
);

// Toggle department status (Admin only)
router.patch(
    '/:id/status',
    authenticateToken,
    authorizeRoles(UserRole.ADMIN),
    toggleDepartmentStatus
);

// Delete department (Admin only)
router.delete(
    '/:id',
    authenticateToken,
    authorizeRoles(UserRole.ADMIN),
    deleteDepartment
);

// ============================================
// Warehouse Management Routes
// ============================================

// Get warehouses linked to a department
router.get(
    '/:id/warehouses',
    authenticateToken,
    getDepartmentWarehouses
);

// Link warehouse to department (Admin only)
router.post(
    '/:id/warehouses',
    authenticateToken,
    authorizeRoles(UserRole.ADMIN),
    linkWarehouseToDepartment
);

// Unlink warehouse from department (Admin only)
router.delete(
    '/:id/warehouses/:warehouseId',
    authenticateToken,
    authorizeRoles(UserRole.ADMIN),
    unlinkWarehouseFromDepartment
);

export default router;
