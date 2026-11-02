# CardNexus — Cloudflare Workers / D1 / R2

## لماذا فرع مستقل؟
هذا الفرع `feature/cloudflare-workers-d1` **لا يُغيّر** فرع Hostinger أو `aqar1.com`.
المسار المقترح: vinext Next.js 16 > Cloudflare Workers > D1 > R2.
المنظومة المساعدة: Better Auth، Brevo API، Stripe/PayPal عند تفعيلها.

**حالة التنفيذ:** كود التحويل موجود ويجب اجتياز CI بالكامل ثم الاختبار على Workers قبل استخدامه تجاريًا. vinext مازال Beta.

## الخطوات (بدون لمس الإنتاج)
1. نزّل هذا الفرع وافتح مجلده، وثبّت Node.js 22 ثم `npm ci` بعد أن ينشر CI ملف الـ lockfile الجديد.
2. شغّل `npx wrangler login` في حساب Cloudflare الشخصي المخصص للمشروع.
3. أنشئ قاعدة البيانات **المنفصلة**: `npx wrangler d1 create cardnexus-d1`. انسخ `database_id` الحقيقي إلى `wrangler.jsonc`.
4. أنشئ R2 bucket مستقلًا: `npx wrangler r2 bucket create cardnexus-media`. `IMAGES` هو اسم الـ binding.
5. شغّل `npm run db:migration:generate` إذا لم يكن ملف `migrations/0001_init.sql` موجودًا (نفّذ على قاعدة فارغة فقط).
6. راجع SQL وافتح قاعدة D1 الاختبارية، ثم شغّل `npm run db:migration:remote` لإنشاء الجداول. هذه خطوة تغيّر قاعدة البيانات ويجب تنفيذها على قاعدة جديدة فقط.
7. من Workers > Settings أضف `APP_URL`، `BETTER_AUTH_URL`، `NEXT_PUBLIC_APP_URL` مساوية لرابط worker الفعلي `https://...workers.dev` أو دومين تجريبي.
8. أضف Secret `BETTER_AUTH_SECRET` عشوائيًا باستخدام `npx wrangler secret put BETTER_AUTH_SECRET`.
9. للبريد أضف `BREVO_API_KEY` كـ Secret، و`EMAIL_FROM` كمرسل موثق، و`EMAIL_FROM_NAME` اختياريًا. بدونها لا تعمل إشعارات البريد.
10. نفّذ `npm run deploy:dry-run` لفحص حزمة النشر، ثم `npm run deploy` **للمشروع التجريبي فقط**. أمر النشر يستخدم Cloudflare Vite Plugin مع `wrangler.jsonc`.
11. افتح `/register` لإنشاء حساب شخصي، ثم امنحه `super_admin` يدويًا من قاعدة D1 الجديدة فقط، ثم سجل خروج/دخول.

مثال ترقية مدير (غيّر الإيميل):
```sh
npx wrangler d1 execute cardnexus-d1 --remote --command "UPDATE user SET role = 'super_admin' WHERE email = 'ADMIN@example.com';"
```

## ما الذي تم تحويله؟
- SQLite Prisma مع `@prisma/adapter-d1` و`env.DB` بدل اتصال MySQL.
- R2 binding `env.IMAGES` بدل `fs` وS3 keys.
- إرسال البريد باستخدام Brevo HTTPS API بدل SMTP socket.
- D1 rate limiting + تنظيف يومي من Cron.
- جغرافيا Cloudflare بدل `geoip-lite`.
- Vinext/Vite مع Node compatibility على Workers.

## ملاحظات مهمة
- لا تعيد استخدام D1 القديمة من مشاريع أخرى، ولا تستخدم قاعدة الإنتاج قبل التحقق.
- NFC يفتح HTTPS URL ولا يستطيع استخراج رقم هاتف الزائر تلقائيًا.
- اختبر: التسجيل، تسجيل الدخول، حفظ الكارت، الصورة، إرسال Lead، CSV، Webhooks، تحليلات، الاشتراكات، نطاقات البروفايل، Two-factor، Apple/Google Wallet قبل اعتبار النظام جاهزًا بالكامل.
- في حال عدم وجود بريد موثق في Brevo لا تعتمد على دعوات العضوية أو استعادة كلمة المرور.
- إعدادات Stripe/PayPal اختيارية وتحتاج Webhook secrets وفحوص دفع فعلية.
- تأكد من أن Worker لا يحوي مفاتيح سرية داخل Git.
- قبل أي إطلاق تجاري، راجع ترخيص MIT، شروط الخدمة وحماية البيانات وإجراءات حذف بيانات الـ Leads.

## المراجع
https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
https://developers.cloudflare.com/d1/tutorials/d1-and-prisma-orm/
https://vinext.dev/docs/deploying/cloudflare

## اختبار تكامل تم اجتيازه داخل Workerd
- إنشاء مستخدم جديد بـ Better Auth وتخزينه في D1.
- إنشاء كارت عام عبر API ثم استرجاعه عبر slug.
- ترقية مستخدم الاختبار داخل D1 مؤقتًا ثم حفظ Lead عن طريق API.
- رفع صورة PNG إلى R2، ثم استرجاع نفس البايتات ومقارنتها.
- ما سبق اختبار محلي ببيئة محاكية، **ليس إطلاقًا على حساب Cloudflare الحقيقي**.
