"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders children at a fixed design width and scales them down to fit the
 * container's width (thumbnails / previews). Height follows the content.
 */
export function FitWidth({ width, children, className, maxHeight }: { width: number; children: ReactNode; className?: string; maxHeight?: number }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [h, setH] = useState(0);
  const [rtl, setRtl] = useState(true);

  useEffect(() => {
    const o = outer.current, i = inner.current;
    if (!o || !i) return;
    setRtl(getComputedStyle(o).direction === "rtl");
    const update = () => { setScale(o.clientWidth / width); setH(i.offsetHeight); };
    const ro = new ResizeObserver(update);
    ro.observe(o); ro.observe(i);
    update();
    return () => ro.disconnect();
  }, [width]);

  const height = h * scale;
  return (
    <div ref={outer} className={className} style={{ position: "relative", overflow: "hidden", height: maxHeight ? Math.min(height, maxHeight) : height }}>
      <div
        ref={inner}
        style={{ width, position: "absolute", top: 0, insetInlineStart: 0, transform: `scale(${scale || 0.0001})`, transformOrigin: rtl ? "top right" : "top left", visibility: scale ? "visible" : "hidden" }}
      >
        {children}
      </div>
    </div>
  );
}
