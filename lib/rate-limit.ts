import { bindings as env } from "./cloudflare-bindings";

// Per-isolate in-memory Maps do not enforce rate limits across Cloudflare
// colos or restarts. A single atomic UPSERT/RETURNING enforces a shared limit.
export async function rateLimit(opts: {
  key: string;
  max: number;
  windowMs: number;
}): Promise<boolean> {
  const epoch = Math.floor(Date.now() / opts.windowMs);
  const raw = new TextEncoder().encode(`${epoch}:${opts.key}`);
  const digest = await crypto.subtle.digest("SHA-256", raw);
  const key = Array.from(new Uint8Array(digest))
    .map((v) => v.toString(16).padStart(2, "0")).join("");
  const expiresAt = Math.ceil(((epoch + 1) * opts.windowMs) / 1000);
  const row = await env.DB.prepare(
    "INSERT INTO RateLimitBucket (id,count,expiresAt) VALUES (?,1,?) " +
    "ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count"
  ).bind(key, expiresAt).first<{ count: number }>();
  return !!row && row.count <= opts.max;
}
