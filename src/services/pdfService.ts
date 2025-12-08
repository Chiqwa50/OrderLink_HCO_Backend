import puppeteer from 'puppeteer';
import { Response } from 'express';
import prisma from '../config/database';
import { getOrderTemplate } from '../templates/orderTemplate';

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

        // إعداد HTML
        const htmlContent = getOrderTemplate(order);

        // إطلاق المتصفح
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();

        // تعيين المحتوى
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0', // انتظار تحميل الخطوط والموارد
        });

        // توليد PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px',
            },
        });

        await browser.close();

        // إرسال الاستجابة
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=order-${order.orderNumber}.pdf`
        );
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(Buffer.from(pdfBuffer));

    } catch (error) {
        console.error('Generate PDF error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'حدث خطأ أثناء توليد PDF' });
        }
    }
};
