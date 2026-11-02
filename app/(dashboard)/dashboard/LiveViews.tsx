"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";

interface Props {
  initialViews: number;
  cardSlug: string;
}

export function LiveViews({ initialViews, cardSlug }: Props) {
  const [views, setViews] = useState(initialViews);
  const [pulse, setPulse] = useState(false);
  const prevRef = useRef(initialViews);

  useEffect(() => {
    if (!cardSlug) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/analytics/live?slug=" + cardSlug);
        if (!res.ok) return;
        const { totalViews } = await res.json();
        if (typeof totalViews === "number" && totalViews !== prevRef.current) {
          prevRef.current = totalViews;
          setViews(totalViews);
          setPulse(true);
          setTimeout(() => setPulse(false), 800);
        }
      } catch { /* ignore */ }
    }, 15_000); // poll every 15 s

    return () => clearInterval(interval);
  }, [cardSlug]);

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">إجمالي الزيارات</p>
        <p className={`text-3xl font-bold mt-1 transition-colors duration-300 ${pulse ? "text-green-600" : ""}`}>
          {views.toLocaleString("ar-u-nu-latn")}
        </p>
      </div>
      <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center transition-all duration-300 ${pulse ? "ring-2 ring-green-400" : ""}`}>
        <Eye className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
}
