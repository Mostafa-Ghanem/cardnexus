import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userIdFromApiKey } from "@/lib/api-key-auth";
import { isLeadStatus } from "@/lib/lead-status";

/**
 * Read-only leads API for CRMs / automation tools.
 *
 *   GET /api/v1/leads?since=2026-01-01T00:00:00Z&status=new&limit=100
 *   Authorization: Bearer fk_…
 *
 * Returns the newest leads first from all cards owned by the key's user.
 */
export async function GET(req: NextRequest) {
  const authResult = await userIdFromApiKey(req.headers.get("authorization"));
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(parseInt(sp.get("limit") ?? "100", 10) || 100, 1), 500);
  const sinceRaw = sp.get("since");
  const since = sinceRaw ? new Date(sinceRaw) : null;
  if (since && isNaN(since.getTime())) return NextResponse.json({ error: "قيمة since غير صالحة" }, { status: 400 });
  const status = sp.get("status");
  if (status && !isLeadStatus(status)) return NextResponse.json({ error: "قيمة status غير صالحة" }, { status: 400 });

  const cards = await db.card.findMany({ where: { userId: authResult.userId }, select: { id: true, slug: true, name: true } });
  const cardById = new Map(cards.map((c) => [c.id, c]));

  const leads = await db.lead.findMany({
    where: {
      cardId: { in: cards.map((c) => c.id) },
      ...(since ? { createdAt: { gt: since } } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    data: leads.map((l) => ({
      id: l.id, name: l.name, phone: l.phone, email: l.email, message: l.message,
      status: l.status, note: l.note, createdAt: l.createdAt.toISOString(),
      card: { slug: cardById.get(l.cardId)?.slug, name: cardById.get(l.cardId)?.name },
    })),
  });
}
