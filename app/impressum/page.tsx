import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPlatformSettings } from "@/lib/platform";

// Re-read platform settings (name, logo, colours) at most once a minute.
export const revalidate = 60;

export const metadata = { title: "من نحن" };

export default async function AboutPage() {
  const s = await getPlatformSettings();
  const email = s.supportEmail;
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-10 transition-colors">
          <ArrowRight className="h-4 w-4" />
          العودة للرئيسية
        </Link>
        <h1 className="text-3xl font-bold mb-8">من نحن</h1>

        <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">عن {s.appName}</h2>
            <p>
              {s.appName} منصة لإنشاء بطاقات الأعمال الرقمية ومشاركتها عبر رابط أو رمز QR أو NFC،
              مع جمع بيانات العملاء المحتملين ومتابعة الإحصائيات وإدارة الفرق.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">تواصل معنا</h2>
            {email ? (
              <p>البريد الإلكتروني: <a href={`mailto:${email}`} className="text-blue-600 hover:underline" dir="ltr">{email}</a></p>
            ) : (
              <p>يمكنك التواصل معنا عبر بيانات التواصل المنشورة على الموقع.</p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">إخلاء المسؤولية</h2>
            <p className="text-sm">
              نبذل كل جهد لتقديم محتوى دقيق ومحدّث، لكننا لا نضمن خلوه التام من الأخطاء.
              كل مستخدم مسؤول عن صحة البيانات التي ينشرها على بطاقته.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
