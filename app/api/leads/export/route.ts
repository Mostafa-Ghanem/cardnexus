import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LEAD_STATUS_LABELS, isLeadStatus } from "@/lib/lead-status";
import { buildCsv } from "@/lib/csv";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const cards = await db.card.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });

  const cardIds = cards.map((c) => c.id);
  const cardNameMap = new Map(cards.map((c) => [c.id, c.name]));

  const leads = await db.lead.findMany({
    where: { cardId: { in: cardIds } },
    orderBy: { createdAt: "desc" },
  });

  const csv = buildCsv(
    ["التاريخ", "الاسم", "البريد الإلكتروني", "الهاتف", "الرسالة", "البطاقة", "الحالة", "ملاحظة"],
    leads.map((l) => [
      l.createdAt.toLocaleDateString("ar-u-nu-latn"),
      l.name,
      l.email,
      l.phone,
      l.message,
      cardNameMap.get(l.cardId) ?? "",
      LEAD_STATUS_LABELS[isLeadStatus(l.status) ? l.status : "new"],
      l.note,
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="leads.csv"',
    },
  });
}
