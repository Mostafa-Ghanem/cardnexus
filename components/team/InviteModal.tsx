"use client";
import { T } from "@/components/i18n/I18nProvider";


import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Copy, Check } from "lucide-react";

interface InviteModalProps {
  onInvited?: () => void;
}

export function InviteModal({ onInvited }: InviteModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleInvite() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fehler");
      setInviteUrl(json.inviteUrl);
      onInvited?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setEmail("");
    setRole("member");
    setError("");
    setInviteUrl("");
    setCopied(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" /><T text={"Einladen"} /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle><T text={"Benutzer einladen"} /></DialogTitle>
        </DialogHeader>

        {!inviteUrl ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label><T text={"E-Mail-Adresse"} /></Label>
              <Input
                type="email"
                placeholder="max@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
            <div className="space-y-1.5">
              <Label><T text={"Rolle"} /></Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_leader"><T text={"Team Leader"} /></SelectItem>
                  <SelectItem value="member"><T text={"Mitglied"} /></SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleInvite} disabled={!email || loading} className="w-full">
              {loading ? "Wird eingeladen…" : "Einladung erstellen"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm font-medium text-foreground mb-1"><T text={"Einladung erstellt!"} /></p>
              <p className="text-xs text-muted-foreground"><T text={"Link an"} />{" "}{email}{" "}<T text={"senden (gültig 7 Tage)"} /></p>
            </div>
            <div className="flex gap-2">
              <Input value={inviteUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyUrl}>
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="outline" onClick={reset} className="w-full"><T text={"Weitere einladen"} /></Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
