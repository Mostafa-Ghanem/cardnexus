import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageUsers } from "@/lib/utils";
import { canUseFeature, effectivePlan } from "@/lib/plans";
import { TeamClientPage } from "./client";
import Link from "next/link";
import { Users, Zap, LayoutDashboard, Building2, SnowflakeIcon } from "lucide-react";
import { CreateOrgForm } from "./CreateOrgForm";

export const metadata = { title: "الفريق" };

export default async function TeamPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string; role?: string; organizationId?: string };
  const role = user.role ?? "member";
  const orgId = user.organizationId;

  // super_admin without an org → they manage users in the admin panel, not here
  if (role === "super_admin" && !orgId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground max-w-sm">
            بصفتك مدير المنصة، تدير كل المستخدمين والمؤسسات من لوحة الإدارة.
            تبويب الفريق مخصص للمستخدمين داخل مؤسسة.
          </p>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Users className="h-4 w-4" />
          إلى لوحة الإدارة
        </Link>
      </div>
    );
  }

  // Non-super-admin: check Business plan + org frozen state
  const [dbUser, frozenOrg] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: { plan: true, planExpiresAt: true },
    }),
    orgId
      ? db.organization.findUnique({
          where: { id: orgId },
          select: { isActive: true, name: true, frozenAt: true },
        })
      : null,
  ]);
  const plan = effectivePlan(dbUser?.plan ?? "free", dbUser?.planExpiresAt);

  // Org is frozen (admin cancelled Business plan)
  if (frozenOrg && !frozenOrg.isActive) {
    const isAdmin = role === "company_admin" || role === "super_admin";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
          <SnowflakeIcon className="h-8 w-8 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">المؤسسة مجمّدة</h1>
          <p className="text-muted-foreground max-w-sm">
            {isAdmin
              ? <>انتهت باقة Business لمؤسسة <strong>{frozenOrg.name}</strong>. كل البيانات محفوظة، جدّد الباقة لإعادة تفعيل المؤسسة فورًا.</>
              : <>المؤسسة <strong>{frozenOrg.name}</strong> مجمّدة حاليًا. تواصل مع مدير المؤسسة.</>
            }
          </p>
          {frozenOrg.frozenAt && (
            <p className="text-xs text-muted-foreground">
              Eingefroren seit {new Date(frozenOrg.frozenAt).toLocaleDateString("ar-u-nu-latn")}
            </p>
          )}
        </div>
        {isAdmin && (
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Zap className="h-4 w-4" />
            اشترك في باقة Business
          </Link>
        )}
      </div>
    );
  }

  if (!canUseFeature("teamDirectory", plan)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">دليل الفريق</h1>
          <p className="text-muted-foreground max-w-sm">
            دليل الفريق متاح في باقة <strong>Business</strong>.
            أدر الأعضاء، وأرسل الدعوات، وتابع فريقك من مكان واحد.
          </p>
        </div>
        <Link
          href="/upgrade"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Zap className="h-4 w-4" />
          الترقية إلى Business
        </Link>
      </div>
    );
  }

  // Business user without an org → show org-creation prompt
  if (!orgId) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-6 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">أنشئ مؤسستك</h1>
          <p className="text-muted-foreground">
            سمِّ مؤسستك، وادعُ الأعضاء، وحدد
            قواعد التصميم لكل البطاقات.
          </p>
        </div>
        <CreateOrgForm />
      </div>
    );
  }

  const isApprover = role === "super_admin" || role === "company_admin" || role === "team_leader";

  const [users, invitations, org, pendingCards] = await Promise.all([
    db.user.findMany({
      where: { organizationId: orgId },
      include: {
        cards: { orderBy: [{ isDefault: "desc" }], take: 1, select: { slug: true, isPublic: true, showInTeamDirectory: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    canManageUsers(role)
      ? db.invitation.findMany({
          where: { organizationId: orgId, acceptedAt: null },
          include: { sender: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [],
    db.organization.findUnique({
      where: { id: orgId },
      select: {
        name: true, slug: true, isActive: true,
        _count: { select: { users: true } },
        settings: { select: { teamDirectoryEnabled: true } },
      },
    }),
    isApprover
      ? db.card.findMany({
          where: { approvalStatus: "pending", user: { organizationId: orgId } },
          select: {
            id: true, slug: true, name: true, approvalNote: true, updatedAt: true,
            user: { select: { name: true, email: true } },
          },
          orderBy: { updatedAt: "desc" },
        })
      : [],
  ]);

  return (
    <TeamClientPage
      users={users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        card: u.cards[0] ?? null,
      }))}
      invitations={invitations.map((i) => ({
        ...i,
        expiresAt: i.expiresAt.toISOString(),
        createdAt: i.createdAt.toISOString(),
      }))}
      currentUserId={user.id}
      currentUserRole={role}
      orgName={org?.name}
      orgSlug={org?.slug}
      memberCount={org?._count.users ?? users.length}
      canManage={canManageUsers(role)}
      teamDirectoryEnabled={org?.settings?.teamDirectoryEnabled ?? true}
      pendingCards={(pendingCards as typeof pendingCards).map((c) => ({
        ...c,
        updatedAt: c.updatedAt.toISOString(),
      }))}
      canImport={canUseFeature("bulkImport", plan)}
    />
  );
}
