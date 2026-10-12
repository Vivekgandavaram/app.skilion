import { z } from "zod";
import { GOALS, COMPENSATION } from "./types";
import { normSkill } from "./skills";

/** Shared request schemas (route files may only export HTTP handlers). */
export const InputSchema = z.object({
  vision: z.string().trim().min(20, "Describe your idea in at least 20 characters").max(1500),
  problem: z.string().trim().max(800).optional(), audience: z.string().trim().max(400).optional(), outcome: z.string().trim().max(400).optional(),
  goal: z.enum(GOALS), stage: z.enum(["idea", "validating", "prototype", "launched"]).default("idea"),
  budget: z.number().min(0).max(1e9).optional(), timeline: z.string().trim().max(60).optional(), compensation: z.array(z.enum(COMPENSATION)).max(5).default([]),
});

export const RoleSchema = z.object({
  key: z.string().trim().min(1).max(40), title: z.string().trim().min(2).max(80),
  essentialSkills: z.array(z.string().trim().min(1).max(40)).max(8), optionalSkills: z.array(z.string().trim().min(1).max(40)).max(8),
  hoursPerWeek: z.number().min(1).max(40), budgetShare: z.number().min(0).max(1).optional(),
});

export const passwordRule = z.string().min(8, "Use at least 8 characters").max(100).refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Include at least one letter and one number");

export const handleRule = z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{1,28})[a-z0-9]$/, "Use 3-30 letters, numbers or hyphens");

export const clean = (d: any) => ({ ...d, tech: [...new Set<string>(d.tech.map((t: string) => normSkill(t).name))], links: Object.fromEntries(Object.entries(d.links).filter(([, v]) => !!v)) });
