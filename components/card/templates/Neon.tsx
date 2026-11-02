import { T } from "@/components/i18n/I18nProvider";
import { Phone, Mail, Globe, MapPin } from "lucide-react";
import type { CardData } from "@/types";
import { fontClass, radiusClass, shadowClass, avatarBorderStyle } from "../CardPreview";
import { SocialLinks } from "./SocialLinks";

export function NeonTemplate({ card }: { card: Partial<CardData> }) {
  const color   = card.primaryColor ?? "#22d3ee";
  const accent  = card.accentColor  ?? color;
  const font    = fontClass(card.fontFamily);
  const radius  = radiusClass(card.roundedStyle);
  const shadow  = shadowClass(card.shadowStyle);
  const avBorder = avatarBorderStyle(card.avatarBorder, accent, color);
  const isCentered = card.layoutStyle === "centered";

  const bgColor = "#07090f";
  const glowShadow = `0 0 20px ${color}50, 0 0 60px ${color}20`;
  const textGlow   = `0 0 8px ${color}80`;
  const borderGlow = `1px solid ${color}50`;

  return (
    <div
      className={`relative w-full max-w-sm ${radius} ${shadow} overflow-hidden ${font}`}
      style={{ backgroundColor: bgColor, border: borderGlow, boxShadow: glowShadow }}
    >
      {/* Scan lines effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)",
        }}
      />

      {/* Top glow bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, transparent, ${color}, transparent)`, boxShadow: `0 0 8px ${color}` }} />

      <div className="p-8 relative">
        {/* Logo */}
        {card.logoUrl && (
          <div className={`mb-5 ${isCentered ? "flex justify-center" : ""}`}>
            <img
              src={card.logoUrl}
              alt="Logo"
              className="h-7 w-auto max-w-[80px] object-contain"
              style={{ filter: `brightness(0) invert(1) drop-shadow(0 0 6px ${color})`, opacity: 0.8 }}
            />
          </div>
        )}

        {/* Avatar + Name */}
        <div className={`flex ${isCentered ? "flex-col items-center text-center" : "items-center"} gap-5 mb-6`}>
          <div
            className="h-20 w-20 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-2xl font-bold relative"
            style={{
              backgroundColor: `${color}15`,
              border: `1px solid ${color}60`,
              color,
              boxShadow: `0 0 12px ${color}40, inset 0 0 12px ${color}10`,
              ...avBorder,
            }}
          >
            {card.avatarUrl
              ? <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
              : `${card.firstName?.[0] ?? ""}${card.lastName?.[0] ?? ""}`}
          </div>

          <div>
            <h1 className="text-xl font-bold leading-tight" style={{ color, textShadow: textGlow }}>
              {card.firstName} {card.lastName}
            </h1>
            {card.title && (
              <p className="text-sm font-mono mt-0.5 text-white/60">{card.title}</p>
            )}
            {card.company && (
              <p className="text-xs mt-0.5 tracking-widest uppercase" style={{ color: `${accent}80` }}>{card.company}</p>
            )}
          </div>
        </div>

        {card.bio && (
          <p className="text-xs text-white/40 mb-5 leading-relaxed font-mono">{card.bio}</p>
        )}

        {/* Divider */}
        <div className="mb-5 h-px" style={{ background: `linear-gradient(to right, transparent, ${color}50, transparent)` }} />

        {/* Contact */}
        <div className="space-y-3 mb-2">
          {card.phone && (
            <NeonRow icon={Phone} value={card.phone} href={`tel:${card.phone}`} color={color} />
          )}
          {card.mobile && (
            <NeonRow icon={Phone} value={card.mobile} href={`tel:${card.mobile}`} color={color} />
          )}
          {card.email && (
            <NeonRow icon={Mail} value={card.email} href={`mailto:${card.email}`} color={color} />
          )}
          {card.website && (
            <NeonRow icon={Globe} value={card.website.replace(/^https?:\/\//, "")} href={card.website} color={color} external />
          )}
          {card.address && (
            <NeonRow icon={MapPin} value={card.address} color={color} />
          )}
        </div>

        <SocialLinks card={card} accent={accent} isCentered={isCentered} dark />

        {card.customLinks && card.customLinks.length > 0 && (
          <div className="mt-4 space-y-2">
            {card.customLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-2.5 rounded-lg text-sm font-mono font-medium transition-all hover:opacity-80"
                style={{
                  backgroundColor: `${color}10`,
                  color,
                  border: `1px solid ${color}40`,
                  boxShadow: `0 0 8px ${color}20`,
                }}>
                {link.label}
              </a>
            ))}
          </div>
        )}

        {card.showQrOnCard && card.slug && (
          <div className="mt-4 flex items-center gap-3">
            <img src={`/api/qr/${card.slug}`} alt="QR Code" className="h-12 w-12"
              style={{ filter: `invert(1) sepia(1) saturate(5) hue-rotate(${color === "#22d3ee" ? "160deg" : "0deg"})`, opacity: 0.7 }} />
            <p className="text-xs font-mono" style={{ color: `${color}50` }}><T text={"SCAN_FOR_CARD"} /></p>
          </div>
        )}
      </div>

      {/* Bottom glow bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, transparent, ${accent}, transparent)`, boxShadow: `0 0 8px ${accent}` }} />
    </div>
  );
}

function NeonRow({
  icon: Icon, value, href, color, external,
}: {
  icon: React.ElementType; value: string; href?: string; color: string; external?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-3 group">
      <div
        className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}10`, border: `1px solid ${color}30` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <span className="text-xs font-mono text-white/60 group-hover:text-white/90 transition-colors truncate">{value}</span>
    </div>
  );
  if (href) {
    return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{content}</a>;
  }
  return <div>{content}</div>;
}
