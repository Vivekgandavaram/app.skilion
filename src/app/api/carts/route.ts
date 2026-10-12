import { z } from "zod";
import { route, body, bad } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { assertWithinLimit } from "@/lib/billing-limits";
import { effectivePlan } from "@/lib/plans";
import { GOALS } from "@/lib/types";
import { RoleSchema } from "@/lib/schemas";
import type { CartDoc, BlueprintDoc } from "@/lib/types";



export const GET = route({ auth: true }, async ({ user }) => {
  const rows = (await (await col("carts")).find({ ownerId: user._id }).sort({ updatedAt: -1 }).limit(60).toArray()) as CartDoc[];
  return { limit: effectivePlan(user).limits.carts, items: rows.map((c) => ({ id: c._id.toString(), name: c.name, goal: c.goal, roles: c.roles.map((r) => ({ key: r.key, title: r.title })), members: new Set(c.items.map((i) => i.userId.toString())).size, updatedAt: c.updatedAt.toISOString(), projectId: c.projectId?.toString() })) };
});

export const POST = route({ auth: true, rate: { key: "cart-new", limit: 30, windowSec: 3600 } }, async ({ req, user }) => {
  const d = await body(req, z.object({ name: z.string().trim().min(1).max(80), blueprintId: z.string().optional(), goal: z.enum(GOALS).optional(), budget: z.number().min(0).max(1e9).optional(), roles: z.array(RoleSchema).max(8).optional() }));
  await assertWithinLimit(user, "carts");
  let roles = d.roles || [], goal = d.goal, budget = d.budget;
  let blueprintId;
  if (d.blueprintId) {
    blueprintId = oid(d.blueprintId); if (!blueprintId) throw bad("Unknown blueprint");
    const b = (await (await col("blueprints")).findOne({ _id: blueprintId, ownerId: user._id })) as BlueprintDoc | null;
    if (!b) throw bad("Unknown blueprint");
    roles = b.output.roles.map((r) => ({ key: r.key, title: r.title, essentialSkills: r.essentialSkills, optionalSkills: r.optionalSkills, hoursPerWeek: r.hoursPerWeek, budgetShare: r.budgetShare }));
    goal ??= b.input.goal; budget ??= b.input.budget;
  }
  const now = new Date();
  const r = await (await col("carts")).insertOne({ ownerId: user._id, name: d.name, blueprintId, goal, budget, roles, items: [], createdAt: now, updatedAt: now } as any);
  return { ok: true, id: r.insertedId.toString() };
});
