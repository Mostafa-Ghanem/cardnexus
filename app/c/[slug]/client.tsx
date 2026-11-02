"use client";

import { useEffect, useState } from "react";
import { CardPreview } from "@/components/card/CardPreview";
import { QRCodeDisplay } from "@/components/card/QRCodeDisplay";
import { Button } from "@/components/ui/button";
import type { CardData } from "@/types";
import { Download, Share2, QrCode, Wallet, X, Loader2, UserPlus, CalendarDays, Mail, MessageCircle } from "lucide-react";
import { LeadModal } from "./LeadModal";
import { whatsappDigits } from "@/lib/utils";
import { hasEnglish, localizeCard, type CardLang } from "@/lib/card-i18n";

const WALLET_ENABLED = process.env.NEXT_PUBLIC_WALLET_ENABLED === "true";

/** Button labels for the visitor's chosen card language. */
const UI = {
  ar: { preparing: "جارٍ التجهيز…", save: "حفظ جهة الاتصال", whatsapp: "راسلني واتساب", book: "احجز موعدًا",
        lead: "اترك بياناتك للتواصل", copied: "تم النسخ!", share: "مشاركة", qr: "رمز QR",
        shareWa: "شارك بواتساب", email: "البريد", wallet: "حفظ في المحفظة" },
  en: { preparing: "Preparing…", save: "Save contact", whatsapp: "Message me on WhatsApp", book: "Book a meeting",
        lead: "Leave your details", copied: "Copied!", share: "Share", qr: "QR code",
        shareWa: "Share on WhatsApp", email: "Email", wallet: "Save to Wallet" },
} as const;

interface Props {
  card: CardData;
  source?: string;
  showBadge?: boolean;
  showLeadForm?: boolean;
  appName?: string;
}

interface TrackOpts {
  linkLabel?: string;
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

export function PublicCardView({ card, source, showBadge = true, showLeadForm = false, appName = "كارت نكسس" }: Props) {
  const [showQR, setShowQR] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [shared, setShared] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const bilingual = hasEnglish(card.translations);
  const [lang, setLang] = useState<CardLang>("ar");
  const shown = localizeCard(card, lang);
  const waNumber = whatsappDigits(card.whatsapp) ?? whatsappDigits(card.mobile);
  const T = UI[lang];

  // Open the English version for ?lang=en or non-Arabic browsers.
  useEffect(() => {
    if (!bilingual) return;
    const q = new URLSearchParams(window.location.search).get("lang");
    if (q === "en" || (!q && !navigator.language.toLowerCase().startsWith("ar"))) setLang("en");
  }, [bilingual]);

  function openWhatsApp() {
    if (!waNumber) return;
    const name = [card.firstName, card.lastName].filter(Boolean).join(" ");
    const text = lang === "en"
      ? `Hello ${shown.firstName ?? ""}, I got your digital business card.`
      : `مرحبًا ${name}، وصلتني بطاقتك الرقمية وأود التواصل معك.`;
    track(card.slug, "link_click", { linkLabel: "whatsapp", source });
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

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
      if (!res.ok) throw new Error("تعذّر التنزيل");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const cd = res.headers.get("content-disposition") ?? "";
      const utf8 = cd.match(/filename\*=UTF-8''([^;]+)/i);
      const plain = cd.match(/filename="?([^";]+)"?/);
      a.download = utf8 ? decodeURIComponent(utf8[1]) : plain?.[1] ?? "contact.vcf";

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
        alert(error ?? "المحفظة غير متاحة حاليًا.");
      }
    } catch {
      alert("المحفظة غير متاحة حاليًا.");
    } finally {
      setWalletLoading(false);
    }
  }

  function shareViaWhatsApp() {
    const url  = window.location.origin + `/c/${card.slug}`;
    const name = [card.firstName, card.lastName].filter(Boolean).join(" ") || "بطاقة أعمال";
    window.open(`https://wa.me/?text=${encodeURIComponent(`${name} – ${url}`)}`, "_blank");
  }

  function shareViaEmail() {
    const url  = window.location.origin + `/c/${card.slug}`;
    const name = [card.firstName, card.lastName].filter(Boolean).join(" ") || "بطاقة أعمال";
    window.location.href = `mailto:?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(`بطاقتي الرقمية: ${url}`)}`;

  }

  async function handleShare() {
    const url = window.location.origin + `/c/${card.slug}`;
    const name = [card.firstName, card.lastName].filter(Boolean).join(" ") || "بطاقة أعمال";

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center py-6 sm:py-8 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* Card */}
      <div className="w-full max-w-sm">
        {bilingual && (
          <div className="mb-3 flex justify-center">
            <div className="inline-flex rounded-full border border-border bg-white dark:bg-gray-900 p-1 text-xs font-medium" role="group" aria-label="اللغة">
              {(["ar", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`rounded-full px-3 py-1 transition-colors ${lang === l ? "text-white" : "text-muted-foreground"}`}
                  style={lang === l ? { backgroundColor: card.primaryColor } : undefined}
                >
                  {l === "ar" ? "عربي" : "English"}
                </button>
              ))}
            </div>
          </div>
        )}
        <div dir={lang === "en" ? "ltr" : "rtl"} lang={lang}>
          <CardPreview card={shown} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 w-full max-w-sm flex flex-col gap-2" dir={lang === "en" ? "ltr" : "rtl"}>
        <Button
          onClick={downloadVCard}
          className="w-full font-semibold shadow-sm"
          size="lg"
          disabled={downloading}
          style={{ backgroundColor: card.primaryColor, borderColor: card.primaryColor }}
        >
          {downloading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> {T.preparing}</>
            : <><Download className="h-4 w-4" /> {T.save}</>
          }
        </Button>

        {waNumber && (
          <Button
            onClick={openWhatsApp}
            className="w-full font-semibold bg-[#25D366] hover:bg-[#1ebe5b] text-white"
            size="lg"
          >
            <MessageCircle className="h-4 w-4" />
            {T.whatsapp}
          </Button>
        )}

        {card.bookingUrl && (
          <Button asChild className="w-full" size="lg" style={{ backgroundColor: card.primaryColor }}>
            <a href={card.bookingUrl} target="_blank" rel="noopener noreferrer">
              <CalendarDays className="h-4 w-4" />
              {T.book}
            </a>
          </Button>
        )}

        {showLeadForm && (
          <Button
            variant="outline"
            className="w-full font-semibold border-2"
            size="lg"
            onClick={() => setShowLead(true)}
            style={{ borderColor: card.primaryColor, color: card.primaryColor }}
          >
            <UserPlus className="h-4 w-4" />
            {T.lead}
          </Button>
        )}

        <div className={`grid gap-2 ${card.hideShareButton ? "grid-cols-1" : "grid-cols-2"}`}>
          {!card.hideShareButton && (
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              {shared ? T.copied : T.share}
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowQR(!showQR)}>
            <QrCode className="h-4 w-4" />
            {T.qr}
          </Button>
        </div>

        {!card.hideShareButton && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={shareViaWhatsApp}>
              <MessageCircle className="h-4 w-4" />
              {T.shareWa}
            </Button>
            <Button variant="outline" onClick={shareViaEmail}>
              <Mail className="h-4 w-4" />
              {T.email}
            </Button>
          </div>
        )}

        {WALLET_ENABLED && (
        <Button variant="outline" className="w-full" onClick={saveToWallet} disabled={walletLoading}>
          {walletLoading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…</>
            : <><Wallet className="h-4 w-4" /> {T.wallet}</>
          }
        </Button>
        )}
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
              <h3 className="font-semibold">رمز QR</h3>
              <button onClick={() => setShowQR(false)} aria-label="إغلاق" className="text-muted-foreground hover:text-foreground p-1">
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
        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
          صُنعت بواسطة{" "}
          <a href="/" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors font-medium">{appName}</a>
        </p>
      )}
    </div>
  );
}
