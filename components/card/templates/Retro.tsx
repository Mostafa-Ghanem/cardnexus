import { Phone, Mail, Globe, MapPin } from "lucide-react";
import type { CardData } from "@/types";
import { fontClass, shadowClass, avatarBorderStyle } from "../CardPreview";
import { SocialLinks } from "./SocialLinks";

export function RetroTemplate({ card }: { card: Partial<CardData> }) {
  const color   = card.primaryColor ?? "#92400e";
  const accent  = card.accentColor  ?? color;
  const font    = fontClass(card.fontFamily);
  const shadow  = shadowClass(card.shadowStyle);
  const avBorder = avatarBorderStyle(card.avatarBorder, accent, color);

  // Retro always uses rounded-none corners for that authentic card feel
  const borderRadius = card.roundedStyle === "pill" ? "1.5rem"
    : card.roundedStyle === "sharp" ? "0" : "0.25rem";

  const bgCream = "#FDF6E3";

  return (
    <div
      className={`relative w-full max-w-sm overflow-hidden ${font} ${shadow}`}
      style={{ backgroundColor: bgCream, borderRadius, border: `1px solid ${color}30` }}
    >
      {/* Outer decorative border */}
      <div
        className="absolute inset-2 pointer-events-none"
        style={{ border: `1px solid ${color}25`, borderRadius: Math.max(0, parseInt(borderRadius) - 4) + "px" }}
      />

      {/* Corner ornaments */}
      <CornerOrnament pos="top-2 left-2" color={color} />
      <CornerOrnament pos="top-2 right-2" color={color} rotate />
      <CornerOrnament pos="bottom-2 left-2" color={color} flipY />
      <CornerOrnament pos="bottom-2 right-2" color={color} rotate flipY />

      <div className="px-10 py-8">
        {/* Company header */}
        {card.company && (
          <div className="text-center mb-4">
            {card.logoUrl
              ? <img src={card.logoUrl} alt="Logo" className="h-6 w-auto max-w-[80px] mx-auto object-contain mb-1 opacity-75" />
              : null}
            <p className="text-[9px] font-bold tracking-[0.35em] uppercase" style={{ color }}>
              {card.company}
            </p>
            {card.department && (
              <p className="text-[8px] tracking-[0.2em] uppercase text-stone-400 mt-0.5">{card.department}</p>
            )}
          </div>
        )}

        {/* Decorative rule */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-px" style={{ backgroundColor: `${color}40` }} />
          <div className="h-1 w-1 rounded-full" style={{ backgroundColor: color }} />
          <div className="flex-1 h-px" style={{ backgroundColor: `${color}40` }} />
        </div>

        {/* Avatar + name (always centered in retro) */}
        <div className="flex flex-col items-center text-center mb-6">
          {card.avatarUrl && (
            <div
              className="h-16 w-16 rounded-full overflow-hidden mb-4"
              style={{ border: `2px solid ${color}40`, ...avBorder }}
            >
              <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <h1 className="text-2xl font-light tracking-wide text-stone-800 leading-tight">
            {card.firstName}{" "}
            <span className="font-bold">{card.lastName}</span>
          </h1>
          {card.title && (
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase mt-2" style={{ color }}>
              {card.title}
            </p>
          )}
        </div>

        {/* Decorative rule */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-px" style={{ backgroundColor: `${color}40` }} />
          <div className="h-1 w-1 rounded-full" style={{ backgroundColor: color }} />
          <div className="flex-1 h-px" style={{ backgroundColor: `${color}40` }} />
        </div>

        {/* Bio */}
        {card.bio && (
          <p className="text-xs text-stone-500 text-center mb-6 leading-relaxed italic">&ldquo;{card.bio}&rdquo;</p>
        )}

        {/* Contact — two-column grid style */}
        <div className="space-y-2.5">
          {card.phone && (
            <RetroRow icon={Phone} label="هاتف" value={card.phone} href={`tel:${card.phone}`} color={color} />
          )}
          {card.mobile && (
            <RetroRow icon={Phone} label="جوال" value={card.mobile} href={`tel:${card.mobile}`} color={color} />
          )}
          {card.email && (
            <RetroRow icon={Mail} label="بريد" value={card.email} href={`mailto:${card.email}`} color={color} />
          )}
          {card.website && (
            <RetroRow icon={Globe} label="موقع" value={card.website.replace(/^https?:\/\//, "")} href={card.website} color={color} external />
          )}
          {card.address && (
            <RetroRow icon={MapPin} label="عنوان" value={card.address} color={color} />
          )}
        </div>

        <SocialLinks card={card} accent={accent} isCentered />

        {card.customLinks && card.customLinks.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {card.customLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="block text-center text-xs tracking-wider hover:opacity-70 transition-opacity"
                style={{ color }}>
                ✦ {link.label} ✦
              </a>
            ))}
          </div>
        )}

        {card.showQrOnCard && card.slug && (
          <div className="mt-4 flex justify-center">
            <img src={`/api/qr/${card.slug}`} alt="رمز QR" className="h-14 w-14 opacity-50" />
          </div>
        )}
      </div>
    </div>
  );
}

function CornerOrnament({
  pos, color, rotate, flipY,
}: {
  pos: string; color: string; rotate?: boolean; flipY?: boolean;
}) {
  return (
    <div
      className={`absolute ${pos} w-5 h-5 pointer-events-none`}
      style={{
        borderTop: `1px solid ${color}60`,
        borderLeft: `1px solid ${color}60`,
        transform: `${rotate ? "scaleX(-1)" : ""} ${flipY ? "scaleY(-1)" : ""}`.trim() || undefined,
      }}
    />
  );
}

function RetroRow({
  icon: Icon, label, value, href, color, external,
}: {
  icon: React.ElementType; label: string; value: string;
  href?: string; color: string; external?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-2.5">
      <span className="text-[9px] font-bold tracking-[0.2em] uppercase w-7 shrink-0" style={{ color: `${color}80` }}>
        {label}
      </span>
      <div className="h-3 w-px" style={{ backgroundColor: `${color}30` }} />
      <span className="text-xs text-stone-600 hover:text-stone-900 transition-colors"><bdi>{value}</bdi></span>
    </div>
  );
  if (href) {
    return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{content}</a>;
  }
  return <div>{content}</div>;
}
