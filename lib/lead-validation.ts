/** Locale-safe contact helpers: usable in both React and Cloudflare Workers. */
export function normalizeContactPhone(value: string): string {
  const ascii = value.replace(/[\u0660-\u0669]/g, c => String(c.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, c => String(c.charCodeAt(0) - 0x06f0));
  const cleaned = ascii.replace(/[^0-9+]/g, "");
  return cleaned.startsWith("+")
    ? "+" + cleaned.slice(1).replace(/\+/g, "")
    : cleaned.replace(/\+/g, "");
}
export function hasContactDetails(email?: string | null, phone?: string | null): boolean {
  return Boolean(email?.trim() || phone?.trim());
}
