import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageUsers } from "@/lib/utils";

// PATCH /api/organizations/directory/member — toggle showInTeamDirectory for a member's card
export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const admin = session.user as { id: string; role?: string; organizationId?: string };
  if (!canManageUsers(admin.role ?? "member")) {
    return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
  }

  const { cardSlug, showInTeamDirectory } = await req.json() as {
    cardSlug: string;
    showInTeamDirectory: boolean;
  };

  // Verify the card belongs to a member of the admin's org
  const card = await db.card.findUnique({
    where: { slug: cardSlug },
    include: { user: { select: { organizationId: true } } },
  });

  if (!card) return NextResponse.json({ error: "البطاقة غير موجودة" }, { status: 404 });

  // Only allow if card owner is in same org (or super_admin)
  if (
    admin.role !== "super_admin" &&
    card.user.organizationId !== admin.organizationId
  ) {
    return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
  }

  await db.card.update({
    where: { slug: cardSlug },
    data: { showInTeamDirectory },
  });

  return NextResponse.json({ success: true, showInTeamDirectory });
}
