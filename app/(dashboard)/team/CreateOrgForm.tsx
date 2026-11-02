"use client";
import { T } from "@/components/i18n/I18nProvider";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2 } from "lucide-react";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function CreateOrgForm() {
  const router = useRouter();
  const [name,  setName]  = useState("");
  const [slug,  setSlug]  = useState("");
  const [color, setColor] = useState("#0F172A");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleName(v: string) {
    setName(v);
    setSlug(slugify(v));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug || slugify(name), primaryColor: color }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fehler beim Erstellen");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-left">
      <div className="space-y-1.5">
        <Label><T text={"Name der Organisation"} /></Label>
        <Input
          value={name}
          onChange={(e) => handleName(e.target.value)}
          placeholder="Meine Firma GmbH"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label><T text={"URL-Kürzel (Slug)"} /></Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0">/team/</span>
          <Input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="meine-firma"
            className="font-mono"
          />
        </div>
        <p className="text-xs text-muted-foreground"><T text={"Öffentliche URL des Team-Verzeichnisses"} /></p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label><T text={"Akzentfarbe"} /></Label>
          <p className="text-xs text-muted-foreground mt-0.5"><T text={"Primärfarbe für Karten deiner Mitglieder"} /></p>
        </div>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-16 cursor-pointer rounded border border-border p-0.5"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" />{" "}<T text={"Wird erstellt…"} /></>
          : <><Building2 className="h-4 w-4" />{" "}<T text={"Organisation erstellen"} /></>}
      </Button>

      <p className="text-xs text-center text-muted-foreground"><T text={"Du wirst automatisch zum Organisations-Admin. Design-Vorgaben kannst du danach unter"} />{" "}
        <a href="/settings" className="underline hover:text-foreground"><T text={"Einstellungen"} /></a><T text={"anpassen."} /></p>
    </form>
  );
}
