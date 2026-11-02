/**
 * Native Cloudflare R2 binding; no S3 credentials, AWS signing or filesystem.
 * All objects remain in the private bucket and are streamed via /uploads.
 */
import { bindings as env } from "./cloudflare-bindings";

const keyPattern = /^[a-zA-Z0-9_-]{1,140}\.(?:jpg|jpeg|png|webp|gif)$/;
function imageKey(key: string) {
  if (!keyPattern.test(key)) throw new Error("Unsafe image key");
  return key;
}
export function isR2Configured(): boolean {
  return !!env.IMAGES;
}
export async function countUserImages(userId: string): Promise<number> {
  if (!/^[a-zA-Z0-9_-]{1,110}$/.test(userId)) throw new Error("Invalid user ID");
  const list = await env.IMAGES.list({ prefix: `${userId}-`, limit: 21 });
  return list.objects.length;
}
export async function putImage(key: string, data: Buffer, mime: string): Promise<void> {
  const result = await env.IMAGES.put(imageKey(key), new Uint8Array(data), {
    httpMetadata: { contentType: mime, cacheControl: "max-age=86400" },
  });
  if (!result) throw new Error("R2 returned no upload result");
}
export async function getImage(key: string): Promise<ArrayBuffer | null> {
  const item = await env.IMAGES.get(imageKey(key));
  return item ? item.arrayBuffer() : null;
}
