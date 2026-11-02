import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const user = session.user as { stripeCustomerId?: string };
  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "لا يوجد اشتراك مرتبط" }, { status: 400 });
  }

  const hdrs = await headers();
  const host  = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer:   user.stripeCustomerId,
    return_url: `${proto}://${host}/upgrade`,
  });

  return NextResponse.json({ url: portalSession.url });
}
