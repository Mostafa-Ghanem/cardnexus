"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { CardPreview } from "@/components/card/CardPreview";
import { FitWidth } from "@/components/ui/fit-width";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CardData } from "@/types";
import { cn } from "@/lib/utils";

const COLORS = ["#0F766E", "#1D4ED8", "#7C3AED", "#BE123C", "#B45309", "#0F172A"];
const SHOWN = ["classic", "modern", "dark", "elegant", "gradient", "bold"] as const;

/** "Type your name" gallery: every template updates live before signing up. */
export function TemplatePlayground() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [first, ...rest] = (name.trim() || "اسمك هنا").split(/\s+/);
  const card: Partial<CardData> = {
    firstName: first, lastName: rest.join(" "), title: title || "المسمى الوظيفي", company: "شركتك",
    mobile: "+966 5X XXX XXXX", email: "you@company.com", primaryColor: color,
    roundedStyle: "default", shadowStyle: "md", cardBackground: "white", customLinks: [],
  };

  return (
    <div className="space-y-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="pg-name">اسمك</label>
        <Input id="pg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اكتب اسمك…" className="h-11 text-base" maxLength={40} />
        <label className="sr-only" htmlFor="pg-title">المسمى</label>
        <Input id="pg-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مسماك الوظيفي" className="h-11 text-base" maxLength={40} />
        <div className="flex shrink-0 justify-center gap-1.5" role="group" aria-label="اللون">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} aria-label={c} aria-pressed={color === c}
              className={cn("h-7 w-7 rounded-full border-2 transition-transform hover:scale-110", color === c ? "border-foreground scale-110" : "border-transparent")}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 stagger">
        {SHOWN.map((t) => (
          <div key={t} className="group rounded-2xl bg-muted/40 p-3 transition-all hover:-translate-y-1 hover:shadow-xl">
            <FitWidth width={360} maxHeight={300} className="pointer-events-none rounded-xl">
              <CardPreview card={{ ...card, templateId: t }} />
            </FitWidth>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button asChild size="lg">
          <Link href="/register"><Sparkles className="h-4 w-4" /> احفظ بطاقتك مجانًا <ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">12 قالبًا رقميًا + 12 تصميمًا للطباعة</p>
      </div>
    </div>
  );
}
