import PDFDocument from 'pdfkit';
import { Response } from 'express';
import prisma from '../config/database';
import fs from 'fs';
import path from 'path';

// خريطة حالات الطلبات بالعربية
const statusMap: Record<string, string> = {
    PENDING: 'قيد الانتظار',
    REVIEWING: 'قيد المراجعة',
    PREPARING: 'قيد التجهيز',
    READY: 'جاهز للتوصيل',
    DELIVERED: 'تم التسليم',
    CANCELLED: 'ملغي',
};

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

        // إنشاء مستند PDF
        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        // تعيين headers للاستجابة
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=order-${order.orderNumber}.pdf`
        );

        // توجيه الـ PDF إلى الاستجابة
        doc.pipe(res);

        // العنوان
        doc.fontSize(20).text('Order Details / تفاصيل الطلب', { align: 'center' });
        doc.moveDown();

        // معلومات الطلب الأساسية
        doc.fontSize(12);
        doc.text(`Order Number / رقم الطلب: ${order.orderNumber}`);
        doc.text(`Department / القسم: ${order.department.name}`);
        doc.text(`Status / الحالة: ${statusMap[order.status] || order.status}`);
        doc.text(`Created / تاريخ الإنشاء: ${new Date(order.createdAt).toLocaleString('ar-EG')}`);

        if (order.notes) {
            doc.text(`Notes / ملاحظات: ${order.notes}`);
        }

        doc.moveDown();

        // جدول المواد
        doc.fontSize(14).text('Items / المواد المطلوبة:', { underline: true });
        doc.moveDown(0.5);

        doc.fontSize(10);
        order.items.forEach((item: any, index: number) => {
            doc.text(`${index + 1}. ${item.itemName}`);
            doc.text(`   Quantity / الكمية: ${item.quantity}`);
            if (item.notes) {
                doc.text(`   Notes / ملاحظات: ${item.notes}`);
            }
            doc.moveDown(0.3);
        });

        doc.moveDown();

        // سجل التغييرات
        if (order.history.length > 0) {
            doc.fontSize(14).text('History / سجل التغييرات:', { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(9);
            order.history.forEach((record: any) => {
                const timestamp = new Date(record.timestamp).toLocaleString('ar-EG');
                doc.text(`${timestamp} - ${statusMap[record.status] || record.status}`);
                doc.text(`   By / بواسطة: ${record.user.name}`);
                if (record.notes) {
                    doc.text(`   Notes / ملاحظات: ${record.notes}`);
                }
                doc.moveDown(0.3);
            });
        }

        // إنهاء المستند
        doc.end();
    } catch (error) {
        console.error('Generate PDF error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'حدث خطأ أثناء توليد PDF' });
        }
    }
};
