"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { CardPreview } from "@/components/card/CardPreview";
import { TEMPLATES } from "@/types";
import type { CardData } from "@/types";
import { extractPalette, readableOnWhite } from "@/lib/color-extract";
import { normalizeContactPhone } from "@/lib/lead-validation";

const COLORS = ["#0F766E", "#1D4ED8", "#7C3AED", "#BE123C", "#B45309", "#0F172A"];
const translations = {
  "ar-SA": {
    steps: ["بياناتك", "التصميم", "النشر"], title: "جهّز بطاقتك الرقمية", intro: "ثلاث خطوات بسيطة. تقدر تكمل باقي التفاصيل لاحقًا.",
    first: "الاسم الأول", last: "اسم العائلة", job: "المسمى الوظيفي", company: "الشركة", mobile: "رقم الجوال",
    email: "البريد الإلكتروني", contact: "أضف رقم جوال أو بريدًا إلكترونيًا على الأقل.",
    design: "اختر الشكل المناسب", designSub: "ارفع شعارك أو اختر لونًا وتصميمًا من الخيارات.",
    logo: "رفع الشعار", color: "اللون الرئيسي", template: "تصميم البطاقة",
    review: "بطاقتك جاهزة للنشر", reviewSub: "راجع البيانات ثم انشر بطاقتك للحصول على رابط المشاركة.",
    next: "التالي", back: "رجوع", publish: "انشر بطاقتي", publishing: "جارٍ النشر…",
    done: "تم إنشاء بطاقتك!", copy: "نسخ الرابط", open: "معاينة البطاقة", share: "مشاركة عبر واتساب",
    edit: "المحرر الكامل", error: "تعذّر إنشاء البطاقة. حاول مرة ثانية.", preview: "معاينة مباشرة",
  },
  en: {
    steps: ["Your details", "Design", "Publish"], title: "Create your digital card", intro: "Three quick steps. Add the remaining details later.",
    first: "First name", last: "Last name", job: "Job title", company: "Company", mobile: "Mobile number",
    email: "Email address", contact: "Enter a mobile number or an email address.",
    design: "Make it yours", designSub: "Add your logo or choose a color and card design.",
    logo: "Upload logo", color: "Main color", template: "Card design",
    review: "Ready to publish", reviewSub: "Review your details, then publish your shareable card.",
    next: "Next", back: "Back", publish: "Publish my card", publishing: "Publishing…",
    done: "Your card is ready!", copy: "Copy link", open: "View card", share: "Share on WhatsApp",
    edit: "Full editor", error: "Could not create your card. Please try again.", preview: "Live preview",
  },
  de: {
    steps: ["Deine Daten", "Design", "Veröffentlichen"], title: "Erstelle deine digitale Karte",
    intro: "Drei einfache Schritte. Weitere Details kannst du später ergänzen.",
    first: "Vorname", last: "Nachname", job: "Berufsbezeichnung", company: "Unternehmen",
    mobile: "Mobilnummer", email: "E-Mail", contact: "Bitte gib eine Mobilnummer oder E-Mail ein.",
    design: "Gestalte deine Karte", designSub: "Logo hochladen oder Farbe und Vorlage auswählen.",
    logo: "Logo hochladen", color: "Hauptfarbe", template: "Kartenvorlage",
    review: "Bereit zur Veröffentlichung", reviewSub: "Prüfe deine Daten und veröffentliche die Karte.",
    next: "Weiter", back: "Zurück", publish: "Karte veröffentlichen", publishing: "Wird veröffentlicht…",
    done: "Deine Karte ist fertig!", copy: "Link kopieren", open: "Karte ansehen", share: "Per WhatsApp teilen",
    edit: "Erweiterter Editor", error: "Karte konnte nicht erstellt werden.", preview: "Live-Vorschau",
  },
} as const;

export function OnboardingWizard({
  userName, userEmail, userPlan,
}: { userName: string; userEmail: string; userPlan: string }) {
  const { locale } = useI18n();
  const t = translations[locale];
  const [first, ...rest] = userName.trim().split(/\s+/);
  const [card, setCard] = useState<Partial<CardData>>({
    firstName: first || "", lastName: rest.join(" "), email: userEmail,
    title: "", company: "", mobile: "", logoUrl: null,
    primaryColor: COLORS[0], templateId: "classic", customLinks: [],
  });
  const [step, setStep] = useState(0);
  const [colors, setColors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ id: string; slug: string } | null>(null);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const assign = (values: Partial<CardData>) => setCard(previous => ({ ...previous, ...values }));
  const availableTemplates = userPlan === "free" ? TEMPLATES.slice(0, 4) : TEMPLATES;
  const valid = Boolean(card.firstName?.trim() && (card.email?.trim() || card.mobile?.trim()));

  async function onLogo(file: File) {
    const palette = await extractPalette(file);
    if (palette.length) {
      setColors(palette);
      assign({ primaryColor: readableOnWhite(palette[0]), accentColor: palette[1] || null });
    }
  }
  async function publish() {
    if (busy || created || !valid) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: card.firstName?.trim(), lastName: card.lastName?.trim(),
          title: card.title?.trim(), company: card.company?.trim(),
          mobile: normalizeContactPhone(card.mobile || ""), email: card.email?.trim(),
          templateId: card.templateId, primaryColor: card.primaryColor, logoUrl: card.logoUrl,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.id || !result.slug) throw new Error(result.error || t.error);
      setCreated({ id: result.id, slug: result.slug });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  const url = created && origin ? `${origin}/c/${created.slug}` : "";
  if (created) return (
    <section className="mx-auto max-w-2xl space-y-5 rounded-3xl border border-border bg-card p-6 text-center sm:p-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold">{t.done}</h1>
      <div className="mx-auto max-w-sm"><CardPreview card={card} /></div>
      <div className="flex items-center gap-2 rounded-lg bg-muted p-2" dir="ltr">
        <span className="min-w-0 flex-1 truncate text-start text-sm">{url}</span>
        <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(url)} aria-label={t.copy}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button asChild><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" />{t.open}</a></Button>
        <Button asChild variant="outline">
          <a href={`https://wa.me/?text=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />{t.share}
          </a>
        </Button>
        <Button asChild variant="outline"><Link href={`/card?card=${created.id}`}>{t.edit}</Link></Button>
      </div>
    </section>
  );

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 rounded-3xl border border-border bg-card p-5 sm:p-8">
        <ol className="mb-7 flex items-center gap-2" aria-label={t.title}>
          {t.steps.map((label, i) => <li key={label} className="flex flex-1 items-center gap-2">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${step >= i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {step > i ? <Check className="mx-auto h-4 w-4" /> : <span className="mx-auto">{i + 1}</span>}
            </span>
            <span className="hidden text-xs font-medium sm:block">{label}</span>
            {i < 2 && <span className="h-0.5 flex-1 bg-border" />}
          </li>)}
        </ol>

        {step === 0 && <div className="space-y-4">
          <h1 className="text-xl font-bold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.intro}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="setup-first">{t.first} *</Label><Input id="setup-first" autoComplete="given-name" required
              value={card.firstName || ""} onChange={e => assign({ firstName: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="setup-last">{t.last}</Label><Input id="setup-last" autoComplete="family-name"
              value={card.lastName || ""} onChange={e => assign({ lastName: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="setup-job">{t.job}</Label><Input id="setup-job" autoComplete="organization-title"
              value={card.title || ""} onChange={e => assign({ title: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="setup-company">{t.company}</Label><Input id="setup-company" autoComplete="organization"
              value={card.company || ""} onChange={e => assign({ company: e.target.value })} /></div>
          </div>
          <div className="space-y-1"><Label htmlFor="setup-mobile">{t.mobile}</Label><Input id="setup-mobile" type="tel" inputMode="tel" autoComplete="tel" dir="ltr"
            placeholder="+966 5X XXX XXXX" value={card.mobile || ""} onChange={e => assign({ mobile: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="setup-email">{t.email}</Label><Input id="setup-email" type="email" autoComplete="email" dir="ltr"
            value={card.email || ""} onChange={e => assign({ email: e.target.value })} /></div>
          {!valid && <p className="text-xs text-muted-foreground">{t.contact}</p>}
        </div>}

        {step === 1 && <div className="space-y-5">
          <h1 className="text-xl font-bold">{t.design}</h1>
          <p className="text-sm text-muted-foreground">{t.designSub}</p>
          <ImageUpload value={card.logoUrl} onChange={logoUrl => assign({ logoUrl })}
            onFileSelected={onLogo} label={t.logo} shape="wide" />
          <p className="text-sm font-medium">{t.color}</p>
          <div className="flex flex-wrap gap-2">
            {[...colors.map(readableOnWhite), ...COLORS].filter((c,i,a)=>a.indexOf(c)===i).map(c =>
              <button key={c} type="button" title={c} aria-label={c} onClick={() => assign({ primaryColor: c })}
                aria-pressed={card.primaryColor === c}
                className={`h-9 w-9 rounded-full border-2 ${card.primaryColor === c ? "ring-2 ring-offset-2 ring-primary" : "border-transparent"}`}
                style={{backgroundColor:c}} />
            )}
            <input type="color" aria-label={t.color} value={card.primaryColor || COLORS[0]}
              onChange={e=>assign({ primaryColor:e.target.value })} className="h-9 w-9 cursor-pointer" />
          </div>
          <p className="text-sm font-medium">{t.template}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {availableTemplates.map(template =>
              <button key={template.id} type="button" onClick={() => assign({ templateId: template.id })}
                aria-pressed={card.templateId === template.id}
                className={`rounded-xl border-2 p-3 text-start text-sm ${card.templateId === template.id ? "border-primary" : "border-border"}`}>
                <span className="mb-2 block h-9 rounded-md" style={{background:template.preview}} />
                {template.name}
              </button>
            )}
          </div>
        </div>}

        {step === 2 && <div className="space-y-4">
          <h1 className="text-xl font-bold">{t.review}</h1>
          <p className="text-sm text-muted-foreground">{t.reviewSub}</p>
          <dl className="space-y-2 rounded-xl bg-muted/50 p-4 text-sm">
            <div className="flex justify-between gap-3"><dt>{t.first}</dt><dd><bdi>{[card.firstName,card.lastName].filter(Boolean).join(" ")}</bdi></dd></div>
            <div className="flex justify-between gap-3"><dt>{t.mobile}</dt><dd dir="ltr">{card.mobile || "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt>{t.email}</dt><dd dir="ltr">{card.email || "—"}</dd></div>
          </dl>
        </div>}
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <div className="mt-7 flex items-center justify-between gap-3">
          {step > 0 ? <Button variant="outline" onClick={() => setStep(s => s-1)} disabled={busy}>
            <ArrowRight className="h-4 w-4" />{t.back}
          </Button> : <Link className="text-sm text-muted-foreground underline" href="/card?advanced=1">{t.edit}</Link>}
          {step < 2 ? <Button size="lg" disabled={step === 0 && !valid} onClick={() => setStep(s => s+1)}>
            {t.next}<ArrowLeft className="h-4 w-4" />
          </Button> : <Button size="lg" disabled={busy || !valid} onClick={publish}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? t.publishing : t.publish}
          </Button>}
        </div>
      </section>
      <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-center text-xs text-muted-foreground">{t.preview}</p>
        <CardPreview card={card} />
      </aside>
    </div>
  );
}
