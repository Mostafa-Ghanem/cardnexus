"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/** Registers the Telegram webhook once the bot env vars are set on the host. */
export function TelegramSetup({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState(false);

  async function activate() {
    setBusy(true);
    const res = await fetch("/api/telegram/setup", { method: "POST" }).catch(() => null);
    setBusy(false);
    const j = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) toast.success("تم تفعيل بوت Telegram");
    else toast.error(j.error ?? "تعذّر التفعيل");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">بوت Telegram للتنبيهات</CardTitle>
        <CardDescription>
          {configured
            ? "المتغيرات مضبوطة. اضغط التفعيل مرة واحدة بعد كل تغيير للدومين أو التوكن."
            : "أضف TELEGRAM_BOT_TOKEN وTELEGRAM_BOT_USERNAME وTELEGRAM_WEBHOOK_SECRET في متغيرات الاستضافة ثم أعد النشر."}
        </CardDescription>
      </CardHeader>
      {configured && (
        <CardContent>
          <Button size="sm" onClick={activate} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} تفعيل البوت
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
