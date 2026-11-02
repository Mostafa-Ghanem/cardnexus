import type { Metadata } from "next";
import { getPlatformSettings } from "@/lib/platform";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#0F766E" };

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPlatformSettings();

  return {
    title: {
      default: `${s.appName} – بطاقات أعمال رقمية`,
      template: `%s | ${s.appName}`,
    },
    description: "شارك بيانات تواصلك في ثوانٍ عبر NFC أو رمز QR أو رابط، واجمع بيانات عملائك المحتملين.",
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

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
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
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
