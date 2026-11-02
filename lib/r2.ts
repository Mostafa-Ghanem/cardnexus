/**
 * Cloudflare R2 (S3-compatible) storage for Hostinger Node.js hosting.
 * Uses Node's built-in crypto/fetch for AWS Signature V4; no extra runtime packages.
 * Bucket stays private; images are served only through /uploads/[...path].
 */
import { createHash, createHmac } from "node:crypto";

type Method = "GET" | "PUT";

const required = [
  "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET",
] as const;

function settings() {
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    throw new Error("R2 storage is not configured: " + missing.join(", "));
  }
  const account = process.env.R2_ACCOUNT_ID!;
  const bucket = process.env.R2_BUCKET!;
  if (!/^[a-f0-9]{32}$/i.test(account) || !/^[a-z0-9][a-z0-9.-]{1,62}$/.test(bucket)) {
    throw new Error("Invalid R2 account or bucket configuration");
  }
  return {
    account, bucket,
    keyId: process.env.R2_ACCESS_KEY_ID!,
    secret: process.env.R2_SECRET_ACCESS_KEY!,
  };
}
export function isR2Configured() {
  return required.every((key) => Boolean(process.env[key]?.trim()));
}

function hash(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}
function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}
function awsEscape(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (x) =>
    "%" + x.charCodeAt(0).toString(16).toUpperCase());
}

async function signedRequest(
  method: Method, key: string | null,
  opts: { payload?: Buffer; contentType?: string; query?: Record<string, string> } = {},
): Promise<Response> {
  const cfg = settings();
  if (key !== null && !/^[a-zA-Z0-9_-]{1,140}\.(?:jpg|jpeg|png|webp|gif)$/.test(key)) {
    throw new Error("Unsafe image key");
  }
  const host = `${cfg.account}.r2.cloudflarestorage.com`;
  const uri = "/" + [cfg.bucket, ...(key ? [key] : [])].map(awsEscape).join("/");
  const canonicalQuery = Object.entries(opts.query ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${awsEscape(k)}=${awsEscape(v)}`).join("&");
  const url = `https://${host}${uri}${canonicalQuery ? "?" + canonicalQuery : ""}`;
  const payloadHash = hash(opts.payload ?? Buffer.alloc(0));
  const now = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = now.slice(0, 8);
  const canonicalHeaders =
    `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${now}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    method, uri, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash,
  ].join("\n");
  const scope = `${date}/auto/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", now, scope, hash(canonicalRequest)].join("\n");
  const dateKey = hmac("AWS4" + cfg.secret, date);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = createHmac("sha256", signingKey).update(toSign).digest("hex");
  const headers: Record<string, string> = {
    "x-amz-date": now,
    "x-amz-content-sha256": payloadHash,
    authorization: `AWS4-HMAC-SHA256 Credential=${cfg.keyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
  if (opts.contentType) headers["content-type"] = opts.contentType;
  return fetch(url, {
    method,
    headers,
    body: opts.payload ? new Uint8Array(opts.payload) : undefined,
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
}

async function expectOK(response: Response) {
  if (!response.ok) {
    console.error("R2 returned", response.status, "from S3 API");
    throw new Error(`R2 request failed (HTTP ${response.status})`);
  }
}

export async function countUserImages(userId: string): Promise<number> {
  if (!/^[a-zA-Z0-9_-]{1,110}$/.test(userId)) throw new Error("Invalid user ID");
  const r = await signedRequest("GET", null, {
    query: { "list-type": "2", "max-keys": "21", prefix: `${userId}-` },
  });
  await expectOK(r);
  const xml = await r.text();
  // R2/S3 ListObjectsV2 returns one <Contents> block per object.
  return (xml.match(/<Contents>/g) ?? []).length;
}

export async function putImage(key: string, data: Buffer, mime: string) {
  const r = await signedRequest("PUT", key, { payload: data, contentType: mime });
  await expectOK(r);
}

export async function getImage(key: string): Promise<ArrayBuffer | null> {
  const r = await signedRequest("GET", key);
  if (r.status === 404) return null;
  await expectOK(r);
  return r.arrayBuffer();
}
