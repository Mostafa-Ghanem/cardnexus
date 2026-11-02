import { T } from "@/components/i18n/I18nProvider";
import { Phone, Mail, Globe, MapPin } from "lucide-react";
import type { CardData } from "@/types";
import { fontClass, shadowClass, avatarBorderStyle } from "../CardPreview";
import { SocialLinks } from "./SocialLinks";

export function ElegantTemplate({ card }: { card: Partial<CardData> }) {
  const color   = card.primaryColor ?? "#0F172A";
  const accent  = card.accentColor  ?? color;
  const font    = fontClass(card.fontFamily);
  const shadow  = shadowClass(card.shadowStyle);
  const avBorder = avatarBorderStyle(card.avatarBorder, accent, color);
  const name    = `${card.firstName ?? ""} ${card.lastName ?? ""}`.trim();
  const initials = `${card.firstName?.[0] ?? ""}${card.lastName?.[0] ?? ""}`;

  return (
    <div className={`relative w-full max-w-sm bg-white rounded-2xl ${shadow} overflow-hidden ${font}`}>
      {/* Decorative left border strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />

      {/* Logo */}
      {card.logoUrl && (
        <div className="absolute top-5 right-5">
          <img src={card.logoUrl} alt="Logo" className="h-7 w-auto max-w-[64px] object-contain opacity-70" />
        </div>
      )}

      <div className="pl-8 pr-6 pt-8 pb-6">
        {/* Avatar + identity */}
        <div className="flex items-center gap-5 mb-7">
          <div
            className="h-16 w-16 shrink-0 rounded-full overflow-hidden flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: color, ...avBorder }}
          >
            {card.avatarUrl
              ? <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
              : initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-snug">
              {name || "Dein Name"}
            </h1>
            {card.title && (
              <p className="text-sm font-medium mt-0.5 tracking-wide" style={{ color }}>
                {card.title}
              </p>
            )}
            {card.company && (
              <p className="text-xs text-gray-400 mt-0.5 tracking-wider uppercase">
                {card.company}
              </p>
            )}
          </div>
        </div>

        {/* Thin decorative rule */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ backgroundColor: `${color}30` }} />
          <div className="h-1 w-1 rounded-full" style={{ backgroundColor: `${color}60` }} />
          <div className="flex-1 h-px" style={{ backgroundColor: `${color}30` }} />
        </div>

        {/* Bio */}
        {card.bio && (
          <p className="text-sm text-gray-500 mb-5 leading-relaxed italic">{card.bio}</p>
        )}

        {/* Contact */}
        <div className="space-y-2.5">
          {card.phone && (
            <a href={`tel:${card.phone}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors group">
              <Phone className="h-3.5 w-3.5 shrink-0 group-hover:scale-110 transition-transform" style={{ color: accent }} />
              <span>{card.phone}</span>
            </a>
          )}
          {card.mobile && (
            <a href={`tel:${card.mobile}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors group">
              <Phone className="h-3.5 w-3.5 shrink-0 group-hover:scale-110 transition-transform" style={{ color: accent }} />
              <span>{card.mobile}{" "}<T text={"(Mobil)"} /></span>
            </a>
          )}
          {card.email && (
            <a href={`mailto:${card.email}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors group">
              <Mail className="h-3.5 w-3.5 shrink-0 group-hover:scale-110 transition-transform" style={{ color: accent }} />
              <span className="truncate">{card.email}</span>
            </a>
          )}
          {card.website && (
            <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors group">
              <Globe className="h-3.5 w-3.5 shrink-0 group-hover:scale-110 transition-transform" style={{ color: accent }} />
              <span className="truncate">{card.website.replace(/^https?:\/\//, "")}</span>
            </a>
          )}
          {card.address && (
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: accent }} />
              <span>{card.address}</span>
            </div>
          )}
        </div>

        <SocialLinks card={card} accent={accent} />

        {/* Custom links */}
        {card.customLinks && card.customLinks.length > 0 && (
          <div className="mt-4 space-y-2">
            {card.customLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-2 px-4 text-sm font-medium border transition-colors hover:opacity-80"
                style={{ borderColor: accent, color: accent, borderRadius: "0.5rem" }}>
                {link.label}
              </a>
            ))}
          </div>
        )}

        {card.showQrOnCard && card.slug && (
          <div className="mt-5 flex items-center gap-3">
            <img src={`/api/qr/${card.slug}`} alt="QR" className="h-10 w-10" />
            <p className="text-xs text-gray-400"><T text={"Scan für digitale Karte"} /></p>
          </div>
        )}
      </div>
    </div>
  );
}
