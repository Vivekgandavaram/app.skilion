import { col, ObjectId } from "./db";
import { HttpError, notFound } from "./api";
import { oid } from "./db";
import type { CartDoc, UserDoc } from "./types";
import { isBlocked } from "./relations";
import { assertWithinLimit } from "./billing-limits";

export async function ownedCart(id: string, userId: ObjectId): Promise<CartDoc> {
  const oidv = oid(id); if (!oidv) throw notFound();
  const c = (await (await col("carts")).findOne({ _id: oidv, ownerId: userId })) as CartDoc | null;
  if (!c) throw notFound("Cart not found");
  return c;
}

/** Add a person to a cart (creating "My squad" when the owner has none). Used by profile, explore and match buttons. */
export async function addToCart(owner: UserDoc, userId: string, cartId?: string, roleKey?: string) {
  const target = oid(userId); if (!target) throw new HttpError(400, "Unknown person");
  if (target.equals(owner._id)) throw new HttpError(400, "You are already on your own team.");
  const person = await (await col("users")).findOne({ _id: target, status: "active", onboarded: true });
  if (!person) throw new HttpError(404, "That person was not found.");
  if (await isBlocked(owner._id, target)) throw new HttpError(403, "You cannot add this person.");
  const carts = await col("carts");
  let cart: CartDoc | null = null;
  if (cartId) cart = await ownedCart(cartId, owner._id);
  else cart = (await carts.find({ ownerId: owner._id }).sort({ updatedAt: -1 }).limit(1).next()) as CartDoc | null;
  const now = new Date();
  if (!cart) {
    await assertWithinLimit(owner, "carts");
    const r = await carts.insertOne({ ownerId: owner._id, name: "My squad", roles: [], items: [], createdAt: now, updatedAt: now } as any);
    cart = (await carts.findOne({ _id: r.insertedId })) as CartDoc;
  }
  if (cart.items.length >= 12) throw new HttpError(400, "A cart holds up to 12 people.");
  const key = roleKey && (roleKey === "unassigned" || cart.roles.some((r) => r.key === roleKey)) ? roleKey : "unassigned";
  if (cart.items.some((i) => i.userId.equals(target) && i.roleKey === key)) return { cartId: cart._id.toString(), already: true, name: cart.name };
  await carts.updateOne({ _id: cart._id }, { $push: { items: { roleKey: key, userId: target, addedAt: now } }, $set: { updatedAt: now } } as any);
  return { cartId: cart._id.toString(), already: false, name: cart.name };
}
