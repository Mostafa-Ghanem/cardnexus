import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["approved", "rejected"]),
  note:   z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const me = session.user as { id: string; role?: string; organizationId?: string };
  const isApprover = me.role === "super_admin" || me.role === "company_admin" || me.role === "team_leader";
  if (!isApprover) return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "البيانات غير صحيحة" }, { status: 400 });

  const { slug } = await params;
  const card = await db.card.findUnique({
    where: { slug },
    select: { id: true, userId: true, user: { select: { organizationId: true } } },
  });

  if (!card) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  // team_leader / company_admin may only approve cards in their own org
  if (me.role !== "super_admin") {
    if (!me.organizationId || card.user.organizationId !== me.organizationId) {
      return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
    }
  }

  const updated = await db.card.update({
    where: { id: card.id },
    data: { approvalStatus: body.data.status, approvalNote: body.data.note ?? null },
    select: { id: true, slug: true, approvalStatus: true, approvalNote: true },
  });

  return NextResponse.json(updated);
}
