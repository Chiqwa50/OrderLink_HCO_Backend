# Git Ignore Configuration

## نظرة عامة

تم تكوين ملفات `.gitignore` في المشروع لحماية جميع الملفات الحساسة والمهمة من الرفع إلى GitHub.

## بنية الملفات

### 1. الملف الرئيسي (Root)
**الموقع:** `/home/ayb/Documents/OrderLink_HCO/.gitignore`

يحتوي على قواعد شاملة لحماية:
- متغيرات البيئة (`.env`, `.env.local`, إلخ)
- قواعد البيانات (`*.db`, `*.sqlite`)
- المكتبات (`node_modules/`)
- ملفات البناء (`dist/`, `build/`, `.next/`)
- السجلات (`*.log`)
- ملفات النظام (`.DS_Store`, `Thumbs.db`)
- ملفات IDE (`.vscode/`, `.idea/`)
- الشهادات والمفاتيح (`*.pem`, `*.key`, `*.cert`)
- الملفات المؤقتة (`tmp/`, `temp/`)

### 2. Backend .gitignore
**الموقع:** `/home/ayb/Documents/OrderLink_HCO/backend/.gitignore`

يحمي:
- متغيرات البيئة الخاصة بالخلفية
- قاعدة البيانات Prisma (`/prisma/dev.db`)
- ملفات البناء (`dist/`)
- الملفات المرفوعة (`/uploads/*`)
- المكتبات (`node_modules/`)

### 3. Frontend .gitignore
**الموقع:** `/home/ayb/Documents/OrderLink_HCO/frontend/.gitignore`

يحمي:
- متغيرات البيئة الخاصة بالواجهة
- ملفات Next.js (`/.next/`, `/out/`)
- ملفات البناء (`/build`)
- الملفات المرفوعة (`/public/uploads/*`)
- ملفات الكاش (`.cache`, `.turbo`)

## الملفات المحمية

### ✅ ملفات البيئة (Environment Variables)
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
*.env
```
**ملاحظة:** فقط `.env.example` يتم رفعه كمرجع.

### ✅ قواعد البيانات
```
*.db
*.sqlite
*.sqlite3
/backend/prisma/dev.db
/backend/prisma/dev.db-journal
```

### ✅ المكتبات والتبعيات
```
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml
```

### ✅ ملفات البناء
```
dist/
build/
.next/
out/
*.tsbuildinfo
```

### ✅ الشهادات والمفاتيح
```
*.pem
*.key
*.cert
*.crt
*.p12
*.pfx
```

### ✅ السجلات
```
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

### ✅ ملفات IDE
```
.vscode/*
.idea/
*.swp
*.swo
```

## التحقق من الحماية

### فحص الملفات المتتبعة
```bash
# التحقق من عدم وجود ملفات .env
git ls-files | grep -E '\.env$'

# التحقق من عدم وجود node_modules
git ls-files | grep node_modules

# التحقق من عدم وجود ملفات البناء
git ls-files | grep -E 'dist|build|\.next'
```

### إزالة ملفات تم تتبعها بالخطأ
إذا تم رفع ملفات حساسة بالخطأ، استخدم:

```bash
# إزالة ملف من Git مع الاحتفاظ به محلياً
git rm --cached <file-path>

# إزالة مجلد كامل
git rm -r --cached <directory-path>

# مثال: إزالة .env
git rm --cached backend/.env
git rm --cached frontend/.env

# ثم قم بعمل commit
git commit -m "Remove sensitive files from tracking"
```

## أفضل الممارسات

### 1. قبل الرفع إلى GitHub
```bash
# تحقق من الملفات التي سيتم رفعها
git status

# راجع التغييرات
git diff

# تأكد من عدم وجود ملفات حساسة
git ls-files | grep -E '\.env|\.key|\.pem'
```

### 2. بعد استنساخ المشروع
```bash
# انسخ ملفات .env.example
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# قم بتعديل القيم الفعلية
nano backend/.env
nano frontend/.env
```

### 3. عند إضافة ملفات جديدة حساسة
قم بإضافتها إلى `.gitignore` المناسب فوراً.

## الملفات المسموح برفعها

### ✅ ملفات الأمثلة
- `.env.example`
- `config.example.json`

### ✅ الكود المصدري
- `src/`
- `components/`
- `pages/`

### ✅ التوثيق
- `docs/`
- `README.md`

### ✅ ملفات الإعداد
- `package.json`
- `tsconfig.json`
- `next.config.mjs`
- `prisma/schema.prisma`

## استكشاف الأخطاء

### المشكلة: ملف .env تم رفعه بالخطأ
```bash
# 1. إزالة من Git
git rm --cached backend/.env

# 2. إضافة إلى .gitignore (إذا لم يكن موجوداً)
echo ".env" >> backend/.gitignore

# 3. Commit التغييرات
git commit -m "Remove .env from tracking"

# 4. إذا تم رفعه إلى GitHub، قد تحتاج لتغيير المفاتيح
```

### المشكلة: node_modules تم رفعها
```bash
# 1. إزالة من Git
git rm -r --cached backend/node_modules
git rm -r --cached frontend/node_modules

# 2. Commit
git commit -m "Remove node_modules from tracking"

# 3. Push
git push origin main
```

## الأمان

### ⚠️ تحذيرات مهمة

1. **لا ترفع أبداً:**
   - كلمات المرور
   - مفاتيح API
   - أسرار JWT
   - معلومات قاعدة البيانات
   - شهادات SSL

2. **إذا تم رفع معلومات حساسة:**
   - قم بتغيير جميع المفاتيح والأسرار فوراً
   - استخدم `git filter-branch` أو `BFG Repo-Cleaner` لإزالتها من التاريخ
   - أبلغ الفريق

3. **استخدم .env.example:**
   - احتفظ بنموذج لملف `.env`
   - استخدم قيم وهمية أو تعليمات
   - وثق جميع المتغيرات المطلوبة

## الصيانة

### مراجعة دورية
```bash
# كل شهر، تحقق من:
git ls-files | wc -l  # عدد الملفات المتتبعة
du -sh .git           # حجم المستودع

# ابحث عن ملفات كبيرة
git ls-files | xargs ls -lh | sort -k5 -hr | head -20
```

## المراجع

- [Git Documentation - gitignore](https://git-scm.com/docs/gitignore)
- [GitHub - Ignoring files](https://docs.github.com/en/get-started/getting-started-with-git/ignoring-files)
- [gitignore.io](https://www.toptal.com/developers/gitignore)

---

**آخر تحديث:** 2025-11-30  
**الحالة:** ✅ نشط ومحمي
