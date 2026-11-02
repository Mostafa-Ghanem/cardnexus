import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/platform";
import { effectivePlan } from "@/lib/plans";
import { parsePrintDesign } from "@/lib/print-design";
import { FREE_PRINT_DESIGNS } from "@/components/print/designs";
import { PrintDocument, type PrintMode } from "@/components/print/PrintDocument";
import { toPrintCard } from "@/lib/print-design";

export const metadata: Metadata = { title: "طباعة الكارت", robots: { index: false } };

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string; auto?: string }>;
}

export default async function PrintPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const card = await db.card.findUnique({
    where: { slug },
    include: { user: { select: { plan: true, planExpiresAt: true } } },
  });
  if (!card) notFound();

  // Public cards can be printed by anyone who has the link; private cards only by their owner.
  if (!card.isPublic) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id !== card.userId) notFound();
  }

  const plan = effectivePlan(card.user?.plan ?? "free", card.user?.planExpiresAt);
  const isFree = plan === "free";
  let design = parsePrintDesign(card.printDesign);
  let notice: string | null = null;
  if (isFree && !FREE_PRINT_DESIGNS.includes(design.designId)) {
    notice = "هذا التصميم متاح في باقة Pro، لذلك تمت الطباعة بالتصميم الكلاسيكي.";
    design = { ...design, designId: "classic" };
  }

  let mode: PrintMode = sp.mode === "exact" || sp.mode === "sheet" ? sp.mode : "pro";
  if (mode === "sheet" && isFree) {
    mode = "pro";
    notice = (notice ? notice + " " : "") + "لوح A4 متاح في باقة Pro.";
  }

  const settings = await getPlatformSettings();

  return (
    <PrintDocument
      jobs={[{ card: toPrintCard(card), design }]}
      mode={mode}
      branding={isFree ? settings.appName : null}
      backHref="/card/print"
      autoPrint={sp.auto === "1"}
      notice={notice}
    />
  );
}
