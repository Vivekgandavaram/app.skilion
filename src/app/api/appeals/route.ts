import { z } from "zod";
import { route, body } from "@/lib/api";
import { col } from "@/lib/db";

/** Public: a suspended person cannot sign in, so appeals take an email address. */
export const POST = route({ rate: { key: "appeal", limit: 5, windowSec: 86400 } }, async ({ req }) => {
  const d = await body(req, z.object({ email: z.string().trim().toLowerCase().email().max(200), message: z.string().trim().min(20, "Tell us a bit more (20+ characters)").max(2000) }));
  const u = await (await col("users")).findOne({ email: d.email }, { projection: { _id: 1 } });
  await (await col("appeals")).insertOne({ userId: u?._id, email: d.email, message: d.message, status: "open", createdAt: new Date() } as any);
  return { ok: true };
});
