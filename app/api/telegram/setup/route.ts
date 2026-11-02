import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/utils";
import { telegramApi, telegramConfigured } from "@/lib/telegram";

/** Super admin: register this app's webhook URL with Telegram (idempotent). */
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !isSuperAdmin(role)) return NextResponse.json({ error: "ليست لديك صلاحية" }, { status: 403 });
  if (!telegramConfigured()) return NextResponse.json({ error: "متغيرات Telegram غير مضبوطة في الاستضافة" }, { status: 400 });

  const base = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (!base.startsWith("https://")) return NextResponse.json({ error: "APP_URL يجب أن يبدأ بـ https://" }, { status: 400 });

  const ok = await telegramApi("setWebhook", {
    url: `${base}/api/telegram/webhook`,
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ["message"],
  });
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "رفض Telegram الطلب، تأكد من التوكن" }, { status: 502 });
}
