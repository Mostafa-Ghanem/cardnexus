import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  let user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, referralCode: true },
  });

  if (!user) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  // Create referral code if missing
  if (!user.referralCode) {
    const code = nanoid(8).toUpperCase();
    user = await db.user.update({
      where: { id: session.user.id },
      data: { referralCode: code },
      select: { id: true, referralCode: true },
    });
  }

  const code = user.referralCode!;

  const signupCount = await db.user.count({
    where: { referredById: session.user.id },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const referralUrl = `${appUrl}/register?ref=${code}`;

  return NextResponse.json({
    data: {
      code,
      signupCount,
      clickCount: 0,
      referralUrl,
    },
  });
}
