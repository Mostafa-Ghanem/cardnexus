export type Plan = "free" | "pro" | "business";

export interface PlanFeatures {
  whiteLabel: boolean;          // Remove "Erstellt mit CardNexus" badge
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
  maxLeadsPerMonth: number;     // Limit unique submitted leads (Infinity for paid)
}

export interface PlanDefinition {
  id: Plan;
  name: string;
  monthlyPrice: number; // EUR
  yearlyPrice: number;  // EUR/month billed yearly
  description: string;
  features: PlanFeatures;
  highlight?: boolean;
}

export const PLANS: Record<Plan, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Für den Einstieg",
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
      leadCapture: true,
      maxLeadsPerMonth: 10,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPrice: 5,
    yearlyPrice: 4,
    description: "Für Profis & Freelancer",
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
      maxLeadsPerMonth: Infinity,
    },
  },
  business: {
    id: "business",
    name: "Business",
    monthlyPrice: 19,
    yearlyPrice: 15,
    description: "Für Teams & Unternehmen",
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
      maxLeadsPerMonth: Infinity,
    },
  },
};

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
