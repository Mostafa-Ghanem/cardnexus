"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ui/image-upload";
import { CardPreview } from "./CardPreview";
import { DesignTab } from "./editor/DesignTab";
import type { CardData, CustomLink, DesignPolicy } from "@/types";
import { EnglishTab } from "./editor/EnglishTab";
import { localizeCard } from "@/lib/card-i18n";
import { whatsappDigits } from "@/lib/utils";
import { Plus, Trash2, Save, Eye, GripVertical } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface CardEditorProps {
  initialCard?: Partial<CardData>;
  isNew?: boolean;
  policy?: DesignPolicy;
  saveEndpoint?: string;
  userPlan?: string;
  allowedDomains?: string[];
  canCustomDomain?: boolean;
}

const OPEN_POLICY: DesignPolicy = {
  allowTemplateChange: true,
  allowColorChange: true,
  allowFontChange: true,
  allowLayoutChange: true,
  canEditLogo: true,
  brandColors: [],
  defaults: { template: "classic", fontFamily: "inter", layoutStyle: "standard" },
};

const SOCIAL_FIELDS = [
  { key: "linkedin",  label: "LinkedIn",    ph: "https://linkedin.com/in/..." },
  { key: "xing",      label: "Xing",        ph: "https://xing.com/profile/..." },
  { key: "twitter",   label: "Twitter / X", ph: "https://twitter.com/..." },
  { key: "instagram", label: "Instagram",   ph: "https://instagram.com/..." },
  { key: "github",    label: "GitHub",      ph: "https://github.com/..." },
  { key: "youtube",   label: "YouTube",     ph: "https://youtube.com/@..." },
];

export function CardEditor({ initialCard, isNew = false, policy = OPEN_POLICY, saveEndpoint, userPlan = "free", allowedDomains, canCustomDomain }: CardEditorProps) {
  const router = useRouter();
  const allTemplates = userPlan !== "free";

  const defaultCard: Partial<CardData> = {
    firstName: "", lastName: "",
    templateId:     (policy.defaults.template as CardData["templateId"]) ?? "classic",
    primaryColor:   "#0F766E",
    accentColor:    policy.defaults.accentColor,
    fontFamily:     policy.defaults.fontFamily ?? "inter",
    layoutStyle:    policy.defaults.layoutStyle ?? "standard",
    roundedStyle:   "default",
    shadowStyle:    "md",
    socialStyle:    "icons",
    avatarBorder:   "none",
    cardBackground: "white",
    showQrOnCard: false, showInTeamDirectory: true, isPublic: true,
    customLinks: [],
  };

  const [card, setCard]         = useState<Partial<CardData>>(initialCard ?? defaultCard);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLang, setPreviewLang] = useState<"ar" | "en">("ar");

  function update<K extends keyof CardData>(key: K, value: CardData[K] | null) {
    setCard((prev) => ({ ...prev, [key]: value }));
  }

  function addLink() {
    update("customLinks", [...(card.customLinks ?? []), { label: "", url: "" }] as CustomLink[]);
  }
  function updateLink(i: number, field: keyof CustomLink, value: string) {
    const links = [...(card.customLinks ?? [])];
    links[i] = { ...links[i], [field]: value };
    update("customLinks", links);
  }
  function removeLink(i: number) {
    update("customLinks", (card.customLinks ?? []).filter((_, idx) => idx !== i));
  }
  function moveLink(from: number, to: number) {
    const links = [...(card.customLinks ?? [])];
    if (to < 0 || to >= links.length || from === to) return;
    const [moved] = links.splice(from, 1);
    links.splice(to, 0, moved);
    update("customLinks", links);
  }

  async function save() {
    setSaving(true); setError(""); setSuccess(false);
    try {
      const method = isNew ? "POST" : "PATCH";
      // For PATCH the route reads `id` from the body — card state already contains it
      // when initialCard was provided. Ensure it's always present.
      const payload = isNew ? card : { ...card, id: card.id };
      const res = await fetch(saveEndpoint ?? "/api/cards", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "تعذّر الحفظ");
      // POST only creates the card shell (name, template, colour). Persist every
      // other field the user already filled in (title, phone, email, links…).
      if (isNew && json.id && !saveEndpoint) {
        const { slug: _slug, id: _id, ...fields } = card as Partial<CardData> & { id?: string };
        const patch = await fetch("/api/cards", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...fields, id: json.id }),
        });
        if (!patch.ok) {
          const pj = await patch.json().catch(() => ({}));
          throw new Error(typeof pj.error === "string" ? pj.error : "تعذّر حفظ بيانات البطاقة");
        }
      }
      // On new card creation, navigate to the card page with the new card selected
      if (isNew && json.id) {
        router.push(`/card?card=${json.id}`);
      }
      setSuccess(true);
      toast.success("تم حفظ البطاقة");
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 min-w-0">
        <Tabs defaultValue="profile" onValueChange={(v) => setPreviewLang(v === "english" ? "en" : "ar")}>
          <TabsList className="mb-6 h-auto gap-1 w-full justify-start overflow-x-auto flex-nowrap sm:flex-wrap">
            <TabsTrigger value="profile">الملف</TabsTrigger>
            <TabsTrigger value="media">الصور</TabsTrigger>
            <TabsTrigger value="contact">التواصل</TabsTrigger>
            <TabsTrigger value="social">السوشيال</TabsTrigger>
            <TabsTrigger value="design">التصميم</TabsTrigger>
            <TabsTrigger value="links">الروابط</TabsTrigger>
            <TabsTrigger value="english">English</TabsTrigger>
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>الاسم الأول</Label>
                <Input value={card.firstName ?? ""} onChange={(e) => update("firstName", e.target.value || null)} placeholder="أحمد" autoComplete="given-name" />
              </div>
              <div className="space-y-1.5">
                <Label>اسم العائلة</Label>
                <Input value={card.lastName ?? ""} onChange={(e) => update("lastName", e.target.value || null)} placeholder="حسن" autoComplete="family-name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>المسمى الوظيفي</Label>
              <Input value={card.title ?? ""} onChange={(e) => update("title", e.target.value || null)} placeholder="مدير المبيعات" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>الشركة</Label>
                <Input value={card.company ?? ""} onChange={(e) => update("company", e.target.value || null)} placeholder="اسم الشركة" />
              </div>
              <div className="space-y-1.5">
                <Label>القسم</Label>
                <Input value={card.department ?? ""} onChange={(e) => update("department", e.target.value || null)} placeholder="المبيعات" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>نبذة مختصرة</Label>
              <Textarea value={card.bio ?? ""} onChange={(e) => update("bio", e.target.value || null)}
                placeholder="نبذة قصيرة عنك…" maxLength={500} />
              <p className="text-xs text-muted-foreground text-end">{(card.bio ?? "").length}/500</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>صيغة المخاطبة</Label>
                <Input value={card.pronouns ?? ""} onChange={(e) => update("pronouns", e.target.value || null)} placeholder="أ. / م. / د." />
              </div>
              <div className="space-y-1.5">
                <Label>الجنس <span className="text-xs font-normal text-muted-foreground">(vCard)</span></Label>
                <select
                  value={card.gender ?? ""}
                  onChange={(e) => update("gender", e.target.value || null)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— بدون تحديد —</option>
                  <option value="m">ذكر</option>
                  <option value="w">أنثى</option>
                  <option value="divers">آخر</option>
                  <option value="n">أفضل عدم التحديد</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>تاريخ الميلاد</Label>
              <Input value={card.birthday ?? ""} onChange={(e) => update("birthday", e.target.value || null)} type="date" />
            </div>

            {!isNew && card.slug && (
              <div className="space-y-1.5 pt-2 border-t border-border">
                <Label htmlFor="slug-field">رابط البطاقة (Slug)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">/c/</span>
                  <Input
                    id="slug-field"
                    value={card.slug}
                    onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-"))}
                    className="font-mono"
                    placeholder="my-name"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  الرابط القديم سيتحول تلقائيًا للجديد. احفظ البطاقة لتطبيق التغيير.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Media */}
          <TabsContent value="media" className="space-y-6">
            <div className="space-y-2">
              <Label>الصورة الشخصية</Label>
              <p className="text-xs text-muted-foreground">يُفضل صورة مربعة 200×200 بكسل على الأقل.</p>
              <ImageUpload value={card.avatarUrl} onChange={(url) => update("avatarUrl", url)} label="رفع الصورة" shape="circle" />
            </div>
            <div className="space-y-2">
              <Label>صورة الغلاف</Label>
              <p className="text-xs text-muted-foreground">صورة خلفية لقالب Modern. يُفضل 800×300 بكسل.</p>
              <ImageUpload value={card.coverUrl} onChange={(url) => update("coverUrl", url)} label="رفع الغلاف" shape="wide" className="h-28" />
            </div>
          </TabsContent>

          {/* Contact */}
          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>هاتف المكتب</Label>
                <Input value={card.phone ?? ""} onChange={(e) => update("phone", e.target.value || null)} placeholder="+966 11 123 4567" type="tel" inputMode="tel" autoComplete="tel-national" />
              </div>
              <div className="space-y-1.5">
                <Label>الجوال</Label>
                <Input value={card.mobile ?? ""} onChange={(e) => update("mobile", e.target.value || null)} placeholder="+966 50 123 4567" type="tel" inputMode="tel" autoComplete="tel" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>واتساب</Label>
              <Input value={card.whatsapp ?? ""} onChange={(e) => update("whatsapp", e.target.value || null)} placeholder="+966 50 123 4567" type="tel" inputMode="tel" dir="ltr" />
              <p className={`text-xs ${card.whatsapp && !whatsappDigits(card.whatsapp) ? "text-destructive" : "text-muted-foreground"}`}>
                {card.whatsapp && !whatsappDigits(card.whatsapp)
                  ? "اكتب الرقم بالصيغة الدولية مع مفتاح الدولة، مثل ‎+966501234567"
                  : "يظهر زر «راسلني واتساب» على بطاقتك. إذا تركته فارغًا نستخدم رقم الجوال (بالصيغة الدولية)."}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>فاكس</Label>
              <Input value={card.fax ?? ""} onChange={(e) => update("fax", e.target.value || null)} placeholder="+966 11 123 4568" type="tel" inputMode="tel" />
            </div>
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني</Label>
              <Input value={card.email ?? ""} onChange={(e) => update("email", e.target.value || null)} placeholder="name@example.com" type="email" inputMode="email" autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label>الموقع الإلكتروني</Label>
              <Input value={card.website ?? ""} onChange={(e) => update("website", e.target.value || null)} placeholder="https://example.com" type="url" inputMode="url" autoComplete="url" />
            </div>
            <div className="space-y-1.5">
              <Label>العنوان</Label>
              <Input value={card.address ?? ""} onChange={(e) => update("address", e.target.value || null)} placeholder="الشارع، الحي، المدينة" />
            </div>
            <div className="space-y-1.5">
              <Label>رابط حجز المواعيد <span className="text-xs font-normal text-muted-foreground">(Pro)</span></Label>
              <Input value={card.bookingUrl ?? ""} onChange={(e) => update("bookingUrl", e.target.value || null)} placeholder="https://calendly.com/..." type="url" />
              <p className="text-xs text-muted-foreground">يظهر كزر على بطاقتك.</p>
            </div>
          </TabsContent>

          {/* Social */}
          <TabsContent value="social" className="space-y-4">
            {SOCIAL_FIELDS.map(({ key, label, ph }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  value={(card[key as keyof CardData] as string) ?? ""}
                  onChange={(e) => update(key as keyof CardData, (e.target.value || null) as never)}
                  placeholder={ph} type="url"
                />
              </div>
            ))}
          </TabsContent>

          {/* Design — extracted component */}
          <TabsContent value="design">
            <DesignTab card={card} update={update} policy={policy} allTemplates={allTemplates} allowedDomains={allowedDomains} canCustomDomain={canCustomDomain} />
          </TabsContent>

          {/* Custom Links — reorderable via drag handle */}
          <TabsContent value="links" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              الروابط المخصصة تظهر كأزرار على البطاقة (حتى 5).
              اسحب من المقبض <GripVertical className="inline h-3.5 w-3.5 align-text-bottom" /> لتغيير الترتيب.
            </p>
            <ul className="space-y-2">
              {(card.customLinks ?? []).map((link, i) => (
                <li
                  key={i}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", String(i));
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = parseInt(e.dataTransfer.getData("text/plain"));
                    if (Number.isFinite(from)) moveLink(from, i);
                  }}
                  className="group flex items-center gap-2 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 px-1 py-1 transition-colors"
                >
                  <button
                    type="button"
                    aria-label={`تحريك الرابط ${i + 1}`}
                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 -ms-1"
                    title="اسحب للترتيب"
                    tabIndex={-1}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <Input
                    placeholder="اسم الرابط"
                    value={link.label}
                    onChange={(e) => updateLink(i, "label", e.target.value)}
                    className="w-32"
                    aria-label={`اسم الرابط ${i + 1}`}
                  />
                  <Input
                    placeholder="https://…"
                    value={link.url}
                    onChange={(e) => updateLink(i, "url", e.target.value)}
                    type="url"
                    aria-label={`عنوان الرابط ${i + 1}`}
                  />
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => moveLink(i, i - 1)}
                      disabled={i === 0}
                      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 px-1 leading-3"
                      aria-label="لأعلى"
                    >▲</button>
                    <button
                      type="button"
                      onClick={() => moveLink(i, i + 1)}
                      disabled={i === (card.customLinks?.length ?? 0) - 1}
                      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 px-1 leading-3"
                      aria-label="لأسفل"
                    >▼</button>
                  </div>
                  <Button
                    type="button" variant="ghost" size="icon"
                    onClick={() => removeLink(i)}
                    aria-label={`حذف الرابط ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
            {(card.customLinks ?? []).length < 5 && (
              <Button type="button" variant="outline" size="sm" onClick={addLink}>
                <Plus className="h-4 w-4" /> إضافة رابط
              </Button>
            )}
          </TabsContent>
          <TabsContent value="english">
            <EnglishTab value={card.translations ?? null} onChange={(v) => update("translations", v)} />
          </TabsContent>
        </Tabs>

        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive border border-destructive/20">{error}</p>
        )}
        {success && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 border border-emerald-200">تم الحفظ ✓</p>
        )}

        <div className="sticky bottom-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-t border-border flex items-center gap-3 mt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:static lg:mx-0 lg:px-0 lg:pt-6 lg:bg-transparent">
          <Button type="button" onClick={save} disabled={saving} className="flex-1 lg:flex-none">
            <Save className="h-4 w-4" />
            {saving ? "جارٍ الحفظ…" : "حفظ"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowPreview(!showPreview)} className="lg:hidden">
            <Eye className="h-4 w-4" /> {showPreview ? "إخفاء المعاينة" : "معاينة"}
          </Button>
        </div>
      </div>

      <div className={`lg:w-80 lg:sticky lg:top-4 lg:self-start ${showPreview ? "" : "hidden lg:block"}`}>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-4">معاينة مباشرة</p>
        <div dir={previewLang === "en" ? "ltr" : "rtl"}>
          <CardPreview card={previewLang === "en" ? localizeCard(card, "en") : card} lang={previewLang} scale={0.85} />
        </div>
      </div>
    </div>
  );
}
