"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import { T } from "@/components/i18n/I18nProvider";


import { useState } from "react";
import { Copy, Check, Code2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface CardOption {
  slug: string;
  name: string;
}

interface WidgetClientProps {
  cards: CardOption[];
  canSelectMultiple: boolean;
}

export function WidgetClient({ cards, canSelectMultiple }: WidgetClientProps) {
  const tI18n = useI18n().t;
  const [selectedSlug, setSelectedSlug] = useState(cards[0]?.slug ?? "");
  const [width, setWidth] = useState("400");
  const [height, setHeight] = useState("700");
  const [copied, setCopied] = useState<"iframe" | "link" | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const cardUrl = selectedSlug ? `${baseUrl}/c/${selectedSlug}` : "";

  const iframeCode = selectedSlug
    ? `<iframe\n  src="${cardUrl}"\n  width="${width}"\n  height="${height}"\n  frameborder="0"\n  style="border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);"\n  title="Digitale Visitenkarte"\n  loading="lazy"\n></iframe>`
    : "";

  async function copy(text: string, key: "iframe" | "link") {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Code2 className="h-6 w-6" /><T text={"Karte einbetten"} /></h1>
        <p className="text-muted-foreground mt-1"><T text={"Bette deine digitale Karte per iFrame direkt auf deiner Website ein."} /></p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        {/* Card selector */}
        <div>
          <Label htmlFor="card-select"><T text={"Karte auswählen"} /></Label>
          {canSelectMultiple && cards.length > 1 ? (
            <select
              id="card-select"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {cards.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.slug})
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-1 flex items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm">
              <span>{cards[0]?.name ?? "—"}</span>
              <code className="text-xs text-muted-foreground">/c/{selectedSlug}</code>
            </div>
          )}

          {!canSelectMultiple && (
            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-amber-500" /><T text={"Mehrere Karten ab"} />{" "}
              <Link href="/upgrade" className="text-primary underline underline-offset-2"><T text={"Pro"} /></Link>
              {" "}<T text={"verfügbar."} /></p>
          )}
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="width"><T text={"Breite (px)"} /></Label>
            <Input id="width" value={width} onChange={(e) => setWidth(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="height"><T text={"Höhe (px)"} /></Label>
            <Input id="height" value={height} onChange={(e) => setHeight(e.target.value)} className="mt-1" />
          </div>
        </div>
      </div>

      {selectedSlug && (
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium"><T text={"Direktlink"} /></p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted rounded-lg px-3 py-2 truncate">{cardUrl}</code>
              <Button size="sm" variant="outline" onClick={() => copy(cardUrl, "link")}>
                {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium"><T text={"iFrame-Code"} /></p>
            <div className="relative">
              <pre className="text-xs bg-muted rounded-xl p-4 overflow-x-auto whitespace-pre leading-relaxed">{iframeCode}</pre>
              <Button
                size="sm" variant="outline"
                className="absolute top-2 right-2"
                onClick={() => copy(iframeCode, "iframe")}
              >
                {copied === "iframe" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium"><T text={"Vorschau"} /></p>
            <div className="flex justify-center bg-muted rounded-2xl p-6">
              <iframe
                src={cardUrl}
                width={Math.min(parseInt(width) || 400, 500)}
                height={Math.min(parseInt(height) || 700, 700)}
                frameBorder={0}
                style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}
                title={tI18n("Vorschau")}
                loading="lazy"
              />
            </div>
          </div>
        </>
      )}

      {!selectedSlug && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm"><T text={"Keine Karte gefunden. Erstelle zuerst eine Karte."} /></div>
      )}
    </div>
  );
}
