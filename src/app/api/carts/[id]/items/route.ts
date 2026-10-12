import { z } from "zod";
import { route, body, bad } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { ownedCart, addToCart } from "@/lib/carts";

export const POST = route<{ id: string }>({ auth: true, rate: { key: "cart-item", limit: 300, windowSec: 3600 } }, async ({ req, user, params }) => {
  const d = await body(req, z.object({ userId: z.string(), roleKey: z.string().max(40).optional() }));
  return { ok: true, ...(await addToCart(user, d.userId, params.id, d.roleKey)) };
});
/** Move a person to another role */
export const PATCH = route<{ id: string }>({ auth: true }, async ({ req, user, params }) => {
  const d = await body(req, z.object({ userId: z.string(), from: z.string().max(40), to: z.string().max(40) }));
  const cart = await ownedCart(params.id, user._id); const uid = oid(d.userId); if (!uid) throw bad("Unknown person");
  if (d.to !== "unassigned" && !cart.roles.some((r) => r.key === d.to)) throw bad("Unknown role");
  const items = cart.items.map((i) => (i.userId.equals(uid) && i.roleKey === d.from ? { ...i, roleKey: d.to } : i));
  await (await col("carts")).updateOne({ _id: cart._id }, { $set: { items, updatedAt: new Date() } });
  return { ok: true };
});
export const DELETE = route<{ id: string }>({ auth: true }, async ({ req, user, params }) => {
  const d = await body(req, z.object({ userId: z.string(), roleKey: z.string().max(40).optional() }));
  const cart = await ownedCart(params.id, user._id); const uid = oid(d.userId); if (!uid) throw bad("Unknown person");
  const items = cart.items.filter((i) => !(i.userId.equals(uid) && (!d.roleKey || i.roleKey === d.roleKey)));
  await (await col("carts")).updateOne({ _id: cart._id }, { $set: { items, updatedAt: new Date() } });
  return { ok: true };
});
