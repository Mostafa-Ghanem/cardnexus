"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { localizeCard } from "@/lib/card-i18n";
import { PRINT_SIZES, type PrintDesign } from "@/lib/print-design";
import { qrArtSvg } from "@/lib/qr-art";
import { getPrintDesign, fontCss, type FaceCtx, type FaceData } from "./designs";

export const MM_TO_PX = 96 / 25.4;

export type { PrintCardInput } from "@/lib/print-design";
import type { PrintCardInput } from "@/lib/print-design";

function initialsOf(first?: string | null, last?: string | null) {
  // Skip the Arabic definite article: «العتيبي» → «ع»
  const lastWord = (last ?? "").trim().replace(/^ال(?=\S{2,})/, "");
  const parts = [(first ?? "").trim()[0], lastWord[0]].filter(Boolean) as string[];
  if (!parts.length) return "•";
  // Arabic letters would join into a word; a zero-width non-joiner keeps them apart.
  return /[A-Za-z]/.test(parts.join("")) ? parts.join("").toUpperCase() : parts.join("\u200C");
}

function faceData(card: PrintCardInput, lang: "ar" | "en"): FaceData {
  const c = localizeCard(card, lang);
  return {
    name: [c.firstName, c.lastName].filter(Boolean).join(" ") || (lang === "en" ? "Your Name" : "اسمك"),
    title: c.title ?? "",
    company: c.company ?? "",
    phone: c.phone ?? "",
    mobile: c.mobile ?? "",
    email: c.email ?? "",
    website: c.website ?? "",
    address: c.address ?? "",
    logoUrl: c.logoUrl ?? "",
    avatarUrl: c.avatarUrl ?? "",
    initials: initialsOf(c.firstName, c.lastName),
  };
}

/** Public URL the QR code on the card opens. */
export function cardQrUrl(origin: string, slug: string) {
  return `${origin}/c/${slug}?source=qr`;
}

export function useOrigin() {
  const [o, setO] = useState("");
  useEffect(() => setO(window.location.origin), []);
  return o;
}

export interface PrintFaceProps {
  card: PrintCardInput;
  design: PrintDesign;
  side: "front" | "back";
  /** Bleed drawn around the trim size (mm). 0 for previews/exact size. */
  bleed?: number;
  origin: string;
  branding?: string | null;
}

/** One card face at real size (mm). */
export function PrintFace({ card, design, side, bleed = 0, origin, branding = null }: PrintFaceProps) {
  const def = getPrintDesign(design.designId);
  const size = PRINT_SIZES[design.size] ?? PRINT_SIZES["85x55"];
  const lang: "ar" | "en" =
    design.lang === "en" ? "en" : design.lang === "bi" ? (side === "front" ? "ar" : "en") : "ar";
  const p = design.primary ?? def.primary ?? card.primaryColor ?? "#0F766E";
  const a = design.accent ?? def.accent ?? card.accentColor ?? "#14B8A6";

  const qr = useMemo<ReactNode>(() => {
    if (side !== "back" || !design.backQr || !origin) return null;
    const svg = qrArtSvg({ text: cardQrUrl(origin, card.slug), color: "#111111", style: design.qrStyle, margin: 0 });
    return <span style={{ display: "block", width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: svg }} />;
  }, [side, design.backQr, design.qrStyle, origin, card.slug]);

  const ctx: FaceCtx = {
    d: faceData(card, lang),
    lang,
    dir: lang === "en" ? "ltr" : "rtl",
    p, a,
    font: fontCss(design.font ?? def.font),
    W: size.w, H: size.h, b: bleed,
    show: design.show,
    tagline: design.tagline,
    nfc: design.nfc && side === "back",
    qr,
    backDetails: design.lang === "bi" && side === "back",
    branding: side === "back" ? branding : null,
  };

  return (
    <div
      dir={ctx.dir}
      lang={lang}
      className="print-face"
      style={{
        position: "relative",
        width: `${size.w + 2 * bleed}mm`,
        height: `${size.h + 2 * bleed}mm`,
        overflow: "hidden",
        fontFamily: ctx.font,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        background: "#fff",
        flexShrink: 0,
      }}
    >
      {side === "front" ? def.front(ctx) : def.back(ctx)}
    </div>
  );
}

/** A face scaled to the width of its container (for previews/thumbnails). */
export function ScaledFace(props: PrintFaceProps & { className?: string; rounded?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const size = PRINT_SIZES[props.design.size] ?? PRINT_SIZES["85x55"];
  const b = props.bleed ?? 0;
  const wPx = (size.w + 2 * b) * MM_TO_PX;
  const hPx = (size.h + 2 * b) * MM_TO_PX;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / wPx));
    ro.observe(el);
    return () => ro.disconnect();
  }, [wPx]);

  return (
    <div
      ref={ref}
      className={props.className}
      style={{ width: "100%", aspectRatio: `${wPx} / ${hPx}`, position: "relative", overflow: "hidden", borderRadius: props.rounded === false ? 0 : "2.5%/4%" }}
    >
      {scale > 0 && (
        <div style={{ position: "absolute", top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <PrintFace {...props} />
        </div>
      )}
    </div>
  );
}

