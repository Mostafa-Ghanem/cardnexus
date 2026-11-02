import type { CardData } from "@/types";
import type { CardLang } from "@/lib/card-i18n";
import { ClassicTemplate } from "./templates/Classic";
import { ModernTemplate } from "./templates/Modern";
import { MinimalTemplate } from "./templates/Minimal";
import { DarkTemplate } from "./templates/Dark";
import { BoldTemplate } from "./templates/Bold";
import { GlassTemplate } from "./templates/Glass";
import { RetroTemplate } from "./templates/Retro";
import { NeonTemplate } from "./templates/Neon";
import { CorporateTemplate } from "./templates/Corporate";
import { ElegantTemplate } from "./templates/Elegant";
import { GradientTemplate } from "./templates/Gradient";
import { WaveTemplate } from "./templates/Wave";

interface CardPreviewProps {
  card: Partial<CardData>;
  scale?: number;
  /** Language of the fixed texts printed on the card. */
  lang?: CardLang;
}

export function CardPreview({ card, scale = 1, lang = "ar" }: CardPreviewProps) {
  const template = card.templateId ?? "classic";

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "top center",
      }}
    >
      {template === "classic"   && <ClassicTemplate   card={card} lang={lang} />}
      {template === "modern"    && <ModernTemplate    card={card} lang={lang} />}
      {template === "minimal"   && <MinimalTemplate   card={card} lang={lang} />}
      {template === "dark"      && <DarkTemplate      card={card} lang={lang} />}
      {template === "bold"      && <BoldTemplate      card={card} lang={lang} />}
      {template === "glass"     && <GlassTemplate     card={card} lang={lang} />}
      {template === "retro"     && <RetroTemplate     card={card} lang={lang} />}
      {template === "neon"      && <NeonTemplate      card={card} lang={lang} />}
      {template === "corporate" && <CorporateTemplate card={card} lang={lang} />}
      {template === "elegant"   && <ElegantTemplate   card={card} lang={lang} />}
      {template === "gradient"  && <GradientTemplate  card={card} lang={lang} />}
      {template === "wave"      && <WaveTemplate      card={card} lang={lang} />}
    </div>
  );
}

// ─── Shared style helpers ────────────────────────────────────────────────────

export function fontClass(fontFamily?: string | null) {
  switch (fontFamily) {
    case "serif":   return "font-serif";
    case "mono":    return "font-mono";
    case "display": return "font-sans tracking-tight";
    default:        return "font-sans";
  }
}

export function radiusClass(roundedStyle?: string | null) {
  switch (roundedStyle) {
    case "sharp": return "rounded-none";
    case "pill":  return "rounded-3xl";
    default:      return "rounded-2xl";
  }
}

export function radiusInnerClass(roundedStyle?: string | null) {
  switch (roundedStyle) {
    case "sharp": return "rounded-none";
    case "pill":  return "rounded-2xl";
    default:      return "rounded-full";
  }
}

export function shadowClass(shadowStyle?: string | null) {
  switch (shadowStyle) {
    case "none": return "shadow-none";
    case "sm":   return "shadow-sm";
    case "lg":   return "shadow-lg";
    case "xl":   return "shadow-xl";
    default:     return "shadow-md";
  }
}

/** Inline background style for light-theme templates (classic/modern/minimal). */
export function cardBgStyle(
  cardBackground?: string | null,
  primaryColor?: string | null
): React.CSSProperties {
  const base = primaryColor ?? "#0F172A";
  switch (cardBackground) {
    case "tinted":
      return { backgroundColor: `${base}0d` }; // 5% opacity
    case "gradient":
      return {
        background: `linear-gradient(160deg, #ffffff 0%, ${base}0d 100%)`,
      };
    default:
      return { backgroundColor: "#ffffff" };
  }
}

/** Avatar border/glow style. */
export function avatarBorderStyle(
  avatarBorder?: string | null,
  accentColor?: string | null,
  primaryColor?: string | null
): React.CSSProperties {
  const color = accentColor ?? primaryColor ?? "#0F172A";
  switch (avatarBorder) {
    case "ring":
      return { outline: `3px solid ${color}`, outlineOffset: "2px" };
    case "glow":
      return { boxShadow: `0 0 0 3px ${color}40, 0 0 16px ${color}60` };
    default:
      return {};
  }
}
