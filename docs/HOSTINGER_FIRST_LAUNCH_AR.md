# تشغيل CardNexus على Hostinger — الدليل العملي

هذه نسخة تطوير للتجربة فقط. **لا تستبدل موقع aqar1.com ولا ترفع المشروع إلى public_html الخاص به.**

## 1. تحميل ورفع الكود

**الأفضل:** Hostinger > Websites > Create site > Web App > Import Git Repository ثم اختر:
- المستودع: `Mostafa-Ghanem/cardnexus`
- الفرع: `feature/hostinger-mysql-foundation`
- Node.js: `22.x`
- Framework: `Next.js`

**لو هترفع ZIP:** نزّل `Code > Download ZIP` من نفس الفرع. افك الملف ثم أنشئ ZIP جديدًا يحتوي في جذره مباشرة `package.json` و`package-lock.json` و`app/` و`prisma/`؛ احذف مجلد `node_modules` و`.next` إن وُجدا. من Hostinger اختر `Create site > Web App > Upload files`. لا تستخدم File Manager / WordPress ولا تستبدل الموقع القديم.

## 2. قاعدة البيانات

داخل Hostinger أنشئ **قاعدة MySQL جديدة وفارغة تمامًا** ومستخدمًا جديدًا مخصصًا لهذا التطبيق. سجّل اسم القاعدة والمستخدم وكلمة المرور من لوحة Hostinger (لا تكتبها في GitHub أو داخل الرسائل).

مثال فقط (استبدل كل القيم):
```env
DATABASE_URL=mysql://u123456789_nfc:URL_ENCODED_PASSWORD@127.0.0.1:3306/u123456789_nfc
```
إذا احتوت كلمة المرور على رموز مثل `@` أو `#` أو `/` أو `:` فيجب URL-encode لها.

## 3. إعدادات تطبيق الويب

اختر Web App مستقل بدومين تجريبي جديد. أضف Environment Variables من إعدادات Hostinger:

| Variable | Value |
|---|---|
| `DATABASE_URL` | عنوان MySQL الجديد (كامل) |
| `BETTER_AUTH_SECRET` | قيمة عشوائية طويلة وآمنة، لا تقل عن 32 بايت |
| `APP_URL` | `https://test-domain.example` |
| `BETTER_AUTH_URL` | نفس الرابط أعلاه |
| `NEXT_PUBLIC_APP_URL` | نفس الرابط أعلاه |
| `HOSTINGER_INITIAL_SETUP` | `true` في أول نشر فقط |

**النشر الأول، والقاعدة فارغة فقط:**
- Install: تُشغّله Hostinger تلقائيًا (npm ci).
- Build command: `npm run build:hostinger:init`
- Start command: `npm run start`
- Node: `22.x`

بعد نجاح أول نشر وظهور الجداول في phpMyAdmin:
- غيّر `HOSTINGER_INITIAL_SETUP` إلى `false` أو احذفه.
- غيّر Build command إلى `npm run build`، وأعد النشر.
- لا تستخدم أمر تهيئة القاعدة لأول مرة على قاعدة فيها بيانات فعلية.
- إذا كان Hostinger يُظهر إعداد Output directory، اختر إعداد Next.js التلقائي (`.next`) ولا تستخدم export static.

## 4. حساب المسؤول

1. افتح `https://test-domain.example/register` وأنشئ حسابك أنت باستخدام بريدك.
2. من Hostinger > Databases > phpMyAdmin افتح قاعدة البيانات الجديدة، وتأكد من وجود المستخدم.
3. نفّذ أمر SQL التالي **بعد استبدال البريد ببريدك**:
```sql
UPDATE `user` SET `role` = 'super_admin' WHERE `email` = 'YOUR_ADMIN_EMAIL@example.com';
```
4. سجّل خروجك وادخل من جديد للتحقق من صلاحيات لوحة الإدارة.

**مهم:** حظرت النسخة الجديدة اختيار `role` و`organizationId` من بيانات تسجيل المستخدم نفسه. لا تشغّل `prisma/seed.ts` التجريبي.

## 5. تخزين الصور على R2

يمكن تصفح الموقع وإدارة الكروت بدون R2، لكن رفع الصور سيرجع خطأ واضحًا حتى تكمل إعداد التخزين.

- Cloudflare > R2 > Create bucket: اقترح اسمًا مستقلًا مثل `cardnexus-uploads`.
- أنشئ S3 API token بصلاحيات Object Read & Write محدودة بالـ bucket فقط.
- من Hostinger > Environment Variables أضف `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
- **لا ترسل مفاتيح R2 أو كلمات المرور في المحادثة أو ترفعها إلى GitHub**.
- الصور ستُحفظ في bucket خاص، بينما التطبيق يقدم الروابط العامة عن طريق `/uploads/...`.

## 6. البريد الإلكتروني

الدعوات ورسائل استعادة كلمة المرور تتطلب SMTP صالحًا من Hostinger أو مزودًا خارجيًا مثل Brevo. الإعدادات: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. بدونها لا تعتمد على وظيفة استعادة كلمة المرور حتى يتم الاختبار.

## 7. اختبار التشغيل

- `/`: الصفحة الرئيسية
- `/register`: تسجيل حساب جديد
- `/login`: تسجيل الدخول
- `/dashboard`: لوحة المستخدم بعد الدخول
- إنشاء كارت ومشاركته عبر URL / QR / NFC
- تسجيل Lead والتأكد من ظهوره في قاعدة MySQL
- رفع صورة (بعد R2) ثم إعادة نشر التطبيق والتحقق من استمرار ظهورها
- التحقق من الصلاحيات وحماية لوحة الإدارة

## أخطاء متوقعة

- **Prisma P1001 / P1000**: راجع `DATABASE_URL` والمستخدم والصلاحيات.
- **Table doesn't exist**: فشل تشغيل `build:hostinger:init` أو تم ربط قاعدة أخرى.
- **NEXT_PUBLIC_APP_URL / BETTER_AUTH_URL mismatch**: سجل خروجك وصحّح الثلاثة روابط وأعد Build.
- **Image storage is not configured**: أضف مفاتيح R2.
- **Prisma CLI not found**: راجع سجل Install، وهل Hostinger ثبّت devDependencies أثناء البناء. قد تحتاج نقل Prisma إلى dependencies.
- **ZIP cannot find package.json**: لازم يكون `package.json` في جذر الأرشيف.

## مراجع رسمية

- https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- https://www.hostinger.com/support/how-to-deploy-prisma-apps-on-hostinger-node-js-hosting/
- https://developers.cloudflare.com/r2/get-started/s3/

## الحالة

- تم تعديل الكود على فرع GitHub المذكور.
- الاختبارات الآلية من GitHub Actions تساعد في التحقق من البناء وقاعدة البيانات.
- لم يتم تشغيل هذا التطبيق فعليًا على حساب Hostinger بعد؛ لا توجد بيانات دخول أو نطاق تجريبي في المستودع.
