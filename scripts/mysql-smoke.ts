/**
 * Minimal database roundtrip and cascade test for a disposable MySQL database.
 * Never run against production: this creates and deletes test records.
 */
import { db } from "../lib/db";
import { randomUUID } from "node:crypto";

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.RUN_MYSQL_SMOKE !== "ci") {
    throw new Error("Refusing database smoke test outside an explicit CI database.");
  }
  const email = `ci-smoke-${randomUUID()}@example.invalid`;
  const now = new Date();
  const id = randomUUID();
  let cardId: string | undefined;
  try {
    const user = await db.user.create({
      data: { id, name: "CI smoke", email, emailVerified: false, createdAt: now, updatedAt: now },
    });
    const longLinks = JSON.stringify(Array.from({ length: 12 }, (_, i) => ({
      label: `Link ${i}`, url: `https://example.invalid/profile/${"a".repeat(80)}${i}`,
    })));
    const card = await db.card.create({
      data: {
        userId: user.id,
        slug: `ci-${randomUUID()}`,
        name: "Database smoke",
        customLinks: longLinks,
        bio: "b".repeat(400),
      },
    });
    cardId = card.id;
    await db.lead.create({
      data: { cardId: card.id, name: "Example visitor", message: "m".repeat(400) },
    });
    const stored = await db.card.findUnique({
      where: { id: card.id }, include: { leads: true },
    });
    if (!stored || stored.customLinks !== longLinks || stored.leads[0]?.message?.length !== 400) {
      throw new Error("MySQL text persistence or relation test failed.");
    }
    console.log("MySQL schema smoke test passed (user, card, long text, lead, relation).");
  } finally {
    if (cardId) await db.card.deleteMany({ where: { id: cardId } });
    await db.user.deleteMany({ where: { id } });
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
