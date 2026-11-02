import { CARD_LABELS } from "@/lib/card-labels";
import type { CardLang } from "@/lib/card-i18n";
import { Phone, Mail, Globe, MapPin } from "lucide-react";
import type { CardData } from "@/types";
import { fontClass, radiusClass, shadowClass, avatarBorderStyle } from "../CardPreview";
import { SocialLinks } from "./SocialLinks";

export function BoldTemplate({ card, lang = "ar" }: { card: Partial<CardData>; lang?: CardLang }) {
  const L = CARD_LABELS[lang];
  const color   = card.primaryColor ?? "#0F172A";
  const accent  = card.accentColor  ?? color;
  const font    = fontClass(card.fontFamily);
  const radius  = radiusClass(card.roundedStyle);
  const shadow  = shadowClass(card.shadowStyle);
  const avBorder = avatarBorderStyle(card.avatarBorder, accent, color);

  const initials = `${card.firstName?.[0] ?? ""}${card.lastName?.[0] ?? ""}`;

  const bgLeft = `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`;

  return (
    <div className={`relative w-full max-w-sm ${radius} ${shadow} overflow-hidden ${font} flex`}
      style={{ minHeight: 460 }}>

      {/* ── Left colored panel ─────────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center justify-between py-8 px-5 text-white shrink-0"
        style={{ width: "42%", background: bgLeft }}
      >
        {/* Logo */}
        {card.logoUrl
          ? <img src={card.logoUrl} alt={L.logoAlt} className="h-6 w-auto max-w-[64px] object-contain opacity-70 mb-2"
              style={{ filter: "brightness(0) invert(1)" }} />
          : <div className="mb-2" />}

        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-20 w-20 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30"
            style={{ backgroundColor: `${accent}80`, ...avBorder }}
          >
            {card.avatarUrl
              ? <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
              : initials}
          </div>

          <div className="text-center">
            <p className="text-base font-bold leading-tight">
              {card.firstName}
            </p>
            <p className="text-base font-bold leading-tight opacity-90">
              {card.lastName}
            </p>
          </div>
        </div>

        {/* QR at bottom */}
        {card.showQrOnCard && card.slug
          ? <img src={`/api/qr/${card.slug}`} alt="QR" className="h-12 w-12 invert opacity-60" />
          : <div />}
      </div>

      {/* ── Right white panel ──────────────────────────────────────────────── */}
      <div className="flex-1 bg-white flex flex-col px-5 py-6 overflow-hidden">
        {/* Title / company */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          {card.title && (
            <p className="text-sm font-semibold leading-tight" style={{ color }}>
              {card.title}
            </p>
          )}
          {card.company && (
            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wider">{card.company}</p>
          )}
          {card.department && (
            <p className="text-xs text-gray-300 mt-0.5">{card.department}</p>
          )}
          {!card.title && !card.company && (
            <p className="text-sm font-semibold text-gray-300">{L.jobTitle}</p>
          )}
        </div>

        {/* Bio */}
        {card.bio && (
          <p className="text-xs text-gray-500 mb-4 leading-relaxed line-clamp-3">{card.bio}</p>
        )}

        {/* Contact */}
        <div className="space-y-2.5 flex-1">
          {card.phone && (
            <a href={`tel:${card.phone}`} className="flex items-center gap-2.5 group">
              <BoldIcon icon={Phone} color={color} />
              <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors truncate"><bdi>{card.phone}</bdi></span>
            </a>
          )}
          {card.mobile && (
            <a href={`tel:${card.mobile}`} className="flex items-center gap-2.5 group">
              <BoldIcon icon={Phone} color={color} />
              <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors truncate"><bdi>{card.mobile}</bdi></span>
            </a>
          )}
          {card.email && (
            <a href={`mailto:${card.email}`} className="flex items-center gap-2.5 group">
              <BoldIcon icon={Mail} color={color} />
              <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors truncate"><bdi>{card.email}</bdi></span>
            </a>
          )}
          {card.website && (
            <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 group">
              <BoldIcon icon={Globe} color={color} />
              <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors truncate">
                <bdi>{card.website.replace(/^https?:\/\//, "")}</bdi>
              </span>
            </a>
          )}
          {card.address && (
            <div className="flex items-start gap-2.5">
              <BoldIcon icon={MapPin} color={color} />
              <span className="text-xs text-gray-500">{card.address}</span>
            </div>
          )}
        </div>

        {/* Social */}
        <SocialLinks card={card} accent={accent} />

        {/* Custom links */}
        {card.customLinks && card.customLinks.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {card.customLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: color }}>
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BoldIcon({ icon: Icon, color }: { icon: React.ElementType; color: string }) {
  return (
    <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${color}15` }}>
      <Icon className="h-3 w-3" style={{ color }} />
    </div>
  );
}
