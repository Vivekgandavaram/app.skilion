import type { ObjectId } from "mongodb";

export type Role = "user" | "moderator" | "admin";
export type PlanId = "free" | "builder_pro" | "founder_pro" | "squad_workspace";
export type Interval = "month" | "year";

/** What a person wants from Skilion (multi-select, spec AUTH-05) */
export const INTENTS = ["offer_skills", "join_squads", "build_projects", "assemble_squads"] as const;
export type Intent = (typeof INTENTS)[number];

/** Why a team is being formed. This is the heart of the product: not freelancing. */
export const GOALS = ["validate", "prototype", "help", "company"] as const;
export type Goal = (typeof GOALS)[number];
export const GOAL_LABEL: Record<Goal, string> = {
  validate: "Validate an idea",
  prototype: "Build a prototype",
  help: "Get help with something",
  company: "Build a company",
};
export const COMPENSATION = ["paid", "equity", "revshare", "learning", "volunteer"] as const;
export type Compensation = (typeof COMPENSATION)[number];
export const COMP_LABEL: Record<Compensation, string> = {
  paid: "Paid",
  equity: "Equity",
  revshare: "Revenue share",
  learning: "Learning / credit",
  volunteer: "Volunteer",
};
export const DOMAINS = ["Design", "Engineering", "AI / ML", "Product & Strategy", "Marketing & Growth", "Finance & Business", "Operations & Support", "Research & Analysis", "Community & Content", "Sales & Partnerships", "Security & Trust", "Other"] as const;

export type Verification = { type: "email" | "github" | "google" | "repo" | "endorsement" | "identity"; at: Date; detail?: string };
export type Skill = { name: string; slug: string; evidenceWorkIds: string[] };

export interface UserDoc {
  _id: ObjectId;
  email: string;
  emailVerified: boolean;
  passwordHash?: string;
  name: string;
  handle: string;
  image?: string;
  role: Role;
  status: "active" | "suspended";
  providers: { google?: string; github?: string; githubLogin?: string };
  intents: Intent[];
  onboarded: boolean;
  isDemo?: boolean;
  plan: { id: PlanId; interval?: Interval; expiresAt?: Date };
  headline?: string;
  bio?: string;
  location?: string;
  timezone: string;
  domain?: string;
  /** sub-area inside the main area, from data/taxonomy.ts */
  subdomain?: string;
  skills: Skill[];
  /** after-hours professionals are first-class: they have a day job and build in spare time */
  dayJob: boolean;
  goals: Goal[]; // goals the person likes to help with
  compensation: Compensation[]; // what they accept
  availability: {
    status: "open" | "busy" | "unavailable";
    hoursPerWeek: number;
    /** local hour-of-week slots, Monday 00:00 = 0 ... Sunday 23:00 = 167 */
    slots: number[];
  };
  rate?: { min: number; max: number; currency: string; unit: "hour" | "session" };
  links: { github?: string; linkedin?: string; website?: string; x?: string };
  visibility: { public: boolean; showRate: boolean; showLocation: boolean; showAvailability: boolean; showLinks: boolean };
  verifications: Verification[];
  notifyPrefs: { email: boolean; bonds: boolean; messages: boolean; squads: boolean; quietStart?: number; quietEnd?: number };
  mfa?: { enabled: boolean };
  aiOptOut?: boolean;
  usage: { aiMonth: string; aiCount: number };
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkDoc {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  role: string;
  kind: "personal" | "collaborative" | "client";
  summary?: string;
  tech: string[];
  links: { demo?: string; repo?: string; media?: string };
  outcome?: string;
  visibility: "public" | "private";
  repoVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PostMedia = {
  id?: string;
  type: "image" | "video";
  url: string;
  name?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  cropX?: number;
  cropY?: number;
  zoom?: number;
  start?: number;
  end?: number;
  duration?: number;
};

export interface PostDoc {
  _id: ObjectId;
  authorId: ObjectId;
  type: "update" | "project" | "demo" | "article" | "opportunity" | "squad";
  text: string;
  url?: string;
  media?: PostMedia[];
  preview?: { title?: string; description?: string; image?: string; siteName?: string; creator?: string; finalUrl?: string; fallback?: boolean };
  tags: string[];
  workId?: ObjectId;
  projectId?: ObjectId;
  opp?: { goal: Goal; compensation: Compensation[]; skillsNeeded: string[]; hoursPerWeek?: number };
  counts: { likes: number; comments: number; saves: number };
  deleted?: boolean;
  isDemo?: boolean;
  createdAt: Date;
}

export interface BondDoc {
  _id: ObjectId;
  pair: string; // sorted "idA:idB"
  fromId: ObjectId;
  toId: ObjectId;
  note: string;
  status: "requested" | "accepted" | "declined" | "expired" | "blocked";
  createdAt: Date;
  respondedAt?: Date;
}

export interface ConversationDoc {
  _id: ObjectId;
  kind: "dm" | "squad";
  memberIds: ObjectId[];
  pairKey?: string;
  projectId?: ObjectId;
  title?: string;
  lastMessage?: { text: string; at: Date; senderId: ObjectId };
  reads: Record<string, Date>;
  createdAt: Date;
}
export interface MessageDoc {
  _id: ObjectId;
  convId: ObjectId;
  senderId: ObjectId;
  text: string;
  links: string[];
  createdAt: Date;
  deleted?: boolean;
}

export interface BlueprintRole {
  key: string;
  title: string;
  responsibilities: string[];
  essentialSkills: string[];
  optionalSkills: string[];
  hoursPerWeek: number;
  budgetShare: number; // 0..1
}
export interface BlueprintOutput {
  summary: string;
  assumptions: string[];
  scope: string;
  roles: BlueprintRole[];
  milestones: { title: string; weeks: number; outcome: string }[];
  risks: string[];
  questions: string[];
}
export interface BlueprintDoc {
  _id: ObjectId;
  ownerId: ObjectId;
  input: { vision: string; problem?: string; audience?: string; outcome?: string; goal: Goal; stage: string; budget?: number; timeline?: string; compensation: Compensation[] };
  output: BlueprintOutput;
  source: "gemini" | "fallback";
  model?: string;
  promptVersion: string;
  createdAt: Date;
}

export interface CartDoc {
  _id: ObjectId;
  ownerId: ObjectId;
  name: string;
  blueprintId?: ObjectId;
  goal?: Goal;
  budget?: number;
  roles: { key: string; title: string; essentialSkills: string[]; optionalSkills: string[]; hoursPerWeek: number; budgetShare?: number }[];
  items: { roleKey: string; userId: ObjectId; addedAt: Date }[];
  advisorToken?: string;
  projectId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvitationDoc {
  _id: ObjectId;
  projectId: ObjectId;
  cartId?: ObjectId;
  fromId: ObjectId;
  toId: ObjectId;
  roleTitle: string;
  hoursPerWeek?: number;
  message?: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: Date;
  respondedAt?: Date;
}

export interface ProjectDoc {
  _id: ObjectId;
  ownerId: ObjectId;
  title: string;
  summary: string;
  goal: Goal;
  status: "draft" | "recruiting" | "active" | "completed" | "archived";
  compensation: Compensation[];
  members: { userId: ObjectId; roleTitle: string; hoursPerWeek?: number; status: "active" | "left"; joinedAt: Date; contributionConsent?: boolean }[];
  openRoles: { key: string; title: string; skills: string[]; hoursPerWeek: number }[];
  objectives: string[];
  links: { title: string; url: string; addedBy?: ObjectId }[];
  blueprintId?: ObjectId;
  convId?: ObjectId;
  showcase: { enabled: boolean; slug?: string; outcome?: string };
  createdAt: Date;
  updatedAt: Date;
}
export interface MilestoneDoc { _id: ObjectId; projectId: ObjectId; title: string; due?: Date; done: boolean; createdAt: Date }
export interface TaskDoc { _id: ObjectId; projectId: ObjectId; milestoneId?: ObjectId; title: string; status: "todo" | "doing" | "done"; assigneeId?: ObjectId; due?: Date; createdAt: Date; updatedAt: Date }
export interface CheckinDoc { _id: ObjectId; projectId: ObjectId; userId: ObjectId; text: string; hours: number; createdAt: Date }
export interface DecisionDoc { _id: ObjectId; projectId: ObjectId; userId: ObjectId; text: string; createdAt: Date }
export interface ActivityDoc { _id: ObjectId; projectId: ObjectId; userId: ObjectId; kind: string; text: string; createdAt: Date }

export interface NotificationDoc {
  _id: ObjectId; userId: ObjectId; type: string; title: string; body?: string; href?: string; read: boolean; createdAt: Date;
}
export interface ReportDoc {
  _id: ObjectId; reporterId: ObjectId; target: { type: "user" | "post" | "message" | "project" | "comment"; id: string };
  reason: string; details?: string; severity: "low" | "medium" | "high" | "urgent"; status: "open" | "actioned" | "dismissed" | "appealed";
  resolution?: string; resolvedBy?: ObjectId; createdAt: Date; resolvedAt?: Date;
}
export interface PaymentDoc {
  _id: ObjectId; userId: ObjectId; planId: PlanId; interval: Interval; amount: number; subtotal: number; tax: number; currency: string;
  orderId: string; paymentId?: string; status: "created" | "paid" | "failed" | "refunded"; createdAt: Date; paidAt?: Date;
}
