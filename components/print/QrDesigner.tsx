"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, AlertTriangle, Image as ImageIcon } from "lucide-react";
import type { CardData } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { qrArtSvg, svgToDataUrl, type QrStyle } from "@/lib/qr-art";
import { cardQrUrl, useOrigin } from "./PrintFace";
import { cn } from "@/lib/utils";

type Frame = "none" | "label" | "badge";

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Wraps the QR SVG in a frame with a call-to-action label. Units: QR = 100. */
function framedSvg(qrSvg: string, frame: Frame, color: string, label: string): string {
  const inner = qrSvg.replace("<svg ", '<svg x="10" y="10" width="100" height="100" ');
  if (frame === "none") return qrSvg;
  const font = "'IBM Plex Sans Arabic','Cairo','Segoe UI',Tahoma,sans-serif";
  if (frame === "label") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 142">` +
      `<rect x="1" y="1" width="118" height="140" rx="10" fill="${color}"/>` +
      `<rect x="6" y="6" width="108" height="108" rx="6" fill="#fff"/>` + inner +
      `<text x="60" y="131" text-anchor="middle" font-family="${font}" font-weight="700" font-size="13" fill="#fff">${esc(label)}</text></svg>`;
  }
  // badge: QR on white with a pill label overlapping the bottom border
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 132">` +
    `<rect x="2" y="2" width="116" height="116" rx="12" fill="#fff" stroke="${color}" stroke-width="3"/>` + inner +
    `<rect x="22" y="108" width="76" height="22" rx="11" fill="${color}"/>` +
    `<text x="60" y="123.5" text-anchor="middle" font-family="${font}" font-weight="700" font-size="11" fill="#fff">${esc(label)}</text></svg>`;
}

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result)); fr.onerror = () => r(null); fr.readAsDataURL(blob); });
  } catch {
    return null;
  }
}

function download(href: string, name: string) {
  const a = document.createElement("a");
  a.href = href; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

export function QrDesigner({ card }: { card: CardData }) {
  const origin = useOrigin();
  const [color, setColor] = useState(card.primaryColor);
  const [bg, setBg] = useState("#ffffff");
  const [style, setStyle] = useState<QrStyle>("rounded");
  const [withLogo, setWithLogo] = useState(!!card.logoUrl);
  const [frame, setFrame] = useState<Frame>("label");
  const [label, setLabel] = useState("امسحني");
  const [logoData, setLogoData] = useState<string | null>(null);

  // Inline the logo so downloads are self-contained (needs CORS on the image host).
  useEffect(() => {
    if (card.logoUrl) toDataUrl(card.logoUrl).then(setLogoData);
  }, [card.logoUrl]);

  const ratio = contrast(color, bg);
  const lowContrast = ratio < 4 || luminance(color) > luminance(bg);

  const build = (logoHref: string | null) => {
    if (!origin) return "";
    const qr = qrArtSvg({ text: cardQrUrl(origin, card.slug), color, background: bg, style, logoHref: withLogo ? logoHref : null, margin: 2 });
    return framedSvg(qr, frame, color, label);
  };
  const preview = useMemo(() => build(logoData ?? card.logoUrl ?? null),
    [origin, color, bg, style, withLogo, frame, label, logoData, card.logoUrl]);

  function downloadSvg() {
    if (withLogo && card.logoUrl && !logoData) toast.message("الشعار مرتبط برابط خارجي داخل الملف وقد لا يظهر في بعض البرامج.");
    const svg = build(logoData ?? card.logoUrl ?? null);
    download(svgToDataUrl(svg), `qr-${card.slug}.svg`);
  }

  async function downloadPng() {
    const svg = build(logoData);
    if (withLogo && card.logoUrl && !logoData) toast.message("تعذّر تضمين الشعار في الصورة، فتم التنزيل بدونه.");
    const img = new Image();
    img.src = svgToDataUrl(svg);
    await img.decode().catch(() => null);
    const scale = 2048 / (img.naturalWidth || 120);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round((img.naturalWidth || 120) * scale);
    canvas.height = Math.round((img.naturalHeight || 120) * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    try {
      download(canvas.toDataURL("image/png"), `qr-${card.slug}.png`);
    } catch {
      toast.error("تعذّر إنشاء الصورة، جرّب تنزيل SVG.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-2xl border border-border p-8 flex flex-col items-center justify-center gap-4 min-h-[380px]"
        style={{ background: "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%) 50% / 20px 20px" }}>
        <div className="w-64 max-w-full drop-shadow-xl" dangerouslySetInnerHTML={{ __html: preview }} />
        <p className="text-xs text-muted-foreground" dir="ltr">{origin && cardQrUrl(origin, card.slug)}</p>
      </div>

      <div className="space-y-5 rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0" />
            لون الرمز
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0" />
            الخلفية
          </label>
        </div>
        {lowContrast && (
          <p className="flex items-start gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            التباين ضعيف، وقد يصعب مسح الرمز. اجعل لون الرمز داكنًا على خلفية فاتحة.
          </p>
        )}

        <div className="space-y-1.5">
          <Label>شكل النقاط</Label>
          <div className="flex rounded-lg bg-muted p-1 gap-1">
            {([["rounded", "ناعم"], ["dots", "نقاط"], ["square", "مربعات"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setStyle(v)} aria-pressed={style === v}
                className={cn("flex-1 rounded-md py-1.5 text-xs font-medium", style === v ? "bg-background shadow-sm" : "text-muted-foreground")}>{l}</button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>الإطار</Label>
          <div className="flex rounded-lg bg-muted p-1 gap-1">
            {([["label", "إطار بعبارة"], ["badge", "شارة"], ["none", "بدون"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setFrame(v)} aria-pressed={frame === v}
                className={cn("flex-1 rounded-md py-1.5 text-xs font-medium", frame === v ? "bg-background shadow-sm" : "text-muted-foreground")}>{l}</button>
            ))}
          </div>
          {frame !== "none" && (
            <Input value={label} maxLength={18} onChange={(e) => setLabel(e.target.value)} placeholder="امسحني" />
          )}
        </div>

        <label className={cn("flex items-center justify-between text-sm", !card.logoUrl && "opacity-50")}>
          <span className="flex items-center gap-1.5"><ImageIcon className="h-4 w-4" /> الشعار في المنتصف</span>
          <Switch checked={withLogo && !!card.logoUrl} onCheckedChange={setWithLogo} disabled={!card.logoUrl} />
        </label>
        {!card.logoUrl && <p className="text-xs text-muted-foreground -mt-3">أضف شعارًا لبطاقتك من المحرر ليظهر هنا.</p>}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button onClick={downloadPng}><Download className="h-4 w-4" /> PNG</Button>
          <Button variant="outline" onClick={downloadSvg}><Download className="h-4 w-4" /> SVG للمطبعة</Button>
        </div>
        <p className="text-xs text-muted-foreground">استخدمه على المنيو والفواتير والبوسترات وواجهة المحل. SVG يُكبَّر لأي مقاس بدون فقد الجودة.</p>
      </div>
    </div>
  );
}
