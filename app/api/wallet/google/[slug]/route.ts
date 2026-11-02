import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateGoogleWalletPassUrl, WalletFeatureDisabledError } from "@/lib/wallet";
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
    const saveUrl = await generateGoogleWalletPassUrl({
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

    return NextResponse.json({ url: saveUrl });
  } catch (err) {
    if (err instanceof WalletFeatureDisabledError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("[wallet/google]", err);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
