import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveDesignPolicy } from "@/lib/design-policy";
import { getPlatformSettings } from "@/lib/platform";
import { canUseFeature, effectivePlan, getPlanFeatures } from "@/lib/plans";
import { CardEditor } from "@/components/card/CardEditor";
import { QRCodeDisplay } from "@/components/card/QRCodeDisplay";
import { CardSwitcher } from "@/components/card/CardSwitcher";
import { ApprovalBanner } from "@/components/card/ApprovalBanner";
import { OnboardingWizard } from "@/components/card/OnboardingWizard";
import type { CardData } from "@/types";
import Link from "next/link";
import { BarChart2, Printer } from "lucide-react";

export const metadata = { title: "بطاقتي" };

export default async function CardPage({
  searchParams,
}: {
  searchParams: Promise<{ card?: string; advanced?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as {
    id: string;
    organizationId?: string;
    role?: string;
    plan?: string;
    planExpiresAt?: Date;
  };

  const { card: cardIdParam, advanced } = await searchParams;

  const [rawCards, orgSettings, platformSettings] = await Promise.all([
    db.card.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    user.organizationId
      ? db.organizationSettings.findUnique({
          where: { organizationId: user.organizationId },
        })
      : null,
    getPlatformSettings(),
  ]);

  let allowedDomains: string[] = [];
  try {
    allowedDomains = platformSettings.allowedDomains
      ? JSON.parse(platformSettings.allowedDomains)
      : [];
  } catch { /* ignore */ }

  const cards: CardData[] = rawCards.map((c) => ({
    ...c,
    firstName: c.firstName ?? "",
    lastName:  c.lastName  ?? "",
    customLinks: JSON.parse(c.customLinks as unknown as string || "[]"),
  } as CardData));

  // Select the active card: by URL param, or the default, or first
  const activeCard =
    (cardIdParam ? cards.find((c) => c.id === cardIdParam) : null) ??
    cards.find((c) => c.isDefault) ??
    cards[0] ??
    null;

  // First card: a short guided wizard instead of the full editor.
  // Org members keep the full editor (their design may be locked by the org).
  if (!activeCard && advanced !== "1" && !user.organizationId) {
    const u = session!.user as { name?: string; email?: string };
    return <OnboardingWizard userName={u.name ?? ""} userEmail={u.email ?? ""} userPlan={user.plan ?? "free"} />;
  }

  const basePolicy = resolveDesignPolicy(orgSettings, activeCard?.department);
  const canEditLogo =
    !user.organizationId ||
    user.role === "company_admin" ||
    user.role === "super_admin";

  const policy = { ...basePolicy, canEditLogo };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">بطاقتي</h1>
          <p className="text-muted-foreground mt-1">
            {activeCard
              ? "عدّل بطاقتك الرقمية."
              : "أنشئ بطاقتك الآن."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeCard && (
            <Link
              href={`/card/print?card=${activeCard.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Printer className="h-4 w-4" />
              اطبع كارتك
            </Link>
          )}
          {activeCard && (
            <Link
              href={`/analytics?cardId=${activeCard.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <BarChart2 className="h-4 w-4" />
              الإحصائيات
            </Link>
          )}
          {cards.length > 0 && (
            <CardSwitcher
              cards={cards}
              activeCardId={activeCard?.id}
              maxCards={getPlanFeatures(effectivePlan(user.plan ?? "free", user.planExpiresAt)).maxCards}
            />
          )}
        </div>
      </div>

      {activeCard && activeCard.approvalStatus && activeCard.approvalStatus !== "approved" && (
        <ApprovalBanner status={activeCard.approvalStatus} note={activeCard.approvalNote} />
      )}

      <CardEditor
        key={activeCard?.id ?? "new"}
        initialCard={activeCard ?? undefined}
        isNew={!activeCard}
        policy={policy}
        userPlan={user.plan ?? "free"}
        allowedDomains={allowedDomains}
        canCustomDomain={canUseFeature("customDomain", user.plan ?? "free")}
      />

      {activeCard && (
        <div className="border-t border-border pt-8">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-semibold">رمز QR</h2>
            <Link href={`/card/print?card=${activeCard.id}&tab=qr`} className="text-sm text-primary hover:underline">صمّم رمزًا بهويتك ←</Link>
          </div>
          <QRCodeDisplay slug={activeCard.slug} color={activeCard.primaryColor} />
        </div>
      )}
    </div>
  );
}
