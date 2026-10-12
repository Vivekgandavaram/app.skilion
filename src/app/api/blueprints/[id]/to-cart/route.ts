import { route, notFound } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { assertWithinLimit } from "@/lib/billing-limits";
import type { BlueprintDoc } from "@/lib/types";

export const POST = route<{ id: string }>({ auth: true, rate: { key: "bp-cart", limit: 30, windowSec: 3600 } }, async ({ user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const b = (await (await col("blueprints")).findOne({ _id: id, ownerId: user._id })) as BlueprintDoc | null;
  if (!b) throw notFound();
  const carts = await col("carts");
  const existing = await carts.findOne({ ownerId: user._id, blueprintId: id });
  if (existing) return { ok: true, id: existing._id.toString(), existing: true };
  await assertWithinLimit(user, "carts");
  const now = new Date();
  const r = await carts.insertOne({ ownerId: user._id, name: b.input.vision.slice(0, 50) || "My squad", blueprintId: id, goal: b.input.goal, budget: b.input.budget, roles: b.output.roles.map((x) => ({ key: x.key, title: x.title, essentialSkills: x.essentialSkills, optionalSkills: x.optionalSkills, hoursPerWeek: x.hoursPerWeek, budgetShare: x.budgetShare })), items: [], createdAt: now, updatedAt: now } as any);
  return { ok: true, id: r.insertedId.toString() };
});
