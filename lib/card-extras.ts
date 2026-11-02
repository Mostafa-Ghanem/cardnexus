import { z } from "zod";

/**
 * Optional sections on the public card page, stored as JSON in Card.extras.
 * Pure data + validation — safe on client and server.
 */

export const WEEK_DAYS = [
  { key: "sat", ar: "السبت",    en: "Saturday",  js: 6 },
  { key: "sun", ar: "الأحد",    en: "Sunday",    js: 0 },
  { key: "mon", ar: "الإثنين",  en: "Monday",    js: 1 },
  { key: "tue", ar: "الثلاثاء", en: "Tuesday",   js: 2 },
  { key: "wed", ar: "الأربعاء", en: "Wednesday", js: 3 },
  { key: "thu", ar: "الخميس",   en: "Thursday",  js: 4 },
  { key: "fri", ar: "الجمعة",   en: "Friday",    js: 5 },
] as const;
export type DayKey = (typeof WEEK_DAYS)[number]["key"];

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const httpsUrl = z.string().max(500).url().refine((u) => /^https?:\/\//i.test(u), "رابط غير صحيح");

const daySchema = z.object({
  open:  z.string().regex(TIME),
  close: z.string().regex(TIME),
}).nullable();

export const extrasSchema = z.object({
  gallery:  z.array(httpsUrl).max(12).default([]),
  videoUrl: httpsUrl.or(z.literal("")).default(""),
  /** null = closed that day; missing key = not shown */
  hours:    z.record(z.enum(["sat", "sun", "mon", "tue", "wed", "thu", "fri"]), daySchema).default({}),
  /** IANA time zone of the business, for the "open now" badge */
  timeZone: z.string().max(60).default(""),
  showMap:  z.boolean().default(false),
}).strict();

export type CardExtras = z.infer<typeof extrasSchema>;
export const EMPTY_EXTRAS: CardExtras = extrasSchema.parse({});

export function parseExtras(raw: string | null | undefined): CardExtras {
  if (!raw) return EMPTY_EXTRAS;
  try {
    const r = extrasSchema.safeParse(JSON.parse(raw));
    return r.success ? r.data : EMPTY_EXTRAS;
  } catch {
    return EMPTY_EXTRAS;
  }
}

export const extrasInput = z.string().max(10000).nullable().optional().transform((raw, ctx) => {
  if (raw === undefined) return undefined;
  if (raw === null || raw.trim() === "") return null;
  try {
    const r = extrasSchema.safeParse(JSON.parse(raw));
    if (r.success) return JSON.stringify(r.data);
  } catch { /* fallthrough */ }
  ctx.addIssue({ code: z.ZodIssueCode.custom, message: "بيانات الأقسام الإضافية غير صحيحة" });
  return z.NEVER;
});

export function hasExtras(e: CardExtras, hasAddress: boolean): boolean {
  return e.gallery.length > 0 || !!e.videoUrl || Object.keys(e.hours).length > 0 || (e.showMap && hasAddress);
}

/** YouTube / Vimeo URL → embeddable URL, otherwise null (shown as a link). */
export function videoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(u.pathname.slice(1))}`;
    if (host === "youtube.com") {
      const id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.match(/^\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch { /* ignore */ }
  return null;
}

/** Is the business open right now in its own time zone? null = unknown. */
export function openNow(e: CardExtras, now = new Date()): boolean | null {
  if (!Object.keys(e.hours).length) return null;
  let wd: number, mins: number;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: e.timeZone || undefined, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    mins = Number(get("hour")) * 60 + Number(get("minute"));
  } catch {
    return null;
  }
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const dayKey = (js: number) => WEEK_DAYS.find((d) => d.js === js)!.key;
  const today = e.hours[dayKey(wd)];
  if (today) {
    const o = toMin(today.open), c = toMin(today.close);
    if (c > o ? mins >= o && mins < c : mins >= o || mins < c) return true;
  }
  // Overnight shift that started yesterday (e.g. 18:00–02:00)
  const y = e.hours[dayKey((wd + 6) % 7)];
  if (y) {
    const o = toMin(y.open), c = toMin(y.close);
    if (c <= o && mins < c) return true;
  }
  return false;
}
