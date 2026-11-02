"use client";
import { T } from "@/components/i18n/I18nProvider";


import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { unlockCard } from "./actions";

interface Props {
  slug: string;
}

export function CardPasswordGate({ slug }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await unlockCard(slug, password);
      if (!res.ok) setError(res.error ?? "Fehler");
      else router.refresh();
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-border bg-white dark:bg-gray-900 p-8 shadow-sm space-y-4"
      >
        <div className="flex flex-col items-center text-center mb-2">
          <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-lg font-semibold"><T text={"Geschützte Karte"} /></h1>
          <p className="text-sm text-muted-foreground mt-1"><T text={"Diese Karte ist passwortgeschützt. Bitte gib das Passwort ein."} /></p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="card-pw"><T text={"Passwort"} /></Label>
          <Input
            id="card-pw"
            type="password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending || !password}>
          {pending ? "Prüfen…" : "Entsperren"}
        </Button>
      </form>
    </div>
  );
}
