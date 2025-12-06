# إضافة المواد الطبية والمستلزمات

**التاريخ**: 2025-11-29  
**الحالة**: ✅ تم التنفيذ

---

## نظرة عامة

تم إضافة 30 مادة طبية ومستلزمات إلى قاعدة البيانات بناءً على الملف المرفق `frontend/أولاً الأدوية (Medications).md`. تم استخدام سكريبت خاص (`backend/prisma/seed-items.ts`) لضمان إدخال البيانات بشكل صحيح ومنظم.

---

## تفاصيل المواد المضافة

### الأدوية (Medications)

| SKU | الاسم | الفئة | الوحدة |
|-----|-------|-------|--------|
| ITM-0001 | Aspirin 81 mg Tablet | أدوية قلب | علبة |
| ITM-0002 | Clopidogrel 75 mg Tablet | أدوية قلب | علبة |
| ITM-0003 | Ticagrelor 90 mg Tablet | أدوية قلب | علبة |
| ITM-0004 | Enoxaparin Injection | أدوية | فيال |
| ITM-0005 | Heparin Injection | أدوية | فيال |
| ITM-0006 | Metoprolol 50 mg Tablet | أدوية قلب | علبة |
| ITM-0007 | Amiodarone Injection/Tablets | أدوية قلب | علبة |
| ITM-0008 | Nitroglycerin IV Infusion | محاليل دوائية | عبوة |
| ITM-0009 | Paracetamol IV | أدوية | فيال |
| ITM-0010 | Morphine Injection | أدوية مخدرة | فيال |
| ITM-0011 | Ceftriaxone Injection | أدوية | فيال |
| ITM-0012 | Vancomycin Injection | أدوية | فيال |

### المستلزمات (Supplies)

| SKU | الاسم | الفئة | الوحدة |
|-----|-------|-------|--------|
| ITM-0013 | ECG Monitoring Electrodes | مراقبة قلب | عبوة |
| ITM-0014 | IV Cannula (Various Sizes) | مستلزمات وريدية | علبة |
| ITM-0015 | Pressure Dressing Kit | تضميد | طقم |
| ITM-0016 | Chest Pain Assessment Kit | مراقبة | طقم |
| ITM-0017 | Oxygen Nasal Cannula | أجهزة تنفس | قطعة |
| ITM-0018 | Normal Saline IV Fluids | محاليل | عبوة |
| ITM-0019 | Chest Drainage System | عناية مركزة | طقم |
| ITM-0020 | Incentive Spirometer | علاج تنفسي | قطعة |
| ITM-0021 | Sterile Gauze Packs | مستلزمات تعقيم | علبة |
| ITM-0022 | Central Line Dressing Kit | عناية مركزية | طقم |
| ITM-0023 | Foley Catheter | مستلزمات قسطرة بولية | قطعة |
| ITM-0024 | Sternal Support Brace | دعم طبي | قطعة |
| ITM-0025 | Arterial Line Kit | عناية مركزة | طقم |
| ITM-0026 | Syringe Pumps | أجهزة | قطعة |
| ITM-0027 | Ventilator Circuits | أجهزة تنفس | طقم |
| ITM-0028 | Suction Catheters | تنفس | علبة |
| ITM-0029 | Continuous ECG Leads | مراقبة قلب | قطعة |
| ITM-0030 | Pulse Oximeter Sensors | مراقبة | قطعة |

---

## كيفية التشغيل

تم إنشاء سكريبت `backend/prisma/seed-items.ts` لتنفيذ هذه العملية. يمكن إعادة تشغيله في أي وقت لتحديث بيانات المواد (لن يتم تكرار المواد بفضل استخدام `upsert` مع `sku`).

```bash
cd backend
npx ts-node prisma/seed-items.ts
```

---

## ملاحظات

- تم تعيين الكمية المبدئية (`quantity`) لجميع المواد إلى **0**.
- تم استخدام رموز SKU متسلسلة من `ITM-0001` إلى `ITM-0030`.
- أي مواد جديدة يتم إضافتها عبر النظام ستبدأ تلقائياً من `ITM-0031`.

---

**تم التنفيذ بواسطة**: Antigravity AI  
**التاريخ**: 2025-11-29
