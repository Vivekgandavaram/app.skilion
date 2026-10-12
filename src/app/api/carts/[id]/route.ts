import { z } from "zod";
import { route, body } from "@/lib/api";
import { col } from "@/lib/db";
import { ownedCart } from "@/lib/carts";
import { cartDetail } from "@/lib/cart-view";
import { GOALS } from "@/lib/types";
import { RoleSchema } from "@/lib/schemas";

export const GET = route<{ id: string }>({ auth: true }, async ({ user, params }) => cartDetail(await ownedCart(params.id, user._id), user));

export const PATCH = route<{ id: string }>({ auth: true, rate: { key: "cart-edit", limit: 300, windowSec: 3600 } }, async ({ req, user, params }) => {
  const cart = await ownedCart(params.id, user._id);
  const d = await body(req, z.object({ name: z.string().trim().min(1).max(80).optional(), goal: z.enum(GOALS).nullable().optional(), budget: z.number().min(0).max(1e9).nullable().optional(), roles: z.array(RoleSchema).max(8).optional() }));
  const set: any = { updatedAt: new Date() }, unset: any = {};
  if (d.name) set.name = d.name;
  if (d.goal !== undefined) d.goal ? (set.goal = d.goal) : (unset.goal = "");
  if (d.budget !== undefined) d.budget !== null ? (set.budget = d.budget) : (unset.budget = "");
  if (d.roles) {
    const keys = new Set<string>(); const roles = d.roles.map((r, i) => { let k = r.key.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30) || `role-${i + 1}`; while (keys.has(k)) k += "-2"; keys.add(k); return { ...r, key: k }; });
    set.roles = roles;
    // people whose role disappeared fall back to "unassigned" rather than being dropped
    const old = cart.roles.map((r) => r.key);
    set.items = cart.items.map((i) => (i.roleKey === "unassigned" || keys.has(i.roleKey) || !old.includes(i.roleKey) ? i : { ...i, roleKey: "unassigned" }));
  }
  await (await col("carts")).updateOne({ _id: cart._id }, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) });
  return { ok: true };
});

export const DELETE = route<{ id: string }>({ auth: true }, async ({ user, params }) => {
  const cart = await ownedCart(params.id, user._id);
  await (await col("carts")).deleteOne({ _id: cart._id });
  return { ok: true };
});
