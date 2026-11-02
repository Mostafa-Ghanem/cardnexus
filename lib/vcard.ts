import type { CardData } from "@/types";

/** Fold long vCard lines at 75 octets (RFC 6350 §3.2) */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let pos = 0;
  let first = true;
  while (pos < line.length) {
    const max = first ? 75 : 74;
    parts.push((first ? "" : " ") + line.slice(pos, pos + max));
    pos += max;
    first = false;
  }
  return parts.join("\r\n");
}

/** Escape special vCard 4.0 text characters */
function esc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Map free-text gender to vCard 4.0 GENDER value */
function mapGender(g: string): string {
  const lower = g.toLowerCase();
  if (lower === "m" || lower === "ذكر" || lower === "männlich" || lower === "male") return "M";
  if (lower === "f" || lower === "w" || lower === "weiblich" || lower === "female") return "F";
  if (lower === "o" || lower === "divers" || lower === "other" || lower === "non-binary") return "O";
  if (lower === "n" || lower === "none" || lower === "keine angabe") return "N";
  if (lower === "u" || lower === "unknown" || lower === "unbekannt") return "U";
  // Free text: pass through as identity component after the semicolon
  return `O;${esc(g)}`;
}

export function generateVCard(card: CardData): string {
  const first = card.firstName ?? "";
  const last  = card.lastName  ?? "";
  const fullName = `${first} ${last}`.trim() || card.email || "جهة اتصال";

  const add = (line: string) => lines.push(fold(line));

  const lines: string[] = [];
  add("BEGIN:VCARD");
  add("VERSION:4.0");
  add(`FN:${esc(fullName)}`);
  add(`N:${esc(last)};${esc(first)};;;`);

  if (card.title)      add(`TITLE:${esc(card.title)}`);
  if (card.company)    add(card.department ? `ORG:${esc(card.company)};${esc(card.department)}` : `ORG:${esc(card.company)}`);
  else if (card.department) add(`ORG:;${esc(card.department)}`);

  if (card.gender)     add(`GENDER:${mapGender(card.gender)}`);
  if (card.pronouns)   add(`X-PRONOUNS:${esc(card.pronouns)}`);
  if (card.birthday) {
    // Accept YYYY-MM-DD → YYYYMMDD
    const bday = card.birthday.replace(/-/g, "");
    add(`BDAY:${bday}`);
  }

  if (card.email)   add(`EMAIL;TYPE=work:${card.email}`);
  if (card.phone)   add(`TEL;TYPE="work,voice":${card.phone}`);
  if (card.mobile)  add(`TEL;TYPE=cell:${card.mobile}`);
  if (card.fax)     add(`TEL;TYPE=fax:${card.fax}`);
  if (card.website) add(`URL;TYPE=work:${card.website}`);
  if (card.address) add(`ADR;TYPE=work:;;${esc(card.address)};;;;`);

  if (card.linkedin)  add(`X-SOCIALPROFILE;TYPE=linkedin:${card.linkedin}`);
  if (card.xing)      add(`X-SOCIALPROFILE;TYPE=xing:${card.xing}`);
  if (card.twitter)   add(`X-SOCIALPROFILE;TYPE=twitter:${card.twitter}`);
  if (card.instagram) add(`X-SOCIALPROFILE;TYPE=instagram:${card.instagram}`);
  if (card.github)    add(`X-SOCIALPROFILE;TYPE=github:${card.github}`);

  // vCard 4.0: PHOTO is just a URI
  if (card.avatarUrl?.startsWith("http")) {
    add(`PHOTO:${card.avatarUrl}`);
  }

  if (card.bio) add(`NOTE:${esc(card.bio)}`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  add(`URL;TYPE=x-card:${appUrl}/c/${card.slug}`);
  add(`REV:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`);
  add("END:VCARD");

  return lines.join("\r\n");
}

export function vCardFileName(card: CardData): string {
  const first = card.firstName ?? "";
  const last  = card.lastName  ?? "";
  const name  = `${first}-${last}`.trim().replace(/\s+/g, "-").replace(/^-+|-+$/g, "").replace(/--+/g, "-").toLowerCase() || "contact";
  return `${name}.vcf`;
}

/** Content-Disposition value that is safe for non-ASCII (e.g. Arabic) names:
 *  ASCII fallback in `filename`, the real name in RFC 5987 `filename*`. */
export function vCardContentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "").replace(/["\\]/g, "").replace(/^[-.]+/, "") || "contact.vcf";
  const safeAscii = ascii.endsWith(".vcf") && ascii.length > 4 ? ascii : "contact.vcf";
  return `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
