import { z } from "zod";
import { COMPENSATION, DOMAINS, GOALS, INTENTS } from "./types";

const https = (hosts?: RegExp) => z.string().trim().max(200).refine((v) => {
  if (!v) return true;
  try { const u = new URL(v); return u.protocol === "https:" && (!hosts || hosts.test(u.hostname)); } catch { return false; }
}, "Use a full https:// link").optional().or(z.literal(""));

export function validTz(tz: string) { try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; } }

export const ProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  headline: z.string().trim().max(120),
  bio: z.string().trim().max(1200),
  location: z.string().trim().max(80),
  timezone: z.string().refine(validTz, "Unknown time zone"),
  domain: z.enum(DOMAINS).or(z.literal("")),
  subdomain: z.string().trim().max(60).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(30),
  intents: z.array(z.enum(INTENTS)).max(4),
  goals: z.array(z.enum(GOALS)).max(4),
  compensation: z.array(z.enum(COMPENSATION)).max(5),
  dayJob: z.boolean(),
  availability: z.object({
    status: z.enum(["open", "busy", "unavailable"]),
    hoursPerWeek: z.number().int().min(0).max(60),
    slots: z.array(z.number().int().min(0).max(167)).max(168),
  }),
  rate: z.object({ min: z.number().min(0).max(1_000_000), max: z.number().min(0).max(1_000_000), currency: z.string().length(3), unit: z.enum(["hour", "session"]) }).refine((r) => r.min <= r.max, "Minimum rate must not exceed maximum").nullable(),
  links: z.object({ github: https(/(^|\.)github\.com$/), linkedin: https(/(^|\.)linkedin\.com$/), website: https(), x: https(/(^|\.)(x|twitter)\.com$/) }),
  visibility: z.object({ public: z.boolean(), showRate: z.boolean(), showLocation: z.boolean(), showAvailability: z.boolean(), showLinks: z.boolean() }),
  notifyPrefs: z.object({ email: z.boolean(), bonds: z.boolean(), messages: z.boolean(), squads: z.boolean(), quietStart: z.number().int().min(0).max(23).nullable().optional(), quietEnd: z.number().int().min(0).max(23).nullable().optional() }),
  aiOptOut: z.boolean(),
  image: z.string().url().max(500).optional(),
}).partial();
export const WorkSchema = z.object({
  title: z.string().trim().min(2).max(100),
  role: z.string().trim().min(2).max(80),
  kind: z.enum(["personal", "collaborative", "client"]),
  summary: z.string().trim().max(600).optional(),
  tech: z.array(z.string().trim().min(1).max(40)).max(15),
  links: z.object({ demo: https(), repo: https(), media: https() }),
  outcome: z.string().trim().max(400).optional(),
  visibility: z.enum(["public", "private"]),
});
