import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Stripe from "stripe";

const PRICE_IDS: Record<string, string | undefined> = {
  pro:      process.env.STRIPE_PRICE_PRO_MONTHLY,
  business: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
};

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const user = session.user as { id: string; email: string; name?: string; stripeCustomerId?: string };
  const { plan } = await req.json() as { plan: string };

  const priceId = PRICE_IDS[plan];
  if (!priceId) return NextResponse.json({ error: "باقة غير معروفة" }, { status: 400 });

  const hdrs = await headers();
  const host  = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${proto}://${host}`;

  // Reuse or create Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name:  user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer:   customerId,
    mode:       "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/upgrade?success=1`,
    cancel_url:  `${baseUrl}/upgrade?canceled=1`,
    metadata:    { userId: user.id, plan },
    subscription_data: { metadata: { userId: user.id, plan } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
