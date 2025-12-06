# استكشاف أخطاء الاتصال بقاعدة بيانات Supabase

## المشكلة الحالية

تم محاولة الاتصال بقاعدة بيانات Supabase باستخدام عدة تنسيقات لرابط الاتصال، لكن جميع المحاولات فشلت مع الخطأ:

```
Error: P1001: Can't reach database server
```

## التنسيقات التي تم تجربتها

1. ✗ Connection Pooling (Port 6543):
   ```
   postgresql://postgres.ywihxwhxbyurabitbvcu:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   **خطأ**: `FATAL: Tenant or user not found`

2. ✗ Transaction Mode (Port 5432):
   ```
   postgresql://postgres.ywihxwhxbyurabitbvcu:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```
   **خطأ**: `FATAL: Tenant or user not found`

3. ✗ Direct Connection (Port 5432):
   ```
   postgresql://postgres:PASSWORD@db.ywihxwhxbyurabitbvcu.supabase.co:5432/postgres
   ```
   **خطأ**: `Can't reach database server`

4. ✗ Direct Connection (Port 6543):
   ```
   postgresql://postgres:PASSWORD@db.ywihxwhxbyurabitbvcu.supabase.co:6543/postgres
   ```
   **خطأ**: `Can't reach database server`

---

## الخطوات المطلوبة للتحقق

### 1. التحقق من حالة مشروع Supabase

يرجى التحقق من:
- هل المشروع نشط وقيد التشغيل؟
- هل تم إيقاف المشروع مؤقتاً (Paused)؟
- هل هناك أي مشاكل في لوحة تحكم Supabase؟

**الرابط**: https://supabase.com/dashboard/project/ywihxwhxbyurabitbvcu

### 2. الحصول على رابط الاتصال الصحيح

من لوحة تحكم Supabase:

1. اذهب إلى **Settings** → **Database**
2. ابحث عن قسم **Connection string**
3. اختر **URI** (وليس Session mode أو Transaction mode)
4. انسخ الرابط الكامل

يجب أن يكون الرابط بهذا الشكل:
```
postgresql://postgres:[YOUR-PASSWORD]@db.ywihxwhxbyurabitbvcu.supabase.co:5432/postgres
```

أو:
```
postgresql://postgres.ywihxwhxbyurabitbvcu:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

### 3. التحقق من كلمة المرور

- هل كلمة المرور `U0DE7m5G4ydjXEAY` صحيحة؟
- هل تم تغيير كلمة المرور مؤخراً؟
- يمكنك إعادة تعيين كلمة المرور من **Settings** → **Database** → **Reset database password**

### 4. التحقق من إعدادات الشبكة

في لوحة تحكم Supabase:
- اذهب إلى **Settings** → **Database**
- تحقق من **Network Restrictions**
- تأكد من أن عنوان IP الخاص بك غير محظور
- أو قم بتعطيل قيود الشبكة مؤقتاً للاختبار

### 5. التحقق من المنطقة (Region)

- تأكد من أن المشروع في المنطقة `eu-central-1` (AWS Frankfurt)
- يمكنك التحقق من ذلك في **Settings** → **General**

---

## حلول بديلة

### الخيار 1: استخدام Supabase Client مباشرة

بدلاً من Prisma، يمكننا استخدام Supabase Client للتفاعل مع قاعدة البيانات:

```typescript
import { supabase } from './config/supabase';

// إنشاء جدول
await supabase.from('users').insert({ ... });

// قراءة البيانات
const { data } = await supabase.from('users').select('*');
```

### الخيار 2: إنشاء الجداول يدوياً

يمكنك إنشاء الجداول مباشرة من لوحة تحكم Supabase:

1. اذهب إلى **Table Editor**
2. انقر على **New table**
3. أنشئ الجداول التالية:
   - `users`
   - `orders`
   - `order_items`
   - `order_history`

يمكنك استخدام SQL Editor لتشغيل هذا الكود:

```sql
-- إنشاء جدول المستخدمين
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  department_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول الطلبات
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  department_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول عناصر الطلب
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  notes TEXT
);

-- إنشاء جدول سجل الطلبات
CREATE TABLE order_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### الخيار 3: استخدام قاعدة بيانات محلية مؤقتاً

يمكنك استخدام PostgreSQL محلي للتطوير:

```bash
# تثبيت PostgreSQL
sudo apt-get install postgresql

# إنشاء قاعدة بيانات
createdb orderlink

# تحديث DATABASE_URL
DATABASE_URL="postgresql://localhost:5432/orderlink"

# تشغيل Prisma
npx prisma db push
```

---

## معلومات إضافية مطلوبة

يرجى تزويدي بالمعلومات التالية:

1. **حالة المشروع**: هل المشروع نشط في لوحة التحكم؟
2. **رابط الاتصال الكامل**: من Settings → Database → Connection string
3. **المنطقة**: ما هي منطقة المشروع؟
4. **قيود الشبكة**: هل هناك أي قيود على عناوين IP؟
5. **لقطة شاشة**: إذا أمكن، لقطة شاشة من صفحة Database Settings

---

## الخطوات التالية

بمجرد الحصول على المعلومات الصحيحة:

1. سأقوم بتحديث ملف `.env` بالرابط الصحيح
2. سنحاول الاتصال مرة أخرى
3. إذا نجح الاتصال، سنقوم بإنشاء الجداول
4. سنختبر التطبيق بالكامل

---

## ملاحظات مهمة

- **لا تقلق**: هذه مشكلة شائعة في إعداد Supabase لأول مرة
- **البيانات آمنة**: لم يتم حذف أو تعديل أي بيانات
- **الكود جاهز**: جميع ملفات التكوين جاهزة، نحتاج فقط إلى رابط الاتصال الصحيح
