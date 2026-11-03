import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { LEAD_STATUSES } from "@/lib/lead-status";

async function ownCardIds(userId: string) {
  const cards = await db.card.findMany({ where: { userId }, select: { id: true } });
  return cards.map(card => card.id);
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cardIds = await ownCardIds(session.user.id);
  if (!cardIds.length) return NextResponse.json({ leads: [] });
  const sinceRaw = new URL(req.url).searchParams.get("since");
  const since = sinceRaw ? new Date(sinceRaw) : null;
  const hasSince = Boolean(since && Number.isFinite(since.getTime()));
  const leads = await db.lead.findMany({
    where: { cardId: { in: cardIds }, ...(hasSince ? { createdAt: { gt: since! } } : {}) },
    orderBy: { createdAt: "desc" },
    take: hasSince ? 10 : 500,
    ...(hasSince ? { select: { id: true, name: true, createdAt: true } } : {}),
  });
  return NextResponse.json({ leads });
}

const idSchema = z.object({ id: z.string().min(1).max(64) });
async function ownedLead(userId: string, id: string) {
  const lead = await db.lead.findUnique({
    where: { id },
    select: { cardId: true, card: { select: { userId: true } } },
  });
  return lead && lead.card.userId === userId ? lead : null;
}

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = idSchema.safeParse(await req.json().catch(() => null));
  if (!payload.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { id } = payload.data;
  if (!(await ownedLead(session.user.id, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

const patchSchema = idSchema.extend({
  status: z.enum(LEAD_STATUSES).optional(),
  note: z.string().max(2000).nullable().optional(),
}).refine(v => v.status !== undefined || v.note !== undefined, { message: "No changes provided" });

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { id, status, note } = parsed.data;
  if (!(await ownedLead(session.user.id, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await db.lead.update({
    where: { id },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(note !== undefined ? { note: note?.trim() || null } : {}),
    },
    select: { id: true, status: true, note: true },
  });
  return NextResponse.json({ data: updated });
}
