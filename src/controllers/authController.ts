import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { LoginRequest, RegisterRequest, AuthRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone, password, name, role, departmentId }: RegisterRequest = req.body;

        // التحقق من وجود المستخدم
        const existingUser = await prisma.user.findUnique({
            where: { phone },
        });

        if (existingUser) {
            res.status(400).json({ error: 'رقم الهاتف مسجل مسبقاً' });
            return;
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // إنشاء المستخدم
        const user = await prisma.user.create({
            data: {
                phone,
                password: hashedPassword,
                name,
                role,
                departmentId,
            },
            select: {
                id: true,
                phone: true,
                name: true,
                role: true,
                departmentId: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                createdAt: true,
            },
        });

        res.status(201).json({
            message: 'تم إنشاء الحساب بنجاح',
            user,
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone, password }: LoginRequest = req.body;

        // البحث عن المستخدم
        const user = await prisma.user.findUnique({
            where: { phone },
        });

        if (!user) {
            res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
            return;
        }

        // التحقق من كلمة المرور
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
            return;
        }

        // جلب بيانات القسم إذا كان موجوداً
        const userWithDepartment = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                phone: true,
                name: true,
                role: true,
                departmentId: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });

        // إنشاء JWT token
        const token = jwt.sign(
            {
                id: user.id,
                phone: user.phone,
                role: user.role,
                name: user.name,
                departmentId: user.departmentId,
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'تم تسجيل الدخول بنجاح',
            token,
            user: userWithDepartment,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
    }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'غير مصرح' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                phone: true,
                name: true,
                role: true,
                departmentId: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'المستخدم غير موجود' });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error('GetMe error:', error);
    }
};

export const updateMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const { name, currentPassword, newPassword } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'غير مصرح' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            res.status(404).json({ error: 'المستخدم غير موجود' });
            return;
        }

        const updateData: any = {};

        if (name) {
            updateData.name = name;
        }

        if (newPassword) {
            if (!currentPassword) {
                res.status(400).json({ error: 'يرجى إدخال كلمة المرور الحالية' });
                return;
            }

            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
                return;
            }

            updateData.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                phone: true,
                name: true,
                role: true,
                departmentId: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                createdAt: true,
            },
        });

        res.json({
            message: 'تم تحديث البيانات بنجاح',
            user: updatedUser,
        });
    } catch (error) {
        console.error('UpdateMe error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء تحديث البيانات' });
    }
};
