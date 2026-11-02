import { T } from "@/components/i18n/I18nProvider";
import { Phone, Mail, Globe, MapPin, Linkedin, Twitter, Instagram, Github, Youtube } from "lucide-react";
import type { CardData } from "@/types";
import { fontClass, radiusClass, radiusInnerClass, shadowClass, cardBgStyle, avatarBorderStyle } from "../CardPreview";
import { SocialLinks } from "./SocialLinks";

export function ClassicTemplate({ card }: { card: Partial<CardData> }) {
  const color  = card.primaryColor ?? "#0F172A";
  const accent = card.accentColor  ?? color;
  const layout      = card.layoutStyle ?? "standard";
  const font        = fontClass(card.fontFamily);
  const radius      = radiusClass(card.roundedStyle);
  const innerRadius = radiusInnerClass(card.roundedStyle);
  const shadow      = shadowClass(card.shadowStyle);
  const bgStyle     = cardBgStyle(card.cardBackground, color);
  const avBorder    = avatarBorderStyle(card.avatarBorder, accent, color);

  const name     = `${card.firstName ?? ""} ${card.lastName ?? ""}`.trim();
  const initials = `${card.firstName?.[0] ?? ""}${card.lastName?.[0] ?? ""}`;
  const isCentered = layout === "centered";
  const isCompact  = layout === "compact";
  const avatarSize = isCompact ? "h-14 w-14" : "h-20 w-20";

  return (
    <div className={`relative w-full max-w-sm ${radius} ${shadow} overflow-hidden ${font}`} style={bgStyle}>
      {/* Accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

      {/* Logo */}
      {card.logoUrl && (
        <div className="absolute top-4 right-4 z-10">
          <img
            src={card.logoUrl}
            alt="Logo"
            className="h-8 w-auto max-w-[72px] object-contain opacity-80"
          />
        </div>
      )}

      <div className="p-8">
        {/* Header */}
        <div className={`flex ${isCentered ? "flex-col items-center text-center" : "items-start"} gap-5 mb-6`}>
          <div
            className={`${avatarSize} shrink-0 ${innerRadius} overflow-hidden flex items-center justify-center text-white text-2xl font-bold`}
            style={{ backgroundColor: color, ...avBorder }}
          >
            {card.avatarUrl
              ? <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
              : initials}
          </div>

          <div className={`min-w-0 ${isCentered ? "text-center" : ""}`}>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{name || "Dein Name"}</h1>
            {card.title && (
              <p className="text-sm font-medium mt-0.5" style={{ color }}>{card.title}</p>
            )}
            {card.company && <p className="text-sm text-gray-500 mt-0.5">{card.company}</p>}
            {card.department && <p className="text-xs text-gray-400 mt-0.5">{card.department}</p>}
          </div>
        </div>

        {/* Bio */}
        {card.bio && (
          <p className={`text-sm text-gray-500 mb-5 leading-relaxed border-l-2 pl-3 ${isCentered ? "text-left" : ""}`}
            style={{ borderColor: accent }}>
            {card.bio}
          </p>
        )}

        <hr className="border-gray-100 mb-5" />

        {/* Contact */}
        <div className="space-y-3">
          {card.phone && (
            <a href={`tel:${card.phone}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <ContactIcon icon={Phone} accent={accent} />
              {card.phone}
            </a>
          )}
          {card.mobile && (
            <a href={`tel:${card.mobile}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <ContactIcon icon={Phone} accent={accent} />
              {card.mobile}<T text={"(Mobil)"} /></a>
          )}
          {card.email && (
            <a href={`mailto:${card.email}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <ContactIcon icon={Mail} accent={accent} />
              {card.email}
            </a>
          )}
          {card.website && (
            <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <ContactIcon icon={Globe} accent={accent} />
              {card.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          {card.address && (
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <ContactIcon icon={MapPin} accent={accent} />
              {card.address}
            </div>
          )}
        </div>

        {/* Social */}
        <SocialLinks card={card} accent={accent} isCentered={isCentered} />

        {/* Custom links */}
        {card.customLinks && card.customLinks.length > 0 && (
          <div className="mt-4 space-y-2">
            {card.customLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-2 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: accent,
                  borderRadius: card.roundedStyle === "sharp" ? "0.25rem"
                    : card.roundedStyle === "pill" ? "9999px" : "0.5rem",
                }}>
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* QR */}
        {card.showQrOnCard && card.slug && (
          <div className="mt-4 flex items-center gap-3">
            <img src={`/api/qr/${card.slug}`} alt="QR Code" className="h-12 w-12" />
            <p className="text-xs text-gray-400"><T text={"Scan für digitale Karte"} /></p>
          </div>
        )}
      </div>
    </div>
  );
}

function ContactIcon({ icon: Icon, accent }: { icon: React.ElementType; accent: string }) {
  return (
    <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${accent}15` }}>
      <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
    </div>
  );
}
