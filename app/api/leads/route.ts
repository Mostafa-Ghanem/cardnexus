import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fireWebhooks } from "@/lib/webhooks";
import { sendLeadNotificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";
import { normalizeContactPhone, hasContactDetails } from "@/lib/lead-validation";
import { verifyTurnstile } from "@/lib/turnstile";
import { bindings as env } from "@/lib/cloudflare-bindings";
import { canUseFeature, effectivePlan } from "@/lib/plans";
import { z } from "zod";
import { waitUntil } from "cloudflare:workers";

const LEADS_PER_CARD_PER_HOUR = 30;
const schema = z.object({
  cardId: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  email: z.union([z.literal(""), z.string().trim().email()]).optional(),
  phone: z.string().max(50).optional().transform(value => value ? normalizeContactPhone(value) : ""),
  message: z.string().max(500).optional(),
  website: z.string().max(200).optional(), // Honeypot: should remain empty
  turnstileToken: z.string().max(4096).optional(),
}).refine(value => hasContactDetails(value.email, value.phone), {
  path: ["phone"], message: "Provide a phone number or email",
}).refine(value => !value.phone || /^[+]?[0-9]{6,16}$/.test(value.phone), {
  path: ["phone"], message: "Invalid phone number",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const card = await db.card.findUnique({
      where: { id: data.cardId },
      select: {
        id: true, isPublic: true, name: true, slug: true, expiresAt: true,
        user: { select: { id: true, email: true, name: true, leadNotification: true, plan: true, planExpiresAt: true } },
      },
    });

    if (!card || !card.isPublic || (card.expiresAt && card.expiresAt < new Date())) {
      return NextResponse.json({ error: "Karte nicht gefunden" }, { status: 404 });
    }

    const ownerPlan = effectivePlan(card.user.plan ?? "free", card.user.planExpiresAt);
    if (!canUseFeature("leadCapture", ownerPlan)) {
      return NextResponse.json({ error: "Nicht verfügbar" }, { status: 403 });
    }

    // Honeypot check does not expose why bots were rejected.
    if (data.website) return NextResponse.json({ success: true });

    const ip = clientIp(req);
    const trustedIp = req.headers.get("cf-connecting-ip") ?? undefined;
    if (!(await verifyTurnstile(data.turnstileToken, trustedIp))) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
    const recent = await db.lead.count({
      where: {
        cardId: data.cardId,
        createdAt: { gte: new Date(Date.now() - 60 * 60_000) },
      },
    });
    if (recent >= LEADS_PER_CARD_PER_HOUR) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
    // Shared D1 rate limiting rather than Hostinger's per-process memory.
    if (ip && !(await rateLimit({ key: `lead:${ip}:${data.cardId}`, max: 3, windowMs: 60 * 60_000 }))) {
      return NextResponse.json(
        { error: "Zu viele Anfragen — bitte später erneut versuchen." },
        { status: 429 }
      );
    }

    const lead = await db.lead.create({
      data: {
        cardId:  data.cardId,
        name:    data.name,
        email:   data.email || null,
        phone:   data.phone || null,
        message: data.message || null,
      },
    });

    // Fire webhooks (non-blocking)
    waitUntil(fireWebhooks(data.cardId, "lead", lead).catch((e) => console.error("Lead webhook error", e)));

    // Send instant email notification if enabled (non-blocking)
    if (card.user.leadNotification === "instant" && card.user.email) {
      const appUrl = env.APP_URL || env.BETTER_AUTH_URL || "http://localhost:3000";
      waitUntil(sendLeadNotificationEmail({
        to: card.user.email,
        ownerName: card.user.name ?? "",
        leadName: data.name,
        leadEmail: data.email || null,
        leadPhone: data.phone || null,
        leadMessage: data.message || null,
        cardName: card.name,
        dashboardUrl: `${appUrl}/leads`,
      }).catch((e) => console.error("Lead email error", e)));
    }

    return NextResponse.json({ success: true, id: lead.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Ungültige Eingabe", details: err.flatten() }, { status: 400 });
    }
    console.error("[leads POST]", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
