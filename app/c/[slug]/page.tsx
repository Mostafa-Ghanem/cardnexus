import { T } from "@/components/i18n/I18nProvider";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { CardData } from "@/types";
import { PublicCardView } from "./client";
import { CardPasswordGate } from "./PasswordGate";
import { canUseFeature } from "@/lib/plans";
import { makeCardUnlockToken } from "@/lib/password-hash";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ source?: string; expired?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const card = await db.card.findUnique({
    where: { slug },
    select: { firstName: true, lastName: true, title: true, company: true, isPublic: true, expiresAt: true, passwordHash: true },
  });
  if (!card) return { title: "Karte nicht gefunden" };

  // Don't leak names of expired or non-public cards in metadata.
  if (!card.isPublic) return { title: "Karte nicht verfügbar" };
  if (card.expiresAt && card.expiresAt < new Date()) return { title: "Karte abgelaufen" };
  if (card.passwordHash) return { title: "Geschützte Karte" };

  const name = `${card.firstName ?? ""} ${card.lastName ?? ""}`.trim();
  return {
    title: `${name}${card.title ? ` – ${card.title}` : ""}`,
    description: card.company ?? undefined,
    openGraph: { title: name, type: "profile" },
  };
}

/**
 * Cookie name for an unlocked password-protected card.
 * Format: `card_unlocked_<slug>`. The cookie value is the bcrypt-style
 * hash to prevent forgery — only valid hashes (matching the current
 * passwordHash) unlock the card.
 */
function unlockCookieName(slug: string): string {
  return `card_unlocked_${slug}`;
}

export default async function PublicCardPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { source } = await searchParams;

  const raw = await db.card.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          name: true,
          // SECURITY: do NOT expose owner email to the public card page.
          plan: true,
          planExpiresAt: true,
        },
      },
    },
  });

  if (!raw) {
    // Check if this is an old slug that was renamed
    const alias = await db.cardSlugAlias.findUnique({ where: { oldSlug: slug } });
    if (alias) redirect(`/c/${alias.cardSlug}`);
    notFound();
  }
  if (!raw.isPublic) notFound();

  // SECURITY: enforce expiry — abgelaufene Karten dürfen nicht mehr aufgerufen werden.
  if (raw.expiresAt && raw.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-sm text-center space-y-2">
          <h1 className="text-2xl font-semibold"><T text={"Karte abgelaufen"} /></h1>
          <p className="text-muted-foreground"><T text={"Diese Karte ist nicht mehr verfügbar."} /></p>
        </div>
      </div>
    );
  }

  // SECURITY: enforce password-protection.
  if (raw.passwordHash) {
    const cookie = (await cookies()).get(unlockCookieName(slug))?.value;
    const expected = makeCardUnlockToken(slug, raw.passwordHash);
    const unlocked = !!cookie && cookie === expected;
    if (!unlocked) {
      return <CardPasswordGate slug={slug} />;
    }
  }

  const { passwordHash: _ph, ...safe } = raw;
  const card = { ...safe, customLinks: JSON.parse(raw.customLinks) } as CardData;
  const ownerPlan = raw.user?.plan ?? "free";
  const ownerExpiry = raw.user?.planExpiresAt;
  const whiteLabel   = canUseFeature("whiteLabel",   ownerPlan, ownerExpiry);
  const showLeadForm = canUseFeature("leadCapture",  ownerPlan, ownerExpiry);

  return <PublicCardView card={card} source={source} showBadge={!whiteLabel} showLeadForm={showLeadForm} />;
}
