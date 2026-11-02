import { Phone, Mail, Globe, MapPin } from "lucide-react";
import type { CardData } from "@/types";
import { fontClass, shadowClass, avatarBorderStyle } from "../CardPreview";
import { SocialLinks } from "./SocialLinks";

export function WaveTemplate({ card }: { card: Partial<CardData> }) {
  const color   = card.primaryColor ?? "#0ea5e9";
  const accent  = card.accentColor  ?? color;
  const font    = fontClass(card.fontFamily);
  const shadow  = shadowClass(card.shadowStyle);
  const avBorder = avatarBorderStyle(card.avatarBorder, accent, color);
  const name    = `${card.firstName ?? ""} ${card.lastName ?? ""}`.trim();
  const initials = `${card.firstName?.[0] ?? ""}${card.lastName?.[0] ?? ""}`;

  return (
    <div className={`relative w-full max-w-sm bg-white rounded-2xl ${shadow} overflow-hidden ${font}`}>
      {/* Wave SVG background */}
      <div className="relative h-36 overflow-hidden" style={{ backgroundColor: color }}>
        <svg
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          className="absolute bottom-0 start-0 w-full h-20"
          style={{ fill: "#ffffff" }}
        >
          <path d="M0,40 C100,80 300,0 400,40 L400,80 L0,80 Z" />
        </svg>

        {/* Logo */}
        {card.logoUrl && (
          <div className="absolute top-4 end-4">
            <img src={card.logoUrl} alt="Logo" className="h-7 w-auto max-w-[64px] object-contain opacity-85"
              style={{ filter: "brightness(0) invert(1)" }} />
          </div>
        )}
      </div>

      {/* Avatar overlapping wave */}
      <div className="flex justify-center -mt-14 mb-3 relative z-10">
        <div
          className="h-20 w-20 rounded-full border-4 border-white overflow-hidden flex items-center justify-center text-white text-2xl font-bold"
          style={{ backgroundColor: color, ...avBorder }}
        >
          {card.avatarUrl
            ? <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
            : initials}
        </div>
      </div>

      {/* Identity */}
      <div className="text-center px-6 pb-4">
        <h1 className="text-xl font-bold text-gray-900 leading-tight">{name || "اسمك"}</h1>
        {card.title && (
          <p className="text-sm font-semibold mt-0.5" style={{ color }}>{card.title}</p>
        )}
        {card.company && (
          <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wider">{card.company}</p>
        )}
        {card.department && (
          <p className="text-xs text-gray-400">{card.department}</p>
        )}
        {card.bio && (
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">{card.bio}</p>
        )}
      </div>

      {/* Contact list */}
      <div className="mx-5 mb-4 rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {card.phone && (
          <a href={`tel:${card.phone}`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Phone className="h-4 w-4 shrink-0" style={{ color: accent }} />
            <bdi>{card.phone}</bdi>
          </a>
        )}
        {card.mobile && (
          <a href={`tel:${card.mobile}`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Phone className="h-4 w-4 shrink-0" style={{ color: accent }} />
            <bdi>{card.mobile}</bdi>
          </a>
        )}
        {card.email && (
          <a href={`mailto:${card.email}`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Mail className="h-4 w-4 shrink-0" style={{ color: accent }} />
            <span className="truncate"><bdi>{card.email}</bdi></span>
          </a>
        )}
        {card.website && (
          <a href={card.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Globe className="h-4 w-4 shrink-0" style={{ color: accent }} />
            <span className="truncate"><bdi>{card.website.replace(/^https?:\/\//, "")}</bdi></span>
          </a>
        )}
        {card.address && (
          <div className="flex items-start gap-3 px-4 py-2.5 text-sm text-gray-600">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" style={{ color: accent }} />
            {card.address}
          </div>
        )}
      </div>

      <div className="px-5 pb-5">
        <SocialLinks card={card} accent={accent} isCentered />

        {card.customLinks && card.customLinks.length > 0 && (
          <div className="mt-4 space-y-2">
            {card.customLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-2 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 rounded-lg"
                style={{ backgroundColor: accent }}>
                {link.label}
              </a>
            ))}
          </div>
        )}

        {card.showQrOnCard && card.slug && (
          <div className="mt-4 flex items-center gap-3">
            <img src={`/api/qr/${card.slug}`} alt="QR" className="h-10 w-10" />
            <p className="text-xs text-gray-400">امسح لفتح البطاقة الرقمية</p>
          </div>
        )}
      </div>
    </div>
  );
}
