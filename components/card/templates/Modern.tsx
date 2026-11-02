import { CARD_LABELS } from "@/lib/card-labels";
import type { CardLang } from "@/lib/card-i18n";
import { Phone, Mail, Globe, MapPin } from "lucide-react";
import type { CardData } from "@/types";
import { fontClass, radiusClass, shadowClass, avatarBorderStyle } from "../CardPreview";
import { SocialLinks } from "./SocialLinks";

export function ModernTemplate({ card, lang = "ar" }: { card: Partial<CardData>; lang?: CardLang }) {
  const L = CARD_LABELS[lang];
  const color   = card.primaryColor ?? "#0F172A";
  const accent  = card.accentColor  ?? color;
  const font    = fontClass(card.fontFamily);
  const radius  = radiusClass(card.roundedStyle);
  const shadow  = shadowClass(card.shadowStyle);
  const isCompact = card.layoutStyle === "compact";
  const avBorder  = avatarBorderStyle(card.avatarBorder, accent, color);

  return (
    <div className={`relative w-full max-w-sm bg-white ${radius} ${shadow} overflow-hidden ${font}`}>
      {/* Gradient header */}
      <div className={`relative ${isCompact ? "h-20" : "h-32"}`} style={{ backgroundColor: color }}>
        {card.coverUrl && (
          <img src={card.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Logo on header */}
        {card.logoUrl && (
          <div className="absolute top-3 end-3">
            <img
              src={card.logoUrl}
              alt={L.logoAlt}
              className="h-7 w-auto max-w-[64px] object-contain opacity-90"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </div>
        )}
      </div>

      {/* Avatar overlapping header */}
      <div className={`flex justify-center ${isCompact ? "-mt-8" : "-mt-12"} mb-4 relative z-10`}>
        <div
          className={`${isCompact ? "h-16 w-16" : "h-24 w-24"} rounded-full border-4 border-white overflow-hidden flex items-center justify-center text-white ${isCompact ? "text-xl" : "text-2xl"} font-bold`}
          style={{ backgroundColor: color, ...avBorder }}
        >
          {card.avatarUrl
            ? <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
            : `${card.firstName?.[0] ?? ""}${card.lastName?.[0] ?? ""}`}
        </div>
      </div>

      {/* Name & title */}
      <div className="text-center px-6 pb-5">
        <h1 className="text-xl font-bold text-gray-900">
          {card.firstName} {card.lastName}
        </h1>
        {card.title && <p className="text-sm font-semibold mt-0.5" style={{ color }}>{card.title}</p>}
        {card.company && <p className="text-sm text-gray-500 mt-0.5">{card.company}</p>}
        {card.bio && <p className="text-xs text-gray-400 mt-3 leading-relaxed">{card.bio}</p>}
      </div>

      {/* Contact rows */}
      <div className="border-t border-gray-100 divide-y divide-gray-100">
        {card.phone && (
          <a href={`tel:${card.phone}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
            <Phone className="h-4 w-4 shrink-0" style={{ color: accent }} />
            <span className="text-sm text-gray-700"><bdi>{card.phone}</bdi></span>
          </a>
        )}
        {card.mobile && (
          <a href={`tel:${card.mobile}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
            <Phone className="h-4 w-4 shrink-0" style={{ color: accent }} />
            <span className="text-sm text-gray-700"><bdi>{card.mobile}</bdi></span>
          </a>
        )}
        {card.email && (
          <a href={`mailto:${card.email}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
            <Mail className="h-4 w-4 shrink-0" style={{ color: accent }} />
            <span className="text-sm text-gray-700"><bdi>{card.email}</bdi></span>
          </a>
        )}
        {card.website && (
          <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
            <Globe className="h-4 w-4 shrink-0" style={{ color: accent }} />
            <span className="text-sm text-gray-700"><bdi>{card.website.replace(/^https?:\/\//, "")}</bdi></span>
          </a>
        )}
        {card.address && (
          <div className="flex items-start gap-4 px-6 py-3">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" style={{ color: accent }} />
            <span className="text-sm text-gray-700">{card.address}</span>
          </div>
        )}
      </div>

      {/* Social + custom links */}
      <div className="px-6 pb-5">
        <SocialLinks card={card} accent={accent} isCentered />
        {card.customLinks && card.customLinks.length > 0 && (
          <div className="mt-4 space-y-2">
            {card.customLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: accent }}>
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* QR */}
      {card.showQrOnCard && card.slug && (
        <div className="px-6 pb-4 flex items-center gap-3">
          <img src={`/api/qr/${card.slug}`} alt={L.qrAlt} className="h-12 w-12" />
          <p className="text-xs text-gray-400">{L.scan}</p>
        </div>
      )}
    </div>
  );
}
