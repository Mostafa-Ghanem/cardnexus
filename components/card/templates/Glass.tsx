import { T } from "@/components/i18n/I18nProvider";
import { Phone, Mail, Globe, MapPin } from "lucide-react";
import type { CardData } from "@/types";
import { fontClass, radiusClass, shadowClass, avatarBorderStyle } from "../CardPreview";
import { SocialLinks } from "./SocialLinks";

export function GlassTemplate({ card }: { card: Partial<CardData> }) {
  const color   = card.primaryColor ?? "#6366f1";
  const accent  = card.accentColor  ?? color;
  const font    = fontClass(card.fontFamily);
  const radius  = radiusClass(card.roundedStyle);
  const shadow  = shadowClass(card.shadowStyle);
  const avBorder = avatarBorderStyle(card.avatarBorder, accent, color);
  const isCentered = card.layoutStyle === "centered";

  const bgGradient = `linear-gradient(135deg, ${color}ee 0%, ${color}99 40%, ${accent}cc 100%)`;

  return (
    <div
      className={`relative w-full max-w-sm ${radius} ${shadow} overflow-hidden ${font}`}
      style={{ background: bgGradient }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: accent }}
      />
      <div
        className="absolute -bottom-16 -left-8 h-40 w-40 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: color }}
      />

      {/* Glass panel */}
      <div
        className="relative m-3 rounded-xl p-6"
        style={{
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.25)",
        }}
      >
        {/* Logo */}
        {card.logoUrl && (
          <div className={`mb-5 ${isCentered ? "flex justify-center" : ""}`}>
            <img
              src={card.logoUrl}
              alt="Logo"
              className="h-7 w-auto max-w-[72px] object-contain"
              style={{ filter: "brightness(0) invert(1)", opacity: 0.8 }}
            />
          </div>
        )}

        {/* Avatar + Name */}
        <div className={`flex ${isCentered ? "flex-col items-center text-center" : "items-center"} gap-4 mb-6`}>
          <div
            className="h-20 w-20 shrink-0 rounded-2xl overflow-hidden flex items-center justify-center text-white text-2xl font-bold"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
              ...avBorder,
            }}
          >
            {card.avatarUrl
              ? <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
              : `${card.firstName?.[0] ?? ""}${card.lastName?.[0] ?? ""}`}
          </div>

          <div>
            <h1 className="text-xl font-bold text-white leading-tight drop-shadow-sm">
              {card.firstName} {card.lastName}
            </h1>
            {card.title && (
              <p className="text-sm font-medium mt-0.5 text-white/80">{card.title}</p>
            )}
            {card.company && (
              <p className="text-sm mt-0.5 text-white/60">{card.company}</p>
            )}
          </div>
        </div>

        {card.bio && (
          <p className="text-xs text-white/70 mb-5 leading-relaxed">{card.bio}</p>
        )}

        {/* Divider */}
        <div className="h-px mb-5" style={{ background: "rgba(255,255,255,0.2)" }} />

        {/* Contact */}
        <div className="space-y-3 mb-2">
          {card.phone && (
            <a href={`tel:${card.phone}`} className="flex items-center gap-3 group">
              <GlassIcon icon={Phone} />
              <span className="text-xs text-white/80 group-hover:text-white transition-colors">{card.phone}</span>
            </a>
          )}
          {card.mobile && (
            <a href={`tel:${card.mobile}`} className="flex items-center gap-3 group">
              <GlassIcon icon={Phone} />
              <span className="text-xs text-white/80 group-hover:text-white transition-colors">{card.mobile}</span>
            </a>
          )}
          {card.email && (
            <a href={`mailto:${card.email}`} className="flex items-center gap-3 group">
              <GlassIcon icon={Mail} />
              <span className="text-xs text-white/80 group-hover:text-white transition-colors">{card.email}</span>
            </a>
          )}
          {card.website && (
            <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
              <GlassIcon icon={Globe} />
              <span className="text-xs text-white/80 group-hover:text-white transition-colors">
                {card.website.replace(/^https?:\/\//, "")}
              </span>
            </a>
          )}
          {card.address && (
            <div className="flex items-start gap-3">
              <GlassIcon icon={MapPin} />
              <span className="text-xs text-white/70">{card.address}</span>
            </div>
          )}
        </div>

        <SocialLinks card={card} accent="#ffffff" isCentered={isCentered} dark />

        {card.customLinks && card.customLinks.length > 0 && (
          <div className="mt-4 space-y-2">
            {card.customLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.25)" }}>
                {link.label}
              </a>
            ))}
          </div>
        )}

        {card.showQrOnCard && card.slug && (
          <div className="mt-4 flex items-center gap-3">
            <img src={`/api/qr/${card.slug}`} alt="QR Code" className="h-12 w-12 invert opacity-70" />
            <p className="text-xs text-white/50"><T text={"Scan für digitale Karte"} /></p>
          </div>
        )}
      </div>
    </div>
  );
}

function GlassIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
      <Icon className="h-3.5 w-3.5 text-white" />
    </div>
  );
}
