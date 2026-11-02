"use client";

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
        <CardTitle>نسيت كلمة المرور؟</CardTitle>
        <CardDescription>
          سنرسل لك رابطًا لإعادة تعيين كلمة المرور.
        </CardDescription>
      </CardHeader>
      {done ? (
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            إذا كان هناك حساب مسجل بالبريد <strong dir="ltr">{email}</strong> فقد أرسلنا إليه
            رسالة فيها رابط إعادة التعيين. لا تنسَ مراجعة
            مجلد الرسائل غير المرغوب فيها (Spam).
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">العودة لتسجيل الدخول</Link>
          </Button>
        </CardContent>
      ) : (
        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || !email}>
              {loading ? "جارٍ الإرسال…" : "أرسل رابط إعادة التعيين"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              <Link href="/login" className="hover:underline">العودة لتسجيل الدخول</Link>
            </p>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
