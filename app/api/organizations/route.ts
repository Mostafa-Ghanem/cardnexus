import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSuperAdmin, canManageOrganization, slugify } from "@/lib/utils";
import { canUseFeature, effectivePlan } from "@/lib/plans";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  domain: z.string().optional().nullable(),
});

const updateSchema = createSchema.partial().extend({
  id: z.string().optional(),
  logo: z.string().url().optional().nullable(),
  settings: z.object({
    defaultTemplate: z.enum(["classic", "modern", "minimal", "dark"]).optional(),
    defaultFontFamily: z.enum(["inter", "serif", "mono", "display"]).optional(),
    defaultLayoutStyle: z.enum(["standard", "centered", "compact"]).optional(),
    defaultAccentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
    allowMemberTemplateChange: z.boolean().optional(),
    allowMemberColorChange: z.boolean().optional(),
    allowMemberFontChange: z.boolean().optional(),
    allowMemberLayoutChange: z.boolean().optional(),
    brandColors: z.string().optional().nullable(),
    departmentPolicies: z.string().optional().nullable(),
    walletEnabled: z.boolean().optional(),
    analyticsEnabled: z.boolean().optional(),
    cardFooterText: z.string().optional().nullable(),
  }).optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  const orgId = (session.user as { organizationId?: string }).organizationId;

  if (isSuperAdmin(role)) {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = parseInt(url.searchParams.get("limit") ?? "20");

    const [orgs, total] = await Promise.all([
      db.organization.findMany({
        include: { settings: true, _count: { select: { users: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.organization.count(),
    ]);

    return NextResponse.json({ data: orgs, total });
  }

  if (!orgId) return NextResponse.json({ data: null });

  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: { settings: true, _count: { select: { users: true } } },
  });

  return NextResponse.json({ data: org });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const userId  = session.user.id;
  const role    = (session.user as { role?: string }).role ?? "member";
  const userOrgId = (session.user as { organizationId?: string }).organizationId;
  const superAdmin = isSuperAdmin(role);

  if (!superAdmin) {
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true },
    });
    const plan = effectivePlan(dbUser?.plan ?? "free", dbUser?.planExpiresAt);
    if (!canUseFeature("teamDirectory", plan)) {
      return NextResponse.json({ error: "تتطلب باقة Business" }, { status: 403 });
    }
    if (userOrgId) {
      return NextResponse.json({ error: "أنت عضو بالفعل في مؤسسة" }, { status: 400 });
    }
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slug = parsed.data.slug ?? slugify(parsed.data.name);

  const existing = await db.organization.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: "هذا الرابط المختصر مستخدم بالفعل" }, { status: 409 });
  }

  const org = await db.organization.create({
    data: {
      name: parsed.data.name,
      slug,
      primaryColor: parsed.data.primaryColor ?? "#0F172A",
      domain: parsed.data.domain,
      settings: { create: {} },
    },
    include: { settings: true },
  });

  // Assign the creating user as company_admin of the new org
  if (!superAdmin) {
    await db.user.update({
      where: { id: userId },
      data: { organizationId: org.id, role: "company_admin" },
    });
  }

  return NextResponse.json({ data: org }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  const sessionOrgId = (session.user as { organizationId?: string }).organizationId;
  const superAdmin = isSuperAdmin(role);

  if (!superAdmin && !canManageOrganization(role)) {
    return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // super_admin can target any org by passing `id`; others can only edit their own org
  const targetOrgId = superAdmin ? (parsed.data.id ?? sessionOrgId) : sessionOrgId;
  if (!targetOrgId) {
    return NextResponse.json({ error: "المؤسسة غير موجودة" }, { status: 404 });
  }

  const { settings, id: _id, ...orgData } = parsed.data;

  const org = await db.organization.update({
    where: { id: targetOrgId },
    data: {
      ...orgData,
      ...(settings ? { settings: { upsert: { create: settings, update: settings } } } : {}),
    },
    include: { settings: true },
  });

  return NextResponse.json({ data: org });
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const role = (session.user as { role?: string }).role ?? "member";
  if (!isSuperAdmin(role)) return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "المعرّف مطلوب" }, { status: 400 });

  // Unassign all members before deleting (don't delete the users themselves)
  await db.user.updateMany({
    where: { organizationId: id },
    data: { organizationId: null, role: "member" },
  });
  await db.organization.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
