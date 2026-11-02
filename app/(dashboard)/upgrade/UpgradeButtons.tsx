"use client";
import { T } from "@/components/i18n/I18nProvider";


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Props {
  planId: "pro" | "business";
  isCurrent: boolean;
  hasStripe: boolean;
  hasPaypal: boolean;
  stripeConfigured: boolean;
  paypalConfigured: boolean;
}

export function UpgradeButtons({
  planId,
  isCurrent,
  hasStripe,
  hasPaypal,
  stripeConfigured,
  paypalConfigured,
}: Props) {
  const [loading, setLoading] = useState<"stripe" | "paypal" | "portal" | null>(null);

  async function startStripe() {
    setLoading("stripe");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  async function startPaypal() {
    setLoading("paypal");
    try {
      const res = await fetch("/api/paypal/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  // Current plan — show management options
  if (isCurrent) {
    return (
      <div className="space-y-2">
        <Button variant="outline" className="w-full" disabled><T text={"Aktueller Plan"} /></Button>
        {hasStripe && (
          <Button
            variant="ghost"
            className="w-full text-xs text-muted-foreground"
            onClick={openPortal}
            disabled={loading !== null}
          >
            {loading === "portal" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Abo verwalten / kündigen (Stripe)"
            )}
          </Button>
        )}
        {hasPaypal && (
          <p className="text-xs text-muted-foreground text-center"><T text={"PayPal-Abo über"} />{" "}
            <a
              href="https://www.paypal.com/myaccount/autopay"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            ><T text={"paypal.com/myaccount/autopay"} /></a>{" "}<T text={"kündigen."} /></p>
        )}
      </div>
    );
  }

  // Not configured at all — mailto fallback
  if (!stripeConfigured && !paypalConfigured) {
    return (
      <Button asChild variant="outline" className="w-full">
        <a href={`mailto:sales@cardnexus.app?subject=Upgrade zu ${planId}`}><T text={"Per E-Mail anfragen"} /></a>
      </Button>
    );
  }

  // Payment buttons
  return (
    <div className="space-y-2">
      {stripeConfigured && (
        <Button
          className="w-full"
          onClick={startStripe}
          disabled={loading !== null}
        >
          {loading === "stripe" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Kreditkarte / SEPA"
          )}
        </Button>
      )}
      {paypalConfigured && (
        <Button
          variant="outline"
          className="w-full gap-2 font-semibold"
          onClick={startPaypal}
          disabled={loading !== null}
        >
          {loading === "paypal" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {/* PayPal logo color */}
              <span className="text-[#003087] font-extrabold"><T text={"Pay"} /></span>
              <span className="text-[#009cde] font-extrabold"><T text={"Pal"} /></span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}
