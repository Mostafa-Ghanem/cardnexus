/**
 * PayPal REST API helpers — Subscriptions API v1
 * Uses fetch only, no extra SDK dependency.
 * Set PAYPAL_MODE=live for production, defaults to sandbox.
 */

const BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export function paypalConfigured(): boolean {
  return !!(
    process.env.PAYPAL_CLIENT_ID &&
    process.env.PAYPAL_CLIENT_SECRET &&
    (process.env.PAYPAL_PLAN_PRO_MONTHLY || process.env.PAYPAL_PLAN_BUSINESS_MONTHLY)
  );
}

export function paypalPlanId(plan: "pro" | "business"): string | null {
  if (plan === "pro")      return process.env.PAYPAL_PLAN_PRO_MONTHLY ?? null;
  if (plan === "business") return process.env.PAYPAL_PLAN_BUSINESS_MONTHLY ?? null;
  return null;
}

/** Get a short-lived OAuth2 access token. */
async function getAccessToken(): Promise<string> {
  const clientId     = process.env.PAYPAL_CLIENT_ID ?? "";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET ?? "";
  const credentials  = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method:  "POST",
    headers: {
      Authorization:  `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal token error: ${err}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export interface PayPalSubscription {
  id:     string;
  status: string; // APPROVAL_PENDING | APPROVED | ACTIVE | SUSPENDED | CANCELLED | EXPIRED
  custom_id?: string; // we encode `${userId}|${plan}` in createSubscription
  links:  { href: string; rel: string; method: string }[];
  billing_info?: {
    next_billing_time?: string;
  };
}

/** Create a PayPal subscription and return the approval URL + subscription ID. */
export async function createSubscription(opts: {
  planId:    string;
  userId:    string;
  plan:      string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ approvalUrl: string; subscriptionId: string }> {
  const token = await getAccessToken();

  const res = await fetch(`${BASE}/v1/billing/subscriptions`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `${opts.userId}-${Date.now()}`,
    },
    body: JSON.stringify({
      plan_id:   opts.planId,
      custom_id: `${opts.userId}|${opts.plan}`, // we read this in the webhook
      application_context: {
        brand_name:  process.env.NEXT_PUBLIC_APP_NAME ?? "CardNexus",
        locale:      "ar-u-nu-latn",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected:   "PAYPAL",
          payee_preferred:  "IMMEDIATE_PAYMENT_REQUIRED",
        },
        return_url: opts.returnUrl,
        cancel_url: opts.cancelUrl,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal subscription error: ${err}`);
  }

  const sub = await res.json() as PayPalSubscription;
  const approvalUrl = sub.links.find((l) => l.rel === "approve")?.href;
  if (!approvalUrl) throw new Error("No approval URL from PayPal");

  return { approvalUrl, subscriptionId: sub.id };
}

/** Fetch a subscription by ID and return status + next billing date. */
export async function getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
  const token = await getAccessToken();

  const res = await fetch(`${BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal get subscription error: ${err}`);
  }

  return res.json() as Promise<PayPalSubscription>;
}

/** Cancel a subscription. */
export async function cancelSubscription(subscriptionId: string, reason = "User request"): Promise<void> {
  const token = await getAccessToken();

  await fetch(`${BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
}

/** Verify a PayPal webhook signature using the verify endpoint. */
export async function verifyWebhookSignature(opts: {
  transmissionId:   string;
  transmissionTime: string;
  certUrl:          string;
  authAlgo:         string;
  transmissionSig:  string;
  webhookId:        string;
  body:             string;
}): Promise<boolean> {
  const token = await getAccessToken();

  const res = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transmission_id:   opts.transmissionId,
      transmission_time: opts.transmissionTime,
      cert_url:          opts.certUrl,
      auth_algo:         opts.authAlgo,
      transmission_sig:  opts.transmissionSig,
      webhook_id:        opts.webhookId,
      webhook_event:     JSON.parse(opts.body),
    }),
  });

  if (!res.ok) return false;
  const data = await res.json() as { verification_status: string };
  return data.verification_status === "SUCCESS";
}
