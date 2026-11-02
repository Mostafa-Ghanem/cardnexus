import { T } from "@/components/i18n/I18nProvider";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, CreditCard, Activity, TrendingUp } from "lucide-react";
import { CHANGELOG } from "@/lib/changelog";
import { PLANS } from "@/lib/plans";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const now = new Date();
  const [userCount, orgCount, cardCount, recentAnalytics, planGroups, newUsersThisMonth] =
    await Promise.all([
      db.user.count(),
      db.organization.count(),
      db.card.count(),
      db.cardAnalytic.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
      db.user.groupBy({ by: ["plan"], _count: true }),
      db.user.count({
        where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      }),
    ]);

  // Plan breakdown & MRR estimate (active = not expired)
  const planMap = Object.fromEntries(planGroups.map((p) => [p.plan, p._count])) as Record<string, number>;
  const freeCount     = planMap["free"]     ?? 0;
  const proCount      = planMap["pro"]      ?? 0;
  const businessCount = planMap["business"] ?? 0;
  // Conservative MRR estimate — counts all paid-plan users, expiry not tracked here
  const mrrEst = proCount * PLANS.pro.monthlyPrice + businessCount * PLANS.business.monthlyPrice;

  const stats = [
    { label: "Benutzer gesamt", value: userCount, icon: Users },
    { label: "Neu diesen Monat", value: newUsersThisMonth, icon: TrendingUp },
    { label: "Digitale Karten", value: cardCount, icon: CreditCard },
    { label: "Events (30d)", value: recentAnalytics, icon: Activity },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold"><T text={"Plattform-Übersicht"} /></h1>
        <p className="text-muted-foreground mt-1"><T text={"Globale Statistiken für alle Organisationen"} /></p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-3xl font-bold mt-1">{value.toLocaleString("de-DE")}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base"><T text={"Plan-Verteilung"} /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { plan: "Free",     count: freeCount,     color: "bg-gray-400",  bar: freeCount     },
              { plan: "Pro",      count: proCount,      color: "bg-blue-500",  bar: proCount      },
              { plan: "Business", count: businessCount, color: "bg-amber-500", bar: businessCount },
            ].map(({ plan, count, color, bar }) => (
              <div key={plan} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${color}`} />
                    {plan}
                  </span>
                  <span className="font-medium tabular-nums">{count.toLocaleString("de-DE")}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all`}
                    style={{ width: userCount ? `${(bar / userCount) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base"><T text={"Umsatz-Schätzung"} /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground"><T text={"MRR (geschätzt)"} /></p>
              <p className="text-3xl font-bold mt-1">
                {mrrEst.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </p>
              <p className="text-xs text-muted-foreground mt-1"><T text={"Basierend auf"} />{proCount}{" "}<T text={"Pro ×"} />{" "}{PLANS.pro.monthlyPrice} € + {businessCount}{" "}<T text={"Business ×"} />{" "}{PLANS.business.monthlyPrice} €
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground"><T text={"Organisationen"} /></p>
                <p className="text-xl font-bold mt-0.5">{orgCount.toLocaleString("de-DE")}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground"><T text={"Bezahlend"} /></p>
                <p className="text-xl font-bold mt-0.5">{(proCount + businessCount).toLocaleString("de-DE")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Build info */}
      <div className="text-xs text-muted-foreground flex gap-4 mt-2">
        <span><T text={"Version:"} />{" "}{process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}</span>
        <span><T text={"Build:"} />{" "}{process.env.NEXT_PUBLIC_BUILD_TIME ? new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString("de-DE") : "lokal"}</span>
      </div>

      {/* Changelog */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4"><T text={"Changelog"} /></h2>
        <div className="space-y-4">
          {CHANGELOG.map((entry) => (
            <div key={entry.version} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-sm font-bold">v{entry.version}</span>
                <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString("de-DE")}</span>
              </div>
              <ul className="space-y-1.5">
                {entry.changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${c.type === "feature" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                      {c.type === "feature" ? "Neu" : "Fix"}
                    </span>
                    <span className="text-muted-foreground">{c.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
