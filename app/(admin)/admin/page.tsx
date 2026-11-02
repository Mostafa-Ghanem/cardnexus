import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, CreditCard, Activity, TrendingUp } from "lucide-react";
import { CHANGELOG } from "@/lib/changelog";
import { PLANS, formatPrice } from "@/lib/plans";

export const metadata = { title: "مدير" };

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
    { label: "إجمالي المستخدمين", value: userCount, icon: Users },
    { label: "جدد هذا الشهر", value: newUsersThisMonth, icon: TrendingUp },
    { label: "البطاقات الرقمية", value: cardCount, icon: CreditCard },
    { label: "الأحداث (30 يومًا)", value: recentAnalytics, icon: Activity },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">نظرة عامة على المنصة</h1>
        <p className="text-muted-foreground mt-1">إحصائيات شاملة لكل المؤسسات</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-3xl font-bold mt-1">{value.toLocaleString("ar-u-nu-latn")}</p>
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
            <CardTitle className="text-base">توزيع الباقات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { plan: "المجانية",     count: freeCount,     color: "bg-gray-400",  bar: freeCount     },
              { plan: "Pro",      count: proCount,      color: "bg-blue-500",  bar: proCount      },
              { plan: "Business", count: businessCount, color: "bg-amber-500", bar: businessCount },
            ].map(({ plan, count, color, bar }) => (
              <div key={plan} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${color}`} />
                    {plan}
                  </span>
                  <span className="font-medium tabular-nums">{count.toLocaleString("ar-u-nu-latn")}</span>
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
            <CardTitle className="text-base">تقدير الإيرادات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">الإيراد الشهري (تقديري)</p>
              <p className="text-3xl font-bold mt-1">
                {formatPrice(mrrEst)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                بناءً على {proCount} Pro × {formatPrice(PLANS.pro.monthlyPrice)} + {businessCount} Business × {formatPrice(PLANS.business.monthlyPrice)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">المؤسسات</p>
                <p className="text-xl font-bold mt-0.5">{orgCount.toLocaleString("ar-u-nu-latn")}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">مدفوعة</p>
                <p className="text-xl font-bold mt-0.5">{(proCount + businessCount).toLocaleString("ar-u-nu-latn")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Build info */}
      <div className="text-xs text-muted-foreground flex gap-4 mt-2">
        <span>Version: {process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}</span>
        <span>Build: {process.env.NEXT_PUBLIC_BUILD_TIME ? new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString("ar-u-nu-latn") : "محلي"}</span>
      </div>

      {/* Changelog */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">سجل التغييرات</h2>
        <div className="space-y-4">
          {CHANGELOG.map((entry) => (
            <div key={entry.version} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-sm font-bold">v{entry.version}</span>
                <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString("ar-u-nu-latn")}</span>
              </div>
              <ul className="space-y-1.5">
                {entry.changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${c.type === "feature" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                      {c.type === "feature" ? "جديد" : "إصلاح"}
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
