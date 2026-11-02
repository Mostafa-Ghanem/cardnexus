import { NextRequest, NextResponse } from "next/server";
import { getImage, isR2Configured } from "@/lib/r2";

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", gif: "image/gif",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  if (path.length !== 1) return new NextResponse("Not Found", { status: 404 });
  const key = path[0];
  if (!/^[a-zA-Z0-9_-]{1,140}\.(?:jpg|jpeg|png|webp|gif)$/.test(key)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  if (!isR2Configured()) return new NextResponse("Storage unavailable", { status: 503 });
  try {
    const bytes = await getImage(key);
    if (!bytes) return new NextResponse("Not Found", { status: 404 });
    const type = key.split(".").pop()!.toLowerCase();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": MIME[type],
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error("R2 image read failed:", error);
    return new NextResponse("Storage unavailable", { status: 502 });
  }
}
