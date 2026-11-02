import { z } from "zod";

/** Fields a card owner can provide in a second language (English). */
export const TRANSLATABLE_FIELDS = ["firstName", "lastName", "title", "company", "department", "bio", "address"] as const;
export type TranslatableField = (typeof TRANSLATABLE_FIELDS)[number];
export type CardTranslation = Partial<Record<TranslatableField, string>>;
export type CardLang = "ar" | "en";

const translationSchema = z.object({
  firstName:  z.string().max(100).optional(),
  lastName:   z.string().max(100).optional(),
  title:      z.string().max(150).optional(),
  company:    z.string().max(150).optional(),
  department: z.string().max(150).optional(),
  bio:        z.string().max(500).optional(),
  address:    z.string().max(500).optional(),
}).strict();

const translationsSchema = z.object({ en: translationSchema.optional() }).strict();

/** Parse the stored JSON; never throws (bad data = no translation). */
export function parseTranslations(raw: string | null | undefined): { en?: CardTranslation } {
  if (!raw) return {};
  try {
    const parsed = translationsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

/**
 * Zod field for API input: accepts the JSON string, validates it and stores a
 * normalised version (empty values removed). Empty → null.
 */
export const translationsInput = z.string().max(5000).nullable().optional().transform((raw, ctx) => {
  if (raw === undefined) return undefined;
  if (raw === null || raw.trim() === "") return null;
  let data: unknown;
  try { data = JSON.parse(raw); } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "صيغة الترجمة غير صحيحة" });
    return z.NEVER;
  }
  const parsed = translationsSchema.safeParse(data);
  if (!parsed.success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "صيغة الترجمة غير صحيحة" });
    return z.NEVER;
  }
  const en = Object.fromEntries(
    Object.entries(parsed.data.en ?? {}).map(([k, v]) => [k, (v ?? "").trim()]).filter(([, v]) => v)
  );
  return Object.keys(en).length ? JSON.stringify({ en }) : null;
});

export function hasEnglish(raw: string | null | undefined): boolean {
  const en = parseTranslations(raw).en;
  return !!en && Object.values(en).some(Boolean);
}

/** Card with its display fields swapped to the requested language (falls back per field). */
export function localizeCard<T extends Partial<Record<TranslatableField, string | null>> & { translations?: string | null }>(
  card: T,
  lang: CardLang,
): T {
  if (lang !== "en") return card;
  const en = parseTranslations(card.translations).en ?? {};
  const out = { ...card } as Record<string, unknown>;
  for (const f of TRANSLATABLE_FIELDS) if (en[f]) out[f] = en[f];
  return out as T;
}
