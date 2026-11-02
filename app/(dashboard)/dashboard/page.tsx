import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Eye, Download, ArrowRight, Plus, BarChart2, Pencil, MousePointer, UserCheck, TrendingUp, TrendingDown, CheckCircle2, Circle, Printer, Languages, MessageCircle, ImageIcon, Share2 } from "lucide-react";
import { ActivityChart } from "./ActivityChart";
import { hasEnglish } from "@/lib/card-i18n";
import { LiveViews } from "./LiveViews";
import { CardSparkline } from "./CardSparkline";

export default async function DashboardPage() {
  const hdrs   = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const user = session!.user as { id: string; name: string; role?: string };

  const proto  = hdrs.get("x-forwarded-proto") ?? "https";
  const host   = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const appUrl = `${proto}://${host}`;

  const cards = await db.card.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  // Fetch 30-day view counts and 7-day sparkline data per card in parallel
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const since7  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000);

  const [recentViews, sparkRaw] = cards.length
    ? await Promise.all([
        db.cardAnalytic.groupBy({
          by: ["cardSlug"],
          where: { cardSlug: { in: cards.map((c) => c.slug) }, event: "view", createdAt: { gte: since30 } },
          _count: true,
        }),
        db.cardAnalytic.findMany({
          where: { cardSlug: { in: cards.map((c) => c.slug) }, event: "view", createdAt: { gte: since7 } },
          select: { cardSlug: true, createdAt: true },
        }),
      ])
    : [[], []];

  const viewsBySlug = new Map(recentViews.map((r) => [r.cardSlug, r._count]));

  // ── KPIs: last 30 days vs the 30 days before ──
  const DAY = 24 * 60 * 60 * 1000;
  const since60 = new Date(Date.now() - 60 * DAY);
  const since14 = new Date(Date.now() - 14 * DAY);
  const slugs = cards.map((c) => c.slug);
  const cardIds = cards.map((c) => c.id);
  const ev = (event: string | string[], from: Date, to?: Date) => db.cardAnalytic.count({
    where: { cardSlug: { in: slugs }, event: Array.isArray(event) ? { in: event } : event, createdAt: { gte: from, ...(to ? { lt: to } : {}) } },
  });
  const ld = (from: Date, to?: Date) => db.lead.count({ where: { cardId: { in: cardIds }, createdAt: { gte: from, ...(to ? { lt: to } : {}) } } });
  const SAVE_EVENTS = ["vcard_download", "wallet_save"];
  // Per-day counts are aggregated in MySQL (heavy cards can have many thousands of events).
  type DayRow = { d: Date | string; n: bigint | number };
  const [vCur, vPrev, sCur, sPrev, lCur, lPrev, recentLeads, viewDays, leadDays] = cards.length
    ? await Promise.all([
        ev("view", since30), ev("view", since60, since30),
        ev(SAVE_EVENTS, since30), ev(SAVE_EVENTS, since60, since30),
        ld(since30), ld(since60, since30),
        db.lead.findMany({ where: { cardId: { in: cardIds } }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, phone: true, createdAt: true, status: true } }),
        db.$queryRaw<DayRow[]>`SELECT DATE(createdAt) AS d, COUNT(*) AS n FROM CardAnalytic WHERE cardSlug IN (${Prisma.join(slugs)}) AND event = 'view' AND createdAt >= ${since14} GROUP BY DATE(createdAt)`,
        db.$queryRaw<DayRow[]>`SELECT DATE(createdAt) AS d, COUNT(*) AS n FROM \`Lead\` WHERE cardId IN (${Prisma.join(cardIds)}) AND createdAt >= ${since14} GROUP BY DATE(createdAt)`,
      ])
    : [0, 0, 0, 0, 0, 0, [], [], []] as const;
  const kpi = (cur: number, prev: number) => ({ cur, delta: prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100) });
  const conv = (l: number, v: number) => (v ? Math.round((l / v) * 1000) / 10 : 0);
  const kpis = [
    { label: "الزيارات", icon: Eye, ...kpi(vCur, vPrev), fmt: (n: number) => n.toLocaleString("ar-u-nu-latn") },
    { label: "حفظ جهة الاتصال", icon: Download, ...kpi(sCur, sPrev), fmt: (n: number) => n.toLocaleString("ar-u-nu-latn") },
    { label: "العملاء المحتملون", icon: UserCheck, ...kpi(lCur, lPrev), fmt: (n: number) => n.toLocaleString("ar-u-nu-latn") },
    { label: "نسبة التحويل", icon: TrendingUp, cur: conv(lCur, vCur), delta: Math.round((conv(lCur, vCur) - conv(lPrev, vPrev)) * 10) / 10, fmt: (n: number) => `${n}%`, pts: true },
  ];

  // ── 14-day chart ──
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const chart = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * DAY);
    return { key: dayKey(d), day: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`, views: 0, leads: 0 };
  });
  const byKey = new Map(chart.map((c) => [c.key, c]));
  const rowKey = (d: Date | string) => (d instanceof Date ? d.toISOString() : String(d)).slice(0, 10);
  for (const r of viewDays) { const c = byKey.get(rowKey(r.d)); if (c) c.views = Number(r.n); }
  for (const r of leadDays) { const c = byKey.get(rowKey(r.d)); if (c) c.leads = Number(r.n); }

  // Build slug → [day0…day6] arrays (oldest first, today = day6)
  const sparkBySlug = new Map<string, number[]>(
    cards.map((c) => [c.slug, Array<number>(7).fill(0)])
  );
  for (const r of sparkRaw) {
    const msDiff = Date.now() - r.createdAt.getTime();
    const dayIdx = Math.floor(msDiff / (24 * 60 * 60 * 1000)); // 0 = today
    if (dayIdx >= 0 && dayIdx < 7) {
      const arr = sparkBySlug.get(r.cardSlug)!;
      arr[6 - dayIdx] += 1; // reverse so oldest is leftmost
    }
  }

  const firstName = user.name.split(" ")[0];
  const defaultCard = cards.find((c) => c.isDefault) ?? cards[0] ?? null;

  // ── Setup checklist for the default card ──
  const checklist = defaultCard ? [
    { done: !!defaultCard.avatarUrl || !!defaultCard.logoUrl, label: "أضف صورتك أو شعارك", href: `/card?card=${defaultCard.id}`, icon: ImageIcon },
    { done: !!(defaultCard.whatsapp || defaultCard.mobile), label: "أضف رقم واتساب", href: `/card?card=${defaultCard.id}`, icon: MessageCircle },
    { done: hasEnglish(defaultCard.translations), label: "أضف النسخة الإنجليزية", href: `/card?card=${defaultCard.id}`, icon: Languages },
    { done: !!defaultCard.printDesign, label: "صمّم كارتك المطبوع", href: `/card/print?card=${defaultCard.id}`, icon: Printer },
    { done: defaultCard.totalViews > 0, label: "شارك بطاقتك أول مرة", href: `/c/${defaultCard.slug}`, icon: Share2 },
  ] : [];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">أهلًا {firstName} 👋</h1>
        <p className="text-muted-foreground mt-1">
          {cards.length > 0 ? `لديك ${cards.length} ${cards.length > 1 ? "بطاقات" : "بطاقة"}.` : "أنشئ الآن أول بطاقة رقمية لك."}
        </p>
      </div>

      {/* No card CTA */}
      {cards.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">لا توجد بطاقة بعد</h2>
          <p className="text-sm text-muted-foreground mb-6">أنشئ بطاقتك الرقمية في دقائق.</p>
          <Button asChild>
            <Link href="/card">
              إنشاء بطاقة
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      )}

      {cards.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 stagger">
          {kpis.map((k) => {
            const up = k.delta > 0, down = k.delta < 0;
            return (
              <div key={k.label} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">{k.label}</span>
                  <k.icon className="h-4 w-4" />
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums">{k.fmt(k.cur)}</p>
                <p className={`mt-1 inline-flex items-center gap-1 text-xs ${up ? "text-emerald-600" : down ? "text-rose-600" : "text-muted-foreground"}`}>
                  {up ? <TrendingUp className="h-3 w-3" /> : down ? <TrendingDown className="h-3 w-3" /> : null}
                  <bdi dir="ltr">{up ? "+" : ""}{k.delta}{"pts" in k ? " pt" : "%"}</bdi>
                  <span className="text-muted-foreground">عن الشهر السابق</span>
                </p>
              </div>
            );
          })}
        </div>
      )}

      {cards.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">النشاط آخر 14 يومًا</CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: defaultCard?.primaryColor ?? "#0F766E" }} />الزيارات</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />العملاء</span>
              </div>
            </CardHeader>
            <CardContent><ActivityChart data={chart.map(({ day, views, leads }) => ({ day, views, leads }))} color={defaultCard?.primaryColor ?? "#0F766E"} /></CardContent>
          </Card>

          {doneCount < checklist.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">أكمل بطاقتك</CardTitle>
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{doneCount} من {checklist.length}</p>
              </CardHeader>
              <CardContent className="space-y-1">
                {checklist.map((c) => (
                  <Link key={c.label} href={c.href} className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent ${c.done ? "text-muted-foreground line-through" : ""}`}>
                    {c.done ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <c.icon className="h-4 w-4 shrink-0 opacity-60" />
                    {c.label}
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">آخر العملاء المحتملين</CardTitle>
                <Link href="/leads" className="text-xs text-primary hover:underline">الكل</Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentLeads.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">لا يوجد بعد</p>}
                {recentLeads.map((l) => (
                  <Link key={l.id} href="/leads" className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-accent">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{l.name}</p>
                      {l.phone && <bdi dir="ltr" className="text-xs text-muted-foreground">{l.phone}</bdi>}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{l.createdAt.toLocaleDateString("ar-u-nu-latn")}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Cards overview */}
      {cards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">بطاقاتك</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/card">
                <Plus className="h-4 w-4" />
                بطاقة جديدة
              </Link>
            </Button>
          </div>

          <div className="grid gap-3">
            {cards.map((c) => {
              const recentCount = viewsBySlug.get(c.slug) ?? 0;
              const sparkData   = sparkBySlug.get(c.slug) ?? Array<number>(7).fill(0);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:bg-accent/30 transition-colors"
                >
                  {/* Color dot */}
                  <div
                    className="h-10 w-10 rounded-lg shrink-0"
                    style={{ backgroundColor: c.primaryColor ?? "#0F172A" }}
                  />

                  {/* Name + status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{c.name ?? c.slug}</span>
                      {c.isDefault && (
                        <Badge variant="outline" className="text-xs shrink-0">الافتراضية</Badge>
                      )}
                      <Badge variant={c.isPublic ? "success" : "outline"} className="text-xs shrink-0">
                        {c.isPublic ? "عامة" : "خاصة"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">/c/{c.slug}</p>
                  </div>

                  {/* Sparkline — 7 days */}
                  <div className="hidden md:block shrink-0" title="الزيارات آخر 7 أيام">
                    <CardSparkline data={sparkData} color={c.primaryColor ?? "#0F172A"} />
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground shrink-0">
                    <div className="flex items-center gap-1.5" title="إجمالي الزيارات">
                      <Eye className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground">{c.totalViews.toLocaleString("ar-u-nu-latn")}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="الزيارات آخر 30 يومًا">
                      <MousePointer className="h-3.5 w-3.5" />
                      <span>{recentCount.toLocaleString("ar-u-nu-latn")} <span className="text-xs">/ 30d</span></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/card?card=${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title="تعديل البطاقة"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">تعديل</span>
                    </Link>
                    <Link
                      href={`/analytics?cardId=${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title="عرض الإحصائيات"
                    >
                      <BarChart2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">الإحصائيات</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions for default card */}
      {defaultCard && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">مشاركة البطاقة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Prefer custom domain, then app URL derived from request headers */}
              {(({ cardUrl }: { cardUrl: string }) => (
                <>
                  <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm font-mono text-muted-foreground overflow-hidden">
                    <span className="truncate">{cardUrl}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={cardUrl} target="_blank">فتح</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/api/vcard/${defaultCard.slug}`}>vCard</Link>
                    </Button>
                  </div>
                </>
              ))({
                cardUrl: defaultCard.cardDomain
                  ? `https://${defaultCard.cardDomain}/c/${defaultCard.slug}`
                  : `${appUrl}/c/${defaultCard.slug}`,
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">الزيارات المباشرة</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <LiveViews initialViews={defaultCard.totalViews} cardSlug={defaultCard.slug} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
