"use client";
import { T } from "@/components/i18n/I18nProvider";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { Save, Check, Globe, Type, Image, Palette, X, Plus } from "lucide-react";
import type { PlatformSettings } from "@/lib/platform";

function parseAllowedDomains(val: string | null): string[] {
  try { return val ? JSON.parse(val) : []; } catch { return []; }
}

export function AdminSettingsClient({ settings: initial }: { settings: PlatformSettings }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [domains, setDomains] = useState<string[]>(() => parseAllowedDomains(initial.allowedDomains));
  const [newDomain, setNewDomain] = useState("");

  function update<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }

  function addDomain() {
    const d = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!d || domains.includes(d)) return;
    setDomains([...domains, d]);
    setNewDomain("");
  }

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const payload = { ...s, allowedDomains: domains.length > 0 ? JSON.stringify(domains) : null };
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Fehler");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold"><T text={"Plattform-Einstellungen"} /></h1>
        <p className="text-muted-foreground mt-1"><T text={"Name, URL, Favicon und Branding der gesamten Anwendung"} /></p>
      </div>

      {/* App Identity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base"><T text={"Anwendungsname"} /></CardTitle>
          </div>
          <CardDescription><T text={"Wird in Browser-Tab, Sidebar, E-Mails und überall als Produktname angezeigt."} /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="appName"><T text={"Name"} /></Label>
            <Input
              id="appName"
              value={s.appName}
              onChange={(e) => update("appName", e.target.value)}
              placeholder="CardNexus"
              maxLength={64}
            />
            <p className="text-xs text-muted-foreground"><T text={"Vorschau Browser-Tab:"} /><span className="font-mono">{s.appName}{" "}<T text={"– Digitale Visitenkarten"} /></span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* App URL */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base"><T text={"Anwendungs-URL"} /></CardTitle>
          </div>
          <CardDescription><T text={"Basis-URL der Anwendung. Wird in QR-Codes, vCards und Einladungslinks verwendet."} /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="appUrl"><T text={"URL"} /></Label>
            <Input
              id="appUrl"
              value={s.appUrl}
              onChange={(e) => update("appUrl", e.target.value)}
              placeholder="https://meinedomain.de"
              type="url"
            />
            <p className="text-xs text-muted-foreground"><T text={"Beispiel-Karten-URL:"} /><span className="font-mono">{s.appUrl.replace(/\/$/, "")}/c/max-mustermann</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Favicon & Logo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base"><T text={"Favicon & Logo"} /></CardTitle>
          </div>
          <CardDescription><T text={"Favicon erscheint im Browser-Tab. Logo erscheint in der Sidebar statt der Initialen."} /></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label><T text={"Favicon"} /></Label>
            <p className="text-xs text-muted-foreground"><T text={"Empfohlen: quadratisch, mind. 32×32 px (PNG, ICO, SVG)."} /></p>
            <div className="flex items-start gap-4">
              <ImageUpload
                value={s.faviconUrl}
                onChange={(url) => update("faviconUrl", url)}
                label="Favicon hochladen"
                shape="square"
              />
              {s.faviconUrl && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1"><T text={"Vorschau"} /></p>
                    <div className="flex items-center gap-2">
                      <img src={s.faviconUrl} alt="Favicon" className="h-4 w-4 object-cover" />
                      <span className="font-mono">{s.appName}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label><T text={"Sidebar-Logo"} /></Label>
            <p className="text-xs text-muted-foreground"><T text={"Ersetzt die Buchstaben-Initialen in der Sidebar. Empfohlen: quadratisch, 64×64 px."} /></p>
            <ImageUpload
              value={s.logoUrl}
              onChange={(url) => update("logoUrl", url)}
              label="Logo hochladen"
              shape="square"
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base"><T text={"Sonstiges"} /></CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="supportEmail"><T text={"Support-E-Mail"} /></Label>
            <Input
              id="supportEmail"
              value={s.supportEmail ?? ""}
              onChange={(e) => update("supportEmail", e.target.value || null)}
              placeholder="support@meinedomain.de"
              type="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="footerText"><T text={"Footer-Text"} /></Label>
            <Input
              id="footerText"
              value={s.footerText ?? ""}
              onChange={(e) => update("footerText", e.target.value || null)}
              placeholder="© 2025 Meine Firma. Alle Rechte vorbehalten."
              maxLength={200}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Domains */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base"><T text={"Custom Domains"} /></CardTitle>
          </div>
          <CardDescription><T text={"Diese Domains können Nutzer und Organisationen für ihre Karten auswählen."} /></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {domains.map((d) => (
              <span key={d} className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full text-sm">
                {d}
                <button type="button" onClick={() => setDomains(domains.filter((x) => x !== d))}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {domains.length === 0 && (
              <p className="text-sm text-muted-foreground"><T text={"Noch keine Domains hinzugefügt."} /></p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDomain()}
              placeholder="karte.meinefirma.de"
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={addDomain}>
              <Plus className="h-4 w-4" /><T text={"Hinzufügen"} /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive border border-destructive/20">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saved ? (
            <><Check className="h-4 w-4" />{" "}<T text={"Gespeichert"} /></>
          ) : (
            <><Save className="h-4 w-4" /> {saving ? "Wird gespeichert…" : "Einstellungen speichern"}</>
          )}
        </Button>
        {saved && (
          <p className="text-sm text-muted-foreground"><T text={"Änderungen aktiv — Browser-Tab neu laden zum Prüfen"} /></p>
        )}
      </div>
    </div>
  );
}
