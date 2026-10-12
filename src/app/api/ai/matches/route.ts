import { z } from "zod";
import { route, body, bad } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { discoverable } from "@/lib/people";
import { blockedIds } from "@/lib/relations";
import { matchUser } from "@/lib/match";
import { slugOf } from "@/lib/skills";
import { memberView } from "@/lib/serialize";
import type { UserDoc, BlueprintDoc } from "@/lib/types";

/**
 * Explainable candidate matching for one role. No model call: score components come from profile data only
 * (skills, evidence, availability, overlap, verifications). People who opted out of AI-assisted matching are excluded.
 */
export const POST = route({ auth: true, rate: { key: "matches", limit: 120, windowSec: 3600 } }, async ({ req, user }) => {
  const d = await body(req, z.object({
    blueprintId: z.string().optional(), roleKey: z.string().max(40).optional(),
    role: z.object({ title: z.string().max(80), essentialSkills: z.array(z.string().max(40)).max(8), optionalSkills: z.array(z.string().max(40)).max(8).default([]), hoursPerWeek: z.number().min(1).max(40) }).optional(),
    limit: z.number().int().min(1).max(24).default(12),
  }));
  let role = d.role;
  if (!role && d.blueprintId && d.roleKey) {
    const bid = oid(d.blueprintId); if (!bid) throw bad("Unknown blueprint");
    const b = (await (await col("blueprints")).findOne({ _id: bid, ownerId: user._id })) as BlueprintDoc | null;
    const r = b?.output.roles.find((x) => x.key === d.roleKey);
    if (r) role = { title: r.title, essentialSkills: r.essentialSkills, optionalSkills: r.optionalSkills, hoursPerWeek: r.hoursPerWeek };
  }
  if (!role) throw bad("Choose a role to match.");
  const slugs = [...new Set([...role.essentialSkills, ...role.optionalSkills].map(slugOf))];
  if (!slugs.length) return { items: [] };
  const blocked = await blockedIds(user._id);
  const users = await col("users");
  const rows = (await users.find({ ...discoverable(user._id), ...(blocked.length ? { _id: { $nin: [...blocked, user._id] } } : {}), aiOptOut: { $ne: true }, "skills.slug": { $in: slugs }, "availability.status": { $ne: "unavailable" } }, { projection: { passwordHash: 0 } }).limit(300).toArray()) as UserDoc[];
  const works = await (await col("works")).find({ userId: { $in: rows.map((r) => r._id) }, visibility: "public" }, { projection: { title: 1 } }).toArray();
  const wt = Object.fromEntries(works.map((w) => [w._id.toString(), w.title]));
  const scored = rows.map((u) => ({ u, m: matchUser(role!, u, user, wt) })).filter((x) => x.m.essentialCovered.length > 0 || x.m.optionalCovered.length > 0).sort((a, b) => b.m.score - a.m.score).slice(0, d.limit);
  return { items: scored.map(({ u, m }) => ({ ...memberView(u), match: m })) };
});
