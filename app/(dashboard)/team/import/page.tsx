import { T } from "@/components/i18n/I18nProvider";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { canManageUsers } from "@/lib/utils";
import { canUseFeature, effectivePlan } from "@/lib/plans";
import { ImportClient } from "./client";

export const metadata = { title: "CSV-Import" };

export default async function ImportPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string; role?: string; organizationId?: string };

  if (!canManageUsers(user.role ?? "member")) redirect("/team");

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { plan: true, planExpiresAt: true },
  });
  const plan = effectivePlan(dbUser?.plan ?? "free", dbUser?.planExpiresAt);

  if (!canUseFeature("bulkImport", plan) && user.role !== "super_admin") redirect("/team");
  if (!user.organizationId) redirect("/team");

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold"><T text={"CSV-Import"} /></h1>
        <p className="text-muted-foreground mt-1"><T text={"Importiere Mitglieder und befülle deren Visitenkarten aus einer CSV-Datei."} /></p>
      </div>
      <ImportClient />
    </div>
  );
}
