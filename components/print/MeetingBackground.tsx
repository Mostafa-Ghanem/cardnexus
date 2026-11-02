"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import type { CardData } from "@/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { localizeCard } from "@/lib/card-i18n";
import { qrArtSvg, svgToDataUrl } from "@/lib/qr-art";
import { shade } from "./designs";
import { cardQrUrl, useOrigin } from "./PrintFace";
import { cn } from "@/lib/utils";

type Theme = "brand" | "dark" | "light";
const W = 1920, H = 1080;
const FONT = "'IBM Plex Sans Arabic', 'Inter', sans-serif";

function loadImage(src: string, cors: boolean): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Virtual background for Zoom / Meet / Teams: name, title and a QR code in the
 * corners (the camera usually covers the middle).
 */
export function MeetingBackground({ card }: { card: CardData }) {
  const origin = useOrigin();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [theme, setTheme] = useState<Theme>("brand");
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [showQr, setShowQr] = useState(true);
  const [withLogo, setWithLogo] = useState(!!card.logoUrl);
  const [busy, setBusy] = useState(false);
  const p = card.primaryColor || "#0F766E";

  async function draw(includeLogo: boolean) {
    const canvas = canvasRef.current;
    if (!canvas || !origin) return;
    const ctx = canvas.getContext("2d")!;
    const c = localizeCard(card, lang);
    const rtl = lang === "ar";
    try { await document.fonts.load(`700 80px "IBM Plex Sans Arabic"`); await document.fonts.load(`400 40px "IBM Plex Sans Arabic"`); } catch { /* ignore */ }

    // Background
    const g = ctx.createLinearGradient(0, 0, W, H);
    if (theme === "brand") { g.addColorStop(0, shade(p, -0.35)); g.addColorStop(1, p); }
    else if (theme === "dark") { g.addColorStop(0, "#0b1220"); g.addColorStop(1, "#1f2937"); }
    else { g.addColorStop(0, "#ffffff"); g.addColorStop(1, shade(p, 0.88)); }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const fg = theme === "light" ? "#0f172a" : "#ffffff";
    const muted = theme === "light" ? "#475569" : "rgba(255,255,255,0.78)";
    const accent = theme === "light" ? p : theme === "dark" ? shade(p, 0.35) : "rgba(255,255,255,0.9)";

    // Decorative circles
    ctx.globalAlpha = theme === "light" ? 0.08 : 0.1;
    ctx.fillStyle = theme === "light" ? p : "#ffffff";
    ctx.beginPath(); ctx.arc(rtl ? 120 : W - 120, H + 80, 420, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(rtl ? W - 60 : 60, -120, 300, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Text block (top corner, start side)
    const x = rtl ? W - 110 : 110;
    ctx.direction = rtl ? "rtl" : "ltr";
    ctx.textAlign = rtl ? "right" : "left";
    let y = 150;
    if (includeLogo && card.logoUrl) {
      const logo = await loadImage(card.logoUrl, true);
      if (logo) {
        const h = 84, w = Math.min(260, (logo.width / logo.height) * h);
        ctx.drawImage(logo, rtl ? x - w : x, y - 60, w, h);
        y += 70;
      }
    }
    ctx.fillStyle = accent;
    ctx.fillRect(rtl ? x - 90 : x, y, 90, 8);
    y += 90;
    ctx.fillStyle = fg;
    ctx.font = `700 76px ${FONT}`;
    ctx.fillText([c.firstName, c.lastName].filter(Boolean).join(" ") || (rtl ? "اسمك" : "Your Name"), x, y);
    y += 62;
    ctx.fillStyle = muted;
    ctx.font = `400 40px ${FONT}`;
    const sub = [c.title, c.company].filter(Boolean).join(" · ");
    if (sub) { ctx.fillText(sub, x, y); y += 56; }
    ctx.font = `400 32px ${FONT}`;
    ctx.direction = "ltr";
    for (const line of [card.mobile || card.phone, card.email, card.website?.replace(/^https?:\/\//, "")].filter(Boolean) as string[]) {
      ctx.fillText(line, x, y + 10);
      y += 46;
    }

    // QR (bottom corner, end side)
    if (showQr) {
      const qr = await loadImage(svgToDataUrl(qrArtSvg({ text: cardQrUrl(origin, card.slug), color: "#111111", style: "rounded", margin: 1 })), false);
      const size = 230, pad = 22;
      const qx = rtl ? 110 : W - 110 - size - pad * 2;
      const qy = H - 110 - size - pad * 2 - 40;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 30;
      roundRect(ctx, qx, qy, size + pad * 2, size + pad * 2 + 54, 24);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (qr) ctx.drawImage(qr, qx + pad, qy + pad, size, size);
      ctx.fillStyle = "#111827";
      ctx.font = `600 26px ${FONT}`;
      ctx.textAlign = "center";
      ctx.direction = rtl ? "rtl" : "ltr";
      ctx.fillText(rtl ? "امسح لحفظ بياناتي" : "Scan to save my contact", qx + pad + size / 2, qy + pad + size + 42);
    }
  }

  useEffect(() => { draw(withLogo); }, [origin, theme, lang, showQr, withLogo]);

  async function downloadPng() {
    setBusy(true);
    try {
      const canvas = canvasRef.current!;
      let url: string;
      try {
        url = canvas.toDataURL("image/png");
      } catch {
        // Logo host without CORS taints the canvas — redraw without it.
        await draw(false);
        url = canvas.toDataURL("image/png");
        toast.message("تم التنزيل بدون الشعار لأن مصدره لا يسمح بذلك.");
      }
      const a = document.createElement("a");
      a.href = url; a.download = `meeting-background-${card.slug}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      if (withLogo) draw(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-2">
        <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-2xl border border-border shadow-lg" />
        <p className="text-xs text-muted-foreground">1920 × 1080 · مكان الكاميرا في المنتصف يبقى فارغًا. Zoom يعرض لك الصورة معكوسة، لكن الآخرين يرونها صحيحة.</p>
      </div>
      <div className="space-y-5 rounded-xl border border-border bg-card p-4 self-start">
        <div className="space-y-1.5">
          <Label>النمط</Label>
          <div className="flex rounded-lg bg-muted p-1 gap-1">
            {([["brand", "لون الهوية"], ["dark", "داكن"], ["light", "فاتح"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setTheme(v)} aria-pressed={theme === v}
                className={cn("flex-1 rounded-md py-1.5 text-xs font-medium", theme === v ? "bg-background shadow-sm" : "text-muted-foreground")}>{l}</button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>اللغة</Label>
          <div className="flex rounded-lg bg-muted p-1 gap-1">
            {([["ar", "عربي"], ["en", "English"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setLang(v)} aria-pressed={lang === v}
                className={cn("flex-1 rounded-md py-1.5 text-xs font-medium", lang === v ? "bg-background shadow-sm" : "text-muted-foreground")}>{l}</button>
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between text-sm">رمز QR <Switch checked={showQr} onCheckedChange={setShowQr} /></label>
        <label className={cn("flex items-center justify-between text-sm", !card.logoUrl && "opacity-50")}>
          الشعار <Switch checked={withLogo && !!card.logoUrl} onCheckedChange={setWithLogo} disabled={!card.logoUrl} />
        </label>
        <Button className="w-full" onClick={downloadPng} disabled={busy || !origin}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} تنزيل الخلفية PNG
        </Button>
      </div>
    </div>
  );
}
