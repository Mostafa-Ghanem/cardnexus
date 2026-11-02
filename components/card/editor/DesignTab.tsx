"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ui/image-upload";
import { Lock } from "lucide-react";
import { TEMPLATES } from "@/types";
import type { CardData, DesignPolicy } from "@/types";
import { FREE_TEMPLATES } from "@/lib/plans";
import {
  FONT_OPTIONS, LAYOUT_OPTIONS, ROUNDED_OPTIONS, SHADOW_OPTIONS,
  SOCIAL_STYLE_OPTIONS, AVATAR_BORDER_OPTIONS, BG_OPTIONS,
} from "./editorConstants";
import { DomainSection } from "./DomainSection";
import { useState } from "react";
import { extractPalette, readableOnWhite } from "@/lib/color-extract";
import { Sparkles } from "lucide-react";

interface Props {
  card: Partial<CardData>;
  update: <K extends keyof CardData>(key: K, value: CardData[K] | null) => void;
  policy: DesignPolicy;
  allTemplates: boolean;
  allowedDomains?: string[];
  canCustomDomain?: boolean;
}

function LockedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
      <Lock className="h-3 w-3" /> مقفل من المدير
    </span>
  );
}

export function DesignTab({ card, update, policy, allTemplates, allowedDomains, canCustomDomain }: Props) {
  const hasBrandColors = policy.brandColors.length > 0;
  const [logoPalette, setLogoPalette] = useState<string[]>([]);
  async function suggestFromLogo(src: File | string) {
    const colors = await extractPalette(src);
    setLogoPalette(colors);
  }

  return (
    <div className="space-y-8">
      {/* Template */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">القالب</Label>
          {!policy.allowTemplateChange && <LockedBadge />}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((t) => {
            const policyLocked = !policy.allowTemplateChange;
            const planLocked   = !allTemplates && !FREE_TEMPLATES.includes(t.id);
            const locked       = policyLocked || planLocked;
            return (
              <button key={t.id} type="button" disabled={locked}
                onClick={() => !locked && update("templateId", t.id as CardData["templateId"])}
                className={`rounded-xl border-2 p-4 text-left transition-all relative ${
                  card.templateId === t.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}>
                {planLocked && (
                  <span className="absolute top-2 end-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                    <Lock className="h-2.5 w-2.5" /> Pro
                  </span>
                )}
                <div className="h-8 w-8 rounded-lg mb-2" style={{ backgroundColor: t.preview }} />
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Primary color */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base">اللون الأساسي</Label>
          {!policy.allowColorChange && <LockedBadge />}
        </div>
        {policy.allowColorChange ? (
          <>
            {hasBrandColors && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">ألوان هوية المؤسسة</p>
                <div className="flex flex-wrap gap-2">
                  {policy.brandColors.map((c) => (
                    <button key={c} type="button" title={c} onClick={() => update("primaryColor", c)}
                      className={`h-8 w-8 rounded-lg border-2 transition-all ${
                        card.primaryColor === c ? "border-foreground scale-110" : "border-transparent hover:border-muted-foreground"
                      }`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <input type="color" value={card.primaryColor ?? "#0F172A"}
                onChange={(e) => update("primaryColor", e.target.value)}
                className="h-10 w-16 rounded-md border border-input cursor-pointer" />
              <Input value={card.primaryColor ?? "#0F172A"}
                onChange={(e) => update("primaryColor", e.target.value)}
                className="font-mono w-32" maxLength={7} />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 opacity-50">
            <div className="h-10 w-16 rounded-md border border-input" style={{ backgroundColor: card.primaryColor ?? "#0F172A" }} />
            <span className="font-mono text-sm">{card.primaryColor ?? "#0F172A"}</span>
          </div>
        )}
      </section>

      {/* Accent color */}
      <section className="space-y-2">
        <Label className="text-base">اللون المميز <span className="text-xs font-normal text-muted-foreground">(اختياري)</span></Label>
        <p className="text-xs text-muted-foreground">لون ثانٍ للأيقونات والروابط والأزرار</p>
        <div className="flex items-center gap-3">
          <input type="color" value={card.accentColor ?? card.primaryColor ?? "#0F172A"}
            onChange={(e) => update("accentColor", e.target.value)}
            className="h-10 w-16 rounded-md border border-input cursor-pointer" />
          <Input value={card.accentColor ?? ""} onChange={(e) => update("accentColor", e.target.value || null)}
            className="font-mono w-32" placeholder="مثل الأساسي" maxLength={7} />
          {card.accentColor && (
            <Button type="button" variant="ghost" size="sm" onClick={() => update("accentColor", null)}
              className="text-muted-foreground">إعادة تعيين</Button>
          )}
        </div>
      </section>

      {/* Background */}
      <section className="space-y-3">
        <Label className="text-base">الخلفية</Label>
        <div className="grid grid-cols-3 gap-2">
          {BG_OPTIONS.map((b) => (
            <button key={b.value} type="button"
              onClick={() => update("cardBackground", b.value as never)}
              className={`rounded-lg border-2 p-3 text-left transition-all ${
                (card.cardBackground ?? "white") === b.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
              }`}>
              <p className="text-sm font-medium">{b.label}</p>
              <p className="text-xs text-muted-foreground">{b.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Shadow */}
      <section className="space-y-3">
        <Label className="text-base">ظل البطاقة</Label>
        <div className="flex gap-2 flex-wrap">
          {SHADOW_OPTIONS.map((s) => (
            <button key={s.value} type="button"
              onClick={() => update("shadowStyle", s.value as never)}
              className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                (card.shadowStyle ?? "md") === s.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Font */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">الخط</Label>
          {!policy.allowFontChange && <LockedBadge />}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {FONT_OPTIONS.map((f) => {
            const locked = !policy.allowFontChange;
            return (
              <button key={f.value} type="button" disabled={locked}
                onClick={() => !locked && update("fontFamily", f.value as never)}
                className={`rounded-lg border-2 p-3 text-left transition-all ${
                  (card.fontFamily ?? "inter") === f.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}>
                <p className={`text-2xl mb-1 ${f.className}`}>{f.preview}</p>
                <p className="text-xs font-medium">{f.label}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Layout */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">التخطيط</Label>
          {!policy.allowLayoutChange && <LockedBadge />}
        </div>
        <div className="space-y-2">
          {LAYOUT_OPTIONS.map((l) => {
            const locked = !policy.allowLayoutChange;
            return (
              <button key={l.value} type="button" disabled={locked}
                onClick={() => !locked && update("layoutStyle", l.value as never)}
                className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                  (card.layoutStyle ?? "standard") === l.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}>
                <p className="text-sm font-medium">{l.label}</p>
                <p className="text-xs text-muted-foreground">{l.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Rounded */}
      <section className="space-y-3">
        <Label className="text-base">استدارة الزوايا</Label>
        <div className="flex gap-2">
          {ROUNDED_OPTIONS.map((r) => (
            <button key={r.value} type="button"
              onClick={() => update("roundedStyle", r.value as never)}
              className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all ${
                (card.roundedStyle ?? "default") === r.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </section>

      {/* Avatar border */}
      <section className="space-y-3">
        <Label className="text-base">إطار الصورة</Label>
        <div className="flex gap-2">
          {AVATAR_BORDER_OPTIONS.map((a) => (
            <button key={a.value} type="button"
              onClick={() => update("avatarBorder", a.value as never)}
              className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all ${
                (card.avatarBorder ?? "none") === a.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
              }`}>
              {a.label}
            </button>
          ))}
        </div>
      </section>

      {/* Social style */}
      <section className="space-y-3">
        <Label className="text-base">نمط روابط التواصل</Label>
        <div className="space-y-2">
          {SOCIAL_STYLE_OPTIONS.map((s) => (
            <button key={s.value} type="button"
              onClick={() => update("socialStyle", s.value as never)}
              className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                (card.socialStyle ?? "icons") === s.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
              }`}>
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Logo */}
      <section className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">شعار الشركة</p>
            <p className="text-xs text-muted-foreground mt-0.5">يظهر صغيرًا في أعلى البطاقة</p>
          </div>
          {!policy.canEditLogo && <LockedBadge />}
        </div>
        {policy.canEditLogo ? (
          <>
            <ImageUpload value={card.logoUrl} onChange={(url) => update("logoUrl", url)}
              label="رفع الشعار" shape="wide" className="h-20" onFileSelected={suggestFromLogo} />
            {policy.allowColorChange && card.logoUrl && logoPalette.length === 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => suggestFromLogo(card.logoUrl!)}>
                <Sparkles className="h-3.5 w-3.5" /> اقترح ألوانًا من الشعار
              </Button>
            )}
            {policy.allowColorChange && logoPalette.length > 0 && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <p className="text-xs font-medium flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-primary" /> ألوان من شعارك — اضغط لتطبيقها</p>
                <div className="flex flex-wrap gap-2">
                  {logoPalette.map((c, i) => (
                    <button key={c} type="button" title={c}
                      onClick={() => { update("primaryColor", readableOnWhite(c)); const other = logoPalette[i === 0 ? 1 : 0]; if (other) update("accentColor", other); }}
                      className="h-9 w-9 rounded-full border-2 border-white shadow ring-1 ring-border transition-transform hover:scale-110"
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          card.logoUrl
            ? <img src={card.logoUrl} alt="الشعار" className="h-10 w-auto max-w-[120px] object-contain opacity-60" />
            : <p className="text-xs text-muted-foreground">لا يوجد شعار</p>
        )}
      </section>

      {/* Toggles */}
      {[
        { key: "showQrOnCard" as const,        label: "إظهار رمز QR على البطاقة",         desc: "رمز QR صغير على البطاقة نفسها" },
        { key: "isPublic" as const,            label: "بطاقة عامة",                 desc: "البطاقة ظاهرة للجميع" },
        { key: "showInTeamDirectory" as const, label: "إظهار في دليل الفريق",     desc: "يظهر ملفك في الدليل العام لمؤسستك" },
        { key: "hideShareButton" as const,     label: "إخفاء زر المشاركة",         desc: "بدون زر مشاركة في صفحة البطاقة العامة" },
      ].map(({ key, label, desc }) => (
        <div key={key} className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
          <Switch
            checked={card[key] as boolean ?? (key !== "showQrOnCard" && key !== "hideShareButton")}
            onCheckedChange={(v) => update(key, v)}
          />
        </div>
      ))}

      {/* Domain */}
      <DomainSection card={card} update={update} allowedDomains={allowedDomains} canCustomDomain={canCustomDomain} />
    </div>
  );
}
