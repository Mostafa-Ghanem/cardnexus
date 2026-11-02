"use client";
import { T } from "@/components/i18n/I18nProvider";


import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getRoleLabel, canManageOrganization } from "@/lib/utils";
import { Save, Wallet, Bell } from "lucide-react";
import type { DeptPolicyOverride } from "@/types";
import {
  OrgInfoCard, DesignDefaultsCard, BrandColorsCard,
  PermissionsCard, DeptPoliciesCard, TemplateCardSection,
} from "./OrgSettingsCards";
import { SecurityCard } from "@/components/settings/SecurityCard";
import { AccountActions } from "@/components/settings/AccountActions";
import { WebhooksCard, ApiKeysCard, ReferralsCard } from "@/components/settings/IntegrationsCards";

interface OrgSettings {
  defaultTemplate: string; defaultFontFamily: string; defaultLayoutStyle: string;
  defaultAccentColor?: string | null; allowMemberTemplateChange: boolean;
  allowMemberColorChange: boolean; allowMemberFontChange: boolean;
  allowMemberLayoutChange: boolean; analyticsEnabled: boolean;
  cardFooterText?: string | null; brandColors?: string | null;
  departmentPolicies?: string | null; templateCardData?: string | null;
}

interface Props {
  user: {
    id: string; name: string; email: string; role: string;
    organizationId?: string | null; twoFactorEnabled: boolean;
    leadNotification: string;
  };
  org: { id: string; name: string; slug: string; primaryColor: string; settings?: OrgSettings | null } | null;
}

interface DeptRow { name: string; policy: DeptPolicyOverride }

function parseJson<T>(val: string | null | undefined, fallback: T): T {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

export function SettingsClientPage({ user, org }: Props) {
  const [orgName, setOrgName]   = useState(org?.name ?? "");
  const [orgColor, setOrgColor] = useState(org?.primaryColor ?? "#0F172A");

  const [defaultTemplate, setDefaultTemplate] = useState(org?.settings?.defaultTemplate ?? "classic");
  const [defaultFont, setDefaultFont]         = useState(org?.settings?.defaultFontFamily ?? "inter");
  const [defaultLayout, setDefaultLayout]     = useState(org?.settings?.defaultLayoutStyle ?? "standard");
  const [defaultAccent, setDefaultAccent]     = useState(org?.settings?.defaultAccentColor ?? "");

  const [allowTemplateChange, setAllowTemplateChange] = useState(org?.settings?.allowMemberTemplateChange ?? true);
  const [allowColorChange, setAllowColorChange]       = useState(org?.settings?.allowMemberColorChange ?? false);
  const [allowFontChange, setAllowFontChange]         = useState(org?.settings?.allowMemberFontChange ?? true);
  const [allowLayoutChange, setAllowLayoutChange]     = useState(org?.settings?.allowMemberLayoutChange ?? true);
  const [analyticsEnabled, setAnalyticsEnabled]       = useState(org?.settings?.analyticsEnabled ?? true);

  const [brandColors, setBrandColors] = useState<string[]>(() => parseJson(org?.settings?.brandColors, []));
  const [newColor, setNewColor]       = useState("#0F172A");

  const [deptRows, setDeptRows]     = useState<DeptRow[]>(() => {
    const raw: Record<string, DeptPolicyOverride> = parseJson(org?.settings?.departmentPolicies, {});
    return Object.entries(raw).map(([name, policy]) => ({ name, policy }));
  });
  const [newDeptName, setNewDeptName] = useState("");

  const templateData = parseJson(org?.settings?.templateCardData, {} as Record<string, string>);
  const [templateCompany, setTemplateCompany] = useState(templateData.company ?? "");
  const [templateColor, setTemplateColor]     = useState(templateData.primaryColor ?? "#0F172A");
  const [templateId, setTemplateId]           = useState(templateData.templateId ?? "classic");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const [leadNotif, setLeadNotif]       = useState(user.leadNotification);
  const [notifSaving, setNotifSaving]   = useState(false);
  const [notifSaved, setNotifSaved]     = useState(false);

  async function saveLeadNotification(value: string) {
    setLeadNotif(value);
    setNotifSaving(true);
    await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadNotification: value }),
    });
    setNotifSaving(false);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  }

  const [newName, setNewName]       = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved]   = useState(false);

  const [newEmail, setNewEmail]     = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError]   = useState("");
  const [emailSaved, setEmailSaved]   = useState(false);

  const canManageOrg = canManageOrganization(user.role);

  async function saveName() {
    if (!newName.trim() || newName.trim() === user.name) return;
    setNameSaving(true);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      setNameSaved(true);
      setTimeout(() => { setNameSaved(false); setNewName(""); }, 2000);
    }
    setNameSaving(false);
  }

  async function saveEmail() {
    if (!newEmail || newEmail === user.email) return;
    setEmailSaving(true); setEmailError("");
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail }),
    });
    const data = await res.json();
    if (!res.ok) { setEmailError(data.error ?? "Fehler"); }
    else { setEmailSaved(true); setTimeout(() => setEmailSaved(false), 3000); setNewEmail(""); }
    setEmailSaving(false);
  }

  async function saveOrgSettings() {
    setSaving(true);
    const deptPolicies: Record<string, DeptPolicyOverride> = Object.fromEntries(
      deptRows.map(({ name, policy }) => [name, policy])
    );
    await fetch("/api/organizations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: orgName, primaryColor: orgColor,
        settings: {
          defaultTemplate, defaultFontFamily: defaultFont,
          defaultLayoutStyle: defaultLayout, defaultAccentColor: defaultAccent || null,
          allowMemberTemplateChange: allowTemplateChange, allowMemberColorChange: allowColorChange,
          allowMemberFontChange: allowFontChange, allowMemberLayoutChange: allowLayoutChange,
          analyticsEnabled,
          brandColors: brandColors.length > 0 ? JSON.stringify(brandColors) : null,
          departmentPolicies: deptRows.length > 0 ? JSON.stringify(deptPolicies) : null,
          templateCardData: JSON.stringify({ company: templateCompany || null, primaryColor: templateColor, templateId }),
        },
      }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold"><T text={"Einstellungen"} /></h1>
        <p className="text-muted-foreground mt-1"><T text={"Account und Organisations-Einstellungen"} /></p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle><T text={"Account"} /></CardTitle>
          <CardDescription><T text={"Deine persönlichen Informationen"} /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge className="ml-auto" variant="secondary">{getRoleLabel(user.role)}</Badge>
          </div>
          <div className="border-t border-border pt-4 mt-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium"><T text={"Name ändern"} /></p>
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={user.name}
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                />
                <Button size="sm" onClick={saveName} disabled={nameSaving || !newName.trim()}>
                  {nameSaving ? "…" : nameSaved ? "✓" : "Speichern"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium"><T text={"E-Mail-Adresse ändern"} /></p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={user.email}
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && saveEmail()}
                />
                <Button size="sm" onClick={saveEmail} disabled={emailSaving || !newEmail}>
                  {emailSaving ? "…" : emailSaved ? "✓" : "Speichern"}
                </Button>
              </div>
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <SecurityCard twoFactorEnabled={user.twoFactorEnabled} />

      {/* Account actions (password, delete, export) */}
      <AccountActions />

      {/* Lead notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base"><T text={"Lead-Benachrichtigungen"} /></CardTitle>
            {notifSaved && <Badge variant="outline" className="ml-auto text-green-600 border-green-300"><T text={"Gespeichert"} /></Badge>}
            {notifSaving && <Badge variant="outline" className="ml-auto"><T text={"Wird gespeichert…"} /></Badge>}
          </div>
          <CardDescription><T text={"Wie möchtest du benachrichtigt werden, wenn jemand auf deiner Karte Kontakt hinterlässt?"} /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {([
              { value: "off",     label: "Keine Benachrichtigungen",    desc: "Leads werden nur im Dashboard gespeichert." },
              { value: "instant", label: "Sofort",                      desc: "Du bekommst bei jedem neuen Lead eine E-Mail." },
              { value: "daily",   label: "Tägliche Zusammenfassung",    desc: "Einmal täglich – nur wenn neue Leads vorliegen." },
            ] as const).map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => saveLeadNotification(value)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  leadNotif === value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                  leadNotif === value ? "border-primary" : "border-muted-foreground/40"
                }`}>
                  {leadNotif === value && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="text-sm font-medium"><T text={label} /></p>
                  <p className="text-xs text-muted-foreground"><T text={desc} /></p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <WebhooksCard />
      <ApiKeysCard />
      <ReferralsCard />

      {/* Organisation */}
      {org && canManageOrg && (
        <>
          <OrgInfoCard orgName={orgName} setOrgName={setOrgName} orgColor={orgColor} setOrgColor={setOrgColor} orgDisplayName={org.name} />
          <DesignDefaultsCard
            defaultTemplate={defaultTemplate} setDefaultTemplate={setDefaultTemplate}
            defaultFont={defaultFont} setDefaultFont={setDefaultFont}
            defaultLayout={defaultLayout} setDefaultLayout={setDefaultLayout}
            defaultAccent={defaultAccent} setDefaultAccent={setDefaultAccent}
            orgColor={orgColor}
          />
          <BrandColorsCard
            brandColors={brandColors} newColor={newColor} setNewColor={setNewColor}
            onAdd={() => { if (!brandColors.includes(newColor)) setBrandColors([...brandColors, newColor]); }}
            onRemove={(c) => setBrandColors(brandColors.filter((x) => x !== c))}
          />
          <PermissionsCard
            allowTemplateChange={allowTemplateChange} setAllowTemplateChange={setAllowTemplateChange}
            allowColorChange={allowColorChange} setAllowColorChange={setAllowColorChange}
            allowFontChange={allowFontChange} setAllowFontChange={setAllowFontChange}
            allowLayoutChange={allowLayoutChange} setAllowLayoutChange={setAllowLayoutChange}
            analyticsEnabled={analyticsEnabled} setAnalyticsEnabled={setAnalyticsEnabled}
          />
          <DeptPoliciesCard
            deptRows={deptRows} newDeptName={newDeptName} setNewDeptName={setNewDeptName}
            onAdd={() => {
              const name = newDeptName.trim();
              if (!name || deptRows.find((r) => r.name === name)) return;
              setDeptRows([...deptRows, { name, policy: { allowTemplateChange, allowColorChange, allowFontChange, allowLayoutChange } }]);
              setNewDeptName("");
            }}
            onRemove={(name) => setDeptRows(deptRows.filter((r) => r.name !== name))}
            onUpdatePolicy={(name, key, v) =>
              setDeptRows(deptRows.map((r) => r.name === name ? { ...r, policy: { ...r.policy, [key]: v } } : r))
            }
          />
          <TemplateCardSection
            templateCompany={templateCompany} setTemplateCompany={setTemplateCompany}
            templateColor={templateColor} setTemplateColor={setTemplateColor}
            templateId={templateId} setTemplateId={setTemplateId}
            orgName={orgName}
          />
          <Button onClick={saveOrgSettings} disabled={saving}>
            <Save className="h-4 w-4" />
            {saved ? "Gespeichert!" : saving ? "Wird gespeichert…" : "Einstellungen speichern"}
          </Button>
        </>
      )}

      {/* Wallet (coming soon) */}
      <Card className="border-dashed opacity-60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base"><T text={"Apple & Google Wallet"} /></CardTitle>
            <Badge variant="outline" className="ml-auto"><T text={"Demnächst"} /></Badge>
          </div>
          <CardDescription><T text={"Karten direkt in Apple Wallet oder Google Wallet speichern. Diese Funktion wird bald verfügbar sein."} /></CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
