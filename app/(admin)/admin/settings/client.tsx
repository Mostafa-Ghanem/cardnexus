"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { Save, Check, Globe, Type, Image, Palette, X, Plus } from "lucide-react";
import type { PlatformSettings } from "@/lib/platform";

function parseAllowedDomains(val: string | null): string[] {
  try { return val ? JSON.parse(val) : []; } catch { return []; }
}

export function AdminSettingsClient({ settings: initial }: { settings: PlatformSettings }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [domains, setDomains] = useState<string[]>(() => parseAllowedDomains(initial.allowedDomains));
  const [newDomain, setNewDomain] = useState("");

  function update<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }

  function addDomain() {
    const d = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!d || domains.includes(d)) return;
    setDomains([...domains, d]);
    setNewDomain("");
  }

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const payload = { ...s, allowedDomains: domains.length > 0 ? JSON.stringify(domains) : null };
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "حدث خطأ");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">إعدادات المنصة</h1>
        <p className="text-muted-foreground mt-1">
          الاسم والرابط والأيقونة والهوية للتطبيق بالكامل
        </p>
      </div>

      {/* App Identity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">اسم التطبيق</CardTitle>
          </div>
          <CardDescription>
            يظهر في عنوان المتصفح والقائمة والبريد وكل مكان كاسم للمنتج.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="appName">الاسم</Label>
            <Input
              id="appName"
              value={s.appName}
              onChange={(e) => update("appName", e.target.value)}
              placeholder="اسم المنصة"
              maxLength={64}
            />
            <p className="text-xs text-muted-foreground">
              معاينة عنوان المتصفح: <span className="font-mono">{s.appName} – بطاقات أعمال رقمية</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* App URL */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">رابط التطبيق</CardTitle>
          </div>
          <CardDescription>
            الرابط الأساسي للتطبيق، يُستخدم في رموز QR وجهات الاتصال وروابط الدعوات.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="appUrl">URL</Label>
            <Input
              id="appUrl"
              value={s.appUrl}
              onChange={(e) => update("appUrl", e.target.value)}
              placeholder="https://yourdomain.com"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              مثال لرابط بطاقة: <span className="font-mono">{s.appUrl.replace(/\/$/, "")}/c/ahmed-hassan</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Favicon & Logo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">الأيقونة والشعار</CardTitle>
          </div>
          <CardDescription>
            الأيقونة تظهر في عنوان المتصفح، والشعار يظهر في القائمة والصفحة الرئيسية بدل الحرف الأول.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>الأيقونة (Favicon)</Label>
            <p className="text-xs text-muted-foreground">
              Empfohlen: quadratisch, mind. 32×32 px (PNG, ICO, SVG).
            </p>
            <div className="flex items-start gap-4">
              <ImageUpload
                value={s.faviconUrl}
                onChange={(url) => update("faviconUrl", url)}
                label="رفع الأيقونة"
                shape="square"
              />
              {s.faviconUrl && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">معاينة</p>
                    <div className="flex items-center gap-2">
                      <img src={s.faviconUrl} alt="Favicon" className="h-4 w-4 object-cover" />
                      <span className="font-mono">{s.appName}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>الشعار</Label>
            <p className="text-xs text-muted-foreground">
              يحل محل الحرف الأول من الاسم. يُفضل مربع 64×64 بكسل.
            </p>
            <ImageUpload
              value={s.logoUrl}
              onChange={(url) => update("logoUrl", url)}
              label="رفع الشعار"
              shape="square"
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">أخرى</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="supportEmail">بريد الدعم</Label>
            <Input
              id="supportEmail"
              value={s.supportEmail ?? ""}
              onChange={(e) => update("supportEmail", e.target.value || null)}
              placeholder="support@yourdomain.com"
              type="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="footerText">نص التذييل</Label>
            <Input
              id="footerText"
              value={s.footerText ?? ""}
              onChange={(e) => update("footerText", e.target.value || null)}
              placeholder="صُنع للعالم العربي"
              maxLength={200}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Domains */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">دومينات مخصصة</CardTitle>
          </div>
          <CardDescription>
            يمكن للمستخدمين والمؤسسات اختيار هذه الدومينات لبطاقاتهم.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {domains.map((d) => (
              <span key={d} className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full text-sm">
                {d}
                <button type="button" onClick={() => setDomains(domains.filter((x) => x !== d))}
                  className="text-muted-foreground hover:text-destructive transition-colors ms-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {domains.length === 0 && (
              <p className="text-sm text-muted-foreground">لم تتم إضافة دومينات بعد.</p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDomain()}
              placeholder="card.yourcompany.com"
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={addDomain}>
              <Plus className="h-4 w-4" /> إضافة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive border border-destructive/20">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saved ? (
            <><Check className="h-4 w-4" /> تم الحفظ</>
          ) : (
            <><Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"}</>
          )}
        </Button>
        {saved && (
          <p className="text-sm text-muted-foreground">
            التغييرات مفعّلة، أعد تحميل الصفحة للتأكد
          </p>
        )}
      </div>
    </div>
  );
}
