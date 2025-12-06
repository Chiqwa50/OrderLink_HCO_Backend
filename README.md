# OrderLink Backend - نظام إدارة طلبيات المستودع

Backend API لنظام OrderLink - نظام شامل لإدارة الطلبيات بين الأقسام والمستودع.

## 🚀 المميزات

- ✅ **RESTful API** مبني على Express.js و TypeScript
- ✅ **مصادقة آمنة** باستخدام JWT
- ✅ **قاعدة بيانات PostgreSQL** مع Prisma ORM
- ✅ **ثلاثة أدوار مستخدمين**: الأقسام، المستودع، السائقين
- ✅ **إدارة كاملة للطلبيات** مع تتبع الحالة
- ✅ **توليد PDF** للطلبيات
- ✅ **سجل كامل** لجميع التغييرات
- ✅ **نظام قيود المستخدمين** مع حدود الطلبات

## 🛠️ التقنيات المستخدمة

- **Node.js** + **Express.js**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **JWT** للمصادقة
- **Bcrypt** لتشفير كلمات المرور
- **PDFKit** لتوليد PDF
- **Zod** للتحقق من البيانات

## 📋 المتطلبات

- Node.js >= 18
- PostgreSQL >= 14
- npm أو yarn

## 🔧 التثبيت والإعداد

### 1. استنساخ المشروع

```bash
git clone https://github.com/YOUR_USERNAME/OrderLink_HCO_Backend.git
cd OrderLink_HCO_Backend
```

### 2. تثبيت التبعيات

```bash
npm install
```

### 3. إعداد متغيرات البيئة

```bash
cp .env.example .env
```

ثم قم بتحديث الملف `.env` بالقيم الصحيحة:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/orderlink"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### 4. إعداد قاعدة البيانات

```bash
# تشغيل migrations
npx prisma migrate dev --name init

# توليد Prisma Client
npx prisma generate
```

### 5. تشغيل الخادم

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

الخادم سيعمل على `http://localhost:5000`

## 🗂️ بنية المشروع

```
OrderLink_HCO_Backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── config/
│   │   └── database.ts        # Database configuration
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── orderController.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── orderRoutes.ts
│   │   └── ...
│   ├── services/
│   │   ├── authService.ts
│   │   ├── orderService.ts
│   │   ├── pdfService.ts
│   │   └── ...
│   ├── types/
│   │   └── index.ts
│   └── server.ts              # Entry point
├── docs/                      # Documentation
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 API Endpoints

### Authentication

- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/auth/me` - الحصول على بيانات المستخدم الحالي
- `PUT /api/auth/profile` - تحديث الملف الشخصي
- `PUT /api/auth/change-password` - تغيير كلمة المرور

### Orders

- `POST /api/orders` - إنشاء طلب جديد (الأقسام فقط)
- `GET /api/orders` - عرض الطلبات (مفلترة حسب الدور)
- `GET /api/orders/:id` - عرض تفاصيل طلب
- `PATCH /api/orders/:id/status` - تحديث حالة الطلب
- `GET /api/orders/:id/history` - عرض سجل الطلب
- `GET /api/orders/:id/pdf` - تحميل PDF للطلب
- `DELETE /api/orders/:id` - حذف طلب (الأقسام فقط، قبل المراجعة)

### Departments

- `GET /api/departments` - عرض جميع الأقسام
- `POST /api/departments` - إنشاء قسم جديد
- `PUT /api/departments/:id` - تحديث قسم
- `DELETE /api/departments/:id` - حذف قسم

### Warehouses

- `GET /api/warehouses` - عرض جميع المستودعات
- `POST /api/warehouses` - إنشاء مستودع جديد
- `PUT /api/warehouses/:id` - تحديث مستودع
- `DELETE /api/warehouses/:id` - حذف مستودع

### User Restrictions

- `GET /api/restrictions/user/:userId` - عرض قيود مستخدم
- `PUT /api/restrictions/user/:userId` - تحديث قيود مستخدم

### Items

- `GET /api/items` - عرض جميع المواد
- `POST /api/items` - إضافة مادة جديدة
- `PUT /api/items/:id` - تحديث مادة
- `DELETE /api/items/:id` - حذف مادة

## 🔒 المصادقة والتفويض

يستخدم النظام JWT للمصادقة. جميع endpoints المحمية تتطلب إرسال token في header:

```
Authorization: Bearer <your-jwt-token>
```

### الأدوار والصلاحيات

- **DEPARTMENT**: إنشاء وعرض طلبات القسم الخاص به
- **WAREHOUSE**: عرض وإدارة جميع الطلبات
- **DRIVER**: عرض الطلبات الجاهزة وتحديثها للتسليم
- **ADMIN**: صلاحيات كاملة على النظام

## 🌐 النشر

### Railway / Render

1. إنشاء قاعدة بيانات PostgreSQL
2. رفع الكود إلى GitHub
3. ربط المشروع بـ Railway/Render
4. إضافة متغيرات البيئة
5. تشغيل:
   ```bash
   npx prisma migrate deploy
   npm run build
   npm start
   ```

### متغيرات البيئة المطلوبة للإنتاج

```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="production"
FRONTEND_URL="https://your-frontend-domain.com"
```

## 🧪 الاختبار

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📊 Prisma Studio

لعرض وإدارة البيانات بصرياً:

```bash
npx prisma studio
```

## 🔗 الربط مع Frontend

تأكد من تحديث `FRONTEND_URL` في `.env` للسماح بـ CORS من Frontend:

```env
FRONTEND_URL="http://localhost:3000"  # للتطوير
# أو
FRONTEND_URL="https://your-frontend-domain.com"  # للإنتاج
```

## 📝 ملاحظات

- جميع كلمات المرور مشفرة باستخدام bcrypt
- JWT tokens تنتهي صلاحيتها بعد 7 أيام افتراضياً
- النظام يدعم تعدد الأقسام للمستخدم الواحد
- نظام القيود يسمح بتحديد عدد الطلبات لكل مستخدم

## 🔧 التطوير

```bash
# تشغيل في وضع التطوير مع hot reload
npm run dev

# بناء المشروع
npm run build

# تشغيل النسخة المبنية
npm start

# فحص الكود
npm run lint

# تنسيق الكود
npm run format
```

## 📄 الترخيص

MIT License

## 🤝 المساهمة

هذا المشروع تم تطويره خصيصاً لإدارة طلبيات المستودع في المستشفيات.

## 📞 الدعم

للمزيد من المعلومات، راجع مجلد [docs/](./docs/)
