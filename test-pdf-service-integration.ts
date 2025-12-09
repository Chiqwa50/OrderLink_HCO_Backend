
import { generateOrderPDF } from './src/services/pdfService';
import { Response } from 'express';
import prisma from './src/config/database';

// Mock Express Response
const mockRes = () => {
    const res: any = {};
    res.status = (code: number) => {
        console.log(`[MockRes] status(${code})`);
        return res;
    };
    res.json = (data: any) => {
        console.log(`[MockRes] json:`, data);
        return res;
    };
    res.send = (data: any) => {
        console.log(`[MockRes] send called with data of type: ${typeof data}`);
        if (Buffer.isBuffer(data)) {
            console.log(`[MockRes] Buffer size: ${data.length}`);
            res.sentData = data;
        }
        return res;
    };
    res.setHeader = (name: string, value: string) => {
        // console.log(`[MockRes] setHeader(${name}, ${value})`);
        return res;
    };
    res.headersSent = false;
    res.sentData = null;
    return res;
};

const testIntegration = async () => {
    try {
        console.log('Fetching latest order...');
        const order = await prisma.order.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        if (!order) {
            console.error('No orders found in database to test with.');
            return;
        }

        console.log(`Testing PDF generation for Order #${order.orderNumber} (${order.id})...`);

        const res = mockRes();
        await generateOrderPDF(order.id, res);

        // Check if send was called
        if (res.sentData) {
            const buffer = res.sentData;
            if (Buffer.isBuffer(buffer)) {
                console.log('✅ Success! PDF Buffer received.');
                console.log(`   Size: ${buffer.length} bytes`);
                // Optionally save it to check content
                const fs = require('fs');
                fs.writeFileSync('test-integration-output.pdf', buffer);
                console.log('   Saved to test-integration-output.pdf');
            } else {
                console.error('❌ Failed: Response is not a buffer.', buffer);
            }
        } else {
            console.error('❌ Failed: res.send was not called with data.');
        }

    } catch (error) {
        console.error('❌ Test Error:', error);
    } finally {
        await prisma.$disconnect();
    }
};

testIntegration();
