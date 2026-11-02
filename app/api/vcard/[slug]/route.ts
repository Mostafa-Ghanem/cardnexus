import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateVCard, vCardFileName, vCardContentDisposition } from "@/lib/vcard";
import type { CardData } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const card = await db.card.findUnique({
    where: { slug },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!card || !card.isPublic) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  // Track download
  await db.cardAnalytic.create({
    data: { cardSlug: slug, event: "vcard_download" },
  });

  const cardData = {
    ...card,
    customLinks: JSON.parse(card.customLinks),
  } as CardData;

  const vcf = generateVCard(cardData);
  const filename = vCardFileName(cardData);

  return new NextResponse(vcf, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": vCardContentDisposition(filename),
    },
  });
}
