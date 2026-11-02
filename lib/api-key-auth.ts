import { createHash } from "crypto";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Resolve the user behind an `Authorization: Bearer <key>` header.
 * Keys are stored only as SHA-256 hashes. Returns null for missing/invalid keys.
 */
export async function userIdFromApiKey(authHeader: string | null): Promise<{ userId: string } | { error: string; status: number }> {
  const key = authHeader?.match(/^Bearer\s+(fk_[a-f0-9]{48})$/)?.[1];
  if (!key) return { error: "مفتاح API مفقود أو غير صالح", status: 401 };

  const keyHash = createHash("sha256").update(key).digest("hex");
  if (!rateLimit({ key: `apikey:${keyHash}`, max: 60, windowMs: 60_000 })) {
    return { error: "طلبات كثيرة، حاول بعد دقيقة", status: 429 };
  }

  const apiKey = await db.apiKey.findUnique({
    where: { keyHash },
    select: { id: true, userId: true, lastUsedAt: true, user: { select: { bannedAt: true } } },
  });
  if (!apiKey || apiKey.user.bannedAt) return { error: "مفتاح API غير صالح", status: 401 };

  // Throttle writes: record usage at most once a minute.
  if (!apiKey.lastUsedAt || Date.now() - apiKey.lastUsedAt.getTime() > 60_000) {
    await db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  }
  return { userId: apiKey.userId };
}
