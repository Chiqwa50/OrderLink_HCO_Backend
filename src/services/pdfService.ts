import { Response } from 'express';
import prisma from '../config/database';
import axios from 'axios';

const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || 'https://orderlink-hco-pdf-service.onrender.com/generate-pdf';

export const generateOrderPDF = async (orderId: string, res: Response): Promise<void> => {
    try {
        // جلب بيانات الطلب
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                department: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
                history: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                role: true,
                            },
                        },
                    },
                    orderBy: {
                        timestamp: 'asc',
                    },
                },
            },
        });

        if (!order) {
            res.status(404).json({ error: 'الطلب غير موجود' });
            return;
        }

        // إرسال البيانات إلى خدمة PDF
        const response = await axios.post(PDF_SERVICE_URL, order, {
            responseType: 'arraybuffer', // مهم لاستقبال الملف كبيانات ثنائية
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // إرسال الاستجابة
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=order-${order.orderNumber}.pdf`
        );
        res.setHeader('Content-Length', response.data.length);

        res.send(response.data);

    } catch (error) {
        console.error('Generate PDF error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'حدث خطأ أثناء توليد PDF' });
        }
    }
};
