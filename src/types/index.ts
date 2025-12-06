import { Request } from 'express';
import { UserRole, OrderStatus } from '@prisma/client';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        phone: string;
        role: UserRole;
        name: string;
        departmentId?: string;
    };
}

export interface LoginRequest {
    phone: string;
    password: string;
}

export interface RegisterRequest {
    phone: string;
    password: string;
    name: string;
    role: UserRole;
    departmentId?: string;
}

export interface CreateOrderRequest {
    notes?: string;
    items: {
        itemName: string;
        quantity: number;
        unit?: string; // piece, box, carton, kg, liter
        notes?: string;
    }[];
}

export interface UpdateOrderStatusRequest {
    status: OrderStatus;
    notes?: string;
}
