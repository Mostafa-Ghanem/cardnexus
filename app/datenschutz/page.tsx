import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPlatformSettings } from "@/lib/platform";

// Re-read platform settings (name, logo, colours) at most once a minute.
export const revalidate = 60;

export const metadata = { title: "سياسة الخصوصية" };

export default async function PrivacyPage() {
  const s = await getPlatformSettings();
  const email = s.supportEmail;
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-10 transition-colors">
          <ArrowRight className="h-4 w-4" />
          العودة للرئيسية
        </Link>

        <h1 className="text-3xl font-bold mb-8">سياسة الخصوصية</h1>

        <div className="space-y-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">1. البيانات التي نجمعها</h2>
            <ul className="list-disc ps-5 mt-2 space-y-1">
              <li>بيانات الحساب (الاسم، البريد الإلكتروني، كلمة المرور بشكل مشفّر)</li>
              <li>بيانات بطاقتك الرقمية (الاسم، بيانات التواصل، الصورة)</li>
              <li>إحصائيات الاستخدام (الزيارات، نوع الجهاز، المصدر) دون تحديد هوية الزائر</li>
              <li>بيانات العملاء المحتملين التي يتركها الزوار طوعًا عبر نموذج التواصل</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">2. سبب استخدام البيانات</h2>
            <p>نستخدم البيانات فقط لتشغيل خدمة {s.appName}. لا نبيع البيانات ولا نشاركها مع أي جهة لأغراض إعلانية.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">3. ملفات تعريف الارتباط</h2>
            <p>نستخدم فقط ملفات الجلسة الضرورية لتسجيل الدخول، ولا نستخدم ملفات تتبع أو تسويق من أطراف خارجية.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">4. حقوقك</h2>
            <p>
              يحق لك الاطلاع على بياناتك وتصحيحها وتصديرها وحذف حسابك في أي وقت من صفحة الإعدادات.
              {email && <> للاستفسارات راسلنا على <a href={`mailto:${email}`} className="text-blue-600 hover:underline" dir="ltr">{email}</a>.</>}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">5. مدة الاحتفاظ</h2>
            <p>تُحذف بيانات الإحصائيات تلقائيًا بعد 30 أو 365 أو 730 يومًا حسب الباقة، وتُحذف بيانات الحساب فور طلب الحذف.</p>
          </section>
        </div>

        <p className="mt-10 text-xs text-gray-400 dark:text-gray-500">
          هذه سياسة استرشادية، يُنصح بمراجعتها قانونيًا بما يناسب نشاطك ودولتك.
        </p>
      </div>
    </div>
  );
}
