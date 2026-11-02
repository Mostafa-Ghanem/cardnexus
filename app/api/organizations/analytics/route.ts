import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageOrganization } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  const orgId = (session.user as { organizationId?: string }).organizationId;

  if (!canManageOrganization(role) || !orgId) {
    return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
  }

  const orgUsers = await db.user.findMany({
    where: { organizationId: orgId },
    select: { id: true },
  });
  const userIds = orgUsers.map((u) => u.id);

  const cards = await db.card.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, slug: true, name: true, totalViews: true },
  });
  const cardSlugs = cards.map((c) => c.slug);

  const url = new URL(request.url);
  const days = 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [eventTotals, recentViews] = await Promise.all([
    db.cardAnalytic.groupBy({
      by: ["event"],
      where: { cardSlug: { in: cardSlugs } },
      _count: true,
    }),
    db.cardAnalytic.findMany({
      where: { cardSlug: { in: cardSlugs }, event: "view", createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const countByEvent = (event: string) =>
    eventTotals.find((r) => r.event === event)?._count ?? 0;

  const totalViews = cards.reduce((sum, c) => sum + c.totalViews, 0);

  const topCards = [...cards]
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 5)
    .map((c) => ({ slug: c.slug, name: c.name, views: c.totalViews }));

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

  return NextResponse.json({
    data: {
      totalViews,
      vcardDownloads: countByEvent("vcard_download"),
      qrScans: countByEvent("qr_scan"),
      topCards,
      viewsLast30Days,
    },
  });
}
