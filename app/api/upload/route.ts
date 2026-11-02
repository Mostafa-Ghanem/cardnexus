import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { countUserImages, isR2Configured, putImage } from "@/lib/r2";
import { nanoid } from "nanoid";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AllowedMime = typeof ALLOWED_TYPES[number];
const MIME_TO_EXT: Record<AllowedMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_UPLOADS_PER_USER = 20;

function matchesSignature(data: Buffer, mime: AllowedMime) {
  if (mime === "image/jpeg") return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (mime === "image/png") return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime === "image/gif") return data.length >= 6 && ["GIF87a","GIF89a"].includes(data.subarray(0,6).toString("ascii"));
  if (mime === "image/webp") return data.length >= 12 &&
    data.subarray(0,4).toString("ascii") === "RIFF" &&
    data.subarray(8,12).toString("ascii") === "WEBP";
  return false;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isR2Configured()) {
    return NextResponse.json({ error: "Image storage is not configured" }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type as AllowedMime)) {
      return NextResponse.json({ error: "Unsupported image format" }, { status: 400 });
    }
    if (file.size < 1 || file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Maximum image size is 5MB" }, { status: 400 });
    }
    const mime = file.type as AllowedMime;
    const body = Buffer.from(await file.arrayBuffer());
    if (!matchesSignature(body, mime)) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    const alreadyUploaded = await countUserImages(session.user.id);
    if (alreadyUploaded >= MAX_UPLOADS_PER_USER) {
      return NextResponse.json({ error: "Maximum of 20 images per user" }, { status: 400 });
    }
    const name = `${session.user.id}-${nanoid(16)}.${MIME_TO_EXT[mime]}`;
    await putImage(name, body, mime);
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (error) {
    console.error("Image upload failed:", error);
    return NextResponse.json({ error: "Image upload failed" }, { status: 502 });
  }
}
