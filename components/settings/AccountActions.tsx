"use client";
import { T } from "@/components/i18n/I18nProvider";


import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/components/ui/sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Lock, Download, Trash2, Loader2 } from "lucide-react";

export function AccountActions() {
  return (
    <>
      <PasswordCard />
      <DataExportCard />
      <DeleteAccountCard />
    </>
  );
}

/* ─── Password change ─────────────────────────────────────────────────── */

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    const res = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });

    if (res.error) {
      toast.error("Passwort konnte nicht geändert werden", {
        description: "Aktuelles Passwort falsch oder neues Passwort zu schwach.",
      });
    } else {
      toast.success("Passwort geändert", {
        description: "Andere Sessions wurden abgemeldet.",
      });
      setCurrent("");
      setNext("");
    }
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <CardTitle className="text-base"><T text={"Passwort ändern"} /></CardTitle>
            <CardDescription><T text={"Setze ein neues Passwort. Andere aktive Sessions werden abgemeldet."} /></CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="current-pw"><T text={"Aktuelles Passwort"} /></Label>
            <Input
              id="current-pw"
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pw"><T text={"Neues Passwort"} /></Label>
            <Input
              id="new-pw"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" disabled={busy || !current || next.length < 8}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}<T text={"Passwort ändern"} /></Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ─── Data export (DSGVO Art. 15/20) ──────────────────────────────────── */

function DataExportCard() {
  const [busy, setBusy] = useState(false);

  async function downloadExport() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) throw new Error("Export fehlgeschlagen");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cardnexus-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export gestartet");
    } catch {
      toast.error("Export fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Download className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <CardTitle className="text-base"><T text={"Daten exportieren"} /></CardTitle>
            <CardDescription><T text={"Lade alle deine personenbezogenen Daten als JSON herunter (DSGVO Art. 15 & 20)."} /></CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" onClick={downloadExport} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}<T text={"Daten als JSON herunterladen"} /></Button>
      </CardContent>
    </Card>
  );
}

/* ─── Delete account (DSGVO Art. 17) ──────────────────────────────────── */

function DeleteAccountCard() {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const REQUIRED = "LÖSCHEN";

  async function performDelete() {
    setBusy(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error("Löschen fehlgeschlagen", { description: data.error });
      setBusy(false);
      return;
    }
    // Force a hard reload — session is now invalid
    window.location.href = "/";
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <CardTitle className="text-base text-destructive"><T text={"Account löschen"} /></CardTitle>
            <CardDescription><T text={"Entfernt deinen Account und alle zugehörigen Daten unwiderruflich (Karten, Leads, Webhooks, API-Keys)."} /></CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" /><T text={"Account endgültig löschen"} /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle><T text={"Account wirklich löschen?"} /></AlertDialogTitle>
              <AlertDialogDescription><T text={"Diese Aktion kann"} /><strong><T text={"nicht rückgängig"} /></strong><T text={"gemacht werden. Alle deine Karten, Leads, Analytics, Webhooks und API-Keys werden unwiderruflich gelöscht."} /></AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="confirm"><T text={"Tippe"} /><code className="px-1 py-0.5 rounded bg-muted text-xs">{REQUIRED}</code><T text={"zur Bestätigung"} /></Label>
              <Input
                id="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="off"
                autoFocus
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirm("")}><T text={"Abbrechen"} /></AlertDialogCancel>
              <AlertDialogAction
                disabled={busy || confirm !== REQUIRED}
                onClick={(e) => { e.preventDefault(); void performDelete(); }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />}<T text={"Endgültig löschen"} /></AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
