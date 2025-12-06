import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// UUID مستودع الهنقر
const WAREHOUSE_ID = '01ef67cf-8776-433f-84ac-5520203c5519';

// دالة لتصنيف المواد بناءً على اسمها
function categorizeItem(itemName: string): string {
    const name = itemName.toLowerCase();

    // أدوية (Medicines)
    const medicineKeywords = [
        'mg', 'tab', 'tablet', 'cap', 'capsul', 'syrup', 'susp', 'inj', 'injection',
        'amp', 'vial', 'dose', 'iu', 'mcg', 'ml', 'cream', 'oint', 'lotion',
        'drop', 'spray', 'inhaler', 'supp', 'suppository', 'powder', 'solution'
    ];

    // مستلزمات طبية (Medical Supplies)
    const medicalSuppliesKeywords = [
        'gauze', 'swab', 'bandage', 'catheter', 'tube', 'mask', 'cannula',
        'bag', 'syringe', 'needle', 'glove', 'set', 'line', 'drain', 'filter',
        'oxygen', 'nasal', 'urin', 'blood', 'iv', 'infusion', 'extension'
    ];

    // أدوات جراحية (Surgical Instruments)
    const surgicalKeywords = [
        'surgical', 'gown', 'drape', 'suture', 'blade', 'knife', 'stapler',
        'pack', 'dressing', 'sterile', 'mesh', 'ethilon', 'vicryl', 'prolen',
        'polypropylene', 'assucryl'
    ];

    // معدات تشخيصية (Diagnostic Equipment)
    const diagnosticKeywords = [
        'test', 'strip', 'rapid', 'ecg', 'paper', 'roll', 'thermometer',
        'stethoscope', 'glucose', 'troponin', 'hba1c', 'thyroid', 'creatine',
        'myoglobin', 'architect', 'fluorecare'
    ];

    // مواد تعقيم (Sterilization Materials)
    const sterilizationKeywords = [
        'alcohol', 'antiseptic', 'disinfect', 'steril', 'clean', 'sanitizer',
        'betax', 'povidone', 'iodine', 'chlorhexidine', 'hydrogen peroxide',
        'actoderm', 'actosal', 'benzax', 'cleanisept', 'cyteal', 'detro san',
        'gda', 'prodex', 'theruptor', 'ultradox', 'aqua', 'poviderm'
    ];

    // أجهزة ومعدات (Equipment & Devices)
    const equipmentKeywords = [
        'device', 'machine', 'pump', 'monitor', 'dispenser', 'autoclave',
        'ventilator', 'circuit', 'sensor', 'scope', 'ultrasonic', 'جهاز',
        'عربة', 'كرسي'
    ];

    // فحص الفئات بالترتيب
    if (medicineKeywords.some(keyword => name.includes(keyword))) {
        return 'أدوية';
    }

    if (sterilizationKeywords.some(keyword => name.includes(keyword))) {
        return 'مواد تعقيم';
    }

    if (surgicalKeywords.some(keyword => name.includes(keyword))) {
        return 'أدوات جراحية';
    }

    if (diagnosticKeywords.some(keyword => name.includes(keyword))) {
        return 'معدات تشخيصية';
    }

    if (equipmentKeywords.some(keyword => name.includes(keyword))) {
        return 'أجهزة ومعدات';
    }

    if (medicalSuppliesKeywords.some(keyword => name.includes(keyword))) {
        return 'مستلزمات طبية';
    }

    // الفئة الافتراضية
    return 'مستلزمات عامة';
}

// دالة لإنشاء وصف عربي للمادة
function createArabicDescription(itemName: string, category: string): string {
    const descriptions: { [key: string]: string } = {
        'أدوية': 'مادة دوائية',
        'مستلزمات طبية': 'مستلزم طبي',
        'أدوات جراحية': 'أداة جراحية',
        'معدات تشخيصية': 'معدة تشخيصية',
        'مواد تعقيم': 'مادة تعقيم وتطهير',
        'أجهزة ومعدات': 'جهاز أو معدة طبية',
        'مستلزمات عامة': 'مستلزم عام'
    };

    return `${descriptions[category]} - ${itemName}`;
}

// دالة لتحديد الوحدة بناءً على اسم المادة
function determineUnit(itemName: string): string {
    const name = itemName.toLowerCase();

    if (name.includes('tab') || name.includes('tablet') || name.includes('cap')) {
        return 'قرص';
    }
    if (name.includes('amp') || name.includes('vial') || name.includes('inj')) {
        return 'أمبول';
    }
    if (name.includes('box') || name.includes('package')) {
        return 'علبة';
    }
    if (name.includes('bottle') || name.includes('liter') || name.includes('ml')) {
        return 'زجاجة';
    }
    if (name.includes('roll') || name.includes('gauze')) {
        return 'لفة';
    }
    if (name.includes('tube')) {
        return 'أنبوب';
    }
    if (name.includes('bag')) {
        return 'كيس';
    }

    return 'قطعة';
}

async function importMaterials() {
    try {
        console.log('🚀 بدء عملية استيراد المواد...\n');

        // التحقق من وجود المستودع
        const warehouse = await prisma.warehouse.findUnique({
            where: { id: WAREHOUSE_ID }
        });

        if (!warehouse) {
            console.error(`❌ خطأ: المستودع بالمعرف ${WAREHOUSE_ID} غير موجود`);
            return;
        }

        console.log(`✅ تم العثور على المستودع: ${warehouse.name}\n`);

        // قراءة ملف CSV
        const csvPath = path.join(__dirname, '../../قائمة بالمستلزمات والادوية.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf-8');

        // تقسيم الملف إلى أسطر وإزالة السطر الأول (العنوان)
        const lines = csvContent.split('\n').slice(1).filter(line => line.trim());

        console.log(`📋 عدد المواد المراد استيرادها: ${lines.length}\n`);

        let successCount = 0;
        let errorCount = 0;
        const categoryCounts: { [key: string]: number } = {};

        // معالجة كل مادة
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim().replace(/\r/g, '');

            if (!line) continue;

            try {
                const itemName = line;
                const category = categorizeItem(itemName);
                const description = createArabicDescription(itemName, category);
                const unit = determineUnit(itemName);
                const sku = `MAT-${String(i + 1).padStart(4, '0')}`;

                // إنشاء المادة في قاعدة البيانات
                await prisma.item.create({
                    data: {
                        name: itemName,
                        description: description,
                        sku: sku,
                        category: category,
                        unit: unit,
                        quantity: 0,
                        warehouseId: WAREHOUSE_ID,
                        isActive: true
                    }
                });

                // تحديث عداد الفئات
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                successCount++;

                // طباعة تقدم العملية كل 50 مادة
                if ((i + 1) % 50 === 0) {
                    console.log(`⏳ تم استيراد ${i + 1} من ${lines.length} مادة...`);
                }

            } catch (error) {
                console.error(`❌ خطأ في استيراد المادة "${line}":`, error);
                errorCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 ملخص عملية الاستيراد:');
        console.log('='.repeat(60));
        console.log(`✅ تم استيراد: ${successCount} مادة`);
        console.log(`❌ فشل استيراد: ${errorCount} مادة`);
        console.log('\n📈 توزيع المواد حسب الفئات:');
        console.log('-'.repeat(60));

        Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([category, count]) => {
                const percentage = ((count / successCount) * 100).toFixed(1);
                console.log(`   ${category}: ${count} مادة (${percentage}%)`);
            });

        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ خطأ عام في عملية الاستيراد:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// تشغيل السكريبت
importMaterials()
    .then(() => {
        console.log('✨ اكتملت عملية الاستيراد بنجاح!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 فشلت عملية الاستيراد:', error);
        process.exit(1);
    });
