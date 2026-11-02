/**
 * Privacy-safe client IP extraction.
 * Returns the IP truncated to /24 (IPv4) or /48 (IPv6) so we can still do
 * coarse geo / device deduplication without storing personally identifying
 * full addresses (DSGVO-friendly).
 */
export function clientIp(req: { headers: Headers | { get(name: string): string | null } }): string {
  return anonymizeIp(rawClientIp(req.headers));
}

/**
 * Real client IP behind the hosting reverse proxy.
 *
 * SECURITY: the LEFT-most X-Forwarded-For entry is whatever the client sent and
 * can be spoofed to bypass rate limits. Each trusted proxy appends the address
 * it received the connection from, so we count TRUSTED_PROXY_HOPS entries from
 * the RIGHT (default 1 = one reverse proxy in front of Node, as on Hostinger).
 */
export function rawClientIp(h: Headers | { get(name: string): string | null }): string {
  const hops = Math.max(1, parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10) || 1);
  const xff = (h.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (xff.length > 0) return xff[Math.max(0, xff.length - hops)];
  return h.get("x-real-ip")?.trim() ?? "";
}

/** Truncate IPv4 to /24 ("192.168.1.0") and IPv6 to /48. */
export function anonymizeIp(ip: string): string {
  if (!ip) return "";
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  // IPv6 — keep first 3 hextets, zero the rest
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return [parts[0] ?? "", parts[1] ?? "", parts[2] ?? "", "0", "0", "0", "0", "0"].join(":");
  }
  return "";
}
