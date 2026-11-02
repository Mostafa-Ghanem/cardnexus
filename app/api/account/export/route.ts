import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/account/export
 * Returns ALL personal data the platform holds about the current user
 * as a single JSON download. DSGVO Art. 15 (right of access) and
 * Art. 20 (right to data portability).
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const userId = session.user.id;

  const [user, cards, leads, analytics, webhooks, apiKeys, notifications, sentInvitations] =
    await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true, name: true, email: true, emailVerified: true, image: true,
          role: true, plan: true, planExpiresAt: true,
          referralCode: true, referredById: true,
          twoFactorEnabled: true,
          createdAt: true, updatedAt: true,
          // intentionally NOT exporting secret/password fields
        },
      }),
      db.card.findMany({ where: { userId } }),
      db.lead.findMany({ where: { card: { userId } } }),
      db.cardAnalytic.findMany({ where: { userId } }),
      db.webhook.findMany({
        where: { userId },
        select: { id: true, name: true, url: true, events: true, active: true, createdAt: true },
      }),
      db.apiKey.findMany({
        where: { userId },
        select: { id: true, name: true, prefix: true, lastUsedAt: true, createdAt: true },
      }),
      db.notification.findMany({ where: { userId } }),
      db.invitation.findMany({ where: { senderId: userId } }),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    user,
    cards,
    leads,
    analytics,
    webhooks,
    apiKeys,
    notifications,
    sentInvitations,
  };

  const filename = `cardnexus-export-${userId}-${Date.now()}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
