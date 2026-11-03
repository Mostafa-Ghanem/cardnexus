"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import { T } from "@/components/i18n/I18nProvider";


import { useEffect, useState } from "react";
import { CardPreview } from "@/components/card/CardPreview";
import { QRCodeDisplay } from "@/components/card/QRCodeDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CardData } from "@/types";
import { Download, Share2, QrCode, Wallet, X, Loader2, UserPlus, CheckCircle2, CalendarDays, Mail, MessageCircle } from "lucide-react";

interface Props {
  card: CardData;
  source?: string;
  showBadge?: boolean;
  showLeadForm?: boolean;
}

interface TrackOpts {
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}
function track(slug: string, event: string, opts: TrackOpts = {}) {
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardSlug: slug, event, ...opts }),
  }).catch(() => {});
}

/** Read UTM params and referrer from the current browser context. */
function readUtmFromUrl(): { utmSource?: string; utmMedium?: string; utmCampaign?: string; referrer?: string } {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  const get = (k: string) => sp.get(k)?.slice(0, 80) || undefined;
  return {
    utmSource:   get("utm_source"),
    utmMedium:   get("utm_medium"),
    utmCampaign: get("utm_campaign"),
    referrer:    document.referrer || undefined,
  };
}

export function PublicCardView({ card, source, showBadge = true, showLeadForm = false }: Props) {
  const [showQR, setShowQR] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [shared, setShared] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

  // Track view once on mount (deduplicated per session per card slug)
  useEffect(() => {
    const key = `tracked_${card.slug}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, "1");
    const utm = readUtmFromUrl();
    // If there's a utm_campaign or any utm_*, source is implicitly "campaign".
    const inferredSource =
      utm.utmCampaign || utm.utmSource || utm.utmMedium ? "campaign" : (source ?? "direct");
    track(card.slug, "view", { source: inferredSource, ...utm });
  }, [card.slug, source]);

  async function downloadVCard() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/vcard/${card.slug}`);
      if (!res.ok) throw new Error("Fehler beim Download");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const cd = res.headers.get("content-disposition") ?? "";
      const match = cd.match(/filename="?([^"]+)"?/);
      a.download = match?.[1] ?? "kontakt.vcf";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      track(card.slug, "vcard_download", { source });
    } catch {
      // silent
    } finally {
      setDownloading(false);
    }
  }

  async function saveToWallet() {
    setWalletLoading(true);
    try {
      // Try Apple Wallet first (iOS), then Google Wallet
      const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
      if (isIos) {
        const res = await fetch(`/api/wallet/apple/${card.slug}`);
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = `${card.slug}.pkpass`;
          document.body.appendChild(a); a.click();
          document.body.removeChild(a); URL.revokeObjectURL(url);
          track(card.slug, "wallet_save");
          return;
        }
      }
      // Google Wallet fallback
      const res = await fetch(`/api/wallet/google/${card.slug}`);
      if (res.ok) {
        const { url } = await res.json();
        window.open(url, "_blank");
        track(card.slug, "wallet_save");
      } else {
        const { error } = await res.json();
        alert(error ?? "Wallet nicht verfügbar.");
      }
    } catch {
      alert("Wallet nicht verfügbar.");
    } finally {
      setWalletLoading(false);
    }
  }

  function shareViaWhatsApp() {
    const url  = window.location.origin + `/c/${card.slug}`;
    const name = [card.firstName, card.lastName].filter(Boolean).join(" ") || "Visitenkarte";
    window.open(`https://wa.me/?text=${encodeURIComponent(`${name} – ${url}`)}`, "_blank");
  }

  function shareViaEmail() {
    const url  = window.location.origin + `/c/${card.slug}`;
    const name = [card.firstName, card.lastName].filter(Boolean).join(" ") || "Visitenkarte";
    window.location.href = `mailto:?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(`Meine digitale Visitenkarte: ${url}`)}`;

  }

  async function handleShare() {
    const url = window.location.origin + `/c/${card.slug}`;
    const name = [card.firstName, card.lastName].filter(Boolean).join(" ") || "Visitenkarte";

    // Native share sheet (mobile / supported browsers)
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
      } catch { /* user cancelled */ }
      return;
    }

    // Clipboard API — requires HTTPS or localhost
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch { /* fall through to legacy */ }
    }

    // Legacy fallback (works over plain HTTP)
    try {
      const el = document.createElement("textarea");
      el.value = url;
      el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch { /* silent */ }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center py-8 px-4">
      {/* Card */}
      <div className="w-full max-w-sm">
        <CardPreview card={card} />
      </div>

      {/* Action buttons */}
      <div className="mt-6 w-full max-w-sm flex flex-col gap-2">
        <Button
          onClick={downloadVCard}
          className="w-full font-semibold shadow-sm"
          size="lg"
          disabled={downloading}
          style={{ backgroundColor: card.primaryColor, borderColor: card.primaryColor }}
        >
          {downloading
            ? <><Loader2 className="h-4 w-4 animate-spin" />{" "}<T text={"Wird vorbereitet…"} /></>
            : <><Download className="h-4 w-4" />{" "}<T text={"Kontakt speichern"} /></>
          }
        </Button>

        {card.bookingUrl && (
          <Button asChild className="w-full" size="lg" style={{ backgroundColor: card.primaryColor }}>
            <a href={card.bookingUrl} target="_blank" rel="noopener noreferrer">
              <CalendarDays className="h-4 w-4" /><T text={"Termin buchen"} /></a>
          </Button>
        )}

        {showLeadForm && (
          <Button variant="outline" className="w-full" size="lg" onClick={() => setShowLead(true)}>
            <UserPlus className="h-4 w-4" /><T text={"Kontakt hinterlassen"} /></Button>
        )}

        <div className={`grid gap-2 ${card.hideShareButton ? "grid-cols-1" : "grid-cols-2"}`}>
          {!card.hideShareButton && (
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              {shared ? "Kopiert!" : "Teilen"}
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowQR(!showQR)}>
            <QrCode className="h-4 w-4" /><T text={"QR-Code"} /></Button>
        </div>

        {!card.hideShareButton && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={shareViaWhatsApp}>
              <MessageCircle className="h-4 w-4" /><T text={"WhatsApp"} /></Button>
            <Button variant="outline" onClick={shareViaEmail}>
              <Mail className="h-4 w-4" /><T text={"E-Mail"} /></Button>
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={saveToWallet} disabled={walletLoading}>
          {walletLoading
            ? <><Loader2 className="h-4 w-4 animate-spin" />{" "}<T text={"Wird geladen…"} /></>
            : <><Wallet className="h-4 w-4" />{" "}<T text={"In Wallet speichern"} /></>
          }
        </Button>
      </div>

      {/* QR overlay */}
      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-xs w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold"><T text={"QR-Code"} /></h3>
              <button onClick={() => setShowQR(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <QRCodeDisplay slug={card.slug} color={card.primaryColor} size={240} />
          </div>
        </div>
      )}

      {/* Lead Capture Modal */}
      {showLead && showLeadForm && (
        <LeadModal card={card} onClose={() => setShowLead(false)} />
      )}

      {/* Powered by — only for free plan */}
      {showBadge && (
        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500"><T text={"Erstellt mit"} />{" "}
          <a href="/" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors font-medium"><T text={"CardNexus"} /></a>
        </p>
      )}
    </div>
  );
}

// ── Lead Capture Modal ──────────────────────────────────────────────────────

function LeadModal({ card, onClose }: { card: CardData; onClose: () => void }) {
  const { locale } = useI18n();
  const labels = locale === "ar-SA" ? {
    heading: "اترك بيانات التواصل", subtitle: "سيتم إرسال بياناتك إلى",
    name: "الاسم", email: "البريد الإلكتروني (اختياري)", phone: "رقم الجوال",
    contact: "أدخل رقم الجوال أو البريد الإلكتروني على الأقل",
    message: "إضافة رسالة (اختياري)", send: "إرسال بياناتي",
    sending: "جارٍ الإرسال…", done: "تم إرسال بياناتك", thanks: "شكرًا لك!",
    close: "إغلاق", privacy: "سيُرسل طلبك إلى صاحب البطاقة للتواصل معك.",
  } : locale === "en" ? {
    heading: "Share your contact details", subtitle: "Your details will be sent to",
    name: "Name", email: "Email (optional)", phone: "Mobile number",
    contact: "Enter at least your phone number or email",
    message: "Add a message (optional)", send: "Send contact details",
    sending: "Sending…", done: "Your details were sent", thanks: "Thank you!",
    close: "Close", privacy: "Your details will be shared with the card owner for follow-up.",
  } : {
    heading: "Kontakt hinterlassen", subtitle: "Deine Angaben erhält",
    name: "Name", email: "E-Mail (optional)", phone: "Telefon",
    contact: "Telefonnummer oder E-Mail eingeben",
    message: "Nachricht hinzufügen (optional)", send: "Kontakt senden",
    sending: "Wird gesendet…", done: "Deine Daten wurden übermittelt",
    thanks: "Vielen Dank!", close: "Schließen",
    privacy: "Deine Kontaktdaten werden zur Rückmeldung an die Person weitergegeben.",
  };
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError(labels.name); return; }
    if (!form.phone.trim() && !form.email.trim()) { setError(labels.contact); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, ...form }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Fehler beim Senden");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  const ownerName = [card.firstName, card.lastName].filter(Boolean).join(" ") || "diese Person";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-lg">{labels.heading}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {labels.subtitle} <bdi>{ownerName}</bdi></p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-6 text-center gap-3">
            <CheckCircle2 className="h-12 w-12" style={{ color: card.primaryColor }} />
            <p className="font-semibold">{labels.thanks}</p>
            <p className="text-sm text-muted-foreground">
              {labels.done}</p>
            <Button variant="outline" className="mt-2" onClick={onClose}>{labels.close}</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="lead-name">{labels.name} *</Label>
              <Input
                id="lead-name"
                name="name"
                autoComplete="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={locale === "ar-SA" ? "الاسم الكامل" : locale === "en" ? "Your name" : "Dein Name"}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="lead-email">{labels.email}</Label>
              <Input
                id="lead-email"
                name="email"
                type="email"
                autoComplete="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="name@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lead-phone">{labels.phone}</Label>
              <Input
                id="lead-phone"
                name="tel"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+966 5X XXX XXXX"
                className="mt-1"
              />
            </div>
            <details className="group rounded-lg border border-border px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium">{labels.message}</summary>
              <textarea
                id="lead-message"
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder={labels.message}
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </details>
            {/* Honeypot is invisible to people, but commonly filled by bots. */}
            <div aria-hidden="true" className="absolute -left-[9999px]" tabIndex={-1}>
              <label htmlFor="lead-website">Website</label>
              <input id="lead-website" name="website" type="text" value={form.website}
                tabIndex={-1} autoComplete="off" onChange={(e) => set("website", e.target.value)} />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">{labels.privacy}</p>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              style={{ backgroundColor: card.primaryColor }}
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />{" "}{labels.sending}</>
                : labels.send}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
