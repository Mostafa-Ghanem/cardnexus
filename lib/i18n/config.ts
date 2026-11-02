export const LOCALES = ["ar-SA", "en", "de"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar-SA";
export const LOCALE_COOKIE = "cn_locale";
export const localeNames: Record<Locale, string> = {
  "ar-SA": "العربية (السعودية)",
  en: "English",
  de: "Deutsch",
};
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.includes(value as Locale);
}
export function directionFor(locale: Locale): "rtl" | "ltr" {
  return locale === "ar-SA" ? "rtl" : "ltr";
}
export function normalizeMessage(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
