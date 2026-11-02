import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createSubscription, paypalPlanId } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "غير مصرح، سجّل الدخول أولًا" }, { status: 401 });

  const user = session.user as { id: string };
  const { plan } = await req.json() as { plan: "pro" | "business" };

  const planId = paypalPlanId(plan);
  if (!planId) return NextResponse.json({ error: "باقة PayPal غير مُعدّة" }, { status: 400 });

  const hdrs = await headers();
  const host  = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const base  = `${proto}://${host}`;

  try {
    const { approvalUrl, subscriptionId } = await createSubscription({
      planId,
      userId:    user.id,
      plan,
      returnUrl: `${base}/api/paypal/capture?plan=${plan}`,
      cancelUrl: `${base}/upgrade?canceled=1`,
    });

    return NextResponse.json({ url: approvalUrl, subscriptionId });
  } catch (err) {
    console.error("[paypal checkout]", err);
    return NextResponse.json({ error: "تعذّر بدء الدفع عبر PayPal" }, { status: 500 });
  }
}
