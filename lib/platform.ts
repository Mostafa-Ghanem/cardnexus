import { db } from "./db";

export interface PlatformSettings {
  id: string;
  appName: string;
  appUrl: string;
  faviconUrl: string | null;
  logoUrl: string | null;
  primaryColor: string;
  supportEmail: string | null;
  footerText: string | null;
  allowedDomains: string | null;
}

const DEFAULTS: Omit<PlatformSettings, "id"> = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "كارت نكسس",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  faviconUrl: null,
  logoUrl: null,
  primaryColor: "#0F766E",
  supportEmail: null,
  footerText: null,
  allowedDomains: null,
};

// Cache for 60s in production to avoid DB hit on every request
let cache: { data: PlatformSettings; at: number } | null = null;
const TTL = 60_000;

export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;

  try {
    const row = await db.platformSettings.upsert({
      where: { id: "main" },
      create: { id: "main", ...DEFAULTS },
      update: {},
    });

    const data = row as PlatformSettings;
    cache = { data, at: Date.now() };
    return data;
  } catch {
    // DB not available (e.g. during Docker image build) — return safe defaults
    return { id: "main", ...DEFAULTS };
  }
}

export function invalidateSettingsCache() {
  cache = null;
}
