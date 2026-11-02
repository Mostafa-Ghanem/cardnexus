import { CARD_LABELS } from "@/lib/card-labels";
import type { CardLang } from "@/lib/card-i18n";
import { Phone, Mail, Globe, MapPin } from "lucide-react";
import type { CardData } from "@/types";
import { fontClass, radiusClass, shadowClass, avatarBorderStyle } from "../CardPreview";
import { SocialLinks } from "./SocialLinks";

export function DarkTemplate({ card, lang = "ar" }: { card: Partial<CardData>; lang?: CardLang }) {
  const L = CARD_LABELS[lang];
  const color   = card.primaryColor ?? "#6366f1";
  const accent  = card.accentColor  ?? color;
  const font    = fontClass(card.fontFamily);
  const radius  = radiusClass(card.roundedStyle);
  const shadow  = shadowClass(card.shadowStyle);
  const isCentered = card.layoutStyle === "centered";
  const avBorder   = avatarBorderStyle(card.avatarBorder, accent, color);

  // Dark-specific background can still have subtle variation
  const bgColor = card.cardBackground === "tinted"
    ? `linear-gradient(160deg, #1e293b 0%, #111827 100%)`
    : card.cardBackground === "gradient"
    ? `linear-gradient(160deg, #1e293b 0%, ${color}30 100%)`
    : "#111827";

  return (
    <div
      className={`relative w-full max-w-sm ${radius} ${shadow} overflow-hidden ${font}`}
      style={{ background: bgColor }}
    >
      {/* Top glow bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${color}, ${color}88)` }} />

      <div className="p-8">
        {/* Logo */}
        {card.logoUrl && (
          <div className={`mb-5 ${isCentered ? "flex justify-center" : ""}`}>
            <img
              src={card.logoUrl}
              alt={L.logoAlt}
              className="h-7 w-auto max-w-[80px] object-contain opacity-60"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </div>
        )}

        {/* Avatar + Name */}
        <div className={`flex ${isCentered ? "flex-col items-center text-center" : "items-center"} gap-5 mb-6`}>
          <div
            className="h-20 w-20 shrink-0 rounded-2xl overflow-hidden flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}88)`, ...avBorder }}
          >
            {card.avatarUrl
              ? <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
              : `${card.firstName?.[0] ?? ""}${card.lastName?.[0] ?? ""}`}
          </div>

          <div>
            <h1 className="text-xl font-bold text-white leading-tight">
              {card.firstName} {card.lastName}
            </h1>
            {card.title && <p className="text-sm font-medium mt-0.5" style={{ color: accent }}>{card.title}</p>}
            {card.company && <p className="text-sm text-gray-400 mt-0.5">{card.company}</p>}
          </div>
        </div>

        {card.bio && <p className="text-sm text-gray-400 mb-6 leading-relaxed">{card.bio}</p>}

        {/* Contact */}
        <div className="space-y-3 mb-6">
          {card.phone && (
            <a href={`tel:${card.phone}`} className="flex items-center gap-3 group">
              <DarkIcon icon={Phone} accent={accent} />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors"><bdi>{card.phone}</bdi></span>
            </a>
          )}
          {card.mobile && (
            <a href={`tel:${card.mobile}`} className="flex items-center gap-3 group">
              <DarkIcon icon={Phone} accent={accent} />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors"><bdi>{card.mobile}</bdi></span>
            </a>
          )}
          {card.email && (
            <a href={`mailto:${card.email}`} className="flex items-center gap-3 group">
              <DarkIcon icon={Mail} accent={accent} />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors"><bdi>{card.email}</bdi></span>
            </a>
          )}
          {card.website && (
            <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
              <DarkIcon icon={Globe} accent={accent} />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                <bdi>{card.website.replace(/^https?:\/\//, "")}</bdi>
              </span>
            </a>
          )}
          {card.address && (
            <div className="flex items-start gap-3">
              <DarkIcon icon={MapPin} accent={accent} />
              <span className="text-sm text-gray-400">{card.address}</span>
            </div>
          )}
        </div>

        <SocialLinks card={card} accent={accent} isCentered={isCentered} dark />

        {card.customLinks && card.customLinks.length > 0 && (
          <div className="mt-4 space-y-2">
            {card.customLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: `${accent}20`, color: accent }}>
                {link.label}
              </a>
            ))}
          </div>
        )}

        {card.showQrOnCard && card.slug && (
          <div className="mt-4 flex items-center gap-3">
            <img src={`/api/qr/${card.slug}`} alt={L.qrAlt} className="h-12 w-12 invert opacity-70" />
            <p className="text-xs text-gray-500">{L.scan}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DarkIcon({ icon: Icon, accent }: { icon: React.ElementType; accent: string }) {
  return (
    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${accent}20` }}>
      <Icon className="h-4 w-4" style={{ color: accent }} />
    </div>
  );
}
