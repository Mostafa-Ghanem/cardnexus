"use client";
import { T } from "@/components/i18n/I18nProvider";


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
    primaryColor:   "#0F172A",
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
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Fehler beim Speichern");
      // On new card creation, navigate to the card page with the new card selected
      if (isNew && json.id) {
        router.push(`/card?card=${json.id}`);
      }
      setSuccess(true);
      toast.success("Karte gespeichert");
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 min-w-0">
        <Tabs defaultValue="profile">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="profile"><T text={"Profil"} /></TabsTrigger>
            <TabsTrigger value="media"><T text={"Bilder"} /></TabsTrigger>
            <TabsTrigger value="contact"><T text={"Kontakt"} /></TabsTrigger>
            <TabsTrigger value="social"><T text={"Social"} /></TabsTrigger>
            <TabsTrigger value="design"><T text={"Design"} /></TabsTrigger>
            <TabsTrigger value="links"><T text={"Links"} /></TabsTrigger>
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label><T text={"Vorname"} /></Label>
                <Input value={card.firstName ?? ""} onChange={(e) => update("firstName", e.target.value || null)} placeholder="Max" />
              </div>
              <div className="space-y-1.5">
                <Label><T text={"Nachname"} /></Label>
                <Input value={card.lastName ?? ""} onChange={(e) => update("lastName", e.target.value || null)} placeholder="Mustermann" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label><T text={"Berufsbezeichnung"} /></Label>
              <Input value={card.title ?? ""} onChange={(e) => update("title", e.target.value || null)} placeholder="Senior Developer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label><T text={"Unternehmen"} /></Label>
                <Input value={card.company ?? ""} onChange={(e) => update("company", e.target.value || null)} placeholder="ACME GmbH" />
              </div>
              <div className="space-y-1.5">
                <Label><T text={"Abteilung"} /></Label>
                <Input value={card.department ?? ""} onChange={(e) => update("department", e.target.value || null)} placeholder="Engineering" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label><T text={"Kurzbeschreibung"} /></Label>
              <Textarea value={card.bio ?? ""} onChange={(e) => update("bio", e.target.value || null)}
                placeholder="Kurze Beschreibung über dich…" maxLength={500} />
              <p className="text-xs text-muted-foreground text-right">{(card.bio ?? "").length}/500</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label><T text={"Pronomen"} /></Label>
                <Input value={card.pronouns ?? ""} onChange={(e) => update("pronouns", e.target.value || null)} placeholder="er/ihm, she/her…" />
              </div>
              <div className="space-y-1.5">
                <Label><T text={"Geschlecht"} />{" "}<span className="text-xs font-normal text-muted-foreground"><T text={"(vCard)"} /></span></Label>
                <select
                  value={card.gender ?? ""}
                  onChange={(e) => update("gender", e.target.value || null)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— keine Angabe —</option>
                  <option value="m">Männlich</option>
                  <option value="w">Weiblich</option>
                  <option value="divers">Divers</option>
                  <option value="n">Keine Angabe</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label><T text={"Geburtstag"} /></Label>
              <Input value={card.birthday ?? ""} onChange={(e) => update("birthday", e.target.value || null)} type="date" />
            </div>

            {!isNew && card.slug && (
              <div className="space-y-1.5 pt-2 border-t border-border">
                <Label htmlFor="slug-field"><T text={"Karten-URL (Slug)"} /></Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">/c/</span>
                  <Input
                    id="slug-field"
                    value={card.slug}
                    onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-"))}
                    className="font-mono"
                    placeholder="mein-slug"
                  />
                </div>
                <p className="text-xs text-muted-foreground"><T text={"Der alte Link wird automatisch weitergeleitet. Speichere die Karte um die Änderung zu übernehmen."} /></p>
              </div>
            )}
          </TabsContent>

          {/* Media */}
          <TabsContent value="media" className="space-y-6">
            <div className="space-y-2">
              <Label><T text={"Avatar"} /></Label>
              <p className="text-xs text-muted-foreground"><T text={"Profilbild. Empfohlen: quadratisch, mind. 200×200 px."} /></p>
              <ImageUpload value={card.avatarUrl} onChange={(url) => update("avatarUrl", url)} label="Avatar hochladen" shape="circle" />
            </div>
            <div className="space-y-2">
              <Label><T text={"Cover-Bild"} /></Label>
              <p className="text-xs text-muted-foreground"><T text={"Hintergrundbild für das Modern-Template. Empfohlen: 800×300 px."} /></p>
              <ImageUpload value={card.coverUrl} onChange={(url) => update("coverUrl", url)} label="Cover hochladen" shape="wide" className="h-28" />
            </div>
          </TabsContent>

          {/* Contact */}
          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label><T text={"Telefon (Büro)"} /></Label>
                <Input value={card.phone ?? ""} onChange={(e) => update("phone", e.target.value || null)} placeholder="+49 89 1234567" type="tel" />
              </div>
              <div className="space-y-1.5">
                <Label><T text={"Mobil"} /></Label>
                <Input value={card.mobile ?? ""} onChange={(e) => update("mobile", e.target.value || null)} placeholder="+49 170 1234567" type="tel" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label><T text={"Fax"} /></Label>
              <Input value={card.fax ?? ""} onChange={(e) => update("fax", e.target.value || null)} placeholder="+49 89 1234568" type="tel" />
            </div>
            <div className="space-y-1.5">
              <Label><T text={"E-Mail"} /></Label>
              <Input value={card.email ?? ""} onChange={(e) => update("email", e.target.value || null)} placeholder="max@example.com" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label><T text={"Website"} /></Label>
              <Input value={card.website ?? ""} onChange={(e) => update("website", e.target.value || null)} placeholder="https://example.com" type="url" />
            </div>
            <div className="space-y-1.5">
              <Label><T text={"Adresse"} /></Label>
              <Input value={card.address ?? ""} onChange={(e) => update("address", e.target.value || null)} placeholder="Musterstraße 1, 80331 München" />
            </div>
            <div className="space-y-1.5">
              <Label><T text={"Terminbuchungs-Link"} />{" "}<span className="text-xs font-normal text-muted-foreground"><T text={"(Pro)"} /></span></Label>
              <Input value={card.bookingUrl ?? ""} onChange={(e) => update("bookingUrl", e.target.value || null)} placeholder="https://calendly.com/..." type="url" />
              <p className="text-xs text-muted-foreground"><T text={"Wird als Button auf deiner Karte angezeigt."} /></p>
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
            <p className="text-sm text-muted-foreground"><T text={"Eigene Links werden als Buttons auf der Karte angezeigt (max. 5). Ziehe am Griff"} /><GripVertical className="inline h-3.5 w-3.5 align-text-bottom" /><T text={", um die Reihenfolge zu ändern."} /></p>
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
                    aria-label={`Link ${i + 1} verschieben`}
                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 -ml-1"
                    title="Ziehen zum Sortieren"
                    tabIndex={-1}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <Input
                    placeholder="Label"
                    value={link.label}
                    onChange={(e) => updateLink(i, "label", e.target.value)}
                    className="w-32"
                    aria-label={`Link ${i + 1} Label`}
                  />
                  <Input
                    placeholder="https://…"
                    value={link.url}
                    onChange={(e) => updateLink(i, "url", e.target.value)}
                    type="url"
                    aria-label={`Link ${i + 1} URL`}
                  />
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => moveLink(i, i - 1)}
                      disabled={i === 0}
                      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 px-1 leading-3"
                      aria-label="Nach oben"
                    >▲</button>
                    <button
                      type="button"
                      onClick={() => moveLink(i, i + 1)}
                      disabled={i === (card.customLinks?.length ?? 0) - 1}
                      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 px-1 leading-3"
                      aria-label="Nach unten"
                    >▼</button>
                  </div>
                  <Button
                    type="button" variant="ghost" size="icon"
                    onClick={() => removeLink(i)}
                    aria-label={`Link ${i + 1} entfernen`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
            {(card.customLinks ?? []).length < 5 && (
              <Button type="button" variant="outline" size="sm" onClick={addLink}>
                <Plus className="h-4 w-4" /><T text={"Link hinzufügen"} /></Button>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive border border-destructive/20">{error}</p>
        )}
        {success && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 border border-emerald-200"><T text={"Gespeichert ✓"} /></p>
        )}

        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
          <Button type="button" onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Wird gespeichert…" : "Speichern"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowPreview(!showPreview)} className="lg:hidden">
            <Eye className="h-4 w-4" /><T text={"Vorschau"} /></Button>
        </div>
      </div>

      <div className={`lg:w-80 lg:sticky lg:top-4 lg:self-start ${showPreview ? "" : "hidden lg:block"}`}>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-4"><T text={"Live-Vorschau"} /></p>
        <CardPreview card={card} scale={0.85} />
      </div>
    </div>
  );
}
