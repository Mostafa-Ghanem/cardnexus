import { createHmac, timingSafeEqual } from "crypto";
import { whatsappDigits } from "@/lib/utils";

/**
 * Telegram bot for instant lead alerts.
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME (without @), TELEGRAM_WEBHOOK_SECRET.
 */
export function telegramConfigured(): boolean {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME && process.env.TELEGRAM_WEBHOOK_SECRET);
}

function sign(userId: string): string {
  return createHmac("sha256", process.env.TELEGRAM_WEBHOOK_SECRET ?? "")
    .update(`telegram-link:${userId}`).digest("base64url").slice(0, 22);
}

/** Deep link that opens the bot with a signed one-tap "Start" payload (≤ 64 chars). */
export function telegramLinkUrl(userId: string): string {
  return `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${userId}_${sign(userId)}`;
}

/** Returns the user id if the /start payload carries a valid signature. */
export function verifyStartPayload(payload: string): string | null {
  const i = payload.lastIndexOf("_");
  if (i <= 0) return null;
  const userId = payload.slice(0, i);
  const given = Buffer.from(payload.slice(i + 1));
  const expected = Buffer.from(sign(userId));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return userId;
}

export function verifyWebhookSecret(header: string | null): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  if (!secret || !header) return false;
  const a = Buffer.from(header), b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function telegramApi(method: string, body: Record<string, unknown>): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  return telegramApi("sendMessage", { chat_id: chatId, text, disable_web_page_preview: true });
}

export function leadTelegramText(o: {
  leadName: string; phone?: string | null; email?: string | null; message?: string | null;
  cardName: string; dashboardUrl: string;
}): string {
  const wa = whatsappDigits(o.phone);
  const lines = [
    "🔔 عميل محتمل جديد",
    `الاسم: ${o.leadName}`,
    o.phone ? `الجوال: ${o.phone}` : "",
    wa ? `واتساب: https://wa.me/${wa}` : "",
    o.email ? `البريد: ${o.email}` : "",
    o.message ? `الرسالة: ${o.message}` : "",
    `البطاقة: ${o.cardName}`,
  ].filter(Boolean);
  return `${lines.join("\n")}\n\n${o.dashboardUrl}`;
}
