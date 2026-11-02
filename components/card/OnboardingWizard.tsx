"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Check, Copy, ExternalLink, Loader2, Lock, MessageCircle, Printer, Sparkles, Settings2,
} from "lucide-react";
import type { CardData } from "@/types";
import { TEMPLATES } from "@/types";
import { FREE_TEMPLATES } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { CardPreview } from "./CardPreview";
import { FitWidth } from "@/components/ui/fit-width";
import { extractPalette, readableOnWhite } from "@/lib/color-extract";
import { normalizeDigits } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STEPS = ["بياناتك", "الشكل", "النشر"] as const;
const PRESET_COLORS = ["#0F766E", "#1D4ED8", "#7C3AED", "#BE123C", "#B45309", "#0F172A", "#047857", "#C026D3"];

export function OnboardingWizard({ userName, userEmail, userPlan }: { userName: string; userEmail: string; userPlan: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [first, ...rest] = (userName || "").trim().split(/\s+/);
  const [card, setCard] = useState<Partial<CardData>>({
    firstName: first ?? "", lastName: rest.join(" "), title: "", company: "",
    mobile: "", email: userEmail ?? "", templateId: "classic", primaryColor: "#0F766E",
    roundedStyle: "default", shadowStyle: "md", cardBackground: "white", customLinks: [],
  });
  const [palette, setPalette] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ id: string; slug: string } | null>(null);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const set = <K extends keyof CardData>(k: K, v: CardData[K] | null) => setCard((c) => ({ ...c, [k]: v }));
  const allTemplates = userPlan !== "free";
  const canNext = step === 0 ? !!card.firstName?.trim() && (!!card.mobile?.trim() || !!card.email?.trim()) : true;

  async function onLogo(file: File) {
    const colors = await extractPalette(file);
    if (colors.length) {
      setPalette(colors);
      set("primaryColor", readableOnWhite(colors[0]));
      if (colors[1]) set("accentColor", colors[1]);
      toast.success("طبّقنا ألوان شعارك على البطاقة");
    }
  }

  async function publish() {
    setSaving(true);
    try {
      const res = await fetch("/api/cards", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: card.firstName, lastName: card.lastName, templateId: card.templateId, primaryColor: card.primaryColor }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "تعذّر إنشاء البطاقة");
      const mobile = card.mobile ? normalizeDigits(card.mobile) : null;
      const patch = await fetch("/api/cards", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: json.id, title: card.title || null, company: card.company || null,
          mobile, whatsapp: mobile, email: card.email || null,
          logoUrl: card.logoUrl ?? null, accentColor: card.accentColor ?? null,
        }),
      });
      if (!patch.ok) throw new Error("تعذّر حفظ البيانات");
      setCreated({ id: json.id, slug: json.slug });
      setStep(3);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  const url = created && origin ? `${origin}/c/${created.slug}` : "";
  const templates = useMemo(() => TEMPLATES.slice(0, 8), []);

  if (step === 3 && created) {
    return (
      <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10 text-center">
        <Confetti />
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 animate-pop">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">بطاقتك جاهزة! 🎉</h1>
        <p className="mt-2 text-muted-foreground">شاركها الآن، وكل من يفتحها يقدر يحفظ رقمك بضغطة واحدة.</p>
        <div className="mx-auto mt-6 w-full max-w-[300px] animate-rise">
          <CardPreview card={card} scale={1} />
        </div>
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-muted p-2 ps-4 text-sm" dir="ltr">
          <span className="flex-1 truncate text-start font-mono text-muted-foreground">{url}</span>
          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(url); toast.success("تم نسخ الرابط"); }}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button asChild className="bg-[#25D366] hover:bg-[#1ebe5b] text-white">
            <a href={`https://wa.me/?text=${encodeURIComponent(`بطاقتي الرقمية: ${url}`)}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> شاركها على واتساب
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> افتح بطاقتك</a>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/card/print?card=${created.id}`}><Printer className="h-4 w-4" /> اطبع كارتك</Link>
          </Button>
          <Button variant="outline" onClick={() => { router.push(`/card?card=${created.id}`); router.refresh(); }}>
            <Settings2 className="h-4 w-4" /> أكمل التخصيص
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-8">
        {/* Progress */}
        <ol className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2">
              <span className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary/10 text-primary ring-2 ring-primary" : "bg-muted text-muted-foreground",
              )}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</span>
              <span className={cn("text-sm font-medium hidden sm:inline", i === step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
              {i < STEPS.length - 1 && <span className={cn("h-0.5 flex-1 rounded", i < step ? "bg-primary" : "bg-muted")} />}
            </li>
          ))}
        </ol>

        <div key={step} className="animate-rise">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold">لنبدأ ببطاقتك الرقمية</h1>
                <p className="text-sm text-muted-foreground mt-1">دقيقة واحدة فقط. يمكنك إضافة الباقي لاحقًا.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field id="wz-first" label="الاسم الأول *"><Input id="wz-first" autoFocus autoComplete="given-name" value={card.firstName ?? ""} onChange={(e) => set("firstName", e.target.value)} /></Field>
                <Field id="wz-last" label="اسم العائلة"><Input id="wz-last" autoComplete="family-name" value={card.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field id="wz-title" label="المسمى الوظيفي"><Input id="wz-title" autoComplete="organization-title" placeholder="مثال: مدير مبيعات" value={card.title ?? ""} onChange={(e) => set("title", e.target.value)} /></Field>
                <Field id="wz-company" label="الشركة"><Input id="wz-company" autoComplete="organization" value={card.company ?? ""} onChange={(e) => set("company", e.target.value)} /></Field>
              </div>
              <Field id="wz-mobile" label="رقم الجوال (وواتساب)">
                <Input id="wz-mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="+9665XXXXXXXX" value={card.mobile ?? ""} onChange={(e) => set("mobile", e.target.value)} />
              </Field>
              <Field id="wz-email" label="البريد الإلكتروني">
                <Input id="wz-email" type="email" autoComplete="email" value={card.email ?? ""} onChange={(e) => set("email", e.target.value)} />
              </Field>
              {!canNext && card.firstName && <p className="text-xs text-muted-foreground">أضف رقم الجوال أو البريد ليتمكن الناس من التواصل معك.</p>}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold">اجعلها تشبه علامتك</h1>
                <p className="text-sm text-muted-foreground mt-1">ارفع شعارك وسنستخرج ألوانه تلقائيًا.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-[180px_1fr] items-start">
                <ImageUpload value={card.logoUrl} onChange={(u) => set("logoUrl", u)} label="رفع الشعار" shape="wide" className="h-24" onFileSelected={onLogo} />
                <div className="space-y-2">
                  <Label>اللون</Label>
                  <div className="flex flex-wrap gap-2">
                    {[...palette.map(readableOnWhite), ...PRESET_COLORS].filter((c, i, a) => a.indexOf(c) === i).slice(0, 10).map((c) => (
                      <button key={c} type="button" onClick={() => set("primaryColor", c)} aria-label={c}
                        className={cn("h-9 w-9 rounded-full border-2 transition-transform hover:scale-110", card.primaryColor === c ? "border-foreground scale-110" : "border-transparent")}
                        style={{ backgroundColor: c }} />
                    ))}
                    <label className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-border" title="لون مخصص">
                      <input type="color" value={card.primaryColor ?? "#0F766E"} onChange={(e) => set("primaryColor", e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                      <span className="flex h-full items-center justify-center text-xs text-muted-foreground">+</span>
                    </label>
                  </div>
                  {palette.length > 0 && <p className="text-xs text-primary flex items-center gap-1"><Sparkles className="h-3 w-3" /> أول الألوان مأخوذة من شعارك</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>القالب</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {templates.map((t) => {
                    const locked = !allTemplates && !FREE_TEMPLATES.includes(t.id);
                    return (
                      <button key={t.id} type="button" disabled={locked} onClick={() => set("templateId", t.id as CardData["templateId"])}
                        className={cn("relative overflow-hidden rounded-xl border-2 bg-muted/40 text-start transition-all",
                          card.templateId === t.id ? "border-primary shadow-md" : "border-transparent hover:border-border",
                          locked && "opacity-60 cursor-not-allowed")}>
                        <FitWidth width={340} maxHeight={150} className="pointer-events-none">
                          <CardPreview card={{ ...card, templateId: t.id as CardData["templateId"] }} />
                        </FitWidth>
                        <div className="flex items-center justify-between border-t border-border bg-card px-2 py-1.5 text-xs font-medium">
                          {t.name}
                          {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold">كل شيء جاهز للنشر</h1>
                <p className="text-sm text-muted-foreground mt-1">راجع المعاينة، ثم انشر بطاقتك واحصل على رابطك.</p>
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  ["الاسم", [card.firstName, card.lastName].filter(Boolean).join(" ")],
                  ["المسمى", [card.title, card.company].filter(Boolean).join(" · ") || "—"],
                  ["الجوال", card.mobile || "—"],
                  ["البريد", card.email || "—"],
                ].map(([k, v]) => (
                  <li key={k} className="flex justify-between gap-4 rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">{k}</span><bdi className="font-medium truncate">{v}</bdi>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">بعد النشر تقدر تضيف الصورة الشخصية، روابط التواصل، النسخة الإنجليزية، ومعرض أعمالك.</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}><ArrowRight className="h-4 w-4" /> رجوع</Button>
          ) : (
            <Link href="/card?advanced=1" className="text-sm text-muted-foreground hover:text-foreground">أفضّل المحرر الكامل</Link>
          )}
          {step < 2 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext} size="lg">
              التالي <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={publish} disabled={saving} size="lg">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} انشر بطاقتي
            </Button>
          )}
        </div>
      </div>

      {/* Live preview */}
      <div className="lg:sticky lg:top-6 self-start">
        <p className="mb-3 text-center text-xs font-medium text-muted-foreground">معاينة مباشرة</p>
        <div className="mx-auto w-full max-w-[340px] transition-all">
          <CardPreview card={card} />
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label>{children}</div>;
}

/** Lightweight CSS confetti (no dependency). */
function Confetti() {
  const pieces = Array.from({ length: 36 }, (_, i) => i);
  const colors = ["#0F766E", "#F59E0B", "#EC4899", "#3B82F6", "#10B981", "#8B5CF6"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((i) => (
        <span key={i} className="confetti-piece" style={{
          left: `${(i * 37) % 100}%`,
          background: colors[i % colors.length],
          animationDelay: `${(i % 12) * 0.08}s`,
          animationDuration: `${2.2 + (i % 5) * 0.35}s`,
          transform: `rotate(${i * 23}deg)`,
        }} />
      ))}
    </div>
  );
}
