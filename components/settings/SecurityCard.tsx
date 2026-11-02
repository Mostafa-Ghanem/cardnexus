"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import { T } from "@/components/i18n/I18nProvider";


import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, KeyRound, Copy, Check, Loader2 } from "lucide-react";
import { twoFactor as twoFactorClient } from "@/lib/auth-client";

interface Props {
  twoFactorEnabled: boolean;
}

type Step = "idle" | "password" | "verify" | "done";

export function SecurityCard({ twoFactorEnabled }: Props) {
  const tI18n = useI18n().t;
  const [enabled, setEnabled] = useState(twoFactorEnabled);

  /* --- enable flow ----------------------------------------------------- */
  const [step, setStep] = useState<Step>("idle");
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [qrSrc, setQrSrc] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  /* --- disable / regenerate -------------------------------------------- */
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisable, setShowDisable] = useState(false);

  function reset() {
    setStep("idle");
    setPassword("");
    setTotpUri("");
    setQrSrc("");
    setSecret("");
    setBackupCodes([]);
    setCode("");
    setErr("");
    setBusy(false);
  }

  async function startEnable() {
    setStep("password");
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);

    const res = await twoFactorClient.enable({ password });
    if (res.error || !res.data) {
      setErr("Passwort ist falsch oder Aktivierung fehlgeschlagen.");
      setBusy(false);
      return;
    }

    const { totpURI, backupCodes: codes } = res.data;
    setTotpUri(totpURI);
    setBackupCodes(codes);
    setSecret(extractSecret(totpURI));

    // Render QR locally — no secret leaves the client.
    const qrcode = (await import("qrcode")).default;
    const dataUrl = await qrcode.toDataURL(totpURI, { margin: 1, width: 240 });
    setQrSrc(dataUrl);

    setBusy(false);
    setStep("verify");
  }

  async function submitVerify(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);

    const res = await twoFactorClient.verifyTotp({ code: code.replace(/\s+/g, "") });
    if (res.error) {
      setErr("Code ist falsch. Bitte erneut prüfen.");
      setBusy(false);
      return;
    }

    setEnabled(true);
    setBusy(false);
    setStep("done");
  }

  async function submitDisable(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await twoFactorClient.disable({ password: disablePassword });
    if (res.error) {
      setErr("Passwort ist falsch.");
      setBusy(false);
      return;
    }
    setEnabled(false);
    setShowDisable(false);
    setDisablePassword("");
    setBusy(false);
  }

  function copyBackup() {
    navigator.clipboard?.writeText(backupCodes.join("\n")).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <CardTitle className="text-base"><T text={"Zwei-Faktor-Authentifizierung"} /></CardTitle>
            <CardDescription><T text={"Schütze deinen Account zusätzlich mit einem Code aus einer Authenticator-App (Google Authenticator, 1Password, Authy …)."} /></CardDescription>
          </div>
          {enabled && (
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="h-3 w-3" /><T text={"Aktiv"} /></Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Already enabled ───────────────────────────────────────── */}
        {enabled && step === "idle" && !showDisable && (
          <Button variant="outline" onClick={() => setShowDisable(true)}><T text={"2FA deaktivieren"} /></Button>
        )}

        {enabled && showDisable && (
          <form onSubmit={submitDisable} className="space-y-3 max-w-sm">
            <div className="space-y-1.5">
              <Label htmlFor="disable-pw"><T text={"Passwort zur Bestätigung"} /></Label>
              <Input
                id="disable-pw"
                type="password"
                autoComplete="current-password"
                required
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" size="sm" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}<T text={"Deaktivieren"} /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowDisable(false); setErr(""); }}><T text={"Abbrechen"} /></Button>
            </div>
          </form>
        )}

        {/* ── Not enabled — start ───────────────────────────────────── */}
        {!enabled && step === "idle" && (
          <Button onClick={startEnable}>
            <KeyRound className="h-4 w-4" /><T text={"2FA aktivieren"} /></Button>
        )}

        {/* ── Step 1: password ──────────────────────────────────────── */}
        {!enabled && step === "password" && (
          <form onSubmit={submitPassword} className="space-y-3 max-w-sm">
            <div className="space-y-1.5">
              <Label htmlFor="enable-pw"><T text={"Passwort zur Bestätigung"} /></Label>
              <Input
                id="enable-pw"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={busy} size="sm">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}<T text={"Weiter"} /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={reset}><T text={"Abbrechen"} /></Button>
            </div>
          </form>
        )}

        {/* ── Step 2: scan + verify ─────────────────────────────────── */}
        {!enabled && step === "verify" && (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-[auto_1fr] items-start">
              {qrSrc && (
                <img
                  src={qrSrc}
                  alt={tI18n("TOTP QR-Code")}
                  width={200}
                  height={200}
                  className="rounded-lg border border-border bg-white dark:bg-gray-900 p-2"
                />
              )}
              <div className="space-y-3 text-sm">
                <p>
                  <strong>1.</strong><T text={"Scanne den QR-Code mit deiner Authenticator-App."} /></p>
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground"><T text={"Manuell eingeben"} /></summary>
                  <code className="mt-2 block rounded bg-muted px-2 py-1 font-mono break-all">
                    {secret}
                  </code>
                </details>
                <p className="pt-2">
                  <strong>2.</strong><T text={"Bewahre deine Backup-Codes sicher auf. Du kannst sie verwenden, falls du dein Gerät verlierst."} /></p>
              </div>
            </div>

            {backupCodes.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-amber-900"><T text={"Backup-Codes"} /></p>
                  <Button type="button" variant="ghost" size="sm" onClick={copyBackup}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Kopiert" : "Kopieren"}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-sm text-amber-900">
                  {backupCodes.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={submitVerify} className="space-y-3 max-w-sm">
              <div className="space-y-1.5">
                <Label htmlFor="verify-code">
                  <strong>3.</strong><T text={"Bestätige durch Eingabe des aktuellen Codes"} /></Label>
                <Input
                  id="verify-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder={tI18n("000000")}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-center text-lg tracking-widest"
                />
              </div>
              {err && <p className="text-sm text-destructive">{err}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={busy || code.length < 6} size="sm">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}<T text={"Aktivieren"} /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={reset}><T text={"Abbrechen"} /></Button>
              </div>
            </form>
          </div>
        )}

        {/* ── Done ──────────────────────────────────────────────────── */}
        {step === "done" && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold mb-1"><T text={"2FA aktiviert ✓"} /></p>
            <p><T text={"Beim nächsten Login wirst du zusätzlich nach einem Code aus deiner Authenticator-App gefragt."} /></p>
            <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={reset}><T text={"Schließen"} /></Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Extracts the `secret=...` parameter from a TOTP URI. */
function extractSecret(uri: string): string {
  try {
    const u = new URL(uri);
    return u.searchParams.get("secret") ?? "";
  } catch {
    return "";
  }
}
