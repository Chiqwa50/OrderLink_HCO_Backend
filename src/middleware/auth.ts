import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { AuthRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({ error: 'رمز المصادقة مطلوب' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            id: string;
            phone: string;
            role: UserRole;
            name: string;
            departmentName?: string;
        };

        (req as AuthRequest).user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: 'رمز المصادقة غير صالح' });
    }
};

export const authorizeRoles = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as AuthRequest).user;

        if (!user || !roles.includes(user.role)) {
            res.status(403).json({ error: 'ليس لديك صلاحية للوصول إلى هذا المورد' });
            return;
        }

        next();
    };
};
