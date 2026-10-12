import { route, query } from "@/lib/api";
import { col } from "@/lib/db";
import { memberViews } from "@/lib/people";
import { ser } from "@/lib/serialize";
import { COMP_LABEL } from "@/lib/types";

export const GET = route({ auth: true }, async ({ req, user }) => {
  const box = query(req).box === "sent" ? "sent" : "received";
  const rows = await (await col("invitations")).find(box === "sent" ? { fromId: user._id } : { toId: user._id }).sort({ createdAt: -1 }).limit(100).toArray();
  const projects = await (await col("projects")).find({ _id: { $in: rows.map((r) => r.projectId) } }).toArray();
  const pm = new Map(projects.map((p) => [p._id.toString(), p]));
  const people = await memberViews(rows.map((r) => (box === "sent" ? r.toId : r.fromId)));
  return {
    items: rows.map((r) => {
      const p = pm.get(r.projectId.toString());
      return { ...ser(r), project: p ? { id: p._id.toString(), title: p.title, summary: p.summary, goal: p.goal, compensation: p.compensation.map((c) => COMP_LABEL[c]), status: p.status } : null, person: people[(box === "sent" ? r.toId : r.fromId).toString()] || null };
    }),
  };
});
