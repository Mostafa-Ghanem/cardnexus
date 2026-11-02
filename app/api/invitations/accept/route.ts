import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const { token } = await request.json();

  const invitation = await db.invitation.findUnique({
    where: { token },
    include: { organization: { select: { id: true } } },
  });

  if (!invitation || invitation.expiresAt < new Date() || invitation.acceptedAt) {
    return NextResponse.json({ error: "الدعوة غير صالحة أو منتهية" }, { status: 410 });
  }

  // SECURITY: an invitation token is bound to a specific email address.
  // Without this check, anybody who obtains the token could attach themselves
  // to the org with the granted role.
  if (
    invitation.email.toLowerCase().trim() !==
    (session.user.email ?? "").toLowerCase().trim()
  ) {
    return NextResponse.json(
      { error: "هذه الدعوة موجهة لبريد إلكتروني آخر." },
      { status: 403 }
    );
  }

  await db.$transaction([
    db.user.update({
      where: { id: session.user.id },
      data: {
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    }),
    db.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
