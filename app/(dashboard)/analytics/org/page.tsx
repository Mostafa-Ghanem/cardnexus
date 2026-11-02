import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { canManageOrganization } from "@/lib/utils";
import { OrgAnalyticsClient } from "./client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "إحصائيات الفريق" };

export default async function OrgAnalyticsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string; role?: string; organizationId?: string };
  const role = user.role ?? "member";
  const orgId = user.organizationId;

  if (!canManageOrganization(role) || !orgId) redirect("/analytics");

  const days = 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [orgUsers, org] = await Promise.all([
    db.user.findMany({ where: { organizationId: orgId }, select: { id: true } }),
    db.organization.findUnique({ where: { id: orgId }, select: { name: true } }),
  ]);

  const userIds = orgUsers.map((u) => u.id);
  const cards = await db.card.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, slug: true, name: true, totalViews: true },
  });
  const cardSlugs = cards.map((c) => c.slug);

  const [eventTotals, recentViews, topLeads] = await Promise.all([
    db.cardAnalytic.groupBy({
      by: ["event"],
      where: { cardSlug: { in: cardSlugs } },
      _count: true,
    }),
    db.cardAnalytic.findMany({
      where: { cardSlug: { in: cardSlugs }, event: "view", createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    db.lead.groupBy({
      by: ["cardId"],
      where: { cardId: { in: cards.map((c) => c.id) } },
      _count: true,
      orderBy: { _count: { cardId: "desc" } },
      take: 5,
    }),
  ]);

  const countByEvent = (event: string) =>
    eventTotals.find((r) => r.event === event)?._count ?? 0;

  const totalViews = cards.reduce((sum, c) => sum + c.totalViews, 0);

  const topCards = [...cards]
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 10)
    .map((c) => ({ slug: c.slug, name: c.name ?? c.slug, views: c.totalViews }));

  const viewMap = new Map<string, number>();
  recentViews.forEach((r) => {
    const key = r.createdAt.toISOString().split("T")[0];
    viewMap.set(key, (viewMap.get(key) ?? 0) + 1);
  });

  const viewsLast30Days = Array.from({ length: days }, (_, i) => {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    return { date: key, count: viewMap.get(key) ?? 0 };
  });

  const leadsPerCard = new Map(topLeads.map((l) => [l.cardId, l._count]));
  const topCardsByLeads = cards
    .filter((c) => leadsPerCard.has(c.id))
    .map((c) => ({ slug: c.slug, name: c.name ?? c.slug, leads: leadsPerCard.get(c.id) ?? 0 }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5);

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/analytics" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">إحصائيات الفريق</h1>
          <p className="text-muted-foreground mt-1">
            {org?.name} · {cards.length} بطاقة · آخر 30 يومًا
          </p>
        </div>
      </div>

      <OrgAnalyticsClient
        totalViews={totalViews}
        vcardDownloads={countByEvent("vcard_download")}
        qrScans={countByEvent("qr_scan")}
        linkClicks={countByEvent("link_click")}
        totalLeads={topLeads.reduce((s, l) => s + l._count, 0)}
        topCards={topCards}
        topCardsByLeads={topCardsByLeads}
        viewsLast30Days={viewsLast30Days}
        memberCount={userIds.length}
      />
    </div>
  );
}
