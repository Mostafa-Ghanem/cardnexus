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

function RegisterForm() {
  const router = useRouter();
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
      setError(result.error.message ?? "تعذّر إنشاء الحساب. تأكد من البيانات وحاول مرة أخرى.");
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
        <CardTitle>إنشاء حساب</CardTitle>
        <CardDescription>
          {inviteToken
            ? "تمت دعوتك للانضمام. أنشئ حسابك للمتابعة."
            : "ابدأ مجانًا مع بطاقتك الرقمية."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">الاسم</Label>
            <Input
              id="name"
              placeholder="الاسم الكامل"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
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
              placeholder="8 أحرف على الأقل"
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
            {loading ? "جارٍ إنشاء الحساب…" : "إنشاء حساب"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="text-foreground font-medium hover:underline">
              تسجيل الدخول
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
