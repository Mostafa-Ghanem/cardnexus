"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const POLL_MS = 30_000;

/**
 * Shows a toast when a new lead arrives while the dashboard is open.
 * Polls only while the tab is visible; a cheap indexed query on the server.
 */
export function LeadNotifier() {
  const router = useRouter();
  const since = useRef(new Date().toISOString());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    async function check() {
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch(`/api/leads/my?since=${encodeURIComponent(since.current)}`, { cache: "no-store" });
          if (res.ok) {
            const { leads } = (await res.json()) as { leads: { id: string; name: string; createdAt: string }[] };
            if (leads.length) {
              since.current = leads[0].createdAt;
              const first = leads[0];
              toast.success(leads.length === 1 ? `عميل محتمل جديد: ${first.name}` : `${leads.length} عملاء محتملين جدد`, {
                description: "ترك بياناته على بطاقتك الآن.",
                duration: 10_000,
                action: { label: "عرض", onClick: () => router.push("/leads") },
              });
              if (location.pathname.startsWith("/leads") || location.pathname === "/dashboard") router.refresh();
            }
          }
        } catch { /* offline — try again later */ }
      }
      if (!stopped) timer = setTimeout(check, POLL_MS);
    }
    timer = setTimeout(check, POLL_MS);
    return () => { stopped = true; clearTimeout(timer); };
  }, [router]);

  return null;
}
