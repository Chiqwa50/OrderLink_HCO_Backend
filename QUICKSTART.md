# Quick Start Guide - دليل البدء السريع

## 🚀 تشغيل المشروع محلياً

### المتطلبات
- Node.js >= 18
- PostgreSQL
- Git

### الخطوات

#### 1. إعداد قاعدة البيانات

**باستخدام Docker (موصى به):**
```bash
docker run --name orderlink-db \
  -e POSTGRES_USER=orderlink \
  -e POSTGRES_PASSWORD=orderlink123 \
  -e POSTGRES_DB=orderlink \
  -p 5432:5432 \
  -d postgres:15
```

**أو تثبيت PostgreSQL محلياً** وإنشاء قاعدة بيانات باسم `orderlink`

#### 2. تشغيل Backend

```bash
cd backend

# تثبيت الحزم
npm install

# إنشاء ملف .env
cat > .env << EOF
DATABASE_URL="postgresql://orderlink:orderlink123@localhost:5432/orderlink?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
PORT=5000
NODE_ENV="development"
EOF

# تشغيل migrations
npx prisma migrate dev --name init

# توليد Prisma Client
npx prisma generate

# تشغيل الخادم
npm run dev
```

الخادم سيعمل على: `http://localhost:5000`

#### 3. تشغيل Frontend

**في terminal جديد:**
```bash
cd frontend

# تثبيت الحزم
npm install

# إنشاء ملف .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF

# تشغيل الخادم
npm run dev
```

التطبيق سيعمل على: `http://localhost:3000`

#### 4. إنشاء مستخدمين للاختبار

**استخدام Prisma Studio (طريقة سهلة):**
```bash
cd backend
npx prisma studio
```

ثم أنشئ مستخدمين يدوياً (تذكر تشفير كلمة المرور باستخدام bcrypt)

**أو استخدام API:**

```bash
# إنشاء قسم
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0512345678",
    "password": "123456",
    "name": "قسم المشتريات",
    "role": "DEPARTMENT",
    "departmentName": "المشتريات"
  }'

# إنشاء موظف مستودع
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0598765432",
    "password": "123456",
    "name": "أحمد محمد",
    "role": "WAREHOUSE"
  }'

# إنشاء سائق
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0555555555",
    "password": "123456",
    "name": "خالد علي",
    "role": "DRIVER"
  }'
```

#### 5. تسجيل الدخول

افتح `http://localhost:3000` وسجل الدخول باستخدام:
- **رقم الهاتف**: 0512345678 (أو أي رقم أنشأته)
- **كلمة المرور**: 123456

---

## 📱 اختبار النظام

### كقسم (Department)
1. سجل دخول برقم هاتف القسم
2. اضغط "طلب جديد"
3. أضف مواد (مثال: ورق A4، أقلام، دباسة)
4. أرسل الطلب
5. شاهد الطلب في القائمة

### كموظف مستودع (Warehouse)
1. سجل دخول برقم هاتف المستودع
2. شاهد جميع الطلبات
3. اضغط على طلب لعرض التفاصيل
4. حدّث الحالة: قيد المراجعة → قيد التجهيز → جاهز
5. حمّل PDF للطلب

### كسائق (Driver)
1. سجل دخول برقم هاتف السائق
2. شاهد الطلبات الجاهزة للتوصيل
3. اضغط "تم التسليم" عند التوصيل

---

## 🐛 حل المشاكل الشائعة

### Backend لا يعمل
```bash
# تأكد من تشغيل PostgreSQL
docker ps

# تحقق من الاتصال بقاعدة البيانات
cd backend
npx prisma studio
```

### Frontend لا يتصل بـ Backend
```bash
# تأكد من NEXT_PUBLIC_API_URL في .env.local
cat frontend/.env.local

# يجب أن يكون:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### خطأ في Prisma
```bash
cd backend
npx prisma generate
npx prisma migrate reset  # سيحذف البيانات!
```

---

## 📚 موارد إضافية

- [README.md](file:///home/ayb/Documents/OrderLink_HCO/README.md) - الوثائق الكاملة
- [Backend README](file:///home/ayb/Documents/OrderLink_HCO/backend/README.md) - وثائق Backend
- [Frontend README](file:///home/ayb/Documents/OrderLink_HCO/frontend/README.md) - وثائق Frontend
- [Walkthrough](file:///home/ayb/.gemini/antigravity/brain/f3909b47-c3cc-49b6-8e41-7215e27da0f9/walkthrough.md) - شرح تفصيلي للتنفيذ

---

## 🌐 النشر على الإنترنت

راجع [README.md](file:///home/ayb/Documents/OrderLink_HCO/README.md) للحصول على تعليمات النشر على Vercel و Railway.
