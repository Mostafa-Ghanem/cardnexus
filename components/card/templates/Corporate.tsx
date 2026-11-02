import { CARD_LABELS } from "@/lib/card-labels";
import type { CardLang } from "@/lib/card-i18n";
import { Phone, Mail, Globe, MapPin } from "lucide-react";
import type { CardData } from "@/types";
import { fontClass, radiusClass, shadowClass, avatarBorderStyle } from "../CardPreview";
import { SocialLinks } from "./SocialLinks";

export function CorporateTemplate({ card, lang = "ar" }: { card: Partial<CardData>; lang?: CardLang }) {
  const L = CARD_LABELS[lang];
  const color   = card.primaryColor ?? "#1e3a5f";
  const accent  = card.accentColor  ?? color;
  const font    = fontClass(card.fontFamily);
  const radius  = radiusClass(card.roundedStyle);
  const shadow  = shadowClass(card.shadowStyle);
  const avBorder = avatarBorderStyle(card.avatarBorder, accent, color);

  const initials = `${card.firstName?.[0] ?? ""}${card.lastName?.[0] ?? ""}`;

  return (
    <div className={`relative w-full max-w-sm ${radius} ${shadow} overflow-hidden ${font} bg-white`}>

      {/* Header band */}
      <div className="relative" style={{ backgroundColor: color }}>
        <div className="px-7 pt-6 pb-14">
          <div className="flex items-start justify-between">
            {/* Company info */}
            <div>
              {card.company && (
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/90">
                  {card.company}
                </p>
              )}
              {card.department && (
                <p className="text-[9px] tracking-wider text-white/50 mt-0.5">{card.department}</p>
              )}
            </div>
            {/* Logo */}
            {card.logoUrl && (
              <img
                src={card.logoUrl}
                alt={L.logoAlt}
                className="h-8 w-auto max-w-[72px] object-contain"
                style={{ filter: "brightness(0) invert(1)", opacity: 0.85 }}
              />
            )}
          </div>
        </div>

        {/* Diagonal cut */}
        <div
          className="absolute bottom-0 start-0 end-0 h-8"
          style={{
            background: "white",
            clipPath: "polygon(0 100%, 100% 100%, 100% 0)",
          }}
        />
      </div>

      {/* Avatar — overlapping the diagonal cut */}
      <div className="relative px-7 -mt-10 mb-4 flex items-end gap-4">
        <div
          className="h-20 w-20 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white"
          style={{ backgroundColor: color, ...avBorder }}
        >
          {card.avatarUrl
            ? <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
            : initials}
        </div>

        <div className="pb-1">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">
            {card.firstName} {card.lastName}
          </h1>
          {card.title && (
            <p className="text-xs font-semibold mt-0.5" style={{ color }}>
              {card.title}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-7 pb-6">
        {card.bio && (
          <p className="text-xs text-gray-500 mb-5 leading-relaxed">{card.bio}</p>
        )}

        {/* Contact table */}
        <div className="space-y-0 divide-y divide-gray-50">
          {card.phone && (
            <CorpRow icon={Phone} label={L.phone} value={card.phone} href={`tel:${card.phone}`} color={color} />
          )}
          {card.mobile && (
            <CorpRow icon={Phone} label={L.mobile} value={card.mobile} href={`tel:${card.mobile}`} color={color} />
          )}
          {card.email && (
            <CorpRow icon={Mail} label={L.email} value={card.email} href={`mailto:${card.email}`} color={color} />
          )}
          {card.website && (
            <CorpRow icon={Globe} label={L.website} value={card.website.replace(/^https?:\/\//, "")} href={card.website} color={color} external />
          )}
          {card.address && (
            <CorpRow icon={MapPin} label={L.address} value={card.address} color={color} />
          )}
        </div>

        <SocialLinks card={card} accent={accent} />

        {card.customLinks && card.customLinks.length > 0 && (
          <div className="mt-4 space-y-2">
            {card.customLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 rounded-lg"
                style={{ backgroundColor: color }}>
                {link.label}
              </a>
            ))}
          </div>
        )}

        {card.showQrOnCard && card.slug && (
          <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-3">
            <img src={`/api/qr/${card.slug}`} alt={L.qrAlt} className="h-12 w-12" />
            <p className="text-xs text-gray-400">{L.scan}</p>
          </div>
        )}
      </div>

      {/* Footer accent bar */}
      <div className="h-1" style={{ background: `linear-gradient(to right, ${color}, ${accent})` }} />
    </div>
  );
}

function CorpRow({
  icon: Icon, label, value, href, color, external,
}: {
  icon: React.ElementType; label: string; value: string;
  href?: string; color: string; external?: boolean;
}) {
  const content = (
    <div className="flex items-start gap-3 py-2.5 group">
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color }} />
      <div className="min-w-0">
        <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 leading-none mb-0.5">{label}</p>
        <p className="text-xs text-gray-700 group-hover:text-gray-900 transition-colors truncate"><bdi>{value}</bdi></p>
      </div>
    </div>
  );
  if (href) {
    return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="block">{content}</a>;
  }
  return <div>{content}</div>;
}
