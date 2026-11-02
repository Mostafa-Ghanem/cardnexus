"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CardData } from "@/types";
import { X, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import { normalizeDigits } from "@/lib/utils";

const STORAGE_KEY = "lead_visitor_v1";

interface Visitor { name: string; phone: string; email: string }

function loadVisitor(): Visitor | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Visitor) : null;
  } catch {
    return null;
  }
}

function saveVisitor(v: Visitor) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch { /* private mode */ }
}

/**
 * Mobile-first lead form: bottom sheet on phones, three short fields with browser
 * autofill (name / tel / email), the visitor's details are remembered on their own
 * device so a second card takes one tap. Message is optional and collapsed.
 */
export function LeadModal({ card, onClose }: { card: CardData; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [showMessage, setShowMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const v = loadVisitor();
    if (v) setForm((f) => ({ ...f, ...v }));
    const t = setTimeout(() => nameRef.current?.focus(), 150);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    const phone = normalizeDigits(form.phone).replace(/[^\d+]/g, "");
    const email = form.email.trim();
    if (!name) { setError("من فضلك اكتب اسمك."); return; }
    if (!phone && !email) { setError("أضف رقم الجوال أو البريد الإلكتروني حتى نتمكن من التواصل معك."); return; }
    if (phone && phone.replace(/\D/g, "").length < 7) { setError("رقم الجوال غير مكتمل."); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, name, phone, email, message: form.message.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "تعذّر الإرسال، حاول مرة أخرى.");
      }
      saveVisitor({ name, phone, email });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  }

  const ownerName = [card.firstName, card.lastName].filter(Boolean).join(" ") || "صاحب البطاقة";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-title"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl max-h-[92dvh] overflow-y-auto px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-700 sm:hidden" />
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h3 id="lead-title" className="font-bold text-lg">اترك بياناتك</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              سيتواصل معك {ownerName} في أقرب وقت
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="text-muted-foreground hover:text-foreground p-2 -m-1 rounded-lg hover:bg-accent transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-6 text-center gap-3">
            <CheckCircle2 className="h-12 w-12" style={{ color: card.primaryColor }} />
            <p className="font-semibold">شكرًا لك!</p>
            <p className="text-sm text-muted-foreground">وصلت بياناتك إلى {ownerName}.</p>
            <Button variant="outline" size="lg" className="mt-2 w-full" onClick={onClose}>إغلاق</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3" noValidate>
            <div>
              <Label htmlFor="lead-name">الاسم *</Label>
              <Input
                ref={nameRef}
                id="lead-name"
                name="name"
                autoComplete="name"
                enterKeyHint="next"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="اسمك الكامل"
                className="mt-1 h-12 text-base"
                required
              />
            </div>
            <div>
              <Label htmlFor="lead-phone">رقم الجوال</Label>
              <Input
                id="lead-phone"
                name="tel"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="next"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="05xxxxxxxx"
                className="mt-1 h-12 text-base"
              />
            </div>
            <div>
              <Label htmlFor="lead-email">البريد الإلكتروني <span className="text-muted-foreground font-normal">(اختياري)</span></Label>
              <Input
                id="lead-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                enterKeyHint={showMessage ? "next" : "send"}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="name@example.com"
                className="mt-1 h-12 text-base"
              />
            </div>

            {showMessage ? (
              <div>
                <Label htmlFor="lead-message">رسالة</Label>
                <textarea
                  id="lead-message"
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  placeholder="اكتب رسالتك (اختياري)"
                  rows={3}
                  maxLength={500}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            ) : (
              <button type="button" onClick={() => setShowMessage(true)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ChevronDown className="h-4 w-4" /> إضافة رسالة
              </button>
            )}

            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base"
              disabled={loading}
              style={{ backgroundColor: card.primaryColor }}
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> جارٍ الإرسال…</> : "إرسال"}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              بياناتك تصل لصاحب البطاقة فقط، ولن تُستخدم لأي غرض آخر.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
