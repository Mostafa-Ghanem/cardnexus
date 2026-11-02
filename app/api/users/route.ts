import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageOrganization, isSuperAdmin } from "@/lib/utils";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const updateSchema = z.object({
  userId: z.string(),
  role: z.enum(["super_admin", "company_admin", "team_leader", "member"]).optional(),
  organizationId: z.string().nullable().optional(),
  name: z.string().optional(),
  plan: z.enum(["free", "pro", "business"]).optional(),
  planExpiresAt: z.string().datetime().nullable().optional(),
  bannedAt: z.string().datetime().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  const orgId = (session.user as { organizationId?: string }).organizationId;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);
  const search = url.searchParams.get("search") ?? "";

  // SECURITY: only super admins see everyone; org managers see their own org.
  // Never let an empty organizationId turn into "no filter" (that leaked all users).
  if (!isSuperAdmin(role) && (!canManageOrganization(role) || !orgId)) {
    return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
  }

  const orgFilter = url.searchParams.get("organizationId");
  const where = isSuperAdmin(role)
    ? orgFilter
      ? { organizationId: orgFilter }
      : search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] } : {}
    : { organizationId: orgId as string };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      // Explicit allow-list: never return billing IDs or other internal fields.
      select: {
        id: true, name: true, email: true, image: true, role: true, plan: true,
        planExpiresAt: true, bannedAt: true, organizationId: true, createdAt: true,
        cards: { orderBy: [{ isDefault: "desc" }], take: 1, select: { slug: true, isPublic: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({ data: users, total, page, limit });
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  if (!canManageOrganization(role)) {
    return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { userId, ...data } = parsed.data;

  // Only super_admins can change plans, assign super_admin role, or ban users
  if (!isSuperAdmin(role)) {
    if (data.role === "super_admin") return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
    if (data.plan !== undefined) return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
    if (data.bannedAt !== undefined) return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
    // company_admin must not be able to grant company_admin to others (only super_admin can).
    if (data.role === "company_admin") return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
    // company_admin cannot move users between orgs.
    if (data.organizationId !== undefined) {
      return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
    }
  }

  // SECURITY: company_admin must only be able to mutate users from THEIR org.
  // Without this check, anybody with company_admin role could update arbitrary users.
  if (!isSuperAdmin(role)) {
    const orgId = (session.user as { organizationId?: string }).organizationId;
    const target = await db.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });
    if (!target) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    if (target.organizationId !== orgId) {
      return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
    }
    // Cannot demote/modify a super_admin.
    if (target.role === "super_admin") {
      return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
    }
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      ...data,
      planExpiresAt: data.planExpiresAt ? new Date(data.planExpiresAt) : data.planExpiresAt,
      bannedAt: data.bannedAt ? new Date(data.bannedAt) : data.bannedAt,
    },
    select: {
      id: true, name: true, email: true, role: true, plan: true,
      planExpiresAt: true, bannedAt: true, organizationId: true,
    },
  });

  // Immediately kill all active sessions when banning a user
  if (data.bannedAt) {
    await db.session.deleteMany({ where: { userId } });
    auditLog("user.ban", session.user.id, { targetId: userId });
  }
  if (data.bannedAt === null) {
    auditLog("user.unban", session.user.id, { targetId: userId });
  }
  if (data.role) {
    auditLog("user.role_change", session.user.id, { targetId: userId, newRole: data.role });
  }
  if (data.plan) {
    auditLog("user.plan_change", session.user.id, { targetId: userId, newPlan: data.plan });
  }
  if (data.organizationId !== undefined) {
    auditLog("user.org_change", session.user.id, { targetId: userId, newOrgId: data.organizationId });
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  if (!canManageOrganization(role)) {
    return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
  }

  const { userId } = await request.json();
  if (userId === session.user.id) {
    return NextResponse.json({ error: "لا يمكنك حذف حسابك من هنا" }, { status: 400 });
  }

  // SECURITY: company_admin only allowed to delete users from THEIR org.
  if (!isSuperAdmin(role)) {
    const orgId = (session.user as { organizationId?: string }).organizationId;
    const target = await db.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });
    if (!target) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    if (target.organizationId !== orgId) {
      return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
    }
    if (target.role === "super_admin") {
      return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
    }
  }

  // Fetch name/email before delete for the audit record
  const target = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  try {
    await db.user.delete({ where: { id: userId } });
  } catch (e) {
    console.error("[DELETE /api/users] db.user.delete failed:", e);
    return NextResponse.json({ error: "تعذّر حذف المستخدم" }, { status: 500 });
  }

  auditLog("user.delete", session.user.id, {
    targetId: userId,
    targetEmail: target?.email,
    targetName: target?.name,
  });

  return NextResponse.json({ ok: true });
}
