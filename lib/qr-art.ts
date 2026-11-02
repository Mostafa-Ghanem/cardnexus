import QRCode from "qrcode";

export type QrStyle = "square" | "rounded" | "dots";

export interface QrArtOptions {
  text: string;
  color?: string;
  /** "transparent" for none */
  background?: string;
  style?: QrStyle;
  /** Image URL/data-URL placed in the centre (uses error-correction level H). */
  logoHref?: string | null;
  /** Quiet zone in modules */
  margin?: number;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/**
 * Branded QR code as an SVG string: brand colour, rounded or dotted modules,
 * rounded finder eyes and an optional centre logo. Works in browser and Node.
 */
export function qrArtSvg(o: QrArtOptions): string {
  const color = o.color ?? "#000000";
  const bg = o.background ?? "#ffffff";
  const style = o.style ?? "rounded";
  const margin = o.margin ?? 2;
  const qr = QRCode.create(o.text, { errorCorrectionLevel: o.logoHref ? "H" : "M" });
  const n = qr.modules.size;
  const data = qr.modules.data;
  const at = (r: number, c: number) => r >= 0 && c >= 0 && r < n && c < n && !!data[r * n + c];
  const total = n + margin * 2;

  // Logo hole: ~22% of the symbol, centred, aligned to modules
  const hole = o.logoHref ? Math.max(5, Math.round(n * 0.22) | 1) : 0;
  const h0 = Math.floor((n - hole) / 2);
  const inHole = (r: number, c: number) => hole > 0 && r >= h0 - 1 && r < h0 + hole + 1 && c >= h0 - 1 && c < h0 + hole + 1;
  const inFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

  const parts: string[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!at(r, c) || inFinder(r, c) || inHole(r, c)) continue;
      const x = c + margin, y = r + margin;
      if (style === "dots") {
        parts.push(`M${x + 0.05} ${y + 0.5}a0.45 0.45 0 1 0 0.9 0a0.45 0.45 0 1 0 -0.9 0z`);
      } else if (style === "rounded") {
        // Round only the corners that have no neighbour, so modules flow together
        const up = at(r - 1, c), dn = at(r + 1, c), lf = at(r, c - 1), rt = at(r, c + 1);
        const k = 0.45;
        const tl = !up && !lf ? k : 0, tr = !up && !rt ? k : 0, br = !dn && !rt ? k : 0, bl = !dn && !lf ? k : 0;
        parts.push(
          `M${x + tl} ${y}H${x + 1 - tr}${tr ? `Q${x + 1} ${y} ${x + 1} ${y + tr}` : ""}V${y + 1 - br}${br ? `Q${x + 1} ${y + 1} ${x + 1 - br} ${y + 1}` : ""}H${x + bl}${bl ? `Q${x} ${y + 1} ${x} ${y + 1 - bl}` : ""}V${y + tl}${tl ? `Q${x} ${y} ${x + tl} ${y}` : ""}Z`
        );
      } else {
        parts.push(`M${x} ${y}h1v1h-1z`);
      }
    }
  }

  const rr = (x: number, y: number, w: number, h: number, rad: number) =>
    rad <= 0
      ? `M${x} ${y}h${w}v${h}h${-w}z`
      : `M${x + rad} ${y}h${w - 2 * rad}a${rad} ${rad} 0 0 1 ${rad} ${rad}v${h - 2 * rad}a${rad} ${rad} 0 0 1 ${-rad} ${rad}` +
        `h${-(w - 2 * rad)}a${rad} ${rad} 0 0 1 ${-rad} ${-rad}v${-(h - 2 * rad)}a${rad} ${rad} 0 0 1 ${rad} ${-rad}z`;
  const eye = (r: number, c: number) => {
    const x = c + margin, y = r + margin;
    const sq = style === "square";
    return (
      `<path fill-rule="evenodd" d="${rr(x, y, 7, 7, sq ? 0 : 2)}${rr(x + 1, y + 1, 5, 5, sq ? 0 : 1.3)}"/>` +
      `<path d="${rr(x + 2, y + 2, 3, 3, sq ? 0 : style === "dots" ? 1.5 : 0.8)}"/>`
    );
  };

  const bgRect = bg === "transparent" ? "" : `<rect width="${total}" height="${total}" fill="${esc(bg)}"/>`;
  let logo = "";
  if (o.logoHref && hole) {
    const lx = h0 + margin, size = hole;
    const plate = bg === "transparent" ? "#ffffff" : bg;
    logo =
      `<rect x="${lx - 0.6}" y="${lx - 0.6}" width="${size + 1.2}" height="${size + 1.2}" rx="1.2" fill="${esc(plate)}"/>` +
      `<image href="${esc(o.logoHref)}" x="${lx}" y="${lx}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="geometricPrecision">` +
    bgRect +
    `<g fill="${esc(color)}"><path d="${parts.join("")}"/>${eye(0, 0)}${eye(0, n - 7)}${eye(n - 7, 0)}</g>` +
    logo +
    `</svg>`
  );
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
