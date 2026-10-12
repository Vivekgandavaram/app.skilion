import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { getFlags, clearFlagsCache } from "@/lib/flags";
import { logAudit } from "@/lib/admin-audit";
import { has } from "@/lib/env";

export const GET = route({ auth: "admin" }, async () => ({
  flags: await getFlags(),
  services: Object.fromEntries([["MongoDB", has("MONGODB_URI")], ["Google sign-in", has("GOOGLE_CLIENT_ID") && has("GOOGLE_CLIENT_SECRET")], ["GitHub sign-in", has("GITHUB_CLIENT_ID") && has("GITHUB_CLIENT_SECRET")], ["Resend email", has("RESEND_API_KEY")], ["Gemini AI", has("GEMINI_API_KEY")], ["Razorpay", has("RAZORPAY_KEY_ID") && has("RAZORPAY_KEY_SECRET")], ["Razorpay webhook", has("RAZORPAY_WEBHOOK_SECRET")]]),
  demo: { users: await (await col("users")).countDocuments({ isDemo: true }), posts: await (await col("posts")).countDocuments({ isDemo: true }) },
}));
export const PUT = route({ auth: "admin" }, async ({ req, user }) => {
  const d = await body(req, z.object({ signupsOpen: z.boolean(), aiEnabled: z.boolean(), maintenance: z.string().trim().max(200) }));
  await (await col("settings")).updateOne({ _id: "flags" }, { $set: { value: d } }, { upsert: true });
  clearFlagsCache(); await logAudit(user._id, "flags.update", undefined, d);
  return { ok: true };
});
/** Remove everything flagged isDemo (seed data) so a launch starts with no fake people or posts. */
export const DELETE = route({ auth: "admin" }, async ({ req, user }) => {
  const d = await body(req, z.object({ confirm: z.literal("PURGE DEMO") }));
  if (!d) throw new HttpError(400, "Confirm");
  const users = await col("users");
  const ids = (await users.find({ isDemo: true }, { projection: { _id: 1 } }).toArray()).map((u) => u._id);
  const r = { users: (await users.deleteMany({ isDemo: true })).deletedCount, posts: (await (await col("posts")).deleteMany({ isDemo: true })).deletedCount, works: 0 };
  r.works = (await (await col("works")).deleteMany({ userId: { $in: ids } })).deletedCount;
  await (await col("bonds")).deleteMany({ $or: [{ fromId: { $in: ids } }, { toId: { $in: ids } }] });
  await (await col("endorsements")).deleteMany({ $or: [{ fromId: { $in: ids } }, { toId: { $in: ids } }] });
  await logAudit(user._id, "demo.purge", undefined, r);
  return { ok: true, ...r };
});
