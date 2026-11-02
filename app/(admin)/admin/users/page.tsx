import { T } from "@/components/i18n/I18nProvider";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminUsersClient } from "./client";

export const metadata = { title: "Benutzer verwalten" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUser = session!.user as { id: string; role?: string };

  const { q } = await searchParams;
  const search = q?.trim() ?? "";

  const where = search
    ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] }
    : undefined;

  const [users, orgs, total] = await Promise.all([
    db.user.findMany({
      where,
      include: {
        cards: { orderBy: [{ isDefault: "desc" }], take: 1, select: { slug: true, isPublic: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.organization.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.user.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold"><T text={"Alle Benutzer"} /></h1>
        <p className="text-muted-foreground mt-1">
          {search
            ? `${users.length} Treffer für „${search}" (${total} gesamt)`
            : `${total} Benutzer auf der Plattform`}
        </p>
      </div>
      <AdminUsersClient
        users={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          planExpiresAt: u.planExpiresAt?.toISOString() ?? null,
          bannedAt: u.bannedAt?.toISOString() ?? null,
          cards: u.cards ?? [],
          organization: u.organization ?? null,
        }))}
        orgs={orgs}
        currentUserId={currentUser.id}
        initialSearch={search}
      />
    </div>
  );
}
