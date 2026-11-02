import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const card = await db.card.findUnique({
    where: { slug },
    include: {
      // SECURITY: do NOT expose the owner's email or other PII via the public
      // card API. Only the display name is needed for rendering.
      user: { select: { name: true } },
    },
  });

  if (!card || !card.isPublic) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  // Hide expiry-elapsed and password-protected cards from the public endpoint.
  if (card.expiresAt && card.expiresAt < new Date()) {
    return NextResponse.json({ error: "انتهت صلاحية البطاقة" }, { status: 410 });
  }
  if (card.passwordHash) {
    return NextResponse.json({ error: "البطاقة محمية بكلمة مرور" }, { status: 401 });
  }

  // Strip server-only fields before returning.
  const { passwordHash: _ph, ...safe } = card;
  return NextResponse.json({
    data: { ...safe, customLinks: JSON.parse(card.customLinks) },
  });
}
