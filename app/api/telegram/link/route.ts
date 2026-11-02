import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendTelegramMessage, telegramConfigured, telegramLinkUrl } from "@/lib/telegram";

async function userId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

/** Status + deep link for the signed-in user. */
export async function GET() {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });
  if (!telegramConfigured()) return NextResponse.json({ enabled: false });
  const u = await db.user.findUnique({ where: { id }, select: { telegramChatId: true } });
  return NextResponse.json({ enabled: true, linked: !!u?.telegramChatId, url: telegramLinkUrl(id) });
}

/** Send a test alert. */
export async function POST() {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });
  const u = await db.user.findUnique({ where: { id }, select: { telegramChatId: true } });
  if (!u?.telegramChatId) return NextResponse.json({ error: "Telegram غير مربوط" }, { status: 400 });
  const ok = await sendTelegramMessage(u.telegramChatId, "رسالة تجريبية ✅ التنبيهات تعمل.");
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "تعذّر الإرسال" }, { status: 502 });
}

/** Unlink. */
export async function DELETE() {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });
  await db.user.update({ where: { id }, data: { telegramChatId: null } });
  return NextResponse.json({ ok: true });
}
