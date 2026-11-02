"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { normalizeMessage } from "@/lib/i18n/config";
import en from "@/messages/en.json";
import ar from "@/messages/ar-SA.json";

type Catalog = Record<string, string>;
type Context = { locale: Locale; t: (source: string) => string };
const I18nContext = createContext<Context | null>(null);
const dictionaries: Record<Exclude<Locale, "de">, Catalog> = {
  en: en as Catalog,
  "ar-SA": ar as Catalog,
};

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<Context>(() => ({
    locale,
    t: (source: string) => {
      const key = normalizeMessage(source);
      if (!key || locale === "de") return key;
      return dictionaries[locale][key] || key;
    },
  }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useI18n(): Context {
  const value = useContext(I18nContext);
  if (!value) throw new Error("Missing I18nProvider");
  return value;
}
/** Render a translated static UI label. User-entered names or data must NOT use this. */
export function T({ text }: { text: string }) {
  return useI18n().t(text);
}
