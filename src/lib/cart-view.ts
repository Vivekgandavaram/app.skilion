import { col, ObjectId } from "./db";
import type { CartDoc, UserDoc } from "./types";
import { memberView, ser } from "./serialize";
import { matchUser, coverage } from "./match";
import { overlap, commonHours, heatmapFor, pairOverlapHours } from "./availability";
import { effectivePlan } from "./plans";

/** Everything the cart screen and the read-only advisor link need. Advisor view hides heatmap and contact details. */
export async function cartDetail(cart: CartDoc, owner: UserDoc, opts: { advisor?: boolean } = {}) {
  const users = await col("users");
  const ids = [...new Set(cart.items.map((i) => i.userId.toString()))];
  const rows = (ids.length ? await users.find({ _id: { $in: ids.map((i) => new ObjectId(i)) }, status: "active" }).toArray() : []) as UserDoc[];
  const byId = new Map(rows.map((u) => [u._id.toString(), u]));
  const works = await (await col("works")).find({ userId: { $in: rows.map((r) => r._id) } }, { projection: { title: 1 } }).toArray();
  const wt = Object.fromEntries(works.map((w) => [w._id.toString(), w.title]));
  const items = cart.items.filter((i) => byId.has(i.userId.toString())).map((i) => {
    const u = byId.get(i.userId.toString())!;
    const role = cart.roles.find((r) => r.key === i.roleKey);
    const match = role ? matchUser({ title: role.title, essentialSkills: role.essentialSkills, optionalSkills: role.optionalSkills, hoursPerWeek: role.hoursPerWeek }, u, owner, wt) : null;
    return { roleKey: i.roleKey, addedAt: i.addedAt.toISOString(), person: memberView(u), match, overlapWithOwner: pairOverlapHours({ id: owner._id.toString(), name: owner.name, timezone: owner.timezone, slots: owner.availability.slots }, { id: u._id.toString(), name: u.name, timezone: u.timezone, slots: u.availability.slots }) };
  });
  const members = [...new Map(cart.items.map((i) => [i.userId.toString(), byId.get(i.userId.toString())])).values()].filter(Boolean) as UserDoc[];
  const everyone = [owner, ...members];
  const allEss = cart.roles.flatMap((r) => r.essentialSkills), allOpt = cart.roles.flatMap((r) => r.optionalSkills);
  const plan = effectivePlan(owner);
  const people = everyone.map((u) => ({ id: u._id.toString(), name: u.name, timezone: u.timezone, slots: u.availability.slots }));
  const counts = overlap(people);
  const hoursByRole = cart.roles.map((r) => ({ key: r.key, filled: cart.items.filter((i) => i.roleKey === r.key).length }));
  return {
    cart: ser({ _id: cart._id, name: cart.name, goal: cart.goal, budget: cart.budget, roles: cart.roles, projectId: cart.projectId, advisorToken: opts.advisor ? undefined : cart.advisorToken, updatedAt: cart.updatedAt }),
    owner: { name: owner.name, handle: owner.handle, timezone: owner.timezone },
    items: opts.advisor ? items.map((i) => ({ ...i, person: { ...i.person, links: undefined, rate: i.person.rate } })) : items,
    coverage: coverage(allEss, allOpt, members),
    roleFill: hoursByRole,
    commonHours: people.length > 1 ? commonHours(people) : 0,
    heatmap: plan.limits.heatmap && !opts.advisor ? { grid: heatmapFor(counts, owner.timezone), max: people.length } : null,
    canHeatmap: plan.limits.heatmap,
    budgetAllocation: cart.budget ? cart.roles.map((r) => ({ key: r.key, title: r.title, amount: Math.round(cart.budget! * (r.budgetShare || 0)) })) : null,
  };
}
