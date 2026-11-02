import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAppleWalletPass, WalletFeatureDisabledError } from "@/lib/wallet";
import { headers } from "next/headers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const card = await db.card.findUnique({
    where: { slug, isPublic: true },
    select: {
      slug: true, firstName: true, lastName: true, title: true,
      company: true, email: true, phone: true, primaryColor: true, avatarUrl: true,
    },
  });

  if (!card) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const hdrs  = await headers();
  const host  = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";

  try {
    const pass = await generateAppleWalletPass({
      slug:         card.slug,
      firstName:    card.firstName  ?? "",
      lastName:     card.lastName   ?? "",
      title:        card.title,
      company:      card.company,
      email:        card.email,
      phone:        card.phone,
      primaryColor: card.primaryColor,
      avatarUrl:    card.avatarUrl,
      cardUrl:      `${proto}://${host}/c/${card.slug}`,
    });

    return new Response(new Uint8Array(pass), {
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${card.slug}.pkpass"`,
      },
    });
  } catch (err) {
    if (err instanceof WalletFeatureDisabledError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("[wallet/apple]", err);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
