import type { Locale } from "@/lib/i18n/config";

export const LEAD_STATUSES = ["new", "contacted", "interested", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

const labels: Record<Locale, Record<LeadStatus,string>> = {
  "ar-SA": {
    new: "جديد", contacted: "تم التواصل", interested: "مهتم",
    won: "تم الإغلاق بنجاح", lost: "غير مهتم",
  },
  en: {
    new: "New", contacted: "Contacted", interested: "Interested",
    won: "Won", lost: "Lost",
  },
  de: {
    new: "Neu", contacted: "Kontaktiert", interested: "Interessiert",
    won: "Gewonnen", lost: "Verloren",
  },
};

export const LEAD_STATUS_COLORS: Record<LeadStatus,string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  contacted: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  interested: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  lost: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function isLeadStatus(v: unknown): v is LeadStatus {
  return typeof v === "string" && (LEAD_STATUSES as readonly string[]).includes(v);
}

export function statusLabel(status: LeadStatus, locale: Locale): string {
  return labels[locale][status];
}
