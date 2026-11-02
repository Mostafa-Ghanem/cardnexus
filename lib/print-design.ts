import { z } from "zod";

/**
 * Settings for the printed (paper) business card, stored as JSON in
 * Card.printDesign. Pure data + validation — safe to import on client and server.
 */

export const PRINT_SIZES = {
  "85x55": { w: 85, h: 55, label: "85 × 55 مم", labelEn: "85 × 55 mm (Arab/EU standard)" },
  "90x50": { w: 90, h: 50, label: "90 × 50 مم", labelEn: "90 × 50 mm (Gulf)" },
  "89x51": { w: 88.9, h: 50.8, label: "89 × 51 مم (3.5 × 2 بوصة)", labelEn: "3.5 × 2 in (US)" },
} as const;
export type PrintSizeId = keyof typeof PRINT_SIZES;

/** Bleed around the trim line, in mm (print-shop standard). */
export const BLEED_MM = 3;

// Only static (non-variable) fonts: Chrome embeds them in the PDF as real fonts.
export const PRINT_FONTS = {
  plex:    { label: "IBM Plex",     css: "'IBM Plex Sans Arabic', 'Inter', sans-serif" },
  tajawal: { label: "Tajawal",      css: "'Tajawal', 'IBM Plex Sans Arabic', sans-serif" },
  almarai: { label: "Almarai",      css: "'Almarai', 'IBM Plex Sans Arabic', sans-serif" },
  zain:    { label: "Zain",         css: "'Zain', 'IBM Plex Sans Arabic', sans-serif" },
  amiri:   { label: "Amiri (نسخ)",  css: "'Amiri', serif" },
  mirza:   { label: "Mirza",        css: "'Mirza', 'Amiri', serif" },
  aref:    { label: "Aref رقعة",    css: "'Aref Ruqaa', 'Amiri', serif" },
} as const;
export type PrintFontId = keyof typeof PRINT_FONTS;

/**
 * Google Fonts stylesheet with every print font (loaded only on print pages).
 * Static fonts only: Chrome embeds them in the PDF as real (CID) fonts, while
 * variable fonts end up as Type3 glyphs, which some print shops reject.
 */
export const PRINT_FONTS_HREF =
  "https://fonts.googleapis.com/css?family=Almarai:400,700,800|Amiri:400,700|Aref+Ruqaa:400,700|Mirza:400,600,700|Tajawal:400,500,700,800|Zain:400,700,800&subset=arabic,latin&display=swap";

export type PrintLang = "ar" | "en" | "bi";

const HEX = /^#[0-9a-fA-F]{6}$/;

export const printDesignSchema = z.object({
  designId: z.string().max(40).default("classic"),
  size:     z.enum(["85x55", "90x50", "89x51"]).default("85x55"),
  /** ar: both sides Arabic · en: both English · bi: Arabic front, English back */
  lang:     z.enum(["ar", "en", "bi"]).default("ar"),
  primary:  z.string().regex(HEX).optional(),
  accent:   z.string().regex(HEX).optional(),
  /** Omitted = the design's own default font */
  font:     z.preprocess(
    (v) => (typeof v === "string" && v in PRINT_FONTS ? v : undefined),
    z.enum(["plex", "tajawal", "almarai", "zain", "amiri", "mirza", "aref"]).optional(),
  ),
  show: z.object({
    phone:   z.boolean().default(true),
    mobile:  z.boolean().default(true),
    email:   z.boolean().default(true),
    website: z.boolean().default(true),
    address: z.boolean().default(false),
    logo:    z.boolean().default(true),
  }).default({}),
  /** QR code on the back that opens the digital card */
  backQr:   z.boolean().default(true),
  /** Short line on the back, e.g. a slogan */
  tagline:  z.string().max(70).default(""),
  /** Show the NFC "tap" symbol (for NFC cards) */
  nfc:      z.boolean().default(false),
  qrStyle:  z.enum(["square", "rounded", "dots"]).default("rounded"),
});

export type PrintDesign = z.infer<typeof printDesignSchema>;

export const DEFAULT_PRINT_DESIGN: PrintDesign = printDesignSchema.parse({});

/** Parse stored JSON; never throws — falls back to defaults. */
export function parsePrintDesign(raw: string | null | undefined): PrintDesign {
  if (!raw) return DEFAULT_PRINT_DESIGN;
  try {
    const r = printDesignSchema.safeParse(JSON.parse(raw));
    return r.success ? r.data : DEFAULT_PRINT_DESIGN;
  } catch {
    return DEFAULT_PRINT_DESIGN;
  }
}

/** API input: JSON string → validated, normalised JSON string (null clears). */
export const printDesignInput = z.string().max(4000).nullable().optional().transform((raw, ctx) => {
  if (raw === undefined) return undefined;
  if (raw === null || raw.trim() === "") return null;
  try {
    const r = printDesignSchema.safeParse(JSON.parse(raw));
    if (r.success) return JSON.stringify(r.data);
  } catch { /* fallthrough */ }
  ctx.addIssue({ code: z.ZodIssueCode.custom, message: "إعدادات الطباعة غير صحيحة" });
  return z.NEVER;
});

/** Encode settings for a URL (team bulk print). */
export function encodePrintDesign(d: PrintDesign): string {
  return encodeURIComponent(JSON.stringify(d));
}
export function decodePrintDesign(s: string | undefined | null): PrintDesign | null {
  if (!s) return null;
  try {
    const r = printDesignSchema.safeParse(JSON.parse(decodeURIComponent(s)));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

type Opt = string | null | undefined;
/** The card fields a printed face needs (DB rows and CardData both fit). */
export interface PrintCardInput {
  slug: string;
  firstName?: Opt; lastName?: Opt; title?: Opt; company?: Opt;
  phone?: Opt; mobile?: Opt; email?: Opt; website?: Opt; address?: Opt;
  logoUrl?: Opt; avatarUrl?: Opt; primaryColor?: Opt; accentColor?: Opt; translations?: Opt;
}

/** Strip a card row down to what printing needs (keeps the client payload small). */
export function toPrintCard<T extends PrintCardInput>(c: T): PrintCardInput {
  return {
    slug: c.slug, firstName: c.firstName, lastName: c.lastName, title: c.title, company: c.company,
    phone: c.phone, mobile: c.mobile, email: c.email, website: c.website, address: c.address,
    logoUrl: c.logoUrl, avatarUrl: c.avatarUrl, primaryColor: c.primaryColor, accentColor: c.accentColor,
    translations: c.translations,
  };
}
