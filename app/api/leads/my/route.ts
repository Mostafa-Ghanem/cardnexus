import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function ownCardIds(userId: string): Promise<string[]> {
  const cards = await db.card.findMany({ where: { userId }, select: { id: true } });
  return cards.map((c) => c.id);
}

/** Leads from every card the signed-in user owns. */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const cardIds = await ownCardIds(session.user.id);
  if (cardIds.length === 0) return NextResponse.json({ leads: [] });

  const leads = await db.lead.findMany({
    where: { cardId: { in: cardIds } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ leads });
}

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const { id } = await req.json() as { id: string };
  if (typeof id !== "string" || !id) return NextResponse.json({ error: "البيانات غير صحيحة" }, { status: 400 });

  // Verify the lead belongs to one of this user's cards before deleting
  const cardIds = await ownCardIds(session.user.id);
  const lead = await db.lead.findUnique({ where: { id }, select: { cardId: true } });
  if (!lead || !cardIds.includes(lead.cardId)) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  await db.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
