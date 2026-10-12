import { route, query } from "@/lib/api";
import { col } from "@/lib/db";
import { handleRule } from "@/lib/schemas";

export const GET = route({ auth: true, rate: { key: "handle-check", limit: 120, windowSec: 600 } }, async ({ req, user }) => {
  const r = handleRule.safeParse(query(req).handle || "");
  if (!r.success) return { available: false, reason: r.error.issues[0].message };
  const hit = await (await col("users")).findOne({ handle: r.data, _id: { $ne: user._id } }, { projection: { _id: 1 } });
  return { available: !hit, reason: hit ? "That handle is taken." : "" };
});
