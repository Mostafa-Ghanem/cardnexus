import type { CardLang } from "@/lib/card-i18n";

/** Fixed texts printed on card templates, per card language. */
export const CARD_LABELS = {
  ar: {
    yourName: "اسمك", jobTitle: "المسمى الوظيفي", mobileSuffix: "(جوال)",
    phone: "الهاتف", mobile: "الجوال", email: "البريد الإلكتروني", website: "الموقع", address: "العنوان",
    phoneShort: "هاتف", mobileShort: "جوال", emailShort: "بريد", websiteShort: "موقع", addressShort: "عنوان",
    scan: "امسح لفتح البطاقة الرقمية", scanMono: "امسح_للبطاقة", qrAlt: "رمز QR", logoAlt: "الشعار",
  },
  en: {
    yourName: "Your name", jobTitle: "Job title", mobileSuffix: "(mobile)",
    phone: "Phone", mobile: "Mobile", email: "Email", website: "Website", address: "Address",
    phoneShort: "Tel", mobileShort: "Mob", emailShort: "Mail", websiteShort: "Web", addressShort: "Adr",
    scan: "Scan for the digital card", scanMono: "SCAN_FOR_CARD", qrAlt: "QR code", logoAlt: "Logo",
  },
} as const satisfies Record<CardLang, Record<string, string>>;

export type CardLabels = (typeof CARD_LABELS)[CardLang];
