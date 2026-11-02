import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";
import { rateLimit } from "./lib/rate-limit";
import { rawClientIp } from "./lib/client-ip";

// ─── Custom domain detection ──────────────────────────────────────────────────

function toHostname(val: string) {
  return val.replace(/^https?:\/\//, "").split(":")[0].split("/")[0];
}

const PLATFORM_HOSTNAMES = [
  "localhost",
  "0.0.0.0",
  process.env.BETTER_AUTH_URL ? toHostname(process.env.BETTER_AUTH_URL) : "",
  process.env.APP_URL ? toHostname(process.env.APP_URL) : "",
].filter(Boolean);

function isLikelyCustomDomain(host: string): boolean {
  const hostname = toHostname(host);
  if (!hostname) return false;
  if (PLATFORM_HOSTNAMES.includes(hostname)) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;
  if (!hostname.includes(".")) return false;
  return true;
}

// ─── Auth route constants ─────────────────────────────────────────────────────

const PUBLIC_EXACT_PATHS = new Set([
  "/", "/login", "/register", "/pricing", "/datenschutz", "/impressum",
  // Must stay reachable while logged out: password reset and the 2FA step.
  "/forgot-password", "/reset-password", "/login/2fa",
]);
const PUBLIC_PREFIXES = ["/c/", "/p/", "/print/", "/team/", "/uploads/"];
const AUTH_PATHS = ["/login", "/register"];
const ADMIN_PATHS = ["/admin"];

export async function proxy(request: NextRequest) {
  const fwdHost  = request.headers.get("x-forwarded-host");
  const fwdProto = request.headers.get("x-forwarded-proto") ?? "http";
  const host     = fwdHost ?? request.headers.get("host") ?? "";
  const base     = `${fwdProto}://${host}`;
  const { pathname } = request.nextUrl;

  // ── Fix Host header for app code behind a reverse proxy ───────────────────
  // Reverse proxies forward the backend address (e.g. 46.x.x.x:3000) as Host.
  // better-auth constructs the origin from this header and rejects sessions
  // because the raw IP is not in trustedOrigins.
  // Solution: rewrite Host to X-Forwarded-Host for all NextResponse.next() calls.
  function nextWithFixedHost() {
    if (!fwdHost) return NextResponse.next();
    const headers = new Headers(request.headers);
    headers.set("host", fwdHost);
    return NextResponse.next({ request: { headers } });
  }

  // ── Auth brute-force protection ───────────────────────────────────────────
  // Rate-limit sign-in and sign-up: max 10 attempts per IP per minute.
  // Must run BEFORE the API early-return so it applies to auth routes.
  if (
    pathname.startsWith("/api/auth/sign-in") ||
    pathname.startsWith("/api/auth/sign-up")
  ) {
    const ip = rawClientIp(request.headers) || "anon";
    if (!rateLimit({ key: `auth:${ip}`, max: 10, windowMs: 60_000 })) {
      return new NextResponse(
        JSON.stringify({ error: "محاولات دخول كثيرة. حاول مرة أخرى بعد دقيقة." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }
  }

  // ── API routes: only fix the Host header, skip all other logic ────────────
  // Auth checks and custom-domain routing must NOT run for API calls.
  if (pathname.startsWith("/api/")) {
    return nextWithFixedHost();
  }

  // ── Custom domain routing ──────────────────────────────────────────────────
  if (isLikelyCustomDomain(host)) {
    const url = request.nextUrl.clone();
    const hostname = toHostname(host);
    url.pathname = `/api/domain/${encodeURIComponent(hostname)}`;
    return NextResponse.rewrite(url);
  }

  // ── Auth / route protection ───────────────────────────────────────────────
  const isPublic = PUBLIC_EXACT_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuth   = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isAdmin  = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  // Call Better Auth directly: Hostinger's Node process port is not fixed,
  // and a server-side HTTP fetch to localhost:3000 fails in managed hosting.
  const session = await auth.api.getSession({ headers: request.headers });

  const isAuthenticated = !!session?.user;

  if (isAuthenticated && isAuth) {
    return NextResponse.redirect(`${base}/dashboard`);
  }

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(`${base}/login`);
  }

  if (isAdmin && session?.user) {
    const role = (session.user as { role?: string }).role;
    if (role !== "super_admin") {
      return NextResponse.redirect(`${base}/dashboard`);
    }
  }

  return nextWithFixedHost();
}

export const config = {
  matcher: [
    // Include /api/* so the Host header is fixed for API calls too.
    // API routes exit early (only host-fix, no auth/domain logic).
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
