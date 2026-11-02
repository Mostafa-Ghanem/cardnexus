"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Status { enabled: boolean; linked?: boolean; url?: string }

/** Instant lead alerts on Telegram. Hidden when the platform has no bot configured. */
export function TelegramCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/telegram/link").catch(() => null);
    if (res?.ok) setStatus(await res.json());
  }

  useEffect(() => {
    refresh();
    // After the user taps Start in Telegram and comes back, show the new state.
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!status?.enabled) return null;

  async function call(method: "POST" | "DELETE") {
    setBusy(true);
    const res = await fetch("/api/telegram/link", { method }).catch(() => null);
    setBusy(false);
    if (!res?.ok) { toast.error("تعذّر تنفيذ الطلب"); return; }
    if (method === "POST") toast.success("أُرسلت رسالة تجريبية إلى Telegram");
    else { toast.success("تم إلغاء الربط"); refresh(); }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-sky-500" />
          <CardTitle className="text-base">تنبيهات Telegram الفورية</CardTitle>
          {status.linked && <Badge variant="success" className="ms-auto">مربوط</Badge>}
        </div>
        <CardDescription>
          تصلك رسالة على Telegram خلال ثوانٍ من ترك أي زائر لبياناته، مع رابط واتساب مباشر للرد عليه.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {status.linked ? (
          <>
            <Button variant="outline" size="sm" onClick={() => call("POST")} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} إرسال رسالة تجريبية
            </Button>
            <Button variant="ghost" size="sm" onClick={() => call("DELETE")} disabled={busy} className="text-muted-foreground">
              إلغاء الربط
            </Button>
          </>
        ) : (
          <Button asChild size="sm">
            <a href={status.url} target="_blank" rel="noopener noreferrer">
              <Send className="h-4 w-4" /> ربط Telegram
            </a>
          </Button>
        )}
        {!status.linked && (
          <p className="w-full text-xs text-muted-foreground">
            سيفتح Telegram، اضغط «Start» ثم ارجع لهذه الصفحة.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
