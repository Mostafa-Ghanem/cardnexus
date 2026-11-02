import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageOrganization } from "@/lib/utils";
import { LEAD_STATUS_LABELS, isLeadStatus } from "@/lib/lead-status";
import { buildCsv } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  const orgId = (session.user as { organizationId?: string }).organizationId;

  if (!canManageOrganization(role) || !orgId) {
    return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50")));

  const orgUsers = await db.user.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true },
  });
  const userIds = orgUsers.map((u) => u.id);
  const userNameMap = new Map(orgUsers.map((u) => [u.id, u.name]));

  const cards = await db.card.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, name: true, slug: true, userId: true },
  });
  const cardIds = cards.map((c) => c.id);
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  if (format === "csv") {
    const leads = await db.lead.findMany({
      where: { cardId: { in: cardIds } },
      orderBy: { createdAt: "desc" },
    });

    const csv = buildCsv(
      ["التاريخ", "الاسم", "البريد الإلكتروني", "الهاتف", "الرسالة", "البطاقة", "عضو", "الحالة"],
      leads.map((l) => {
        const card = cardMap.get(l.cardId);
        const memberName = card ? (userNameMap.get(card.userId) ?? "") : "";
        return [
          l.createdAt.toLocaleDateString("ar-u-nu-latn"),
          l.name, l.email, l.phone, l.message,
          card?.name ?? "", memberName,
          LEAD_STATUS_LABELS[isLeadStatus(l.status) ? l.status : "new"],
        ];
      })
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="org-leads.csv"',
      },
    });
  }

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where: { cardId: { in: cardIds } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.lead.count({ where: { cardId: { in: cardIds } } }),
  ]);

  const data = leads.map((l) => {
    const card = cardMap.get(l.cardId);
    return {
      ...l,
      card: card ? { id: card.id, name: card.name, slug: card.slug } : null,
      member: card ? { id: card.userId, name: userNameMap.get(card.userId) } : null,
    };
  });

  return NextResponse.json({ data, total, page, limit });
}
