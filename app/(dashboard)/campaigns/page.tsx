import { T } from "@/components/i18n/I18nProvider";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canUseFeature } from "@/lib/plans";
import { CampaignsClient } from "./client";
import { UpgradePrompt } from "@/components/plan/UpgradePrompt";
import type { Campaign } from "@/types";

export const metadata = { title: "Kampagnen" };

export default async function CampaignsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string; plan?: string; planExpiresAt?: Date };

  const hasCampaigns = canUseFeature("campaigns", user.plan ?? "free", user.planExpiresAt);

  const card = await db.card.findFirst({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }],
    select: { id: true, slug: true },
  });

  const campaigns: Campaign[] = hasCampaigns && card
    ? (await db.campaign.findMany({
        where: { cardId: card.id },
        orderBy: { createdAt: "desc" },
      })).map((c) => ({
        ...c,
        expiresAt: c.expiresAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      }))
    : [];

  const hdrs = await headers();
  const host  = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${proto}://${host}`;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold"><T text={"UTM-Kampagnen"} /></h1>
        <p className="text-muted-foreground mt-1"><T text={"Erstelle individuelle Links fur Events, Messen oder Kampagnen &mdash; mit separater Klick-Statistik."} /></p>
      </div>

      {!hasCampaigns ? (
        <UpgradePrompt
          feature="UTM-Kampagnen & Event-Links sind ab dem Pro-Plan verfugbar"
          requiredPlan="pro"
        />
      ) : (
        <CampaignsClient
          campaigns={campaigns}
          cardSlug={card?.slug ?? ""}
          baseUrl={baseUrl}
          hasCard={!!card}
        />
      )}
    </div>
  );
}
