"use client";

import { useI18n } from "./I18nProvider";
import { LOCALE_COOKIE, LOCALES, localeNames, type Locale } from "@/lib/i18n/config";

export function LanguageSwitcher() {
  const { locale } = useI18n();
  function changeLocale(next: string) {
    if (!LOCALES.includes(next as Locale)) return;
    document.cookie =
      `${LOCALE_COOKIE}=${encodeURIComponent(next)}; Max-Age=31536000; Path=/; SameSite=Lax` +
      (location.protocol === "https:" ? "; Secure" : "");
    // Refresh server components and the <html lang/dir> attributes together.
    location.reload();
  }
  return (
    <div className="fixed bottom-4 end-4 z-[100] rounded-xl border border-border bg-background/95 p-1 shadow-lg backdrop-blur-sm"
         dir="ltr">
      <label htmlFor="cardnexus-locale" className="sr-only">Language / اللغة</label>
      <select
        id="cardnexus-locale"
        aria-label="Language / اللغة"
        className="bg-transparent px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        value={locale}
        onChange={(e) => changeLocale(e.target.value)}
      >
        {LOCALES.map((lang) => <option key={lang} value={lang}>{localeNames[lang]}</option>)}
      </select>
    </div>
  );
}
