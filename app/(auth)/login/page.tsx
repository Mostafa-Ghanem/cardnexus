"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn.email({ email, password });

    if (result.error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      setLoading(false);
      return;
    }

    // If 2FA is enabled, the twoFactorClient plugin redirects via
    // window.location.href = "/login/2fa" — don't navigate to /dashboard.
    if ((result.data as { twoFactorRedirect?: boolean } | undefined)?.twoFactorRedirect) {
      return;
    }

    router.push("/dashboard");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>مرحبًا بعودتك</CardTitle>
        <CardDescription>سجّل الدخول إلى حسابك.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "جارٍ الدخول…" : "تسجيل الدخول"}
          </Button>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline text-center"
          >
            نسيت كلمة المرور؟
          </Link>
          <p className="text-sm text-muted-foreground text-center">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-foreground font-medium hover:underline">
              إنشاء حساب
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
