import { T } from "@/components/i18n/I18nProvider";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LeadsClient } from "./client";
import type { Lead } from "@/types";

export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string };

  const cards = await db.card.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  const cardIds = cards.map(card => card.id);
  const leads: Lead[] = cardIds.length
    ? (await db.lead.findMany({
        where: { cardId: { in: cardIds } },
        orderBy: { createdAt: "desc" },
        take: 500,
      })).map(lead => ({ ...lead, createdAt: lead.createdAt.toISOString() }))
    : [];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold"><T text={"Leads"} /></h1>
        <p className="text-muted-foreground mt-1"><T text={"Personen, die ihren Kontakt auf deiner Karte hinterlassen haben."} /></p>
      </div>
      <LeadsClient leads={leads} hasCard={cards.length > 0} />
    </div>
  );
}
