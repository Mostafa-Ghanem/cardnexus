export type Role = "super_admin" | "company_admin" | "team_leader" | "member";
export type Plan = "free" | "pro" | "business";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  organizationId?: string | null;
  createdAt: Date;
}

export interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  domain?: string | null;
  primaryColor: string;
  createdAt: Date;
  _count?: { users: number };
}

export interface CardData {
  id: string;
  userId: string;
  slug: string;
  isPublic: boolean;

  firstName: string;
  lastName: string;
  title?: string | null;
  company?: string | null;
  department?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  pronouns?: string | null;
  gender?: string | null;
  birthday?: string | null;

  phone?: string | null;
  mobile?: string | null;
  fax?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;

  linkedin?: string | null;
  xing?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  github?: string | null;
  youtube?: string | null;

  customLinks: CustomLink[];

  templateId: string;
  primaryColor: string;
  accentColor?: string | null;
  fontFamily?: string | null;
  layoutStyle?: string | null;
  roundedStyle?: string | null;
  showQrOnCard?: boolean;
  showInTeamDirectory?: boolean;
  bookingUrl?: string | null;
  shadowStyle?: string | null;
  socialStyle?: string | null;
  avatarBorder?: string | null;
  cardBackground?: string | null;
  logoUrl?: string | null;
  cardDomain?: string | null;
  hideShareButton?: boolean;
  name?: string;
  isDefault?: boolean;
  expiresAt?: string | null;
  passwordHash?: string | null;
  approvalStatus?: string; // approved | pending | rejected
  approvalNote?: string | null;
  totalViews: number;

  createdAt: Date;
  updatedAt: Date;

  user?: { name: string };
}

export interface CustomLink {
  label: string;
  url: string;
  icon?: string;
}

export type TemplateId = "classic" | "modern" | "minimal" | "dark" | "bold" | "glass" | "retro" | "neon" | "corporate" | "elegant" | "gradient" | "wave";

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  preview: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Klar, professionell und zeitlos",
    preview: "#ffffff",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Modernes Design mit farbigem Header",
    preview: "#0F172A",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Reduziert auf das Wesentliche",
    preview: "#F8FAFC",
  },
  {
    id: "dark",
    name: "Dark",
    description: "Dunkel und elegant",
    preview: "#111827",
  },
  {
    id: "bold",
    name: "Bold",
    description: "Zweispaltiges Layout mit farbigem Panel",
    preview: "#1e293b",
  },
  {
    id: "glass",
    name: "Glass",
    description: "Glasmorphismus auf Farbverlauf",
    preview: "#6366f1",
  },
  {
    id: "retro",
    name: "Retro",
    description: "Vintage-Stil mit Schmuckelementen",
    preview: "#FDF6E3",
  },
  {
    id: "neon",
    name: "Neon",
    description: "Cyberpunk-Glowing auf dunklem Hintergrund",
    preview: "#07090f",
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Formell und strukturiert für Unternehmen",
    preview: "#1e3a5f",
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Fein und Premium mit dekorativen Linien",
    preview: "#f5f0eb",
  },
  {
    id: "gradient",
    name: "Gradient",
    description: "Vollfarbig mit weißem Text auf Farbverlauf",
    preview: "#7c3aed",
  },
  {
    id: "wave",
    name: "Wave",
    description: "Organische Wellenform als Hintergrundelement",
    preview: "#0ea5e9",
  },
];

export interface AnalyticsSummary {
  cardId: string;
  cardSlug: string;
  cardName: string;
  totalViews: number;
  vcardDownloads: number;
  qrScans: number;
  linkClicks: number;
  walletSaves: number;
  viewsLast30Days: { date: string; count: number }[];
  topSources: { source: string; count: number }[];
  topLinks: { label: string; count: number }[];
  deviceSplit: { device: string; count: number }[];
  topCountries: { country: string; count: number }[];
  topCities: { city: string; count: number }[];
  browserSplit: { browser: string; count: number }[];
  osSplit: { os: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  topLanguages: { language: string; count: number }[];
  utmCampaigns: {
    campaign: string;
    source: string | null;
    medium: string | null;
    count: number;
  }[];
  namedCampaigns: {
    id: string; name: string; urlSlug: string;
    views: number; expiresAt: string | null; createdAt: string;
  }[];
}

export interface InvitationData {
  id: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  sender: { name: string };
  organization: { name: string };
}

export interface DeptPolicyOverride {
  allowTemplateChange?: boolean;
  allowColorChange?: boolean;
  allowFontChange?: boolean;
  allowLayoutChange?: boolean;
}

export interface DesignPolicy {
  allowTemplateChange: boolean;
  allowColorChange: boolean;
  allowFontChange: boolean;
  allowLayoutChange: boolean;
  canEditLogo: boolean;
  brandColors: string[];
  defaults: {
    template: string;
    fontFamily: string;
    layoutStyle: string;
    accentColor?: string;
  };
}

export interface Campaign {
  id: string;
  cardId: string;
  name: string;
  urlSlug: string;
  views: number;
  expiresAt?: string | null;
  createdAt: string;
}

export interface Lead {
  id: string;
  cardId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  status?: string; // new | contacted | interested | won | lost
  note?: string | null; // private to card owner
  createdAt: string; // ISO string after serialization
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface WebhookData {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string | null;
  active: boolean;
  createdAt: string;
}

export interface ApiKeyData {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt?: string | null;
  createdAt: string;
}
