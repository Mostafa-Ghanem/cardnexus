import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, directionFor } from "@/lib/i18n/config";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { getPlatformSettings } from "@/lib/platform";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

async function selectedLocale() {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(saved) ? saved : DEFAULT_LOCALE;
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPlatformSettings();
  const locale = await selectedLocale();

  return {
    title: {
      default: `${s.appName} – ${locale === "ar-SA" ? "بطاقات أعمال رقمية" : locale === "en" ? "Digital business cards" : "Digitale Visitenkarten"}`,
      template: `%s | ${s.appName}`,
    },
    description: locale === "ar-SA"
      ? "شارك بيانات التواصل في ثوانٍ عبر NFC أو رمز QR أو الرابط."
      : locale === "en"
      ? "Share your contact details in seconds via NFC, QR code or link."
      : "Teile deine Kontaktdaten in Sekunden – per NFC, QR-Code oder Link.",
    icons: s.faviconUrl
      ? {
          icon: s.faviconUrl,
          shortcut: s.faviconUrl,
          apple: s.faviconUrl,
        }
      : undefined,
    metadataBase: new URL(s.appUrl),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getPlatformSettings();
  const locale = await selectedLocale();

  return (
    <html lang={locale} dir={directionFor(locale)} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Dynamic favicon — overrides any static file */}
        {s.faviconUrl && (
          <>
            <link rel="icon" href={s.faviconUrl} />
            <link rel="shortcut icon" href={s.faviconUrl} />
            <link rel="apple-touch-icon" href={s.faviconUrl} />
          </>
        )}
      </head>
      <body className="min-h-screen antialiased">
        <I18nProvider locale={locale}>
          <ThemeProvider>
            {children}
            <Toaster />
            <LanguageSwitcher />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
