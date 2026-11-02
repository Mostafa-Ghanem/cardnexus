"use client";

import { CardPreview } from "@/components/card/CardPreview";
import { FitWidth } from "@/components/ui/fit-width";
import { ScaledFace } from "@/components/print/PrintFace";
import { DEFAULT_PRINT_DESIGN } from "@/lib/print-design";
import { UserPlus, QrCode, Eye } from "lucide-react";
import type { CardData } from "@/types";

const SAMPLE: Partial<CardData> = {
  slug: "demo", firstName: "ريم", lastName: "الشمري", title: "مديرة التسويق", company: "شركة مدار",
  mobile: "+966 55 123 4567", email: "reem@madar.sa", website: "https://madar.sa",
  templateId: "modern", primaryColor: "#0F766E", accentColor: "#14B8A6",
  roundedStyle: "default", shadowStyle: "none", cardBackground: "white", customLinks: [],
  linkedin: "https://linkedin.com/in/demo", instagram: "https://instagram.com/demo",
};

/** Hero illustration: phone with a live card, a printed card behind it and floating chips. */
export function HeroVisual() {
  return (
    <div className="relative mx-auto h-[520px] w-full max-w-[460px] select-none" aria-hidden>
      {/* glow */}
      <div className="absolute inset-10 rounded-full bg-primary/25 blur-3xl" />

      {/* printed card behind */}
      <div className="absolute top-16 -start-2 w-[250px] animate-float" style={{ ["--r" as string]: "-10deg", animationDelay: "-2s" }}>
        <div className="drop-shadow-2xl">
          <ScaledFace card={{ ...SAMPLE, slug: "demo" } as never} design={{ ...DEFAULT_PRINT_DESIGN, designId: "arabesque", font: "mirza" }} side="front" origin="" />
        </div>
      </div>

      {/* phone */}
      <div className="absolute end-4 top-0 w-[250px] rounded-[2.6rem] border-[10px] border-gray-900 bg-gray-50 shadow-2xl dark:border-gray-700 animate-float" style={{ ["--r" as string]: "4deg" }}>
        <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-gray-900 dark:bg-gray-700" />
        <div className="h-[440px] overflow-hidden rounded-b-[2rem] px-3 pt-3">
          <FitWidth width={360}>
            <CardPreview card={SAMPLE} />
          </FitWidth>
        </div>
      </div>

      {/* chips */}
      <div className="absolute bottom-24 start-0 flex items-center gap-2 rounded-2xl border border-border bg-card/95 px-3 py-2 text-sm shadow-xl backdrop-blur animate-float" style={{ animationDelay: "-1s" }}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><UserPlus className="h-4 w-4" /></span>
        <div><p className="font-semibold leading-tight">عميل محتمل جديد</p><p className="text-xs text-muted-foreground">محمد · قبل دقيقة</p></div>
      </div>
      <div className="absolute bottom-6 end-10 flex items-center gap-2 rounded-2xl border border-border bg-card/95 px-3 py-2 text-sm shadow-xl backdrop-blur animate-float" style={{ animationDelay: "-3s" }}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary"><Eye className="h-4 w-4" /></span>
        <div><p className="font-semibold leading-tight">+128 زيارة</p><p className="text-xs text-muted-foreground">هذا الأسبوع</p></div>
      </div>
      <div className="absolute top-2 start-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-xl animate-float" style={{ animationDelay: "-4s" }}>
        <QrCode className="h-6 w-6" />
      </div>
    </div>
  );
}
