import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Server, CheckCircle } from "lucide-react";

export const metadata = { title: "إعداد دومين خاص" };

export default async function CustomDomainPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "yourserver.com";
  const appHost = host;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/card" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          العودة للبطاقة
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6" />
          إعداد دومين خاص
        </h1>
        <p className="text-muted-foreground mt-1">
          هكذا تربط دومينك الخاص ببطاقتك الرقمية.
        </p>
      </div>

      <div className="space-y-4">
        {/* Step 1 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">1</div>
            <div className="space-y-3 flex-1">
              <h2 className="font-semibold">اشترِ دومينًا أو اختر دومينًا لديك</h2>
              <p className="text-sm text-muted-foreground">
                اشترِ دومينًا من أي مزوّد (مثل Hostinger أو Namecheap أو Cloudflare) أو استخدم نطاقًا فرعيًا لديك.
              </p>
              <div className="bg-muted rounded-lg p-3 text-sm font-mono">
                مثال: card.yourcompany.com
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">2</div>
            <div className="space-y-3 flex-1">
              <h2 className="font-semibold">أضف سجل DNS</h2>
              <p className="text-sm text-muted-foreground">
                من إعدادات DNS لدى مزوّد الدومين أضف سجل <strong>CNAME</strong> يشير إلى خادم المنصة:
              </p>
              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm font-mono">
                <div className="grid grid-cols-3 gap-4 text-muted-foreground text-xs uppercase tracking-wide mb-2">
                  <span>النوع</span><span>الاسم</span><span>القيمة</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>CNAME</span>
                  <span>card</span>
                  <span className="break-all">{appHost}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                للدومين الرئيسي (بدون نطاق فرعي) استخدم سجل <strong>A</strong> يشير إلى عنوان IP الخاص بالخادم.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">3</div>
            <div className="space-y-3 flex-1">
              <h2 className="font-semibold">ربط الدومين بالاستضافة</h2>
              <p className="text-sm text-muted-foreground">
                أضف الدومين الجديد كدومين إضافي (Alias) لنفس تطبيق الويب من لوحة الاستضافة، وفعّل شهادة SSL له حتى يعمل HTTPS.
                إذا كنت تستخدم خادمًا خاصًا، اضبط الـ Reverse Proxy ليمرر ترويسة <code className="font-mono text-xs">Host</code> كما هي.
              </p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">4</div>
            <div className="space-y-3 flex-1">
              <h2 className="font-semibold">أدخل الدومين في إعدادات البطاقة</h2>
              <p className="text-sm text-muted-foreground">
                أدخل الدومين في تبويب <strong>التصميم ← دومين البطاقة</strong> داخل محرر البطاقة. بعدها ستستخدم رموز QR وروابط NFC والحملات هذا الدومين تلقائيًا.
              </p>
              <Link href="/card" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <CheckCircle className="h-4 w-4" />
                إلى البطاقة
              </Link>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex gap-2">
          <Server className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">توجيه تلقائي</p>
            <p className="mt-0.5">المنصة تتعرف تلقائيًا على الطلبات القادمة من دومينك وتوجهها للبطاقة الصحيحة، بشرط وصول ترويسة <code className="font-mono text-xs">Host</code>الصحيحة.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
