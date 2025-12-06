import { Router } from 'express';
import {
    createWarehouse,
    getWarehouses,
    getWarehouseById,
    updateWarehouse,
    toggleWarehouseStatus,
    deleteWarehouse,
} from '../controllers/warehouseController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Get all warehouses (authenticated users)
router.get('/', authenticateToken, getWarehouses);

// Get warehouse by ID (authenticated users)
router.get('/:id', authenticateToken, getWarehouseById);

// Create new warehouse (Admin only)
router.post(
    '/',
    authenticateToken,
    authorizeRoles(UserRole.ADMIN),
    createWarehouse
);

// Update warehouse (Admin only)
router.put(
    '/:id',
    authenticateToken,
    authorizeRoles(UserRole.ADMIN),
    updateWarehouse
);

// Toggle warehouse status (Admin only)
router.patch(
    '/:id/status',
    authenticateToken,
    authorizeRoles(UserRole.ADMIN),
    toggleWarehouseStatus
);

// Delete warehouse (Admin only)
router.delete(
    '/:id',
    authenticateToken,
    authorizeRoles(UserRole.ADMIN),
    deleteWarehouse
);

export default router;
