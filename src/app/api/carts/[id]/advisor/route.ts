import crypto from "node:crypto";
import { route } from "@/lib/api";
import { col } from "@/lib/db";
import { ownedCart } from "@/lib/carts";

/** A read-only link for a mentor or friend: no sign-in, no contact details, can be revoked. */
export const POST = route<{ id: string }>({ auth: true, rate: { key: "advisor", limit: 30, windowSec: 3600 } }, async ({ user, params }) => {
  const cart = await ownedCart(params.id, user._id);
  const token = cart.advisorToken || crypto.randomBytes(24).toString("hex");
  await (await col("carts")).updateOne({ _id: cart._id }, { $set: { advisorToken: token } });
  return { ok: true, token };
});
export const DELETE = route<{ id: string }>({ auth: true }, async ({ user, params }) => {
  const cart = await ownedCart(params.id, user._id);
  await (await col("carts")).updateOne({ _id: cart._id }, { $unset: { advisorToken: "" } });
  return { ok: true };
});
