import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fireWebhooks } from "@/lib/webhooks";
import { sendLeadNotificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, rawClientIp } from "@/lib/client-ip";
import { verifyTurnstile } from "@/lib/turnstile";
import { leadTelegramText, sendTelegramMessage, telegramConfigured } from "@/lib/telegram";
import { canUseFeature, effectivePlan } from "@/lib/plans";
import { z } from "zod";
import { normalizeDigits } from "@/lib/utils";

const LEADS_PER_CARD_PER_HOUR = 30;

const schema = z.object({
  cardId:  z.string().min(1),
  name:    z.string().trim().min(1).max(100),
  email:   z.string().trim().email().optional().or(z.literal("")),
  phone:   z.string().max(50).optional().transform((v) => (v ? normalizeDigits(v).replace(/[^\d+]/g, "") : v)),
  message: z.string().max(500).optional(),
  // Honeypot: hidden in the form, real visitors leave it empty.
  website: z.string().max(200).optional(),
  turnstileToken: z.string().max(4096).optional(),
}).refine((d) => !!d.email || !!d.phone, { message: "phone_or_email_required" });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const card = await db.card.findUnique({
      where: { id: data.cardId },
      select: {
        id: true, isPublic: true, name: true, slug: true,
        user: { select: { id: true, email: true, name: true, leadNotification: true, plan: true, planExpiresAt: true, telegramChatId: true } },
      },
    });

    if (!card || !card.isPublic) {
      return NextResponse.json({ error: "البطاقة غير موجودة" }, { status: 404 });
    }

    const ownerPlan = effectivePlan(card.user.plan ?? "free", card.user.planExpiresAt);
    if (!canUseFeature("leadCapture", ownerPlan)) {
      return NextResponse.json({ error: "هذه الخدمة غير متاحة لهذه البطاقة" }, { status: 403 });
    }

    // Bots fill every field; pretend success so they don't retry.
    if (data.website) return NextResponse.json({ success: true });

    if (!(await verifyTurnstile(data.turnstileToken, rawClientIp(req.headers)))) {
      return NextResponse.json({ error: "تعذّر التحقق من أنك لست برنامجًا آليًا، حاول مرة أخرى." }, { status: 400 });
    }

    // Per-card ceiling stored in the DB: independent of the client IP and of
    // process restarts, so it can't be bypassed by spoofing headers.
    const recent = await db.lead.count({
      where: { cardId: data.cardId, createdAt: { gte: new Date(Date.now() - 60 * 60_000) } },
    });
    if (recent >= LEADS_PER_CARD_PER_HOUR) {
      return NextResponse.json({ error: "طلبات كثيرة، حاول مرة أخرى لاحقًا." }, { status: 429 });
    }

    // Per-visitor limit; skipped when the host forwards no client IP, otherwise
    // every visitor would share one bucket (the per-card limit above still applies).
    const ip = clientIp(req);
    if (ip && !rateLimit({ key: `lead:${ip}:${data.cardId}`, max: 3, windowMs: 60 * 60_000 })) {
      return NextResponse.json(
        { error: "طلبات كثيرة، حاول مرة أخرى لاحقًا." },
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
    fireWebhooks(data.cardId, "lead", lead).catch(() => {});

    const appUrlBase = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Instant Telegram alert when the owner linked a chat (non-blocking)
    if (card.user.telegramChatId && telegramConfigured()) {
      sendTelegramMessage(card.user.telegramChatId, leadTelegramText({
        leadName: data.name, phone: data.phone, email: data.email || null,
        message: data.message || null, cardName: card.name, dashboardUrl: `${appUrlBase}/leads`,
      })).catch(() => {});
    }

    // Send instant email notification if enabled (non-blocking)
    if (card.user.leadNotification === "instant" && card.user.email) {
      const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      sendLeadNotificationEmail({
        to: card.user.email,
        ownerName: card.user.name ?? "",
        leadName: data.name,
        leadEmail: data.email || null,
        leadPhone: data.phone || null,
        leadMessage: data.message || null,
        cardName: card.name,
        dashboardUrl: `${appUrl}/leads`,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, id: lead.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "البيانات غير صحيحة. أضف الاسم ورقم الجوال أو البريد الإلكتروني الصحيح.", details: err.flatten() }, { status: 400 });
    }
    console.error("[leads POST]", err);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
