import { db } from "@/lib/db";
import { OrgAdminClient } from "./client";

export const metadata = { title: "المؤسسات" };

export default async function AdminOrgsPage() {
  const orgs = await db.organization.findMany({
    include: {
      settings: true,
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <OrgAdminClient
      orgs={orgs.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        _count: o._count,
        settings: o.settings ?? null,
      }))}
    />
  );
}
