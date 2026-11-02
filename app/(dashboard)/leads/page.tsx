import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LeadsClient } from "./client";
import type { Lead } from "@/types";

export const metadata = { title: "العملاء المحتملون" };

export default async function LeadsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string };

  const cards = await db.card.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  const cardIds = cards.map((c) => c.id);

  const leads: Lead[] = cardIds.length
    ? (await db.lead.findMany({
        where: { cardId: { in: cardIds } },
        orderBy: { createdAt: "desc" },
        take: 500,
      })).map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }))
    : [];

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">العملاء المحتملون</h1>
        <p className="text-muted-foreground mt-1">
          الأشخاص الذين تركوا بياناتهم على بطاقتك.
        </p>
      </div>
      <LeadsClient leads={leads} hasCard={cardIds.length > 0} />
    </div>
  );
}
