"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    if (!token) {
      setError("رابط إعادة التعيين غير صالح أو منتهي الصلاحية.");
      return;
    }
    setLoading(true);
    const res = await authClient.resetPassword({ token, newPassword: password });
    if (res.error) {
      setError("رابط إعادة التعيين غير صالح أو منتهي الصلاحية.");
      setLoading(false);
      return;
    }
    router.push("/login?reset=success");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>تعيين كلمة مرور جديدة</CardTitle>
        <CardDescription>اختر كلمة مرور قوية من 8 أحرف على الأقل.</CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pw">كلمة المرور الجديدة</Label>
            <Input
              id="pw" type="password" required autoComplete="new-password"
              minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw2">تأكيد كلمة المرور</Label>
            <Input
              id="pw2" type="password" required autoComplete="new-password"
              minLength={8} value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading || password.length < 8}>
            {loading ? "جارٍ الحفظ…" : "حفظ كلمة المرور"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            <Link href="/login" className="hover:underline">العودة لتسجيل الدخول</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
