import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { getOrderTemplate } from './src/templates/orderTemplate';

const mockOrder = {
    orderNumber: 'ORD-12345',
    createdAt: new Date(),
    status: 'READY',
    notes: 'يرجى الاتصال عند الوصول',
    department: {
        name: 'قسم المبيعات',
        code: 'SALES'
    },
    items: [
        { itemName: 'قلم حبر جاف', quantity: 50, notes: 'أزرق' },
        { itemName: 'ورق A4', quantity: 10, notes: '' },
        { itemName: 'دباسة كبيرة', quantity: 2, notes: 'نوعية جيدة' }
    ],
    history: [
        {
            timestamp: new Date(Date.now() - 86400000),
            status: 'PENDING',
            user: { name: 'أحمد محمد', role: 'DEPARTMENT' },
            notes: 'تم إنشاء الطلب'
        },
        {
            timestamp: new Date(),
            status: 'READY',
            user: { name: 'سعيد علي', role: 'WAREHOUSE' },
            notes: 'تم تجهيز الطلب بالكامل'
        }
    ]
};

async function testPdfGeneration() {
    console.log('Starting PDF generation test...');

    try {
        const htmlContent = getOrderTemplate(mockOrder);

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();

        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0',
        });

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

        fs.writeFileSync('test-output.pdf', pdfBuffer);
        console.log('PDF generated successfully: test-output.pdf');

    } catch (error) {
        console.error('Error generating PDF:', error);
    }
}

testPdfGeneration();
