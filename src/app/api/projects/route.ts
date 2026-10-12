import { route } from "@/lib/api";
import { col } from "@/lib/db";
import { ser } from "@/lib/serialize";
import type { ProjectDoc } from "@/lib/types";

export const GET = route({ auth: true }, async ({ user }) => {
  const rows = (await (await col("projects")).find({ members: { $elemMatch: { userId: user._id, status: "active" } } }).sort({ updatedAt: -1 }).limit(100).toArray()) as ProjectDoc[];
  const open = await (await col("tasks")).aggregate([{ $match: { projectId: { $in: rows.map((r) => r._id) }, status: { $ne: "done" } } }, { $group: { _id: "$projectId", n: { $sum: 1 } } }]).toArray();
  const om = new Map(open.map((o) => [o._id.toString(), o.n]));
  return { items: rows.map((p) => ({ ...ser({ _id: p._id, title: p.title, summary: p.summary, goal: p.goal, status: p.status, updatedAt: p.updatedAt }), members: p.members.filter((m) => m.status === "active").length, mine: p.ownerId.equals(user._id), openTasks: om.get(p._id.toString()) || 0 })) };
});
