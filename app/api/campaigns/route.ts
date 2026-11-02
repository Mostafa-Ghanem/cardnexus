import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { nanoid } from "nanoid";
import { canUseFeature } from "@/lib/plans";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const user = session.user as { id: string; plan?: string };
  if (!canUseFeature("campaigns", user.plan ?? "free")) {
    return NextResponse.json({ campaigns: [], locked: true });
  }

  const card = await db.card.findFirst({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }], select: { id: true } });
  if (!card) return NextResponse.json({ campaigns: [] });

  const campaigns = await db.campaign.findMany({
    where: { cardId: card.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const user = session.user as { id: string; plan?: string };
  if (!canUseFeature("campaigns", user.plan ?? "free")) {
    return NextResponse.json({ error: "تحتاج ترقية الباقة" }, { status: 403 });
  }

  const card = await db.card.findFirst({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }], select: { id: true, slug: true, firstName: true, lastName: true } });
  if (!card) return NextResponse.json({ error: "لا توجد بطاقة" }, { status: 400 });

  const body = createSchema.parse(await req.json());

  // Generate friendly slug: firstname-lastname-randomid
  const namePart = [card.firstName, card.lastName]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || "link";

  const campaign = await db.campaign.create({
    data: {
      cardId: card.id,
      name: body.name,
      urlSlug: `${namePart}-${nanoid(6)}`,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });

  return NextResponse.json({ campaign });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const { id } = await req.json() as { id: string };
  const user = session.user as { id: string };

  const card = await db.card.findFirst({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }], select: { id: true } });
  if (!card) return NextResponse.json({ error: "لا توجد بطاقة" }, { status: 400 });

  const campaign = await db.campaign.findUnique({ where: { id }, select: { cardId: true } });
  if (!campaign || campaign.cardId !== card.id) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  await db.campaign.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
