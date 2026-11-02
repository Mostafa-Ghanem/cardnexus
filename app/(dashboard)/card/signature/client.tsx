"use client";

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
  { id: "standard", label: "Standard",  desc: "شريط لوني + بيانات التواصل" },
  { id: "compact",  label: "مختصر",   desc: "عمودان، صغير" },
  { id: "rich",     label: "Rich",      desc: "صورة + روابط التواصل" },
  { id: "modern",   label: "Modern",    desc: "شريط علوي ملوّن" },
  { id: "minimal",  label: "Minimal",   desc: "نص فقط بدون أيقونات" },
  { id: "dark",     label: "Dark",      desc: "خلفية داكنة" },
];

const GUIDES: Record<string, { title: string; steps: string[] }> = {
  gmail: {
    title: "Gmail",
    steps: [
      "افتح Gmail ← الإعدادات ← عرض كل الإعدادات",
      'انزل إلى «التوقيع» ← «إنشاء توقيع جديد»',
      "اكتب اسمًا ثم اضغط داخل مربع النص",
      "الصق كود HTML المنسوخ (Ctrl+V / Cmd+V)",
      "احفظ التغييرات أسفل الصفحة",
    ],
  },
  outlook: {
    title: "Outlook",
    steps: [
      "ملف ← خيارات ← البريد ← التوقيعات",
      'اضغط «جديد» واكتب اسمًا',
      "الصق كود HTML في حقل التوقيع",
      "اختره افتراضيًا للرسائل الجديدة والردود",
      "اضغط موافق للحفظ",
    ],
  },
  apple: {
    title: "Apple Mail",
    steps: [
      "Mail ← الإعدادات ← التوقيعات",
      'اضغط «+» واكتب اسمًا',
      'ألغِ تحديد «استخدام الخط الافتراضي دائمًا»',
      "احفظ كود HTML كملف .html واسحبه إلى حقل التوقيع",
    ],
  },
};

export function SignatureClient({ card: initialCard, allCards = [] }: Props) {
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
            <Label>البطاقة</Label>
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
          <p className="text-sm font-medium">اختر النمط</p>
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={cn(
                  "text-start rounded-xl border p-3 transition-colors",
                  style === s.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <p className="font-medium text-sm">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
          <p className="text-sm font-medium">خيارات</p>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-normal">اللون المميز</Label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-16 cursor-pointer rounded border border-border p-0.5"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-normal">
              صورة الملف{!card.avatarUrl && <span className="text-xs text-muted-foreground ms-1">(لا توجد صورة)</span>}
            </Label>
            <Switch checked={showAvatar} onCheckedChange={setShowAvatar} disabled={!card.avatarUrl} />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-normal">روابط التواصل الاجتماعي</Label>
            <Switch checked={showSocials} onCheckedChange={setShowSocials} />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-normal">زر «البطاقة الرقمية»</Label>
            <Switch checked={showCardLink} onCheckedChange={setShowCardLink} />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-normal">
              تذييل <span className="text-xs text-muted-foreground">(مثل تنويه قانوني)</span>
            </Label>
            <Textarea
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="تنويه السرية، سياسة الخصوصية…"
              rows={2}
              className="text-xs resize-none"
            />
          </div>
        </div>

        {/* Copy buttons */}
        <div className="space-y-2">
          <Button onClick={copy} className="w-full" size="lg">
            {copied
              ? <><Check className="h-4 w-4" /> تم نسخ HTML!</>
              : <><Copy className="h-4 w-4" /> نسخ كود HTML</>}
          </Button>
          <Button onClick={copyPlain} variant="outline" className="w-full">
            {copiedTxt
              ? <><Check className="h-4 w-4" /> تم نسخ النص!</>
              : <><Copy className="h-4 w-4" /> نسخ كنص عادي</>}
          </Button>
        </div>

        {/* Client guides */}
        <div className="space-y-2">
          <p className="text-sm font-medium">طريقة الإضافة لبرنامج البريد</p>
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
        <p className="text-sm font-medium">معاينة</p>
        <div className="border border-border rounded-xl bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3 bg-gray-50 space-y-1">
            {[
              { label: "من:",  val: card.email ?? "name@example.com" },
              { label: "An:",   val: "empfaenger@beispiel.de" },
              { label: "الموضوع:",val: "رسالتي" },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium w-10">{label}</span>
                <span>{val}</span>
              </div>
            ))}
          </div>
          <div className="px-4 py-4">
            <p className="text-sm text-gray-400 mb-6">مرحبًا،<br /><br />…<br /><br />مع خالص التحية</p>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>

        <details className="group">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
            عرض كود HTML
          </summary>
          <pre className="mt-2 p-3 rounded-lg bg-muted text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed text-muted-foreground">
            {html}
          </pre>
        </details>
      </div>
    </div>
  );
}
