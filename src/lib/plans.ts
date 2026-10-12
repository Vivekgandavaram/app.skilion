import type { PlanId, Interval, UserDoc } from "./types";
import { env } from "./env";

export type PlanDef = {
  id: PlanId;
  name: string;
  tagline: string;
  audience: string;
  price: { month: number; year: number }; // INR, before GST
  features: string[];
  limits: { aiPerMonth: number; blueprints: number; carts: number; savedSearches: number; heatmap: boolean; analytics: boolean; skillGap: boolean; workspaceMembers: number };
  cta: string;
  available: boolean;
};

/** Source of truth for pricing and entitlements. Everything (UI, API, checkout) reads this. */
export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: "free", name: "Free", tagline: "For curious builders and first-time founders", audience: "Students, independent builders and curious founders",
    price: { month: 0, year: 0 }, cta: "Start free", available: true,
    features: ["Proof-of-work profile", "Discover feed and link sharing", "Browse and search builders", "Bonds and messaging", "Join squads and collaborate", "3 AI Squad Architect runs per month"],
    limits: { aiPerMonth: 3, blueprints: 3, carts: 1, savedSearches: 0, heatmap: false, analytics: false, skillGap: true, workspaceMembers: 5 },
  },
  builder_pro: {
    id: "builder_pro", name: "Builder Pro", tagline: "Show your work like a pro", audience: "Serious builders who sell skills, not hours",
    price: { month: 299, year: 2999 }, cta: "Upgrade to Builder Pro", available: true,
    features: ["Everything in Free", "Advanced portfolio presentation", "Profile and project analytics", "Saved searches and advanced filters", "AI profile and project improvements", "Expanded availability preferences", "More AI matching runs"],
    limits: { aiPerMonth: 15, blueprints: 5, carts: 1, savedSearches: 10, heatmap: false, analytics: true, skillGap: true, workspaceMembers: 5 },
  },
  founder_pro: {
    id: "founder_pro", name: "Founder Pro", tagline: "From idea to squad, faster", audience: "Founders assembling teams",
    price: { month: 999, year: 9999 }, cta: "Upgrade to Founder Pro", available: true,
    features: ["Everything in Free", "Expanded AI Squad Architect usage", "More saved blueprints", "Advanced candidate matching and comparison", "Skill-gap analysis", "Seven-day availability heatmap", "Budget and role planning", "Multiple Squad Cart drafts", "Project planning and progress summaries"],
    limits: { aiPerMonth: 60, blueprints: 50, carts: 20, savedSearches: 10, heatmap: true, analytics: true, skillGap: true, workspaceMembers: 5 },
  },
  squad_workspace: {
    id: "squad_workspace", name: "Squad Workspace", tagline: "A shared home for an active team", audience: "Active teams, up to five members",
    price: { month: 2499, year: 24999 }, cta: "Contact us to join the waitlist", available: false,
    features: ["Shared project workspace", "Expanded AI planning and progress summaries", "Milestones, tasks, check-ins and decision logs", "Shared availability", "Team activity and reports", "Extra seats priced separately", "Priority support"],
    limits: { aiPerMonth: 120, blueprints: 100, carts: 50, savedSearches: 10, heatmap: true, analytics: true, skillGap: true, workspaceMembers: 5 },
  },
};
export const ENTERPRISE = { name: "Enterprise", audience: "Universities, incubators, accelerators and organizations", features: ["Organization management", "Advanced admin permissions", "Organization-level reporting", "Custom onboarding and support", "Negotiated usage, security and compliance"] };

/** Plan that is actually in force (expired paid plans fall back to free, never delete data). */
export function effectivePlan(u: Pick<UserDoc, "plan">): PlanDef {
  const p = u.plan;
  if (p.id !== "free" && p.expiresAt && new Date(p.expiresAt) < new Date()) return PLANS.free;
  return PLANS[p.id] || PLANS.free;
}

export function priceBreakdown(plan: PlanId, interval: Interval) {
  const subtotal = PLANS[plan].price[interval];
  const tax = Math.round((subtotal * env.gst) / 100);
  return { subtotal, tax, total: subtotal + tax, gstPercent: env.gst, currency: "INR" };
}

export const monthKey = (d = new Date()) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

export function aiRemaining(u: UserDoc) {
  const limit = effectivePlan(u).limits.aiPerMonth;
  const used = u.usage?.aiMonth === monthKey() ? u.usage.aiCount : 0;
  return { limit, used, remaining: Math.max(0, limit - used) };
}
