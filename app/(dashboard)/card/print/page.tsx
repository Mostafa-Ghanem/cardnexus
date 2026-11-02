import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { effectivePlan, getPlanFeatures } from "@/lib/plans";
import type { CardData } from "@/types";
import { getPlatformSettings } from "@/lib/platform";
import { PrintStudio } from "./client";

export const metadata = { title: "استوديو الطباعة" };

export default async function PrintStudioPage({ searchParams }: { searchParams: Promise<{ card?: string; tab?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;
  const [rawCards, me] = await Promise.all([
    db.card.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    db.user.findUnique({ where: { id: userId }, select: { plan: true, planExpiresAt: true, role: true, organizationId: true } }),
  ]);
  const plan = effectivePlan(me?.plan ?? "free", me?.planExpiresAt);
  const features = getPlanFeatures(plan);
  const sp = await searchParams;

  if (!rawCards.length) {
    return (
      <div className="max-w-xl rounded-2xl border-2 border-dashed border-border p-10 text-center">
        <h1 className="text-xl font-bold mb-2">أنشئ بطاقتك أولًا</h1>
        <p className="text-muted-foreground mb-6">الكارت المطبوع يأخذ بياناته من بطاقتك الرقمية تلقائيًا.</p>
        <Link href="/card" className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">إنشاء بطاقة</Link>
      </div>
    );
  }

  const cards = rawCards.map(({ passwordHash: _ph, ...c }) => ({
    ...c,
    firstName: c.firstName ?? "",
    lastName: c.lastName ?? "",
    customLinks: [],
  })) as unknown as CardData[];

  const canTeamPrint = !!me?.organizationId && ["company_admin", "super_admin"].includes(me?.role ?? "") && features.teamDirectory;

  return (
    <PrintStudio
      cards={cards}
      initialCardId={sp.card}
      initialTab={sp.tab === "qr" || sp.tab === "background" ? sp.tab : "print"}
      isFree={plan === "free"}
      canTeamPrint={canTeamPrint}
      appName={(await getPlatformSettings()).appName}
    />
  );
}
