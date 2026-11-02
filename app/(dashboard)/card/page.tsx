import { T } from "@/components/i18n/I18nProvider";
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
import type { CardData } from "@/types";
import Link from "next/link";
import { BarChart2 } from "lucide-react";

export const metadata = { title: "Meine Karte" };

export default async function CardPage({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as {
    id: string;
    organizationId?: string;
    role?: string;
    plan?: string;
    planExpiresAt?: Date;
  };

  const { card: cardIdParam } = await searchParams;

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
          <h1 className="text-2xl font-bold"><T text={"Meine Karte"} /></h1>
          <p className="text-muted-foreground mt-1">
            {activeCard
              ? "Bearbeite deine digitale Visitenkarte."
              : "Erstelle jetzt deine Karte."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeCard && (
            <Link
              href={`/analytics?cardId=${activeCard.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <BarChart2 className="h-4 w-4" /><T text={"Analytics"} /></Link>
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
          <h2 className="text-lg font-semibold mb-4"><T text={"QR-Code"} /></h2>
          <QRCodeDisplay slug={activeCard.slug} color={activeCard.primaryColor} />
        </div>
      )}
    </div>
  );
}
