import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Smartphone, Nfc, QrCode, Users, BarChart2,
  ArrowRight, Check, Zap, Mail, FileText,
  Shield, Megaphone, CalendarDays, Download,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { FaqSection } from "./FaqSection";
import { getPlatformSettings } from "@/lib/platform";
import { BrandMark } from "@/components/layout/BrandMark";
import { formatPrice } from "@/lib/plans";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { TemplatePlayground } from "@/components/landing/TemplatePlayground";

// Re-read platform settings (name, logo, colours) at most once a minute.
export const revalidate = 60;

/** Slug of a public card to show as a live example (optional). */
const DEMO_SLUG = process.env.NEXT_PUBLIC_DEMO_CARD_SLUG ?? "";

const features = [
  { icon: Nfc,          title: "جاهز لـ NFC",          desc: "شارك بياناتك بلمسة واحدة: قرّب الجوال من البطاقة وخلاص." },
  { icon: QrCode,       title: "رمز QR",               desc: "رمز QR يتولد تلقائيًا ويبقى محدّثًا دائمًا." },
  { icon: Smartphone,   title: "مصمم للجوال أولًا",     desc: "يفتح في أقل من ثانية، بدون تحميل أي تطبيق." },
  { icon: Users,        title: "إدارة الفرق",           desc: "أدر فريقك كاملًا من مكان واحد: الأدوار والأقسام والهوية." },
  { icon: BarChart2,    title: "إحصائيات",              desc: "تابع الزيارات والمسح والتنزيلات لحظة بلحظة." },
  { icon: Megaphone,    title: "تتبع الحملات",          desc: "روابط UTM للمعارض والفعاليات بإحصائيات نقرات مستقلة." },
  { icon: Mail,         title: "توقيع البريد",          desc: "توقيع احترافي لـ Gmail وOutlook وApple Mail." },
  { icon: CalendarDays, title: "حجز المواعيد",          desc: "رابط حجز مباشر عبر Calendly أو Cal.com أو رابطك الخاص." },
  { icon: Download,     title: "استوديو الطباعة",       desc: "12 تصميمًا للكارت الورقي بوجهين، PDF جاهز للمطبعة بهوامش قص، ولوح A4." },
  { icon: FileText,     title: "جمع العملاء المحتملين",  desc: "الزائر يترك اسمه وجواله وبريده، وتوصلك فورًا في لوحة التحكم." },
  { icon: Shield,       title: "خصوصية بياناتك",        desc: "بدون متتبعات إعلانية، وبياناتك وبيانات عملائك ملكك وحدك." },
  { icon: Zap,          title: "علامتك الخاصة",         desc: "دومين خاص وهوية خاصة بدون شارة المنصة." },
];

const steps = [
  { n: 1, title: "أنشئ حسابك",       desc: "سجّل مجانًا في أقل من دقيقة." },
  { n: 2, title: "صمّم بطاقتك",      desc: "اختر قالبًا، أضف بياناتك وعدّل الألوان." },
  { n: 3, title: "شارك وتواصل",      desc: "أرسل الرابط، أو اعرض رمز QR، أو اكتبه على بطاقة NFC." },
];

const planList = [PLANS.free, PLANS.pro, PLANS.business];

const PLAN_FEATURES: Record<string, string[]> = {
  free:     ["بطاقة رقمية واحدة", "رمز QR وتنزيل جهة الاتصال", "جمع العملاء المحتملين", "4 قوالب", "3 تصاميم للطباعة (PDF)", `حتى ${PLANS.free.features.maxCustomLinks} روابط مخصصة`, `إحصائيات (${PLANS.free.features.analyticsRetention} يومًا)`],
  pro:      ["جميع القوالب", "بدون شارة المنصة", "دومين خاص", "كل تصاميم الطباعة + لوح A4", "تتبع الحملات", "رابط حجز المواعيد", "تنبيهات الإنجازات", `إحصائيات (${PLANS.pro.features.analyticsRetention} يومًا)`],
  business: ["كل مزايا Pro", "إدارة الفريق والأقسام", "استيراد CSV جماعي", "طباعة كروت الفريق دفعة واحدة", "قالب موحّد للمؤسسة", "دليل الفريق", `إحصائيات (${PLANS.business.features.analyticsRetention} يومًا)`],
};

export default async function LandingPage() {
  const s = await getPlatformSettings();
  return (
    <div className="min-h-screen bg-background text-gray-900 dark:text-gray-100">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <BrandMark name={s.appName} logoUrl={s.logoUrl} color={s.primaryColor} />
              <span className="font-semibold">{s.appName}</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <a href="#features" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">المزايا</a>
              <a href="#how"      className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">كيف تعمل</a>
              <a href="#pricing"  className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">الأسعار</a>
              <a href="#faq"      className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">الأسئلة الشائعة</a>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors hidden sm:block">
                تسجيل الدخول
              </Link>
              <Button asChild size="sm">
                <Link href="/register">ابدأ مجانًا</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_70%_0%,hsl(var(--primary)/0.12),transparent_70%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-20">
          <div className="text-center lg:text-start stagger">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-950 px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              رقمية ومطبوعة · بهوية شركتك
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] mb-6">
              بطاقة أعمال
              <br />
              <span className="bg-gradient-to-l from-primary to-emerald-500 bg-clip-text text-transparent">تجيب لك عملاء</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed lg:mx-0">
              شارك بياناتك بـ NFC أو QR أو رابط، يحفظ العميل رقمك بضغطة، ويترك بياناته فتصلك فورًا على لوحتك وتيليجرام. واطبع كارتك الورقي بتصاميم جاهزة للمطبعة.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base shadow-lg shadow-primary/25">
                <Link href="/register">
                  أنشئ بطاقتك مجانًا
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              {DEMO_SLUG ? (
                <Button asChild variant="outline" size="lg" className="h-12">
                  <Link href={`/c/${DEMO_SLUG}`}>شاهد مثالًا حيًّا</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" size="lg" className="h-12">
                  <a href="#try">جرّب القوالب الآن</a>
                </Button>
              )}
            </div>
            <ul className="mt-8 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              {["بدون تطبيق", "جاهزة في دقيقة", "عربي وإنجليزي"].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" />{t}</li>
              ))}
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* ── Playground ──────────────────────────────────────────────────── */}
      <section id="try" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">جرّبها باسمك قبل التسجيل</h2>
          <p className="text-gray-500 dark:text-gray-400">اكتب اسمك واختر لونك، وشاهد بطاقتك في كل القوالب فورًا.</p>
        </div>
        <TemplatePlayground />
      </section>

      {/* ── Paper vs digital ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border p-6">
            <p className="text-sm font-semibold text-gray-400 mb-4">الكارت الورقي وحده</p>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              {["يضيع في الدرج ولا يُحفظ في الجوال", "أي تغيير في رقمك يعني طباعة من جديد", "لا تعرف من اهتم ومن تجاهل", "بيانات العميل لا تصلك أبدًا"].map((t) => (
                <li key={t} className="flex gap-2"><span className="text-rose-400">✕</span>{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6">
            <p className="text-sm font-semibold text-primary mb-4">{s.appName}: مطبوع + رقمي</p>
            <ul className="space-y-3 text-sm">
              {["يحفظ رقمك في جهات الاتصال بضغطة", "عدّل بياناتك متى شئت، والرمز المطبوع لا يتغير", "إحصائيات زيارات ومسح وحفظ", "العميل يترك بياناته وتصلك فورًا"].map((t) => (
                <li key={t} className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how" className="bg-gray-50 dark:bg-gray-950 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">كيف تعمل</h2>
            <p className="text-gray-500 dark:text-gray-400">ثلاث خطوات وبطاقتك جاهزة.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="text-center">
                <div className="h-12 w-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">{n}</div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">كل ما تحتاجه</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">من البطاقة الشخصية إلى حل متكامل لشركتك.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-gray-50 dark:bg-gray-950 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">أسعار واضحة</h2>
            <p className="text-gray-500 dark:text-gray-400">بدون شروط مخفية، وتقدر تلغي في أي وقت.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {planList.map((plan) => {
              const featured = plan.id === "pro";
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-8 border-2 flex flex-col ${
                    featured ? "border-gray-900 bg-gray-900 text-white" : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900"
                  }`}
                >
                  {featured && (
                    <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full self-start mb-3">
                      الأكثر طلبًا
                    </span>
                  )}
                  <p className={`text-sm font-medium mb-1 ${featured ? "opacity-60" : "text-gray-500"}`}>{plan.description}</p>
                  <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold">{formatPrice(plan.monthlyPrice)}</span>
                    <span className={`text-sm ${featured ? "opacity-60" : "text-gray-400"}`}>/شهريًا</span>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {(PLAN_FEATURES[plan.id] ?? []).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className={`h-4 w-4 shrink-0 mt-0.5 ${featured ? "text-white" : "text-emerald-500"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={featured ? "secondary" : "default"} className="w-full">
                    <Link href="/register">{plan.id === "free" ? "ابدأ مجانًا" : `جرّب ${plan.name}`}</Link>
                  </Button>
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8">
            جميع الباقات تشمل رمز QR وتنزيل جهة الاتصال وجمع العملاء المحتملين.
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">الأسئلة الشائعة</h2>
          </div>
          <FaqSection />
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-20 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-3xl font-bold mb-4">جاهز تبدأ؟</h2>
          <p className="text-gray-400 mb-8">ابدأ مجانًا، بدون بطاقة ائتمان.</p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/register">
              سجّل الآن مجانًا
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BrandMark name={s.appName} logoUrl={s.logoUrl} color={s.primaryColor} size="sm" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">{s.appName}</span>
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
                بطاقة الأعمال الرقمية الذكية للمحترفين والفرق.
              </p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300">المنتج</p>
              <ul className="space-y-2 text-sm text-gray-400 dark:text-gray-500">
                <li><a href="#features"  className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">المزايا</a></li>
                <li><a href="#pricing"   className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">الأسعار</a></li>
                {DEMO_SLUG && <li><Link href={`/c/${DEMO_SLUG}`} className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">مثال</Link></li>}
                <li><Link href="/login"  className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">تسجيل الدخول</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300">معلومات</p>
              <ul className="space-y-2 text-sm text-gray-400 dark:text-gray-500">
                <li><Link href="/impressum"  className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">من نحن</Link></li>
                <li><Link href="/datenschutz" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">سياسة الخصوصية</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400 dark:text-gray-500">
            <p>&copy; {new Date().getFullYear()} {s.appName}. جميع الحقوق محفوظة.</p>
            <p>{s.footerText ?? "صُنع للعالم العربي"}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
