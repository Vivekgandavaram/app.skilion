import { z } from "zod";
import { route, body } from "@/lib/api";
import { addToCart } from "@/lib/carts";

export const POST = route({ auth: true, rate: { key: "team-add", limit: 120, windowSec: 3600 } }, async ({ req, user }) => {
  const d = await body(req, z.object({ userId: z.string(), cartId: z.string().optional(), roleKey: z.string().max(40).optional() }));
  return { ok: true, ...(await addToCart(user, d.userId, d.cartId, d.roleKey)) };
});
