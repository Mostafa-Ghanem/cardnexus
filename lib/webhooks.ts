import { db } from "@/lib/db";
import { createHmac } from "crypto";
import { isSafePublicUrl } from "@/lib/ssrf";

/**
 * Dispatch outgoing webhooks for a given event.
 * Each delivery:
 *  - SSRF-checks the destination (https + non-private DNS) before fetching
 *  - signs with HMAC-SHA256 over `t=<timestamp>.<body>` (Stripe-style)
 *  - times out after 5s and never throws
 */
export async function fireWebhooks(cardId: string, event: string, payload: object) {
  const card = await db.card.findUnique({ where: { id: cardId }, select: { userId: true } });
  if (!card) return;

  const webhooks = await db.webhook.findMany({
    where: { userId: card.userId, active: true },
  });

  await Promise.all(
    webhooks.map(async (wh) => {
      try {
        const events: string[] = JSON.parse(wh.events || '["lead"]');
        if (!events.includes(event)) return;

        // SECURITY: refuse to fetch internal/private addresses (SSRF guard).
        if (!(await isSafePublicUrl(wh.url))) {
          console.warn(`[webhook ${wh.id}] blocked unsafe URL: ${wh.url}`);
          return;
        }

        const timestamp = Math.floor(Date.now() / 1000).toString();
        const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });

        const reqHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent":   "CardWebhook/1.0",
          "X-Webhook-Timestamp": timestamp,
          "X-Webhook-Event":     event,
          "X-Webhook-Delivery":  cryptoRandomId(),
        };

        if (wh.secret) {
          const signed = `${timestamp}.${body}`;
          const sig = createHmac("sha256", wh.secret).update(signed).digest("hex");
          reqHeaders["X-Webhook-Signature"] = `t=${timestamp},v1=${sig}`;
        }

        await fetch(wh.url, {
          method: "POST",
          headers: reqHeaders,
          body,
          signal: AbortSignal.timeout(5000),
          redirect: "manual", // don't follow redirects (could leak SSRF target)
        });
      } catch {
        /* non-blocking */
      }
    })
  );
}

function cryptoRandomId(): string {
  // 16 random hex chars — Math.random is enough, this is just a delivery
  // identifier that the receiver can use for de-duplication.
  let s = "";
  for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}
