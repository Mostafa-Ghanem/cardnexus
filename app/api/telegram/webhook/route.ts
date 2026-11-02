import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTelegramMessage, verifyStartPayload, verifyWebhookSecret } from "@/lib/telegram";

/** Telegram → app. Only handles "/start <signed-payload>" to link a chat to a user. */
export async function POST(req: NextRequest) {
  if (!verifyWebhookSecret(req.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const update = await req.json().catch(() => null) as
    | { message?: { text?: string; chat?: { id?: number; type?: string } } }
    | null;
  const text = update?.message?.text ?? "";
  const chatId = update?.message?.chat?.id;
  if (!chatId || update?.message?.chat?.type !== "private") return NextResponse.json({ ok: true });

  const match = text.match(/^\/start\s+([A-Za-z0-9_-]{1,64})$/);
  if (!match) {
    await sendTelegramMessage(String(chatId), "لربط حسابك افتح الإعدادات في لوحة التحكم واضغط «ربط Telegram».");
    return NextResponse.json({ ok: true });
  }

  const userId = verifyStartPayload(match[1]);
  const user = userId ? await db.user.findUnique({ where: { id: userId }, select: { id: true } }) : null;
  if (!user) {
    await sendTelegramMessage(String(chatId), "رابط الربط غير صالح. أعد المحاولة من صفحة الإعدادات.");
    return NextResponse.json({ ok: true });
  }

  await db.user.update({ where: { id: user.id }, data: { telegramChatId: String(chatId) } });
  await sendTelegramMessage(String(chatId), "✅ تم الربط. ستصلك هنا رسالة فورية مع كل عميل محتمل جديد.");
  return NextResponse.json({ ok: true });
}
