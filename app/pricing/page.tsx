import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, formatPrice } from "@/lib/plans";
import type { Plan } from "@/lib/plans";

export const metadata = { title: "الأسعار" };

const FEATURE_ROWS = [
  { label: "جمع العملاء المحتملين",       key: "leadCapture" as const },
  { label: "جميع القوالب",                key: "allTemplates" as const,           note: "المجانية: 4 قوالب" },
  { label: "دومين خاص",               key: "customDomain" as const },
  { label: "بدون شارة المنصة",    key: "whiteLabel" as const },
  { label: "تصدير PDF وطباعة",          key: "pdfExport" as const },
  { label: "رابط حجز المواعيد",         key: "appointmentBooking" as const },
  { label: "حملات UTM وروابط QR",   key: "campaigns" as const },
  { label: "تنبيهات الإنجازات", key: "milestoneNotifications" as const },
  { label: "روابط دعوات الفعاليات",       key: "eventInvitations" as const },
  { label: "استيراد CSV جماعي (فرق)",      key: "bulkImport" as const },
  { label: "قالب موحّد للمؤسسة",        key: "orgTemplate" as const },
];

export default function PricingPage() {
  const plans: Plan[] = ["free", "pro", "business"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">أسعار بسيطة وعادلة</h1>
          <p className="text-lg text-gray-500 mt-3">ابدأ مجانًا، وقم بالترقية عندما تكون جاهزًا.</p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((planId) => {
            const plan = PLANS[planId];
            return (
              <div
                key={planId}
                className={`bg-white dark:bg-gray-900 rounded-2xl p-8 flex flex-col ${
                  plan.highlight
                    ? "ring-2 ring-primary shadow-xl relative"
                    : "border border-gray-200 dark:border-gray-700 shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      الأكثر طلبًا
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{plan.name}</p>
                  <div className="mt-2 flex items-end gap-1">
                    {plan.monthlyPrice === 0 ? (
                      <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">مجانًا</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">{formatPrice(plan.monthlyPrice)}</span>
                        <span className="text-gray-400 dark:text-gray-500 mb-1">/شهريًا</span>
                      </>
                    )}
                  </div>
                  {plan.yearlyPrice > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      أو {formatPrice(plan.yearlyPrice)} شهريًا عند الدفع السنوي
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{plan.description}</p>
                </div>

                <Button
                  asChild
                  className="w-full mb-6"
                  variant={plan.highlight ? "default" : "outline"}
                >
                  <Link href={planId === "free" ? "/register" : "/upgrade"}>
                    {planId === "free" ? "ابدأ مجانًا" : `اختر ${plan.name}`}
                  </Link>
                </Button>

                <ul className="space-y-3 flex-1">
                  {FEATURE_ROWS.map((row) => {
                    const enabled = plan.features[row.key];
                    return (
                      <li key={row.key} className="flex items-center gap-2.5 text-sm">
                        {enabled
                          ? <Check className="h-4 w-4 text-green-500 shrink-0" />
                          : <X className="h-4 w-4 text-gray-300 shrink-0" />}
                        <span className={enabled ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}>
                          {row.label}
                          {row.note && planId === "free" && (
                            <span className="text-xs text-muted-foreground ms-1">({row.note})</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-400 dark:text-gray-500">
          الإلغاء في أي وقت · لديك سؤال؟{" "}
          <a href="/impressum" className="underline hover:text-gray-600 dark:hover:text-gray-400">تواصل معنا</a>
        </p>
      </div>
    </div>
  );
}
