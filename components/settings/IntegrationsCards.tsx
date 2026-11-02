"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import { T } from "@/components/i18n/I18nProvider";


import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Webhook as WebhookIcon, KeyRound, Users, Copy, Check, Trash2, Loader2,
  Plus, Eye, EyeOff,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

/* ─── Webhooks ─────────────────────────────────────────────────────────── */

interface Webhook {
  id: string; name: string; url: string;
  events: string; // JSON array
  active: boolean; createdAt: string;
}

export function WebhooksCard() {
  const tI18n = useI18n().t;
  const [items, setItems] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/webhooks");
    const data = await res.json();
    setItems(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, events: ["lead"] }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      const msg = typeof d.error === "string" ? d.error : "URL muss mit https:// beginnen";
      setErr(msg);
      toast.error("Webhook konnte nicht angelegt werden", { description: msg });
    } else {
      setShowForm(false); setName(""); setUrl("");
      toast.success("Webhook angelegt");
      await load();
    }
    setBusy(false);
  }

  async function toggle(id: string, active: boolean) {
    await fetch("/api/webhooks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Webhook wirklich löschen?")) return;
    const res = await fetch("/api/webhooks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) toast.success("Webhook gelöscht");
    await load();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <WebhookIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <CardTitle className="text-base"><T text={"Webhooks"} /></CardTitle>
            <CardDescription><T text={"Erhalte HTTP-POSTs in Echtzeit, wenn neue Leads über deine Karten kommen. Signatur via"} /><code className="text-xs">X-FreddieCard-Signature</code><T text={"(HMAC-SHA256)."} /></CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /><T text={"Neu"} /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <form onSubmit={create} className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="wh-name"><T text={"Name"} /></Label>
                <Input id="wh-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder={tI18n("z.B. Slack Notifier")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wh-url"><T text={"Endpoint-URL"} /></Label>
                <Input id="wh-url" required type="url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}<T text={"Anlegen"} /></Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}><T text={"Abbrechen"} /></Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground"><T text={"Lädt…"} /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground"><T text={"Noch keine Webhooks angelegt."} /></p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {items.map((w) => (
              <li key={w.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{w.name}</span>
                    {w.active ? (
                      <Badge variant="success" className="text-xs"><T text={"Aktiv"} /></Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs"><T text={"Pausiert"} /></Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{w.url}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => toggle(w.id, !w.active)}>
                  {w.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(w.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── API Keys ─────────────────────────────────────────────────────────── */

interface ApiKey {
  id: string; name: string; prefix: string;
  lastUsedAt: string | null; createdAt: string;
  key?: string; // present only on the creation response
}

export function ApiKeysCard() {
  const tI18n = useI18n().t;
  const [items, setItems] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState<ApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/api-keys");
    const data = await res.json();
    setItems(data.data ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      setRevealed(data.data);
      setName("");
      setShowForm(false);
      toast.success("API-Key erstellt", { description: "Notiere ihn — er wird nicht erneut angezeigt." });
      await load();
    } else {
      toast.error("Konnte API-Key nicht erstellen");
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("API-Key wirklich widerrufen?")) return;
    const res = await fetch("/api/api-keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) toast.success("API-Key widerrufen");
    await load();
  }

  function copyKey() {
    if (!revealed?.key) return;
    navigator.clipboard?.writeText(revealed.key).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <KeyRound className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <CardTitle className="text-base"><T text={"API-Keys"} /></CardTitle>
            <CardDescription><T text={"Authentifiziere externe Skripte über die HTTP-API. Keys sind nur bei der Erstellung sichtbar."} /></CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /><T text={"Neu"} /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <form onSubmit={create} className="rounded-lg border border-border p-4 bg-muted/30 flex gap-2 items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="ak-name"><T text={"Name"} /></Label>
              <Input id="ak-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder={tI18n("z.B. CI Pipeline")} />
            </div>
            <Button type="submit" size="sm" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}<T text={"Anlegen"} /></Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}><T text={"Abbrechen"} /></Button>
          </form>
        )}

        {revealed?.key && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
            <p className="text-sm font-semibold text-amber-900"><T text={"Notiere diesen Key jetzt — er wird nicht erneut angezeigt:"} /></p>
            <div className="flex gap-2 items-center">
              <code className="flex-1 rounded bg-white dark:bg-gray-900 px-3 py-2 font-mono text-sm break-all border border-amber-200">
                {revealed.key}
              </code>
              <Button type="button" size="sm" variant="outline" onClick={copyKey}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Kopiert" : "Kopieren"}
              </Button>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={() => setRevealed(null)}><T text={"Schließen"} /></Button>
          </div>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground"><T text={"Lädt…"} /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground"><T text={"Noch keine API-Keys angelegt."} /></p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {items.map((k) => (
              <li key={k.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{k.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {k.prefix}…
                    {k.lastUsedAt && (
                      <span className="ml-2"><T text={"zuletzt verwendet:"} />{new Date(k.lastUsedAt).toLocaleDateString("de-DE")}
                      </span>
                    )}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(k.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Referrals ────────────────────────────────────────────────────────── */

export function ReferralsCard() {
  const [data, setData] = useState<{ code: string; signupCount: number; referralUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referrals")
      .then((r) => r.json())
      .then((d) => setData(d.data ?? null))
      .catch(() => {});
  }, []);

  function copyUrl() {
    if (!data?.referralUrl) return;
    navigator.clipboard?.writeText(data.referralUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <CardTitle className="text-base"><T text={"Empfehlungen"} /></CardTitle>
            <CardDescription><T text={"Teile deinen persönlichen Link und werbe andere Nutzer an."} /></CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!data ? (
          <p className="text-sm text-muted-foreground"><T text={"Lädt…"} /></p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground"><T text={"Dein Code"} /></p>
                <p className="font-mono font-semibold">{data.code}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground"><T text={"Geworben"} /></p>
                <p className="font-semibold">{data.signupCount}</p>
              </div>
            </div>
            <div className="flex gap-2 max-w-2xl">
              <Input readOnly value={data.referralUrl} className="font-mono text-sm" />
              <Button type="button" variant="outline" onClick={copyUrl} size="sm">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Kopiert" : "Kopieren"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
