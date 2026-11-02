import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getPlanFeatures } from "@/lib/plans";
import { decodePrintDesign, DEFAULT_PRINT_DESIGN } from "@/lib/print-design";
import { PrintDocument, type PrintMode } from "@/components/print/PrintDocument";
import { toPrintCard } from "@/lib/print-design";

export const metadata: Metadata = { title: "طباعة كروت الفريق", robots: { index: false } };

const MANAGER_ROLES = ["company_admin", "super_admin"];

/** Prints every team member's default card with one uniform design (Business plan). */
export default async function TeamPrintPage({ searchParams }: { searchParams: Promise<{ d?: string; mode?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, organizationId: true, plan: true, planExpiresAt: true },
  });
  if (!me?.organizationId || !MANAGER_ROLES.includes(me.role ?? "")) redirect("/card/print");
  if (!getPlanFeatures(me.plan ?? "free", me.planExpiresAt).teamDirectory) redirect("/upgrade");

  const sp = await searchParams;
  const design = decodePrintDesign(sp.d) ?? DEFAULT_PRINT_DESIGN;
  const mode: PrintMode = sp.mode === "exact" || sp.mode === "pro" ? sp.mode : "sheet";

  const cards = await db.card.findMany({
    where: { isDefault: true, user: { organizationId: me.organizationId } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  const jobs = cards.map((c) => ({ card: toPrintCard(c), design }));
  if (!jobs.length) redirect("/team");

  return <PrintDocument jobs={jobs} mode={mode} branding={null} backHref="/card/print" />;
}
