import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDeviceType } from "@/lib/utils";
import { canUseFeature } from "@/lib/plans";
import { clientIp } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";
import { parseBrowser, parseOs, parseLanguage, parseReferrerDomain } from "@/lib/ua-parser";
import { z } from "zod";

function isBot(ua: string): boolean {
  return /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|twitterbot|whatsapp|linkedinbot|embedly|quora|pinterest|lighthouse|headlesschrome|prerender|wget|curl/i.test(ua);
}

const MILESTONES = [100, 500, 1000, 5000, 10000];

const trackSchema = z.object({
  cardSlug: z.string().min(1).max(120),
  event: z.enum(["view", "vcard_download", "qr_scan", "link_click", "wallet_save"]),
  linkLabel: z.string().max(200).optional(),
  source: z.enum(["nfc", "qr", "direct", "share", "campaign"]).optional(),
  utmSource:   z.string().max(80).optional(),
  utmMedium:   z.string().max(80).optional(),
  utmCampaign: z.string().max(120).optional(),
  referrer:    z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const ip = clientIp(request);

  // Anti-spam: 60 events / 60s per anonymized IP. Stops accidental loops &
  // simple flooding without affecting normal users.
  if (!rateLimit({ key: `track:${ip || "anon"}`, max: 60, windowMs: 60_000 })) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const { cardSlug, event, linkLabel, source, utmSource, utmMedium, utmCampaign, referrer } = parsed.data;

  // Make sure the cardSlug actually exists (and is public) before logging,
  // so attackers can't bloat the analytics table with garbage.
  const card = await db.card.findUnique({
    where: { slug: cardSlug },
    select: { id: true, isPublic: true },
  });
  if (!card || !card.isPublic) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBot(userAgent)) return NextResponse.json({ ok: true });
  let geo: { country?: string; city?: string } | null = null;
  if (ip) {
    try {
      const geoip = await import("geoip-lite");
      geo = geoip.default.lookup(ip);
    } catch { /* geoip unavailable — skip */ }
  }

  await db.cardAnalytic.create({
    data: {
      cardSlug,
      event,
      linkLabel,
      source,
      utmSource,
      utmMedium,
      utmCampaign,
      ip,
      country:  geo?.country ?? null,
      city:     geo?.city ?? null,
      device:   getDeviceType(userAgent),
      browser:  parseBrowser(userAgent),
      os:       parseOs(userAgent),
      referrer: parseReferrerDomain(referrer),
      language: parseLanguage(request.headers.get("accept-language")),
    },
  });

  if (event === "view") {
    const updated = await db.card.updateMany({
      where: { slug: cardSlug },
      data: { totalViews: { increment: 1 } },
    });
    if (updated.count > 0) {
      checkMilestone(cardSlug).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}

async function checkMilestone(cardSlug: string) {
  const card = await db.card.findUnique({
    where: { slug: cardSlug },
    select: { totalViews: true, userId: true },
  });
  if (!card) return;

  const milestone = MILESTONES.find((m) => card.totalViews === m);
  if (!milestone) return;

  const user = await db.user.findUnique({
    where: { id: card.userId },
    select: { email: true, name: true, plan: true, planExpiresAt: true },
  });
  if (!user) return;
  if (!canUseFeature("milestoneNotifications", user.plan ?? "free", user.planExpiresAt)) return;

  await db.notification.upsert({
    where: { userId_type_value: { userId: card.userId, type: "milestone", value: String(milestone) } },
    update: {},
    create: {
      userId: card.userId,
      type: "milestone",
      value: String(milestone),
      message: `بطاقتك وصلت إلى ${milestone.toLocaleString("en-US")} زيارة!`,
    },
  }).catch(() => {});
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const url = new URL(request.url);
  const cardId = url.searchParams.get("cardId");
  const days = Math.max(1, Math.min(365, parseInt(url.searchParams.get("days") ?? "30")));

  // Allow scoping to a specific card the caller owns — falls back to the
  // user's default card.
  const card = cardId
    ? await db.card.findFirst({ where: { id: cardId, userId: session.user.id } })
    : await db.card.findFirst({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }] });

  if (!card) return NextResponse.json({ data: null });

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const where = { cardSlug: card.slug };
  const whereRecent = { cardSlug: card.slug, createdAt: { gte: since } };

  const [
    all, recent, sourceData, deviceData, utmRaw, namedCampaigns, topLinksRaw,
    countryData, cityData, browserData, osData, referrerData, languageData,
  ] = await Promise.all([
    db.cardAnalytic.groupBy({ by: ["event"], where, _count: true }),
    db.cardAnalytic.findMany({
      where: { ...whereRecent, event: "view" },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.cardAnalytic.groupBy({ by: ["source"], where, _count: true }),
    db.cardAnalytic.groupBy({ by: ["device"], where, _count: true }),
    db.cardAnalytic.groupBy({
      by: ["utmCampaign", "utmSource", "utmMedium"],
      where: {
        ...whereRecent,
        event: "view",
        OR: [
          { utmCampaign: { not: null } },
          { utmSource:   { not: null } },
          { utmMedium:   { not: null } },
        ],
      },
      _count: true,
    }),
    db.campaign.findMany({
      where: { cardId: card.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, urlSlug: true, views: true, expiresAt: true, createdAt: true },
    }),
    db.cardAnalytic.groupBy({
      by: ["linkLabel"],
      where: { ...where, event: "link_click", linkLabel: { not: null } },
      _count: true,
      orderBy: { _count: { linkLabel: "desc" } },
      take: 10,
    }),
    // Geo
    db.cardAnalytic.groupBy({
      by: ["country"],
      where: { ...where, country: { not: null } },
      _count: true,
      orderBy: { _count: { country: "desc" } },
      take: 15,
    }),
    db.cardAnalytic.groupBy({
      by: ["city"],
      where: { ...where, city: { not: null } },
      _count: true,
      orderBy: { _count: { city: "desc" } },
      take: 10,
    }),
    // Browser & OS
    db.cardAnalytic.groupBy({
      by: ["browser"],
      where: { ...where, browser: { not: null } },
      _count: true,
      orderBy: { _count: { browser: "desc" } },
    }),
    db.cardAnalytic.groupBy({
      by: ["os"],
      where: { ...where, os: { not: null } },
      _count: true,
      orderBy: { _count: { os: "desc" } },
    }),
    // Referrers
    db.cardAnalytic.groupBy({
      by: ["referrer"],
      where: { ...where, referrer: { not: null } },
      _count: true,
      orderBy: { _count: { referrer: "desc" } },
      take: 10,
    }),
    // Languages
    db.cardAnalytic.groupBy({
      by: ["language"],
      where: { ...where, language: { not: null } },
      _count: true,
      orderBy: { _count: { language: "desc" } },
      take: 10,
    }),
  ]);

  const countByEvent = (event: string) =>
    all.find((r) => r.event === event)?._count ?? 0;

  const viewMap = new Map<string, number>();
  recent.forEach((r) => {
    const key = r.createdAt.toISOString().split("T")[0];
    viewMap.set(key, (viewMap.get(key) ?? 0) + 1);
  });

  const viewsLast30Days = Array.from({ length: days }, (_, i) => {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    return { date: key, count: viewMap.get(key) ?? 0 };
  });

  const utmCampaigns = utmRaw
    .map((r) => ({
      campaign: r.utmCampaign ?? "(بدون utm_campaign)",
      source:   r.utmSource   ?? null,
      medium:   r.utmMedium   ?? null,
      count:    r._count,
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    data: {
      cardId: card.id,
      cardSlug: card.slug,
      cardName: card.name,
      totalViews: card.totalViews,
      vcardDownloads: countByEvent("vcard_download"),
      qrScans: countByEvent("qr_scan"),
      linkClicks: countByEvent("link_click"),
      walletSaves: countByEvent("wallet_save"),
      viewsLast30Days,
      topSources: sourceData.map((s) => ({ source: s.source ?? "direct", count: s._count })),
      topLinks: topLinksRaw.map((l) => ({ label: l.linkLabel!, count: l._count })),
      deviceSplit: deviceData.map((d) => ({ device: d.device ?? "unknown", count: d._count })),
      topCountries: countryData.map((r) => ({ country: r.country!, count: r._count })),
      topCities: cityData.map((r) => ({ city: r.city!, count: r._count })),
      browserSplit: browserData.map((r) => ({ browser: r.browser!, count: r._count })),
      osSplit: osData.map((r) => ({ os: r.os!, count: r._count })),
      topReferrers: referrerData.map((r) => ({ referrer: r.referrer!, count: r._count })),
      topLanguages: languageData.map((r) => ({ language: r.language!, count: r._count })),
      utmCampaigns,
      namedCampaigns: namedCampaigns.map((c) => ({
        ...c,
        expiresAt: c.expiresAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
    },
  // Cache in the browser for 60 s; allow stale for 5 min while revalidating.
  // Keeps the dashboard snappy without hammering the DB on every tab switch.
  }, { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } });
}
