import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageUsers } from "@/lib/utils";

// PATCH /api/organizations/directory — toggle teamDirectoryEnabled for current user's org
export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const user = session.user as { id: string; role?: string; organizationId?: string };
  if (!canManageUsers(user.role ?? "member")) {
    return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
  }
  if (!user.organizationId) {
    return NextResponse.json({ error: "لا توجد مؤسسة" }, { status: 400 });
  }

  const { enabled } = await req.json() as { enabled: boolean };

  await db.organizationSettings.upsert({
    where:  { organizationId: user.organizationId },
    create: { organizationId: user.organizationId, teamDirectoryEnabled: enabled },
    update: { teamDirectoryEnabled: enabled },
  });

  return NextResponse.json({ success: true, teamDirectoryEnabled: enabled });
}
