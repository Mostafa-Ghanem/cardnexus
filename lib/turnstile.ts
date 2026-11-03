import { bindings as env } from "@/lib/cloudflare-bindings";

/** Optional Turnstile protection. Keep it disabled until BOTH keys are set. */
export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY || !env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return true;
  if (!token) return false;
  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  });
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return false;
    const result = (await res.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}
