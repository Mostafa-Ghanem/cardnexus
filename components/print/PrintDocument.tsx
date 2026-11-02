"use client";

import { useEffect, useState } from "react";
import { Printer, ArrowRight, Info } from "lucide-react";
import { BLEED_MM, PRINT_FONTS_HREF, PRINT_SIZES, type PrintDesign } from "@/lib/print-design";
import { PrintFace, useOrigin, type PrintCardInput } from "./PrintFace";

export type PrintMode = "pro" | "exact" | "sheet";

export interface PrintJob {
  card: PrintCardInput;
  design: PrintDesign;
}

interface Props {
  jobs: PrintJob[];
  mode: PrintMode;
  branding: string | null;
  backHref: string;
  autoPrint?: boolean;
  notice?: string | null;
}

/** Space around the bleed for crop marks (mm). */
const MARK_AREA = 5;
const A4 = { w: 210, h: 297 };

function CropMarks({ W, H, off }: { W: number; H: number; off: number }) {
  // Marks sit outside the bleed so they are never printed on the card.
  const len = MARK_AREA - 1;
  const xs = [off, off + W];
  const ys = [off, off + H];
  const total = { w: W + 2 * off, h: H + 2 * off };
  const line = (key: string, x1: number, y1: number, x2: number, y2: number) => (
    <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth={0.2} />
  );
  return (
    <svg
      width={`${total.w}mm`} height={`${total.h}mm`} viewBox={`0 0 ${total.w} ${total.h}`}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden
    >
      {xs.flatMap((x) => [line(`t${x}`, x, 0, x, len), line(`b${x}`, x, total.h - len, x, total.h)])}
      {ys.flatMap((y) => [line(`l${y}`, 0, y, len, y), line(`r${y}`, total.w - len, y, total.w, y)])}
    </svg>
  );
}

export function PrintDocument({ jobs, mode, branding, backHref, autoPrint, notice }: Props) {
  const origin = useOrigin();
  const [ready, setReady] = useState(false);
  const first = jobs[0];
  const size = PRINT_SIZES[first?.design.size ?? "85x55"];

  // Wait for fonts and images so the PDF never captures fallback fonts.
  useEffect(() => {
    if (!origin) return;
    let cancelled = false;
    (async () => {
      try { await document.fonts.ready; } catch { /* ignore */ }
      await Promise.all(Array.from(document.images).map((img) =>
        img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })));
      if (cancelled) return;
      setReady(true);
      if (autoPrint) setTimeout(() => window.print(), 300);
    })();
    return () => { cancelled = true; };
  }, [origin, autoPrint]);

  if (!first) return null;

  let pageW: number, pageH: number;
  if (mode === "sheet") { pageW = A4.w; pageH = A4.h; }
  else if (mode === "pro") { pageW = size.w + 2 * (BLEED_MM + MARK_AREA); pageH = size.h + 2 * (BLEED_MM + MARK_AREA); }
  else { pageW = size.w; pageH = size.h; }

  const pageStyle: React.CSSProperties = {
    width: `${pageW}mm`, height: `${pageH}mm`, position: "relative", background: "#fff",
    overflow: "hidden", breakAfter: "page", pageBreakAfter: "always",
  };

  // ── A4 sheet: 2 columns × N rows, fronts page then mirrored backs page ──
  const sheetPages: React.ReactNode[] = [];
  if (mode === "sheet") {
    const cols = 2;
    const rows = Math.floor((A4.h - 16) / size.h);
    const perPage = cols * rows;
    const offX = (A4.w - cols * size.w) / 2;
    const offY = (A4.h - rows * size.h) / 2;
    // A single card fills the sheet; several cards (team) go one per slot.
    const slots: PrintJob[] = jobs.length === 1 ? Array(perPage).fill(jobs[0]) : jobs;
    for (let i = 0; i < slots.length; i += perPage) {
      const chunk = slots.slice(i, i + perPage);
      for (const side of ["front", "back"] as const) {
        sheetPages.push(
          <div key={`${i}-${side}`} className="print-page shadow-lg" style={pageStyle}>
            {/* cut guides */}
            <svg width="210mm" height="297mm" viewBox="0 0 210 297" style={{ position: "absolute", inset: 0 }} aria-hidden>
              {Array.from({ length: cols + 1 }, (_, c) => offX + c * size.w).map((x) => (
                <g key={`x${x}`}>
                  <line x1={x} y1={0} x2={x} y2={offY - 1} stroke="#999" strokeWidth={0.15} />
                  <line x1={x} y1={offY + rows * size.h + 1} x2={x} y2={297} stroke="#999" strokeWidth={0.15} />
                </g>
              ))}
              {Array.from({ length: rows + 1 }, (_, r) => offY + r * size.h).map((y) => (
                <g key={`y${y}`}>
                  <line x1={0} y1={y} x2={offX - 1} y2={y} stroke="#999" strokeWidth={0.15} />
                  <line x1={offX + cols * size.w + 1} y1={y} x2={210} y2={y} stroke="#999" strokeWidth={0.15} />
                </g>
              ))}
            </svg>
            {chunk.map((job, k) => {
              const r = Math.floor(k / cols);
              // Backs are mirrored left↔right so they line up when printed double-sided (long edge).
              const c = side === "front" ? k % cols : cols - 1 - (k % cols);
              return (
                <div key={k} style={{ position: "absolute", left: `${offX + c * size.w}mm`, top: `${offY + r * size.h}mm`, outline: "0.1mm solid #ddd" }}>
                  <PrintFace card={job.card} design={job.design} side={side} bleed={0} origin={origin} branding={branding} />
                </div>
              );
            })}
          </div>
        );
      }
    }
  }

  return (
    <div className="print-root" style={{ background: "#f3f4f6", minHeight: "100vh" }}>
      <link rel="stylesheet" href={PRINT_FONTS_HREF} precedence="default" />
      <style>{`
        @page { size: ${pageW}mm ${pageH}mm; margin: 0; }
        .print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          section[aria-label*="otification"] { display: none !important; }
          .no-print { display: none !important; }
          .print-root { background: #fff !important; min-height: 0 !important; }
          .print-pages { padding: 0 !important; gap: 0 !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; }
          .print-page:last-child { break-after: auto !important; page-break-after: auto !important; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 border-b border-border bg-white/95 backdrop-blur" dir="rtl">
        <div className="mx-auto max-w-4xl flex flex-wrap items-center gap-3 px-4 py-3">
          <a href={backHref} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <ArrowRight className="h-4 w-4" /> رجوع
          </a>
          <div className="flex-1 text-sm text-gray-700">
            {mode === "pro" && <>ملف للمطبعة: {size.label} + هوامش قص {BLEED_MM} مم وعلامات قص · {jobs.length * 2} صفحة</>}
            {mode === "exact" && <>المقاس الدقيق {size.label} بدون هوامش · {jobs.length * 2} صفحة</>}
            {mode === "sheet" && <>لوح A4 جاهز للقص · {sheetPages.length} صفحة (وجه أمامي ثم خلفي)</>}
          </div>
          <button
            onClick={() => window.print()}
            disabled={!ready}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Printer className="h-4 w-4" /> {ready ? "طباعة / حفظ PDF" : "جارٍ التجهيز…"}
          </button>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-3 flex items-start gap-2 text-xs text-gray-500">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            في نافذة الطباعة اختر «حفظ بصيغة PDF»، واجعل الهوامش «بلا»، وفعّل «رسومات الخلفية»، والمقياس 100%.
            {mode === "sheet" && " للطباعة على الوجهين اختر «الحافة الطويلة»."}
          </span>
        </div>
        {notice && (
          <div className="mx-auto max-w-4xl px-4 pb-3 text-xs text-amber-700">{notice}</div>
        )}
      </div>

      <div className="print-pages flex flex-col items-center gap-6 p-6">
        {mode === "sheet"
          ? sheetPages
          : jobs.flatMap((job, i) => (["front", "back"] as const).map((side) => (
              <div key={`${i}-${side}`} className="print-page shadow-lg" style={pageStyle}>
                {mode === "pro" ? (
                  <>
                    <div style={{ position: "absolute", left: `${MARK_AREA}mm`, top: `${MARK_AREA}mm` }}>
                      <PrintFace card={job.card} design={job.design} side={side} bleed={BLEED_MM} origin={origin} branding={branding} />
                    </div>
                    <CropMarks W={size.w} H={size.h} off={MARK_AREA + BLEED_MM} />
                  </>
                ) : (
                  <PrintFace card={job.card} design={job.design} side={side} bleed={0} origin={origin} branding={branding} />
                )}
              </div>
            )))}
      </div>
    </div>
  );
}
