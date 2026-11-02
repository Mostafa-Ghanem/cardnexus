"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import { T } from "@/components/i18n/I18nProvider";


import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const tI18n = useI18n().t;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Always show success message regardless of whether the email exists
    // (prevents enumeration). better-auth will email the user if found.
    await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    }).catch(() => {});
    setDone(true);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle><T text={"Passwort vergessen?"} /></CardTitle>
        <CardDescription><T text={"Wir senden dir einen Link zum Zurücksetzen deines Passworts."} /></CardDescription>
      </CardHeader>
      {done ? (
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><T text={"Falls ein Account zu"} /><strong>{email}</strong><T text={"existiert, wurde gerade eine E-Mail mit einem Reset-Link an diese Adresse versendet. Bitte schau auch im Spam-Ordner nach."} /></div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login"><T text={"Zurück zum Login"} /></Link>
          </Button>
        </CardContent>
      ) : (
        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email"><T text={"E-Mail"} /></Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder={tI18n("max@example.com")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || !email}>
              {loading ? "Senden…" : "Reset-Link senden"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              <Link href="/login" className="hover:underline"><T text={"Zurück zum Login"} /></Link>
            </p>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
