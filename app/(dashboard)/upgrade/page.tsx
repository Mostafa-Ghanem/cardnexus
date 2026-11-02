import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS, effectivePlan, formatPrice } from "@/lib/plans";
import { paypalConfigured } from "@/lib/paypal";
import Link from "next/link";
import { Check, ArrowLeft, Zap } from "lucide-react";
import { UpgradeButtons } from "./UpgradeButtons";

export const metadata = { title: "ترقية الباقة" };

const FEATURE_LABELS: Record<string, string | ((v: number | boolean) => string)> = {
  whiteLabel:             "بدون شارة المنصة",
  customDomain:           "دومين خاص",
  allTemplates:           "جميع القوالب",
  maxCards:               (v) => v === Infinity ? "بطاقات غير محدودة" : `حتى ${v} بطاقات`,
  pdfExport:              "تصدير PDF وطباعة",
  appointmentBooking:     "رابط حجز المواعيد",
  campaigns:              "حملات UTM",
  leadCapture:            "نموذج جمع العملاء المحتملين",
  eventInvitations:       "روابط دعوات الفعاليات",
  milestoneNotifications: "تنبيهات الإنجازات",
  bulkImport:             "استيراد CSV جماعي",
  orgTemplate:            "قالب موحّد للمؤسسة",
  teamDirectory:          "دليل الفريق",
};

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const sp      = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  const user    = session!.user as { id: string };

  // Always re-fetch from DB — webhooks update the DB, not the session cookie
  const dbUser = await db.user.findUnique({
    where:  { id: user.id },
    select: { plan: true, planExpiresAt: true, stripeCustomerId: true, stripeSubscriptionId: true, paypalSubscriptionId: true },
  });

  const currentPlan      = effectivePlan(dbUser?.plan ?? "free", dbUser?.planExpiresAt);
  const hasStripe        = !!dbUser?.stripeCustomerId;
  const hasPaypal        = !!dbUser?.paypalSubscriptionId;
  const stripeReady      = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PRO_MONTHLY);
  const paypalReady      = paypalConfigured();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          العودة للوحة التحكم
        </Link>
        <h1 className="text-2xl font-bold">ترقية الباقة</h1>
        <p className="text-muted-foreground mt-1">
          الحالية:{" "}
          <span className="font-semibold capitalize">{currentPlan}</span>
          {dbUser?.planExpiresAt && (
            <span className="text-xs ms-2 text-muted-foreground">
              (حتى {new Date(dbUser.planExpiresAt).toLocaleDateString("ar-u-nu-latn")})
            </span>
          )}
        </p>
      </div>

      {sp.success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          ✓ تم الدفع بنجاح! تم تحديث باقتك.
        </div>
      )}
      {sp.canceled && (
        <div className="rounded-xl bg-muted border border-border px-4 py-3 text-sm text-muted-foreground">
          تم إلغاء العملية.
        </div>
      )}

      {!stripeReady && !paypalReady && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          لم يتم إعداد بوابة دفع بعد. تواصل معنا للترقية.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {(["pro", "business"] as const).map((planId) => {
          const plan      = PLANS[planId];
          const isCurrent = currentPlan === planId;

          return (
            <div
              key={planId}
              className={`bg-card rounded-2xl border-2 p-6 flex flex-col gap-4 ${
                plan.highlight ? "border-primary" : "border-border"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-bold text-lg">{plan.name}</span>
                  {isCurrent && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      الحالية
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{formatPrice(plan.monthlyPrice)}</span>
                  <span className="text-muted-foreground text-sm">/شهريًا</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <ul className="space-y-2 flex-1">
                {Object.entries(plan.features).map(([k, v]) => {
                  if (!v || v === 0) return null;
                  const labelDef = FEATURE_LABELS[k];
                  if (!labelDef) return null;
                  const label = typeof labelDef === "function" ? labelDef(v as number | boolean) : labelDef;
                  return (
                    <li key={k} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      {label}
                    </li>
                  );
                })}
              </ul>

              <UpgradeButtons
                planId={planId}
                isCurrent={isCurrent}
                hasStripe={hasStripe}
                hasPaypal={hasPaypal}
                stripeConfigured={stripeReady}
                paypalConfigured={paypalReady}
              />
            </div>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        لديك سؤال؟{" "}
        <Link href="/impressum" className="underline hover:text-foreground transition-colors">
          تواصل معنا
        </Link>
      </p>
    </div>
  );
}
