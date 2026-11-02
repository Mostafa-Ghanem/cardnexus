import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, FREE_TEMPLATES } from "@/lib/plans";
import type { Plan } from "@/lib/plans";
import { T } from "@/components/i18n/I18nProvider";

export const metadata = { title: "Preise – CardNexus" };

const FEATURE_ROWS = [
  { label: "Alle 9 Templates",            key: "allTemplates" as const,           note: "Free: 4 Templates" },
  { label: "Eigene Domain",               key: "customDomain" as const },
  { label: "White Label (kein Badge)",    key: "whiteLabel" as const },
  { label: "PDF / Print-Export",          key: "pdfExport" as const },
  { label: "Terminbuchungs-Link",         key: "appointmentBooking" as const },
  { label: "UTM-Kampagnen & QR-Links",   key: "campaigns" as const },
  { label: "Meilenstein-Benachrichtig.", key: "milestoneNotifications" as const },
  { label: "Event-Einladungslinks",       key: "eventInvitations" as const },
  { label: "Bulk CSV-Import (Team)",      key: "bulkImport" as const },
  { label: "Karten-Vorlage (Org)",        key: "orgTemplate" as const },
];

export default function PricingPage() {
  const plans: Plan[] = ["free", "pro", "business"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100"><T text={"Einfache, faire Preise"} /></h1>
          <p className="text-lg text-gray-500 mt-3"><T text={"Starte kostenlos. Upgrade wenn du bereit bist."} /></p>
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
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full"><T text={"Beliebteste Wahl"} /></span>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{plan.name}</p>
                  <div className="mt-2 flex items-end gap-1">
                    {plan.monthlyPrice === 0 ? (
                      <span className="text-4xl font-bold text-gray-900 dark:text-gray-100"><T text={"Kostenlos"} /></span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">{plan.monthlyPrice} €</span>
                        <span className="text-gray-400 dark:text-gray-500 mb-1">/Monat</span>
                      </>
                    )}
                  </div>
                  {plan.yearlyPrice > 0 && (
                    <p className="text-xs text-muted-foreground mt-1"><T text={"oder"} />{plan.yearlyPrice}<T text={"€/Monat bei Jahreszahlung"} /></p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2"><T text={plan.description} /></p>
                </div>

                <Button
                  asChild
                  className="w-full mb-6"
                  variant={plan.highlight ? "default" : "outline"}
                >
                  <Link href={planId === "free" ? "/register" : "/upgrade"}>
                    {planId === "free" ? "Kostenlos starten" : `${plan.name} wählen`}
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
                          <T text={row.label} />
                          {row.note && planId === "free" && (
                            <span className="text-xs text-muted-foreground ml-1">(<T text={row.note} />)</span>
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

        <p className="text-center text-sm text-gray-400 dark:text-gray-500"><T text={"Alle Preise zzgl. MwSt. · Jederzeit kündbar · Fragen?"} />{" "}
          <a href="mailto:support@cardnexus.app" className="underline hover:text-gray-600 dark:hover:text-gray-400"><T text={"Kontakt"} /></a>
        </p>
      </div>
    </div>
  );
}
