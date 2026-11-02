interface BrandMarkProps {
  name: string;
  logoUrl?: string | null;
  color?: string | null;
  size?: "sm" | "md";
}

/** Platform logo: uploaded logo from admin settings, otherwise the first letter of the app name. */
export function BrandMark({ name, logoUrl, color, size = "md" }: BrandMarkProps) {
  const box = size === "sm" ? "h-7 w-7 rounded text-xs" : "h-8 w-8 rounded-lg text-sm";
  if (logoUrl) {
    return <img src={logoUrl} alt={name} className={`${box} object-contain`} />;
  }
  return (
    <div
      className={`flex ${box} items-center justify-center font-bold text-white`}
      style={{ backgroundColor: color || "#0F766E" }}
    >
      {Array.from(name.trim())[0] ?? "ك"}
    </div>
  );
}
