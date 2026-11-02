"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import { T } from "@/components/i18n/I18nProvider";


import { useState } from "react";
import type { Campaign } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Copy, Trash2, Check, ExternalLink, BarChart2, Clock } from "lucide-react";

interface Props {
  campaigns: Campaign[];
  cardSlug: string;
  baseUrl: string;
  hasCard: boolean;
}

export function CampaignsClient({ campaigns: init, cardSlug, baseUrl, hasCard }: Props) {
  const tI18n = useI18n().t;
  const [campaigns, setCampaigns] = useState(init);
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function campaignUrl(urlSlug: string) {
    return `${baseUrl}/p/${urlSlug}`;
  }

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, expiresAt: expiresAt || null }),
      });
      const data = await res.json();
      if (data.campaign) {
        setCampaigns((c) => [
          { ...data.campaign, createdAt: data.campaign.createdAt },
          ...c,
        ]);
        setName("");
        setExpiresAt("");
      }
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: string) {
    await fetch("/api/campaigns", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCampaigns((c) => c.filter((x) => x.id !== id));
  }

  function copy(urlSlug: string) {
    navigator.clipboard.writeText(campaignUrl(urlSlug));
    setCopiedId(urlSlug);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (!hasCard) {
    return (
      <div className="text-center py-16 text-muted-foreground"><T text={"Erstelle zuerst deine Visitenkarte, um Kampagnen zu verwenden."} /></div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <p className="font-semibold text-sm"><T text={"Neue Kampagne erstellen"} /></p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="camp-name"><T text={"Name"} /></Label>
            <Input
              id="camp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tI18n("z.B. Messe Berlin 2026")}
              className="mt-1"
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
          </div>
          <div>
            <Label htmlFor="camp-exp"><T text={"Ablaufdatum (optional)"} /></Label>
            <Input
              id="camp-exp"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <Button onClick={create} disabled={creating || !name.trim()}>
          <Plus className="h-4 w-4" /><T text={"Kampagne erstellen"} /></Button>
      </div>

      {/* List */}
      {campaigns.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm border-2 border-dashed rounded-2xl"><T text={"Noch keine Kampagnen. Erstelle deinen ersten Link oben."} /></div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const url = campaignUrl(c.urlSlug);
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
            return (
              <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    {expired && (
                      <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-medium"><T text={"Abgelaufen"} /></span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{url}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BarChart2 className="h-3 w-3" />
                      {c.views}<T text={"Klicks"} /></span>
                    {c.expiresAt && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /><T text={"bis"} />{new Date(c.expiresAt).toLocaleDateString("de-DE")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copy(c.urlSlug)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    title={tI18n("URL kopieren")}
                  >
                    {copiedId === c.urlSlug ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={tI18n("Link testen")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => remove(c.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title={tI18n("Loeschen")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
