import type { CSSProperties, ReactNode } from "react";
import { Phone, Smartphone, Mail, Globe, MapPin, Nfc } from "lucide-react";
import type { PrintDesign, PrintFontId } from "@/lib/print-design";
import { PRINT_FONTS } from "@/lib/print-design";

/**
 * Printed business-card designs. Every face is laid out in millimetres so the
 * same markup is used for the on-screen preview (scaled) and for the PDF.
 * The face is drawn at trim size + 2×bleed; backgrounds fill the bleed and
 * all text stays inside the safe area.
 */

export interface FaceData {
  name: string;
  title: string;
  company: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  address: string;
  logoUrl: string;
  avatarUrl: string;
  initials: string;
}

export interface FaceCtx {
  d: FaceData;
  lang: "ar" | "en";
  dir: "rtl" | "ltr";
  p: string;           // primary
  a: string;           // accent
  font: string;        // CSS font-family
  W: number; H: number; // trim size (mm)
  b: number;           // bleed (mm)
  show: PrintDesign["show"];
  tagline: string;
  nfc: boolean;
  qr: ReactNode | null;
  /** Bilingual back: show English details instead of the brand side */
  backDetails: boolean;
  branding: string | null;
}

export interface PrintDesignDef {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  free: boolean;
  /** Fixed palette; when absent the card's own colour is used */
  primary?: string;
  accent?: string;
  font: PrintFontId;
  front: (c: FaceCtx) => ReactNode;
  back: (c: FaceCtx) => ReactNode;
}

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const mm = (n: number) => `${n}mm`;
const SAFE = 4.5;

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  const r = f(n >> 16), g = f((n >> 8) & 255), bl = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}
function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Full-bleed background layer */
function Bg({ style, children }: { style?: CSSProperties; children?: ReactNode }) {
  return <div style={{ position: "absolute", inset: 0, ...style }}>{children}</div>;
}

/** Safe-area content box (inside trim + safety margin) */
function Safe({ c, style, children, pad = SAFE }: { c: FaceCtx; style?: CSSProperties; children: ReactNode; pad?: number }) {
  return (
    <div style={{ position: "absolute", inset: mm(c.b + pad), display: "flex", flexDirection: "column", ...style }}>
      {children}
    </div>
  );
}

const ICON = { width: "2.6mm", height: "2.6mm", flexShrink: 0 } as const;

type ContactKey = "mobile" | "phone" | "email" | "website" | "address";
function contactRows(c: FaceCtx): { key: ContactKey; value: string; icon: ReactNode }[] {
  const rows: { key: ContactKey; value: string; icon: ReactNode }[] = [];
  const { d, show } = c;
  if (show.mobile && d.mobile) rows.push({ key: "mobile", value: d.mobile, icon: <Smartphone style={ICON} /> });
  if (show.phone && d.phone) rows.push({ key: "phone", value: d.phone, icon: <Phone style={ICON} /> });
  if (show.email && d.email) rows.push({ key: "email", value: d.email, icon: <Mail style={ICON} /> });
  if (show.website && d.website) rows.push({ key: "website", value: d.website.replace(/^https?:\/\//, "").replace(/\/$/, ""), icon: <Globe style={ICON} /> });
  if (show.address && d.address) rows.push({ key: "address", value: d.address, icon: <MapPin style={ICON} /> });
  return rows;
}

function Contacts({ c, color, iconColor, size = 7, gap = 1.1, align = "start", iconBox }: {
  c: FaceCtx; color: string; iconColor?: string; size?: number; gap?: number; align?: "start" | "center"; iconBox?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: mm(gap), alignItems: align === "center" ? "center" : "stretch" }}>
      {contactRows(c).map((r) => (
        <div key={r.key} style={{ display: "flex", alignItems: "center", gap: "1.6mm", fontSize: `${size}pt`, color, lineHeight: 1.25, minWidth: 0 }}>
          <span style={{
            color: iconColor ?? color, display: "inline-flex",
            ...(iconBox ? { background: iconBox, borderRadius: "50%", padding: "0.7mm" } : {}),
          }}>{r.icon}</span>
          <bdi dir={r.key === "address" ? undefined : "ltr"} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
            {r.value}
          </bdi>
        </div>
      ))}
    </div>
  );
}

function Logo({ c, h = 9, fallback, color, style }: { c: FaceCtx; h?: number; fallback?: "initials" | "company" | "none"; color?: string; style?: CSSProperties }) {
  if (c.show.logo && c.d.logoUrl) {
    return <img src={c.d.logoUrl} alt="" style={{ height: mm(h), maxWidth: mm(h * 3.2), objectFit: "contain", ...style }} />;
  }
  if (fallback === "company" && c.d.company) {
    return <div style={{ fontWeight: 700, fontSize: `${Math.max(8, h * 1.1)}pt`, color, ...style }}>{c.d.company}</div>;
  }
  if (fallback === "initials") {
    return (
      <div style={{
        width: mm(h * 1.25), height: mm(h * 1.25), borderRadius: "50%", border: `0.35mm solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center", color, fontWeight: 700,
        fontSize: `${h * 1.05}pt`, letterSpacing: c.lang === "en" ? "0.05em" : 0, ...style,
      }}>{c.d.initials}</div>
    );
  }
  return null;
}

function Name({ c, size = 13, color, weight = 700, style }: { c: FaceCtx; size?: number; color: string; weight?: number; style?: CSSProperties }) {
  return (
    <div style={{ fontSize: `${size}pt`, fontWeight: weight, color, lineHeight: 1.15, ...style }}>
      {c.d.name}
    </div>
  );
}
function Title({ c, size = 7.5, color, style }: { c: FaceCtx; size?: number; color: string; style?: CSSProperties }) {
  if (!c.d.title && !c.d.company) return null;
  return (
    <div style={{ fontSize: `${size}pt`, color, lineHeight: 1.3, marginTop: "0.9mm", ...style }}>
      {c.d.title && <div>{c.d.title}</div>}
      {c.d.company && <div style={{ fontWeight: 600, opacity: 0.85, fontSize: `${size - 0.5}pt` }}>{c.d.company}</div>}
    </div>
  );
}

function NfcMark({ c, color }: { c: FaceCtx; color: string }) {
  if (!c.nfc) return null;
  return (
    <div style={{ position: "absolute", top: mm(c.b + 3.5), insetInlineEnd: mm(c.b + 3.5), color, display: "flex", alignItems: "center", gap: "0.8mm", fontSize: "5.5pt", opacity: 0.9 }}>
      <Nfc style={{ width: "4mm", height: "4mm" }} />
    </div>
  );
}

/** QR tile — always dark modules on a light tile so every phone can scan it. */
function QrTile({ c, size = 19, border, radius = 2, label, labelColor }: { c: FaceCtx; size?: number; border?: string; radius?: number; label?: boolean; labelColor?: string }) {
  if (!c.qr) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1mm" }}>
      <div style={{ background: "#fff", padding: "1.2mm", borderRadius: mm(radius), border, lineHeight: 0 }}>
        <div style={{ width: mm(size), height: mm(size) }}>{c.qr}</div>
      </div>
      {label && (
        <div style={{ fontSize: "5.5pt", color: labelColor, letterSpacing: c.lang === "en" ? "0.04em" : 0 }}>
          {c.lang === "en" ? "Scan to save my contact" : "امسح لحفظ بياناتي"}
        </div>
      )}
    </div>
  );
}

function Branding({ c, color }: { c: FaceCtx; color: string }) {
  if (!c.branding) return null;
  return (
    <div style={{ position: "absolute", bottom: mm(c.b + 1.6), insetInline: 0, textAlign: "center", fontSize: "4.5pt", color, opacity: 0.7 }}>
      {c.branding}
    </div>
  );
}

/**
 * Generic back side: brand (logo/company/tagline) + QR, or — for bilingual
 * cards — the English details + QR.
 */
function StandardBack(c: FaceCtx, t: { bg: CSSProperties; fg: string; muted: string; deco?: ReactNode; qrBorder?: string }) {
  return (
    <>
      <Bg style={t.bg}>{t.deco}</Bg>
      {c.backDetails ? (
        <Safe c={c} style={{ flexDirection: "row", alignItems: "center", gap: "4mm" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Name c={c} size={11.5} color={t.fg} />
            <Title c={c} color={t.muted} />
            <div style={{ height: "3mm" }} />
            <Contacts c={c} color={t.fg} iconColor={t.muted} size={6.6} />
          </div>
          <QrTile c={c} size={17} border={t.qrBorder} />
        </Safe>
      ) : (
        <Safe c={c} style={{ alignItems: "center", justifyContent: "center", gap: "2.2mm", textAlign: "center" }}>
          <Logo c={c} h={8} fallback="company" color={t.fg} />
          {c.qr ? <QrTile c={c} size={c.H > 52 ? 21 : 19} border={t.qrBorder} label labelColor={t.muted} /> : null}
          {c.tagline && <div style={{ fontSize: "6.5pt", color: t.muted }}>{c.tagline}</div>}
        </Safe>
      )}
      <NfcMark c={c} color={t.muted} />
      <Branding c={c} color={t.muted} />
    </>
  );
}

/* ─── decorative SVGs ─────────────────────────────────────────────────────── */

function GeoPattern({ color, opacity = 0.18, id }: { color: string; opacity?: number; id: string }) {
  // 8-point star lattice (Islamic geometric motif)
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden>
      <defs>
        <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth="0.45" opacity={opacity * 4}>
            <path d="M6 0 L7.8 4.2 L12 6 L7.8 7.8 L6 12 L4.2 7.8 L0 6 L4.2 4.2 Z" />
            <rect x="3" y="3" width="6" height="6" transform="rotate(45 6 6)" />
            <circle cx="6" cy="6" r="1.2" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} opacity={opacity * 4 > 1 ? 1 : 1} />
    </svg>
  );
}

function GridPattern({ color, id }: { color: string; id: string }) {
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden>
      <defs>
        <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke={color} strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

function Skyline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 300 60" preserveAspectRatio="none" style={{ position: "absolute", insetInline: 0, bottom: 0, width: "100%", height: "45%" }} aria-hidden>
      <path fill={color} d="M0 60V38h14V22h10v-8h8v8h10v24h12V30h16v-14h6v14h12v30h10V26h20V8h4v18h14v34h8V34h18V18h14v42h10V28h12v-12h10v12h8v32h12V36h16V20h8v40h12V30h14v30z" />
    </svg>
  );
}

function Wave({ color, opacity = 1, flip = false }: { color: string; opacity?: number; flip?: boolean }) {
  return (
    <svg viewBox="0 0 300 40" preserveAspectRatio="none" style={{ position: "absolute", insetInline: 0, bottom: 0, width: "100%", height: "30%", transform: flip ? "scaleX(-1)" : undefined }} aria-hidden>
      <path fill={color} opacity={opacity} d="M0 22 C60 2 110 40 170 22 S260 6 300 18 V40 H0Z" />
    </svg>
  );
}

/* ─── designs ─────────────────────────────────────────────────────────────── */

export const PRINT_DESIGNS: PrintDesignDef[] = [
  {
    id: "classic", name: "كلاسيكي", nameEn: "Classic", category: "عام", free: true, font: "plex",
    front: (c) => (
      <>
        <Bg style={{ background: "#fff" }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, insetInlineStart: 0, width: mm(c.b + 3.2), background: c.p }} />
        <Safe c={c} style={{ paddingInlineStart: "3mm", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "3mm" }}>
            <div style={{ minWidth: 0 }}>
              <Name c={c} color="#111827" />
              <Title c={c} color={c.p} />
            </div>
            <Logo c={c} h={8} />
          </div>
          <Contacts c={c} color="#374151" iconColor={c.p} />
        </Safe>
        <NfcMark c={c} color={c.p} />
      </>
    ),
    back: (c) => StandardBack(c, { bg: { background: c.p }, fg: "#fff", muted: rgba("#ffffff", 0.8) }),
  },
  {
    id: "minimal", name: "بسيط", nameEn: "Minimal", category: "عام", free: true, font: "plex",
    front: (c) => (
      <>
        <Bg style={{ background: "#fff" }} />
        <Safe c={c} style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <Name c={c} size={13.5} color="#111" weight={600} />
          <div style={{ width: "10mm", height: "0.5mm", background: c.p, margin: "2.2mm 0 1.4mm" }} />
          <Title c={c} color="#6b7280" style={{ marginTop: 0 }} />
          <div style={{ height: "4mm" }} />
          <Contacts c={c} color="#374151" iconColor={c.p} size={6.6} align="center" gap={0.8} />
        </Safe>
        <NfcMark c={c} color={c.p} />
      </>
    ),
    back: (c) => StandardBack(c, { bg: { background: "#fff" }, fg: c.p, muted: "#6b7280", qrBorder: `0.3mm solid ${rgba(c.p, 0.25)}` }),
  },
  {
    id: "duo", name: "ثنائي اللون", nameEn: "Duo", category: "عام", free: true, font: "almarai",
    front: (c) => {
      const split = 0.36 * c.W + c.b;
      return (
        <>
          <Bg style={{ background: "#fff" }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, insetInlineStart: 0, width: mm(split), background: c.p, display: "flex", alignItems: "center", justifyContent: "center", paddingInlineStart: mm(c.b) }}>
            {c.show.logo && c.d.logoUrl
              ? <div style={{ background: "#fff", borderRadius: "2mm", padding: "1.6mm", lineHeight: 0 }}><Logo c={c} h={9} /></div>
              : <Logo c={{ ...c, show: { ...c.show, logo: false } }} h={10} fallback="initials" color="#fff" />}
          </div>
          <div style={{ position: "absolute", top: mm(c.b + SAFE), bottom: mm(c.b + SAFE), insetInlineStart: mm(split + 4), insetInlineEnd: mm(c.b + SAFE), display: "flex", flexDirection: "column", justifyContent: "center", gap: "3mm" }}>
            <div>
              <Name c={c} size={12} color="#111827" />
              <Title c={c} color={c.p} />
            </div>
            <Contacts c={c} color="#374151" iconColor={c.p} size={6.5} gap={0.9} />
          </div>
          <NfcMark c={c} color={c.p} />
        </>
      );
    },
    back: (c) => StandardBack(c, { bg: { background: c.p }, fg: "#fff", muted: rgba("#ffffff", 0.8) }),
  },
  {
    id: "luxe", name: "فاخر ذهبي", nameEn: "Luxe gold", category: "فاخر", free: false, primary: "#C9A24B", accent: "#111111", font: "amiri",
    front: (c) => (
      <>
        <Bg style={{ background: `radial-gradient(120% 140% at 0% 0%, #2a2a2a 0%, ${c.a} 60%)` }} />
        <div style={{ position: "absolute", inset: mm(c.b + 2.6), border: `0.25mm solid ${rgba(c.p, 0.7)}` }} />
        <Safe c={c} pad={SAFE + 1} style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <Logo c={c} h={6.5} style={{ marginBottom: "2mm" }} />
          <Name c={c} size={14} color={c.p} weight={600} style={{ letterSpacing: c.lang === "en" ? "0.08em" : 0, textTransform: c.lang === "en" ? "uppercase" : undefined }} />
          <Title c={c} color={rgba("#ffffff", 0.75)} />
          <div style={{ width: "14mm", height: "0.25mm", background: c.p, margin: "2.6mm 0" }} />
          <Contacts c={c} color={rgba("#ffffff", 0.85)} iconColor={c.p} size={6.3} align="center" gap={0.7} />
        </Safe>
        <NfcMark c={c} color={c.p} />
      </>
    ),
    back: (c) => StandardBack(c, {
      bg: { background: c.a }, fg: c.p, muted: rgba(c.p, 0.85), qrBorder: `0.4mm solid ${c.p}`,
      deco: <GeoPattern color={c.p} opacity={0.07} id={`lux-${c.lang}`} />,
    }),
  },
  {
    id: "tech", name: "تقني", nameEn: "Tech", category: "تقنية", free: false, primary: "#22D3EE", accent: "#0B1220", font: "zain",
    front: (c) => (
      <>
        <Bg style={{ background: `linear-gradient(135deg, ${c.a} 0%, ${shade(c.a, 0.12)} 100%)` }}>
          <GridPattern color={rgba(c.p, 0.12)} id={`grid-${c.lang}`} />
          <div style={{ position: "absolute", insetInlineEnd: "-12mm", top: "-14mm", width: "40mm", height: "40mm", borderRadius: "50%", background: `radial-gradient(circle, ${rgba(c.p, 0.35)}, transparent 70%)` }} />
        </Bg>
        <Safe c={c} style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "3mm" }}>
            <div>
              <div style={{ fontFamily: "'Inter', monospace", fontSize: "5.5pt", color: c.p, letterSpacing: "0.12em", marginBottom: "1mm" }} dir="ltr">{"</>"}</div>
              <Name c={c} size={12.5} color="#fff" />
              <Title c={c} color={c.p} />
            </div>
            <Logo c={c} h={7} />
          </div>
          <Contacts c={c} color={rgba("#ffffff", 0.88)} iconColor={c.p} size={6.5} />
        </Safe>
        <NfcMark c={c} color={c.p} />
      </>
    ),
    back: (c) => StandardBack(c, {
      bg: { background: c.a }, fg: "#fff", muted: c.p, qrBorder: `0.4mm solid ${c.p}`,
      deco: <GridPattern color={rgba(c.p, 0.1)} id={`gridb-${c.lang}`} />,
    }),
  },
  {
    id: "medical", name: "طبي", nameEn: "Medical", category: "طب وصحة", free: false, primary: "#0E7490", accent: "#67E8F9", font: "tajawal",
    front: (c) => (
      <>
        <Bg style={{ background: "#fff" }}>
          <Wave color={rgba(c.a, 0.35)} />
          <Wave color={c.p} opacity={0.9} flip />
          <svg viewBox="0 0 24 24" style={{ position: "absolute", top: mm(c.b + 3), insetInlineEnd: mm(c.b + 3), width: "7mm", height: "7mm", opacity: 0.12 }} aria-hidden>
            <path fill={c.p} d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" />
          </svg>
        </Bg>
        <Safe c={c} style={{ bottom: mm(c.b + c.H * 0.3) }}>
          <Logo c={c} h={6.5} style={{ marginBottom: "1.5mm", alignSelf: "flex-start" }} />
          <Name c={c} size={12.5} color={c.p} />
          <Title c={c} color="#475569" />
          <div style={{ height: "2.2mm" }} />
          <Contacts c={c} color="#334155" iconColor={c.p} size={6.4} gap={0.7} />
        </Safe>
        <NfcMark c={c} color="#fff" />
      </>
    ),
    back: (c) => StandardBack(c, { bg: { background: `linear-gradient(160deg, ${c.p}, ${shade(c.p, -0.25)})` }, fg: "#fff", muted: rgba("#ffffff", 0.82) }),
  },
  {
    id: "realestate", name: "عقاري", nameEn: "Real estate", category: "عقارات", free: false, primary: "#1E3A5F", accent: "#C8A165", font: "almarai",
    front: (c) => (
      <>
        <Bg style={{ background: "#fff" }}>
          <div style={{ position: "absolute", insetInline: 0, bottom: 0, height: "38%", background: c.p }} />
          <div style={{ position: "absolute", insetInline: 0, bottom: "38%", height: "26%" }}><Skyline color={c.p} /></div>
          <div style={{ position: "absolute", insetInline: 0, bottom: "calc(38% - 0.6mm)", height: "0.6mm", background: c.a }} />
        </Bg>
        <Safe c={c} style={{ bottom: mm(c.b + c.H * 0.62) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "3mm" }}>
            <div>
              <Name c={c} size={12} color={c.p} />
              <Title c={c} color={c.a} style={{ fontWeight: 600 }} />
            </div>
            <Logo c={c} h={7} />
          </div>
        </Safe>
        <div style={{ position: "absolute", insetInline: mm(c.b + SAFE), bottom: mm(c.b + 3), height: `calc(38% - ${c.b + 4.5}mm)`, display: "flex", alignItems: "center" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: "3mm", rowGap: "0.6mm", width: "100%" }}>
            {contactRows(c).slice(0, 4).map((r) => (
              <div key={r.key} style={{ display: "flex", alignItems: "center", gap: "1.2mm", fontSize: "6pt", color: "#fff", minWidth: 0 }}>
                <span style={{ color: c.a, display: "inline-flex" }}>{r.icon}</span>
                <bdi dir="ltr" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.value}</bdi>
              </div>
            ))}
          </div>
        </div>
        <NfcMark c={c} color={c.p} />
      </>
    ),
    back: (c) => StandardBack(c, { bg: { background: c.p }, fg: "#fff", muted: c.a, qrBorder: `0.4mm solid ${c.a}`, deco: <div style={{ position: "absolute", insetInline: 0, bottom: 0, height: "30%", opacity: 0.18 }}><Skyline color={c.a} /></div> }),
  },
  {
    id: "law", name: "محاماة واستشارات", nameEn: "Law & consulting", category: "مهن حرة", free: false, primary: "#1F2A44", accent: "#F6F1E6", font: "amiri",
    front: (c) => (
      <>
        <Bg style={{ background: c.a }} />
        <div style={{ position: "absolute", insetInline: mm(c.b + 4), top: mm(c.b + 3), height: "0.7mm", borderTop: `0.2mm solid ${c.p}`, borderBottom: `0.2mm solid ${c.p}` }} />
        <div style={{ position: "absolute", insetInline: mm(c.b + 4), bottom: mm(c.b + 3), height: "0.7mm", borderTop: `0.2mm solid ${c.p}`, borderBottom: `0.2mm solid ${c.p}` }} />
        <Safe c={c} pad={SAFE + 1.5} style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          {c.show.logo && c.d.logoUrl ? <Logo c={c} h={7} style={{ marginBottom: "1.6mm" }} /> : <Logo c={{ ...c, show: { ...c.show, logo: false } }} h={6} fallback="initials" color={c.p} style={{ marginBottom: "1.6mm" }} />}
          <Name c={c} size={14} color={c.p} />
          <Title c={c} color={shade(c.p, 0.35)} style={{ fontStyle: c.lang === "en" ? "italic" : undefined }} />
          <div style={{ height: "2.4mm" }} />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: "3mm", rowGap: "0.6mm", fontSize: "6.4pt", color: c.p }}>
            {contactRows(c).map((r) => <bdi key={r.key} dir="ltr">{r.value}</bdi>)}
          </div>
        </Safe>
        <NfcMark c={c} color={c.p} />
      </>
    ),
    back: (c) => StandardBack(c, { bg: { background: c.p }, fg: c.a, muted: rgba(c.a, 0.8) }),
  },
  {
    id: "restaurant", name: "مطاعم وكافيهات", nameEn: "Food & café", category: "مطاعم", free: false, primary: "#B4532A", accent: "#FBF3E4", font: "aref",
    front: (c) => (
      <>
        <Bg style={{ background: c.a }} />
        <div style={{ position: "absolute", inset: mm(c.b + 2.4), border: `0.5mm dashed ${rgba(c.p, 0.55)}`, borderRadius: "2.5mm" }} />
        <Safe c={c} pad={SAFE + 1} style={{ flexDirection: "row", alignItems: "center", gap: "4mm" }}>
          <div style={{ width: "17mm", height: "17mm", borderRadius: "50%", background: c.p, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            {c.show.logo && c.d.logoUrl
              ? <img src={c.d.logoUrl} alt="" style={{ width: "12mm", height: "12mm", objectFit: "contain", background: "#fff", borderRadius: "50%", padding: "1mm" }} />
              : <span style={{ color: c.a, fontWeight: 700, fontSize: "13pt" }}>{c.d.initials}</span>}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Name c={c} size={12.5} color={c.p} />
            <Title c={c} color="#57534e" />
            <div style={{ height: "2mm" }} />
            <Contacts c={c} color="#44403c" iconColor={c.p} size={6.3} gap={0.6} />
          </div>
        </Safe>
        <NfcMark c={c} color={c.p} />
      </>
    ),
    back: (c) => StandardBack(c, { bg: { background: c.p }, fg: c.a, muted: rgba(c.a, 0.85), deco: <div style={{ position: "absolute", inset: mm(c.b + 2.4), border: `0.5mm dashed ${rgba(c.a, 0.45)}`, borderRadius: "2.5mm" }} /> }),
  },
  {
    id: "photo", name: "بالصورة الشخصية", nameEn: "Photo", category: "تصوير وإبداع", free: false, font: "plex",
    front: (c) => {
      const split = 0.4 * c.W + c.b;
      return (
        <>
          <Bg style={{ background: "#fff" }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, insetInlineStart: 0, width: mm(split), background: c.d.avatarUrl ? "#e5e7eb" : `linear-gradient(160deg, ${c.p}, ${shade(c.p, -0.35)})`, overflow: "hidden" }}>
            {c.d.avatarUrl
              ? <img src={c.d.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "22pt", fontWeight: 700, paddingInlineStart: mm(c.b) }}>{c.d.initials}</div>}
          </div>
          <div style={{ position: "absolute", top: 0, bottom: 0, insetInlineStart: mm(split), width: "1.2mm", background: c.p }} />
          <div style={{ position: "absolute", top: mm(c.b + SAFE), bottom: mm(c.b + SAFE), insetInlineStart: mm(split + 4.5), insetInlineEnd: mm(c.b + SAFE), display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <Name c={c} size={12} color="#111827" />
              <Title c={c} color={c.p} />
            </div>
            <Contacts c={c} color="#374151" iconColor={c.p} size={6.3} gap={0.8} />
          </div>
          <NfcMark c={c} color={c.p} />
        </>
      );
    },
    back: (c) => StandardBack(c, { bg: { background: "#111827" }, fg: "#fff", muted: rgba("#ffffff", 0.75), qrBorder: `0.4mm solid ${c.p}` }),
  },
  {
    id: "arabesque", name: "زخرفة عربية", nameEn: "Arabesque", category: "هوية عربية", free: false, primary: "#0F5132", accent: "#D4AF37", font: "mirza",
    front: (c) => {
      const band = 0.3 * c.W + c.b;
      return (
        <>
          <Bg style={{ background: "#FFFDF7" }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, insetInlineEnd: 0, width: mm(band), background: c.p, overflow: "hidden" }}>
            <GeoPattern color={c.a} opacity={0.12} id={`ara-${c.lang}`} />
          </div>
          <div style={{ position: "absolute", top: 0, bottom: 0, insetInlineEnd: mm(band), width: "0.6mm", background: c.a }} />
          <div style={{ position: "absolute", top: mm(c.b + SAFE), bottom: mm(c.b + SAFE), insetInlineStart: mm(c.b + SAFE), insetInlineEnd: mm(band + 4), display: "flex", flexDirection: "column", justifyContent: "center", gap: "2.6mm" }}>
            <div>
              <Name c={c} size={13} color={c.p} />
              <Title c={c} color="#78716c" />
            </div>
            <Contacts c={c} color="#3f3f46" iconColor={c.p} size={6.3} gap={0.7} />
          </div>
          {c.show.logo && c.d.logoUrl && (
            <div style={{ position: "absolute", top: "50%", insetInlineEnd: mm(band / 2 + c.b / 2), transform: "translate(50%, -50%)", background: "#fff", borderRadius: "50%", width: "13mm", height: "13mm", display: "flex", alignItems: "center", justifyContent: "center", border: `0.5mm solid ${c.a}` }}>
              <img src={c.d.logoUrl} alt="" style={{ width: "9mm", height: "9mm", objectFit: "contain" }} />
            </div>
          )}
          <NfcMark c={c} color={c.a} />
        </>
      );
    },
    back: (c) => StandardBack(c, {
      bg: { background: c.p }, fg: "#fff", muted: c.a, qrBorder: `0.5mm solid ${c.a}`,
      deco: <GeoPattern color={c.a} opacity={0.1} id={`arab-${c.lang}`} />,
    }),
  },
  {
    id: "gradient", name: "تدرّج عصري", nameEn: "Modern gradient", category: "عام", free: false, font: "plex",
    front: (c) => (
      <>
        <Bg style={{ background: `linear-gradient(125deg, ${c.p} 0%, ${c.a} 100%)` }}>
          <div style={{ position: "absolute", width: "45mm", height: "45mm", borderRadius: "50%", background: rgba("#ffffff", 0.1), insetInlineEnd: "-15mm", bottom: "-20mm" }} />
          <div style={{ position: "absolute", width: "25mm", height: "25mm", borderRadius: "50%", background: rgba("#ffffff", 0.08), insetInlineStart: "35%", top: "-12mm" }} />
        </Bg>
        <Safe c={c} style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "3mm" }}>
            <div>
              <Name c={c} size={13} color="#fff" />
              <Title c={c} color={rgba("#ffffff", 0.85)} />
            </div>
            {c.show.logo && c.d.logoUrl && <div style={{ background: "#fff", borderRadius: "1.6mm", padding: "1mm", lineHeight: 0 }}><Logo c={c} h={6.5} /></div>}
          </div>
          <div style={{ background: rgba("#ffffff", 0.14), borderRadius: "2mm", padding: "1.8mm 2.2mm", border: `0.2mm solid ${rgba("#ffffff", 0.25)}` }}>
            <Contacts c={c} color="#fff" size={6.3} gap={0.6} />
          </div>
        </Safe>
        <NfcMark c={c} color="#fff" />
      </>
    ),
    back: (c) => StandardBack(c, { bg: { background: `linear-gradient(125deg, ${c.a} 0%, ${c.p} 100%)` }, fg: "#fff", muted: rgba("#ffffff", 0.85) }),
  },
];

export const PRINT_DESIGN_MAP: Record<string, PrintDesignDef> = Object.fromEntries(PRINT_DESIGNS.map((d) => [d.id, d]));
export const FREE_PRINT_DESIGNS = PRINT_DESIGNS.filter((d) => d.free).map((d) => d.id);

export function getPrintDesign(id: string): PrintDesignDef {
  return PRINT_DESIGN_MAP[id] ?? PRINT_DESIGNS[0];
}

export function fontCss(id: PrintFontId) {
  return PRINT_FONTS[id]?.css ?? PRINT_FONTS.plex.css;
}

export { shade, rgba };
