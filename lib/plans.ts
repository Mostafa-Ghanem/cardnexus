export type Plan = "free" | "pro" | "business";

export interface PlanFeatures {
  whiteLabel: boolean;          // Remove the platform badge
  customDomain: boolean;        // Use own domain
  allTemplates: boolean;        // Access to all 12 templates (free: 4 only)
  maxCards: number;             // Max number of cards per user
  maxCustomLinks: number;       // Max custom links on card
  pdfExport: boolean;           // Print/PDF export
  appointmentBooking: boolean;  // Booking URL field
  campaigns: boolean;           // UTM campaign links
  bulkImport: boolean;          // CSV import for team cards
  orgTemplate: boolean;         // Default card template for org members
  eventInvitations: boolean;    // Time-limited campaign links
  milestoneNotifications: boolean; // Email on view milestones
  analyticsRetention: number;   // Days of analytics history
  teamDirectory: boolean;       // Team directory & member management
  leadCapture: boolean;         // Lead capture form on public card
}

export interface PlanDefinition {
  id: Plan;
  name: string;
  monthlyPrice: number; // in PRICE_CURRENCY
  yearlyPrice: number;  // per month, billed yearly
  description: string;
  features: PlanFeatures;
  highlight?: boolean;
}

export const PLANS: Record<Plan, PlanDefinition> = {
  free: {
    id: "free",
    name: "المجانية",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "للبداية",
    features: {
      whiteLabel: false,
      customDomain: false,
      allTemplates: false,
      maxCards: 1,
      maxCustomLinks: 3,
      pdfExport: false,
      appointmentBooking: false,
      campaigns: false,
      bulkImport: false,
      orgTemplate: false,
      eventInvitations: false,
      milestoneNotifications: false,
      analyticsRetention: 30,
      teamDirectory: false,
      // Lead capture is available on every plan (core feature for the Arabic launch).
      leadCapture: true,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPrice: 5,
    yearlyPrice: 4,
    description: "للمحترفين وأصحاب الأعمال الحرة",
    highlight: true,
    features: {
      whiteLabel: true,
      customDomain: true,
      allTemplates: true,
      maxCards: 3,
      maxCustomLinks: Infinity,
      pdfExport: true,
      appointmentBooking: true,
      campaigns: true,
      bulkImport: false,
      orgTemplate: false,
      eventInvitations: true,
      milestoneNotifications: true,
      analyticsRetention: 365,
      teamDirectory: false,
      leadCapture: true,
    },
  },
  business: {
    id: "business",
    name: "Business",
    monthlyPrice: 19,
    yearlyPrice: 15,
    description: "للفرق والشركات",
    features: {
      whiteLabel: true,
      customDomain: true,
      allTemplates: true,
      maxCards: Infinity,
      maxCustomLinks: Infinity,
      pdfExport: true,
      appointmentBooking: true,
      campaigns: true,
      bulkImport: true,
      orgTemplate: true,
      eventInvitations: true,
      milestoneNotifications: true,
      analyticsRetention: 730,
      teamDirectory: true,
      leadCapture: true,
    },
  },
};

/**
 * Display currency for plan prices. Must match the prices configured in Stripe/PayPal.
 * Override with NEXT_PUBLIC_PRICE_CURRENCY (ISO 4217, e.g. SAR, EGP, AED).
 */
export const PRICE_CURRENCY = process.env.NEXT_PUBLIC_PRICE_CURRENCY || "USD";

export function formatPrice(amount: number): string {
  try {
    return new Intl.NumberFormat("ar", {
      style: "currency", currency: PRICE_CURRENCY,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
      numberingSystem: "latn",
    } as Intl.NumberFormatOptions).format(amount);
  } catch {
    return `${amount} ${PRICE_CURRENCY}`;
  }
}

export const FREE_TEMPLATES = ["classic", "modern", "minimal", "dark"];

/** Returns the effective plan for a user — checks expiry.
 *  Accepts Date or ISO string (better-auth may serialize dates in session JWT). */
export function effectivePlan(plan: string, expiresAt?: Date | string | null): Plan {
  if (plan === "free") return "free";
  if (expiresAt) {
    const d = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    if (!isNaN(d.getTime()) && d < new Date()) return "free";
  }
  return plan as Plan;
}

/** Returns the plan features for a given plan string. */
export function getPlanFeatures(plan: string, expiresAt?: Date | string | null): PlanFeatures {
  return PLANS[effectivePlan(plan, expiresAt)].features;
}

/** Check if a specific feature is available for this plan. */
export function canUseFeature(
  feature: keyof PlanFeatures,
  plan: string,
  expiresAt?: Date | null
): boolean {
  const f = getPlanFeatures(plan, expiresAt);
  const val = f[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val > 0;
  return false;
}
