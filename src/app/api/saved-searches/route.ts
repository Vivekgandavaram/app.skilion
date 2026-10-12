import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { effectivePlan } from "@/lib/plans";
import { ser } from "@/lib/serialize";

export const GET = route({ auth: true }, async ({ user }) => ({ items: ser(await (await col("savedSearches")).find({ userId: user._id }).sort({ createdAt: -1 }).limit(50).toArray()), limit: effectivePlan(user).limits.savedSearches }));
export const POST = route({ auth: true, rate: { key: "saved-search", limit: 30, windowSec: 3600 } }, async ({ req, user }) => {
  const d = await body(req, z.object({ name: z.string().trim().min(1).max(60), params: z.record(z.string().max(200)).refine((p) => Object.keys(p).length <= 14, "Too many filters") }));
  const lim = effectivePlan(user).limits.savedSearches;
  const c = await col("savedSearches");
  if (lim === 0) throw new HttpError(402, "Saved searches are part of Builder Pro and Founder Pro.", "upgrade");
  if ((await c.countDocuments({ userId: user._id })) >= lim) throw new HttpError(402, `Your plan includes ${lim} saved searches. Delete one or upgrade.`, "upgrade");
  const r = await c.insertOne({ userId: user._id, name: d.name, params: d.params, createdAt: new Date() } as any);
  return { ok: true, id: r.insertedId.toString() };
});
