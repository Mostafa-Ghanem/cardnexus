import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("ar-u-nu-latn", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: "مدير المنصة",
    company_admin: "مدير",
    team_leader: "قائد فريق",
    member: "عضو",
  };
  return labels[role] ?? role;
}

export function canManageUsers(role: string): boolean {
  return ["super_admin", "company_admin", "team_leader"].includes(role);
}

export function canManageOrganization(role: string): boolean {
  return ["super_admin", "company_admin"].includes(role);
}

export function isSuperAdmin(role: string): boolean {
  return role === "super_admin";
}

export function getDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return "mobile";
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  return "desktop";
}

/** Convert Arabic-Indic (٠-٩) and Eastern Arabic/Persian (۰-۹) digits to ASCII digits. */
export function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/**
 * Digits for a wa.me link, or null when WhatsApp can't route the number.
 * International formats (+966…, 00966…) always work. Local numbers (05…) are
 * converted only when NEXT_PUBLIC_DEFAULT_COUNTRY_CODE is set (e.g. 966, 20).
 */
export function whatsappDigits(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = normalizeDigits(raw).replace(/[\s\-().]/g, "");
  const cc = (process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE ?? "").replace(/\D/g, "");
  let digits: string;
  if (s.startsWith("+")) digits = s.slice(1);
  else if (s.startsWith("00")) digits = s.slice(2);
  else if (cc && /^0\d{6,14}$/.test(s)) digits = cc + s.slice(1);
  else return null;
  return /^\d{8,15}$/.test(digits) ? digits : null;
}
