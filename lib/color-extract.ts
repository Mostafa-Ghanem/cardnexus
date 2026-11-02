/**
 * Brand-colour extraction from a logo, in the browser (canvas). Works on a
 * local File (no CORS issues) or any same-origin / CORS-enabled URL.
 */

function toHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s, l };
}

/** Darken a colour until white text on it is readable (contrast ≥ 4.5). */
export function readableOnWhite(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  let [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
  const lum = () => {
    const c = [r, g, b].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  for (let i = 0; i < 20 && 1.05 / (lum() + 0.05) < 4.5; i++) { r *= 0.9; g *= 0.9; b *= 0.9; }
  return toHex(r, g, b);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Returns up to `max` dominant, distinct, saturated colours (most prominent first).
 * Near-white, near-black, grey and transparent pixels are ignored.
 */
export async function extractPalette(source: File | string, max = 4): Promise<string[]> {
  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  try {
    const img = await loadImage(url);
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    const buckets = new Map<number, { n: number; r: number; g: number; b: number; w: number }>();
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      if (a < 160) continue;
      const { s, l } = rgbToHsl(r, g, b);
      if (l > 0.93 || l < 0.08 || s < 0.18) continue;
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0, w: 0 };
      e.n++; e.r += r; e.g += g; e.b += b; e.w += 0.5 + s;
      buckets.set(key, e);
    }
    const ranked = [...buckets.values()]
      .map((e) => ({ r: e.r / e.n, g: e.g / e.n, b: e.b / e.n, score: e.w }))
      .sort((a, b) => b.score - a.score);

    const out: { r: number; g: number; b: number }[] = [];
    for (const c of ranked) {
      if (out.every((o) => Math.hypot(o.r - c.r, o.g - c.g, o.b - c.b) > 60)) out.push(c);
      if (out.length >= max) break;
    }
    return out.map((c) => toHex(c.r, c.g, c.b));
  } catch {
    return [];
  } finally {
    if (typeof source !== "string") URL.revokeObjectURL(url);
  }
}
