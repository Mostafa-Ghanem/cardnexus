import { T } from "@/components/i18n/I18nProvider";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS, effectivePlan } from "@/lib/plans";
import { paypalConfigured } from "@/lib/paypal";
import Link from "next/link";
import { Check, ArrowLeft, Zap } from "lucide-react";
import { UpgradeButtons } from "./UpgradeButtons";

export const metadata = { title: "Upgrade – CardNexus" };

const FEATURE_LABELS: Record<string, string | ((v: number | boolean) => string)> = {
  whiteLabel:             "White Label (kein Badge)",
  customDomain:           "Eigene Domain",
  allTemplates:           "Alle 12 Templates",
  maxCards:               (v) => v === Infinity ? "Unbegrenzte Karten" : `Bis zu ${v} Karte${v === 1 ? "" : "n"}`,
  pdfExport:              "PDF / Print-Export",
  appointmentBooking:     "Terminbuchungs-Link",
  campaigns:              "UTM-Kampagnen",
  leadCapture:            "Lead-Capture-Formular",
  eventInvitations:       "Event-Einladungslinks",
  milestoneNotifications: "Meilenstein-Benachrichtigungen",
  bulkImport:             "Bulk CSV-Import",
  orgTemplate:            "Karten-Vorlage für Org",
  teamDirectory:          "Team-Verzeichnis",
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
          <ArrowLeft className="h-3.5 w-3.5" /><T text={"Zurück zum Dashboard"} /></Link>
        <h1 className="text-2xl font-bold"><T text={"Plan upgraden"} /></h1>
        <p className="text-muted-foreground mt-1"><T text={"Aktuell:"} />{" "}
          <span className="font-semibold capitalize">{currentPlan}</span>
          {dbUser?.planExpiresAt && (
            <span className="text-xs ml-2 text-muted-foreground"><T text={"(bis"} />{new Date(dbUser.planExpiresAt).toLocaleDateString("de-DE")})
            </span>
          )}
        </p>
      </div>

      {sp.success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700"><T text={"✓ Zahlung erfolgreich! Dein Plan wurde aktualisiert."} /></div>
      )}
      {sp.canceled && (
        <div className="rounded-xl bg-muted border border-border px-4 py-3 text-sm text-muted-foreground"><T text={"Vorgang abgebrochen."} /></div>
      )}

      {!stripeReady && !paypalReady && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700"><T text={"Kein Zahlungsanbieter konfiguriert. Bitte Stripe- oder PayPal-Umgebungsvariablen setzen."} /></div>
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
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium"><T text={"Aktuell"} /></span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.monthlyPrice} €</span>
                  <span className="text-muted-foreground text-sm">/Monat</span>
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

      <p className="text-sm text-muted-foreground text-center"><T text={"Fragen?"} />{" "}
        <a
          href="mailto:sales@cardnexus.app"
          className="underline hover:text-foreground transition-colors"
        ><T text={"sales@cardnexus.app"} /></a>
      </p>
    </div>
  );
}
