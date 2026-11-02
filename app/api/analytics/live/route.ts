import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Lightweight endpoint for realtime polling — returns only totalViews
export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const card = await db.card.findUnique({
    where: { slug },
    select: { totalViews: true },
  });

  if (!card) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  return NextResponse.json({ totalViews: card.totalViews }, {
    headers: { "Cache-Control": "no-store" },
  });
}
