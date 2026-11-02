"use client";
import { T } from "@/components/i18n/I18nProvider";


import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { twoFactor } from "@/lib/auth-client";

export const dynamic = "force-dynamic";

export default function TwoFactorChallengePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleaned = code.replace(/\s+/g, "");
    const res =
      mode === "totp"
        ? await twoFactor.verifyTotp({ code: cleaned, trustDevice })
        : await twoFactor.verifyBackupCode({ code: cleaned, trustDevice });

    if (res.error) {
      setError(
        mode === "totp"
          ? "Code ist falsch oder abgelaufen."
          : "Backup-Code ist ungültig oder bereits verwendet."
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle><T text={"Zwei-Faktor-Authentifizierung"} /></CardTitle>
        <CardDescription>
          {mode === "totp"
            ? "Gib den 6-stelligen Code aus deiner Authenticator-App ein."
            : "Gib einen deiner gespeicherten Backup-Codes ein."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">
              {mode === "totp" ? "6-stelliger Code" : "Backup-Code"}
            </Label>
            <Input
              id="code"
              inputMode={mode === "totp" ? "numeric" : "text"}
              autoComplete="one-time-code"
              autoFocus
              required
              placeholder={mode === "totp" ? "000000" : "xxxx-xxxx"}
              maxLength={mode === "totp" ? 6 : 32}
              pattern={mode === "totp" ? "\\d{6}" : undefined}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-center text-lg tracking-widest"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            /><T text={"Diesem Gerät 30 Tage vertrauen"} /></label>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading || code.length === 0}>
            {loading ? "Prüfen…" : "Bestätigen"}
          </Button>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            onClick={() => {
              setError("");
              setCode("");
              setMode((m) => (m === "totp" ? "backup" : "totp"));
            }}
          >
            {mode === "totp"
              ? "Stattdessen Backup-Code verwenden"
              : "Zurück zur Authenticator-App"}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            <Link href="/login" className="hover:underline"><T text={"Zurück zum Login"} /></Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
