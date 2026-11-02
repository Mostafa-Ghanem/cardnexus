"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  RotateCcw, Printer, FileDown, LayoutGrid, Save, Lock, Users, Check, QrCode, MonitorPlay, CreditCard, Loader2, Sparkles,
} from "lucide-react";
import type { CardData } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  PRINT_FONTS, PRINT_FONTS_HREF, PRINT_SIZES, encodePrintDesign, parsePrintDesign,
  type PrintDesign, type PrintFontId, type PrintSizeId,
} from "@/lib/print-design";
import { PRINT_DESIGNS, getPrintDesign, shade } from "@/components/print/designs";
import { ScaledFace, useOrigin } from "@/components/print/PrintFace";
import { QrDesigner } from "@/components/print/QrDesigner";
import { MeetingBackground } from "@/components/print/MeetingBackground";
import { cn } from "@/lib/utils";

type Tab = "print" | "qr" | "background";

interface Props {
  cards: CardData[];
  initialCardId?: string;
  initialTab: Tab;
  isFree: boolean;
  canTeamPrint: boolean;
  appName: string;
}

export function PrintStudio({ cards, initialCardId, initialTab, isFree, canTeamPrint, appName }: Props) {
  const [cardId, setCardId] = useState(initialCardId && cards.some((c) => c.id === initialCardId) ? initialCardId : cards[0].id);
  const [tab, setTab] = useState<Tab>(initialTab);
  const card = cards.find((c) => c.id === cardId)!;

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "print", label: "الكارت المطبوع", icon: CreditCard },
    { id: "qr", label: "رمز QR بهويتك", icon: QrCode },
    { id: "background", label: "خلفية الاجتماعات", icon: MonitorPlay },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <link rel="stylesheet" href={PRINT_FONTS_HREF} precedence="default" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> استوديو الطباعة والهوية
          </h1>
          <p className="text-muted-foreground mt-1">صمّم كارتك المطبوع ورمز QR وخلفية الاجتماعات من بيانات بطاقتك، بدون إعادة كتابة.</p>
        </div>
        {cards.length > 1 && (
          <select
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            aria-label="البطاقة"
          >
            {cards.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.slug}</option>)}
          </select>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1 w-full sm:w-fit" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all",
              tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "print" && <PrintTab key={card.id} card={card} isFree={isFree} canTeamPrint={canTeamPrint} appName={appName} />}
      {tab === "qr" && <QrDesigner key={card.id} card={card} />}
      {tab === "background" && <MeetingBackground key={card.id} card={card} />}
    </div>
  );
}

/* ─── Printed card ──────────────────────────────────────────────────────── */

function PrintTab({ card, isFree, canTeamPrint, appName }: { card: CardData; isFree: boolean; canTeamPrint: boolean; appName: string }) {
  const origin = useOrigin();
  const [design, setDesign] = useState<PrintDesign>(() => {
    const d = parsePrintDesign(card.printDesign);
    if (card.printDesign) return d;
    // First visit: start from the card's own brand colour.
    return { ...d, primary: card.primaryColor, accent: card.accentColor ?? shade(card.primaryColor, 0.45) };
  });
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedJson, setSavedJson] = useState(card.printDesign ?? "");
  const def = getPrintDesign(design.designId);
  const locked = isFree && !def.free;
  const dirty = JSON.stringify(design) !== savedJson;
  const hasEnglish = useMemo(() => {
    try { return !!JSON.parse(card.translations ?? "{}")?.en; } catch { return false; }
  }, [card.translations]);

  const set = <K extends keyof PrintDesign>(k: K, v: PrintDesign[K]) => setDesign((d) => ({ ...d, [k]: v }));
  const setShow = (k: keyof PrintDesign["show"], v: boolean) => setDesign((d) => ({ ...d, show: { ...d.show, [k]: v } }));

  function pickDesign(id: string) {
    const nd = getPrintDesign(id);
    setDesign((d) => ({
      ...d,
      designId: id,
      primary: nd.primary ?? card.primaryColor,
      accent: nd.accent ?? card.accentColor ?? shade(card.primaryColor, 0.45),
      font: nd.font,
    }));
  }

  async function save(silent = false): Promise<boolean> {
    if (!dirty) return true;
    setSaving(true);
    try {
      const json = JSON.stringify(design);
      const res = await fetch("/api/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: card.id, printDesign: json }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setSavedJson(saved.printDesign ?? json);
      if (!silent) toast.success("تم حفظ تصميم الكارت");
      return true;
    } catch {
      toast.error("تعذّر الحفظ، حاول مرة أخرى");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function exportPdf(mode: "pro" | "exact" | "sheet") {
    if (locked) {
      toast.error("هذا التصميم ضمن باقة Pro", { action: { label: "ترقية", onClick: () => (window.location.href = "/upgrade") } });
      return;
    }
    if (mode === "sheet" && isFree) {
      toast.error("لوح A4 ضمن باقة Pro", { action: { label: "ترقية", onClick: () => (window.location.href = "/upgrade") } });
      return;
    }
    // Open the window synchronously (popup blockers), then point it at the print page after saving.
    const w = window.open("about:blank", "_blank");
    const ok = await save(true);
    const url = `/print/${card.slug}?mode=${mode}&auto=1`;
    if (!ok) { w?.close(); return; }
    if (w) w.location.href = url; else window.location.href = url;
  }

  function teamPrint() {
    window.open(`/print/team?d=${encodePrintDesign(design)}&mode=sheet`, "_blank");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* Preview */}
      <div className="space-y-4 lg:sticky lg:top-4 self-start">
        <div
          className="relative rounded-2xl p-6 sm:p-10 overflow-hidden"
          style={{ background: "radial-gradient(120% 100% at 50% 0%, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)" }}
        >
          <div className="mx-auto max-w-[520px]" style={{ perspective: "1600px" }}>
            <div
              className="relative transition-transform duration-700 ease-out"
              style={{ transformStyle: "preserve-3d", transform: `rotateX(6deg) rotateY(${flipped ? 180 : 0}deg)` }}
            >
              <div style={{ backfaceVisibility: "hidden", filter: "drop-shadow(0 18px 24px rgba(0,0,0,.18)) drop-shadow(0 4px 6px rgba(0,0,0,.08))" }}>
                <ScaledFace card={card} design={design} side="front" origin={origin} branding={null} />
              </div>
              <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", filter: "drop-shadow(0 18px 24px rgba(0,0,0,.18))" }}>
                <ScaledFace card={card} design={design} side="back" origin={origin} branding={isFree ? appName : null} />
              </div>
            </div>
          </div>
          {locked && (
            <div className="absolute top-3 start-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
              <Lock className="h-3 w-3" /> Pro
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFlipped((f) => !f)}>
            <RotateCcw className="h-4 w-4" /> {flipped ? "الوجه الأمامي" : "اقلب الكارت"}
          </Button>
          <span className="text-xs text-muted-foreground">{PRINT_SIZES[design.size].label} · {def.name}</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <Button onClick={() => exportPdf("pro")} className="w-full">
              <Printer className="h-4 w-4" /> PDF للمطبعة
            </Button>
            <Button variant="outline" onClick={() => exportPdf("exact")} className="w-full">
              <FileDown className="h-4 w-4" /> PDF بالمقاس الدقيق
            </Button>
            <Button variant="outline" onClick={() => exportPdf("sheet")} className="w-full">
              <LayoutGrid className="h-4 w-4" /> لوح A4 للطباعة المنزلية
            </Button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            «PDF للمطبعة» فيه هوامش قص 3 مم وعلامات قص، وهو ما تطلبه أغلب المطابع. «لوح A4» يضع عدة كروت في صفحة لتطبعها في البيت أو المكتب ثم تقصّها.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => save()} disabled={!dirty || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : dirty ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              {dirty ? "حفظ التصميم" : "محفوظ"}
            </Button>
            {canTeamPrint && (
              <Button variant="ghost" size="sm" onClick={teamPrint}>
                <Users className="h-4 w-4" /> اطبع كروت كل الفريق بهذا التصميم
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-6">
        <section>
          <h2 className="text-sm font-semibold mb-3">اختر التصميم</h2>
          <div className="grid grid-cols-2 gap-3">
            {PRINT_DESIGNS.map((d) => {
              const active = d.id === design.designId;
              const preview: PrintDesign = { ...design, designId: d.id, primary: d.primary ?? card.primaryColor, accent: d.accent ?? card.accentColor ?? shade(card.primaryColor, 0.45), font: d.font };
              return (
                <button
                  key={d.id}
                  onClick={() => pickDesign(d.id)}
                  className={cn(
                    "group relative rounded-xl border-2 p-1.5 text-start transition-all hover:-translate-y-0.5 hover:shadow-md",
                    active ? "border-primary shadow-md" : "border-transparent bg-muted/40",
                  )}
                  aria-pressed={active}
                >
                  <ScaledFace card={card} design={preview} side="front" origin={origin} />
                  <div className="flex items-center justify-between px-1 pt-1.5">
                    <span className="text-xs font-medium truncate">{d.name}</span>
                    {!d.free && isFree ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600"><Lock className="h-3 w-3" />Pro</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">{d.category}</span>
                    )}
                  </div>
                  {active && <span className="absolute top-2.5 end-2.5 rounded-full bg-primary p-0.5 text-primary-foreground"><Check className="h-3 w-3" /></span>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">التخصيص</h2>

          <div className="grid grid-cols-2 gap-3">
            <ColorField label="اللون الأساسي" value={design.primary ?? card.primaryColor} onChange={(v) => set("primary", v)} />
            <ColorField label="اللون الثانوي" value={design.accent ?? "#14B8A6"} onChange={(v) => set("accent", v)} />
          </div>

          <div className="space-y-1.5">
            <Label>الخط</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(PRINT_FONTS) as PrintFontId[]).map((f) => (
                <button
                  key={f}
                  onClick={() => set("font", f)}
                  className={cn("rounded-lg border px-2 py-2 text-sm transition-colors", (design.font ?? def.font) === f ? "border-primary bg-primary/5" : "border-border hover:bg-muted")}
                  style={{ fontFamily: PRINT_FONTS[f].css }}
                >
                  أبجد Ab
                  <span className="block text-[10px] text-muted-foreground" style={{ fontFamily: "inherit" }}>{PRINT_FONTS[f].label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>اللغة</Label>
            <Segmented
              value={design.lang}
              onChange={(v) => set("lang", v as PrintDesign["lang"])}
              options={[
                { v: "ar", l: "عربي" },
                { v: "en", l: "English" },
                { v: "bi", l: "عربي + English" },
              ]}
            />
            {design.lang !== "ar" && !hasEnglish && (
              <p className="text-xs text-amber-600">
                أضف الاسم والمسمى بالإنجليزية من <Link href={`/card?card=${card.id}`} className="underline">تبويب English في المحرر</Link> ليظهرا على الكارت.
              </p>
            )}
            {design.lang === "bi" && <p className="text-xs text-muted-foreground">الوجه الأمامي بالعربي والخلفي بالإنجليزية مع رمز QR.</p>}
          </div>

          <div className="space-y-1.5">
            <Label>المقاس</Label>
            <Segmented
              value={design.size}
              onChange={(v) => set("size", v as PrintSizeId)}
              options={(Object.keys(PRINT_SIZES) as PrintSizeId[]).map((k) => ({ v: k, l: PRINT_SIZES[k].label.replace(" (3.5 × 2 بوصة)", "") }))}
            />
          </div>

          <div className="space-y-2">
            <Label>البيانات الظاهرة</Label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {([
                ["mobile", "الجوال", card.mobile],
                ["phone", "الهاتف", card.phone],
                ["email", "البريد", card.email],
                ["website", "الموقع", card.website],
                ["address", "العنوان", card.address],
                ["logo", "الشعار", card.logoUrl],
              ] as const).map(([k, l, val]) => (
                <label key={k} className={cn("flex items-center justify-between gap-2 text-sm", !val && "opacity-50")}>
                  <span>{l}{!val && <span className="text-[10px] text-muted-foreground"> (فارغ)</span>}</span>
                  <Switch checked={design.show[k]} onCheckedChange={(v) => setShow(k, v)} disabled={!val} />
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <label className="flex items-center justify-between gap-2 text-sm">
              <span>رمز QR على الخلف <span className="text-xs text-muted-foreground">(يفتح بطاقتك الرقمية)</span></span>
              <Switch checked={design.backQr} onCheckedChange={(v) => set("backQr", v)} />
            </label>
            {design.backQr && (
              <Segmented
                value={design.qrStyle}
                onChange={(v) => set("qrStyle", v as PrintDesign["qrStyle"])}
                options={[{ v: "rounded", l: "ناعم" }, { v: "dots", l: "نقاط" }, { v: "square", l: "مربعات" }]}
              />
            )}
            <label className="flex items-center justify-between gap-2 text-sm">
              <span>رمز NFC <span className="text-xs text-muted-foreground">(للكروت الذكية)</span></span>
              <Switch checked={design.nfc} onCheckedChange={(v) => set("nfc", v)} />
            </label>
            <div className="space-y-1.5">
              <Label htmlFor="tagline">جملة على الخلف (اختياري)</Label>
              <Input id="tagline" maxLength={70} value={design.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="مثال: حلول عقارية موثوقة منذ 2010" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm cursor-pointer">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0" />
      <span className="flex-1">{label}</span>
      <span className="font-mono text-[10px] text-muted-foreground" dir="ltr">{value.toUpperCase()}</span>
    </label>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div className="flex rounded-lg bg-muted p-1 gap-1">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          aria-pressed={value === o.v}
          className={cn("flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all", value === o.v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
