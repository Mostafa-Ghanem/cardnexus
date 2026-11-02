import { Phone, Mail, Globe, MapPin } from "lucide-react";
import type { CardData } from "@/types";
import { fontClass, shadowClass, avatarBorderStyle } from "../CardPreview";
import { SocialLinks } from "./SocialLinks";

/** Darken a hex color by a given percentage (0–1). */
function darken(hex: string, amount = 0.35): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((n >> 8)  & 0xff) * (1 - amount));
  const b = Math.max(0, ( n        & 0xff) * (1 - amount));
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

export function GradientTemplate({ card }: { card: Partial<CardData> }) {
  const color   = card.primaryColor ?? "#7c3aed";
  const accent  = card.accentColor  ?? darken(color, 0.2);
  const font    = fontClass(card.fontFamily);
  const shadow  = shadowClass(card.shadowStyle);
  const avBorder = avatarBorderStyle(card.avatarBorder, "rgba(255,255,255,0.8)", color);
  const name    = `${card.firstName ?? ""} ${card.lastName ?? ""}`.trim();
  const initials = `${card.firstName?.[0] ?? ""}${card.lastName?.[0] ?? ""}`;

  const bgStyle = {
    background: `linear-gradient(145deg, ${color} 0%, ${darken(color, 0.45)} 100%)`,
  };

  return (
    <div className={`relative w-full max-w-sm rounded-2xl ${shadow} overflow-hidden ${font} text-white`} style={bgStyle}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />

      {/* Logo */}
      {card.logoUrl && (
        <div className="absolute top-5 end-5 z-10">
          <img src={card.logoUrl} alt="Logo" className="h-7 w-auto max-w-[64px] object-contain opacity-80"
            style={{ filter: "brightness(0) invert(1)" }} />
        </div>
      )}

      <div className="relative z-10 px-7 pt-8 pb-6">
        {/* Avatar */}
        <div className="flex justify-center mb-5">
          <div
            className="h-24 w-24 rounded-full border-4 border-white/30 overflow-hidden flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", ...avBorder }}
          >
            {card.avatarUrl
              ? <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
              : initials}
          </div>
        </div>

        {/* Name / title */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold tracking-tight drop-shadow-sm">{name || "اسمك"}</h1>
          {card.title && <p className="text-sm font-medium mt-1 text-white/80">{card.title}</p>}
          {card.company && <p className="text-xs mt-0.5 text-white/60 uppercase tracking-wider">{card.company}</p>}
          {card.bio && <p className="text-xs mt-3 text-white/70 leading-relaxed">{card.bio}</p>}
        </div>

        {/* Contact */}
        <div className="space-y-2 mb-4">
          {card.phone && (
            <a href={`tel:${card.phone}`}
              className="flex items-center gap-3 text-sm text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
              <Phone className="h-3.5 w-3.5 shrink-0 text-white/60" />
              <bdi>{card.phone}</bdi>
            </a>
          )}
          {card.mobile && (
            <a href={`tel:${card.mobile}`}
              className="flex items-center gap-3 text-sm text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
              <Phone className="h-3.5 w-3.5 shrink-0 text-white/60" />
              <bdi>{card.mobile}</bdi>
            </a>
          )}
          {card.email && (
            <a href={`mailto:${card.email}`}
              className="flex items-center gap-3 text-sm text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
              <Mail className="h-3.5 w-3.5 shrink-0 text-white/60" />
              <span className="truncate"><bdi>{card.email}</bdi></span>
            </a>
          )}
          {card.website && (
            <a href={card.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
              <Globe className="h-3.5 w-3.5 shrink-0 text-white/60" />
              <span className="truncate"><bdi>{card.website.replace(/^https?:\/\//, "")}</bdi></span>
            </a>
          )}
          {card.address && (
            <div className="flex items-start gap-3 text-sm text-white/80 px-3 py-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-white/60 mt-0.5" />
              {card.address}
            </div>
          )}
        </div>

        {/* Social */}
        <SocialLinks card={card} accent="rgba(255,255,255,0.9)" isCentered dark />

        {/* Custom links */}
        {card.customLinks && card.customLinks.length > 0 && (
          <div className="mt-4 space-y-2">
            {card.customLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-2 px-4 text-sm font-medium bg-white/15 hover:bg-white/25 transition-colors text-white rounded-lg">
                {link.label}
              </a>
            ))}
          </div>
        )}

        {card.showQrOnCard && card.slug && (
          <div className="mt-5 flex items-center gap-3">
            <img src={`/api/qr/${card.slug}`} alt="QR" className="h-10 w-10 rounded opacity-90" />
            <p className="text-xs text-white/50">امسح لفتح البطاقة الرقمية</p>
          </div>
        )}
      </div>
    </div>
  );
}
