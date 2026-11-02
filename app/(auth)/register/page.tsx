"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signUp } from "@/lib/auth-client";
import { Suspense } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";

function RegisterForm() {
  const router = useRouter();
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signUp.email({ name, email, password });

    if (result.error) {
      setError(t(result.error.message ?? "Registrierung fehlgeschlagen."));
      setLoading(false);
      return;
    }

    // Run in parallel: accept invite (if present) + trigger welcome email
    await Promise.allSettled([
      inviteToken
        ? fetch("/api/invitations/accept", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: inviteToken }),
          })
        : Promise.resolve(),
      fetch("/api/auth/welcome", { method: "POST" }),
    ]);

    router.push("/dashboard");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account erstellen</CardTitle>
        <CardDescription>
          {inviteToken
            ? t("Du wurdest eingeladen. Erstelle deinen Account.")
            : t("Starte kostenlos mit deiner digitalen Visitenkarte.")}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Max Mustermann"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="max@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              type="password"
              placeholder={t("Mindestens 8 Zeichen")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {t(loading ? "Wird erstellt…" : "Account erstellen")}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Bereits registriert?{" "}
            <Link href="/login" className="text-foreground font-medium hover:underline">
              Anmelden
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
