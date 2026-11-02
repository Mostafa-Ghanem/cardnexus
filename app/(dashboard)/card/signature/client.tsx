"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import { T } from "@/components/i18n/I18nProvider";


import { useEffect, useState } from "react";
import type { CardData } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildHtml, buildPlainText, type SigStyle } from "./build-html";

interface Props {
  card: CardData;
  allCards?: CardData[];
}

const STYLES: { id: SigStyle; label: string; desc: string }[] = [
  { id: "standard", label: "Standard",  desc: "Farbbalken + Kontakt" },
  { id: "compact",  label: "Kompakt",   desc: "Zweispaltig, klein" },
  { id: "rich",     label: "Rich",      desc: "Foto + Social-Links" },
  { id: "modern",   label: "Modern",    desc: "Farbiger Headerstreifen" },
  { id: "minimal",  label: "Minimal",   desc: "Nur Text, keine Icons" },
  { id: "dark",     label: "Dark",      desc: "Dunkler Hintergrund" },
];

const GUIDES: Record<string, { title: string; steps: string[] }> = {
  gmail: {
    title: "Gmail",
    steps: [
      "Öffne Gmail → Einstellungen → Alle Einstellungen anzeigen",
      'Scrolle zu „Signatur" → „Neue Signatur erstellen"',
      "Namen eingeben, in das Textfeld klicken",
      "Kopierten HTML-Code einfügen (Strg+V / Cmd+V)",
      "Einstellungen ganz unten speichern",
    ],
  },
  outlook: {
    title: "Outlook",
    steps: [
      "Datei → Optionen → E-Mail → Signaturen",
      '„Neu" klicken, Namen eingeben',
      "Im Signaturfeld den HTML-Code einfügen",
      "Standard für neue Nachrichten & Antworten wählen",
      "OK klicken zum Speichern",
    ],
  },
  apple: {
    title: "Apple Mail",
    steps: [
      "Mail → Einstellungen → Signaturen",
      '„+" klicken, Namen eingeben',
      'Haken bei „Immer klassisches Design" entfernen',
      "HTML-Code als .html-Datei speichern und in das Signaturfeld ziehen",
    ],
  },
};

export function SignatureClient({ card: initialCard, allCards = [] }: Props) {
  const tI18n = useI18n().t;
  const cards = allCards.length > 0 ? allCards : [initialCard];

  const [activeCardId, setActiveCardId] = useState(initialCard.id);
  const [style,       setStyle]        = useState<SigStyle>("standard");
  const [color,       setColor]        = useState(initialCard.primaryColor ?? "#0F172A");
  const [showAvatar,  setShowAvatar]   = useState(true);
  const [showSocials, setShowSocials]  = useState(true);
  const [showCardLink,setShowCardLink] = useState(true);
  const [footerText,  setFooterText]   = useState("");
  const [copied,      setCopied]       = useState(false);
  const [copiedTxt,   setCopiedTxt]    = useState(false);
  const [guide,       setGuide]        = useState<string | null>(null);

  const card = cards.find((c) => c.id === activeCardId) ?? initialCard;

  useEffect(() => {
    setColor(card.primaryColor ?? "#0F172A");
  }, [card.primaryColor]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const opts    = { color, showAvatar, showSocials, showCardLink, footerText };
  const html    = buildHtml(card, style, baseUrl, opts);

  async function copy() {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function copyPlain() {
    await navigator.clipboard.writeText(buildPlainText(card));
    setCopiedTxt(true);
    setTimeout(() => setCopiedTxt(false), 2500);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* ── Controls ── */}
      <div className="space-y-6">

        {/* Card selector */}
        {cards.length > 1 && (
          <div className="space-y-1.5">
            <Label><T text={"Karte"} /></Label>
            <select
              value={activeCardId}
              onChange={(e) => setActiveCardId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Style picker */}
        <div className="space-y-2">
          <p className="text-sm font-medium"><T text={"Stil wählen"} /></p>
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={cn(
                  "text-left rounded-xl border p-3 transition-colors",
                  style === s.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <p className="font-medium text-sm"><T text={s.label} /></p>
                <p className="text-xs text-muted-foreground mt-0.5"><T text={s.desc} /></p>
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
          <p className="text-sm font-medium"><T text={"Optionen"} /></p>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-normal"><T text={"Akzentfarbe"} /></Label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-16 cursor-pointer rounded border border-border p-0.5"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-normal"><T text={"Profilfoto"} />{!card.avatarUrl && <span className="text-xs text-muted-foreground ml-1"><T text={"(kein Foto hinterlegt)"} /></span>}
            </Label>
            <Switch checked={showAvatar} onCheckedChange={setShowAvatar} disabled={!card.avatarUrl} />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-normal"><T text={"Social-Links"} /></Label>
            <Switch checked={showSocials} onCheckedChange={setShowSocials} />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-normal"><T text={"„Digitale Visitenkarte\"-Button"} /></Label>
            <Switch checked={showCardLink} onCheckedChange={setShowCardLink} />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-normal"><T text={"Fußzeile"} /><span className="text-xs text-muted-foreground"><T text={"(z.B. rechtlicher Hinweis)"} /></span>
            </Label>
            <Textarea
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder={tI18n("Vertraulichkeitshinweis, Datenschutzerklärung…")}
              rows={2}
              className="text-xs resize-none"
            />
          </div>
        </div>

        {/* Copy buttons */}
        <div className="space-y-2">
          <Button onClick={copy} className="w-full" size="lg">
            {copied
              ? <><Check className="h-4 w-4" />{" "}<T text={"HTML kopiert!"} /></>
              : <><Copy className="h-4 w-4" />{" "}<T text={"HTML-Code kopieren"} /></>}
          </Button>
          <Button onClick={copyPlain} variant="outline" className="w-full">
            {copiedTxt
              ? <><Check className="h-4 w-4" />{" "}<T text={"Klartext kopiert!"} /></>
              : <><Copy className="h-4 w-4" />{" "}<T text={"Als Klartext kopieren"} /></>}
          </Button>
        </div>

        {/* Client guides */}
        <div className="space-y-2">
          <p className="text-sm font-medium"><T text={"Anleitung für deinen E-Mail-Client"} /></p>
          {Object.entries(GUIDES).map(([key, g]) => (
            <div key={key} className="border border-border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
                onClick={() => setGuide(guide === key ? null : key)}
              >
                {g.title}
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {guide === key && (
                <ol className="px-4 pb-4 space-y-1.5 list-decimal list-inside">
                  {g.steps.map((step, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed">{step}</li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Preview ── */}
      <div className="space-y-3">
        <p className="text-sm font-medium"><T text={"Vorschau"} /></p>
        <div className="border border-border rounded-xl bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3 bg-gray-50 space-y-1">
            {[
              { label: "Von:",  val: card.email ?? "deine@email.de" },
              { label: "An:",   val: "empfaenger@beispiel.de" },
              { label: "Betr.:",val: "Meine Nachricht" },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium w-10"><T text={label} /></span>
                <span>{val}</span>
              </div>
            ))}
          </div>
          <div className="px-4 py-4">
            <p className="text-sm text-gray-400 mb-6"><T text={"Hallo,"} /><br /><br />…<br /><br /><T text={"Mit freundlichen Grüßen"} /></p>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>

        <details className="group">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"><T text={"HTML-Code anzeigen"} /></summary>
          <pre className="mt-2 p-3 rounded-lg bg-muted text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed text-muted-foreground">
            {html}
          </pre>
        </details>
      </div>
    </div>
  );
}
