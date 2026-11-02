import type { CardData } from "@/types";
import { fontClass, radiusClass, shadowClass, cardBgStyle, avatarBorderStyle } from "../CardPreview";
import { SocialLinks } from "./SocialLinks";

export function MinimalTemplate({ card }: { card: Partial<CardData> }) {
  const color   = card.primaryColor ?? "#0F172A";
  const accent  = card.accentColor  ?? color;
  const font    = fontClass(card.fontFamily);
  const radius  = radiusClass(card.roundedStyle);
  const shadow  = shadowClass(card.shadowStyle);
  const bgStyle = cardBgStyle(card.cardBackground, color);
  const avBorder = avatarBorderStyle(card.avatarBorder, accent, color);

  return (
    <div className={`relative w-full max-w-sm ${radius} ${shadow} overflow-hidden ${font}`} style={bgStyle}>
      <div className="px-10 pt-12 pb-10">

        {/* Logo */}
        {card.logoUrl && (
          <div className="mb-6">
            <img
              src={card.logoUrl}
              alt="Logo"
              className="h-7 w-auto max-w-[100px] object-contain opacity-70"
            />
          </div>
        )}

        {/* Avatar (optional in minimal, show if set) */}
        {card.avatarUrl && (
          <div className="mb-6">
            <div
              className="h-14 w-14 rounded-full overflow-hidden"
              style={avBorder}
            >
              <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        )}

        {/* Name */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 tracking-tight leading-tight">
            {card.firstName}
            <br />
            <span className="font-semibold">{card.lastName}</span>
          </h1>
          {card.title && (
            <p className="text-xs font-semibold tracking-widest uppercase mt-2" style={{ color: accent }}>
              {card.title}
            </p>
          )}
          {card.company && <p className="text-sm text-gray-400 mt-1">{card.company}</p>}
        </div>

        <div className="h-px bg-gray-200 mb-8" />

        {card.bio && <p className="text-sm text-gray-500 mb-8 leading-relaxed">{card.bio}</p>}

        {/* Contact */}
        <div className="space-y-4">
          {card.email && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">البريد الإلكتروني</p>
              <a href={`mailto:${card.email}`} className="text-sm text-gray-700 hover:underline mt-0.5 block"><bdi>{card.email}</bdi></a>
            </div>
          )}
          {(card.phone || card.mobile) && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">الهاتف</p>
              {card.phone && <a href={`tel:${card.phone}`} className="text-sm text-gray-700 hover:underline mt-0.5 block"><bdi>{card.phone}</bdi></a>}
              {card.mobile && <a href={`tel:${card.mobile}`} className="text-sm text-gray-700 hover:underline block"><bdi>{card.mobile}</bdi></a>}
            </div>
          )}
          {card.website && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">الموقع</p>
              <a href={card.website} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:underline mt-0.5 block">
                <bdi>{card.website.replace(/^https?:\/\//, "")}</bdi>
              </a>
            </div>
          )}
          {card.address && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">العنوان</p>
              <p className="text-sm text-gray-700 mt-0.5">{card.address}</p>
            </div>
          )}
        </div>

        <SocialLinks card={card} accent={accent} />

        {card.customLinks && card.customLinks.length > 0 && (
          <div className="mt-6 space-y-2">
            {card.customLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="block text-sm text-gray-600 hover:underline">
                → {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
