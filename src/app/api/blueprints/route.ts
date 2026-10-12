import { route } from "@/lib/api";
import { col } from "@/lib/db";
import { ser } from "@/lib/serialize";
import { effectivePlan } from "@/lib/plans";

export const GET = route({ auth: true }, async ({ user }) => {
  const rows = await (await col("blueprints")).find({ ownerId: user._id }).sort({ createdAt: -1 }).limit(100).toArray();
  return { limit: effectivePlan(user).limits.blueprints, items: rows.map((b) => ser({ _id: b._id, summary: b.output.summary, goal: b.input.goal, vision: b.input.vision.slice(0, 160), roles: b.output.roles.length, source: b.source, createdAt: b.createdAt })) };
});
