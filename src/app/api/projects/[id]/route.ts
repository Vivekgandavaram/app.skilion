import { z } from "zod";
import { route, body } from "@/lib/api";
import { col } from "@/lib/db";
import { memberProject, ownerProject, logActivity } from "@/lib/project-access";
import { memberViews } from "@/lib/people";
import { ser } from "@/lib/serialize";
import { GOALS, COMPENSATION } from "@/lib/types";

export const GET = route<{ id: string }>({ auth: true }, async ({ user, params }) => {
  const p = await memberProject(params.id, user);
  const q = { projectId: p._id };
  const [milestones, tasks, checkins, decisions, activity, invites] = await Promise.all([
    (await col("milestones")).find(q).sort({ done: 1, due: 1, createdAt: 1 }).limit(100).toArray(),
    (await col("tasks")).find(q).sort({ createdAt: 1 }).limit(300).toArray(),
    (await col("checkins")).find(q).sort({ createdAt: -1 }).limit(30).toArray(),
    (await col("decisions")).find(q).sort({ createdAt: -1 }).limit(30).toArray(),
    (await col("activity")).find(q).sort({ createdAt: -1 }).limit(30).toArray(),
    p.ownerId.equals(user._id) ? (await col("invitations")).find({ projectId: p._id, status: "pending" }).toArray() : Promise.resolve([]),
  ]);
  const people = await memberViews([...p.members.map((m) => m.userId), ...checkins.map((c) => c.userId), ...decisions.map((d) => d.userId), ...activity.map((a) => a.userId)]);
  return ser({
    project: { _id: p._id, title: p.title, summary: p.summary, goal: p.goal, status: p.status, compensation: p.compensation, objectives: p.objectives, links: p.links, openRoles: p.openRoles, convId: p.convId, showcase: p.showcase, ownerId: p.ownerId, createdAt: p.createdAt },
    isOwner: p.ownerId.equals(user._id), meId: user._id,
    members: p.members.filter((m) => m.status === "active").map((m) => ({ ...m, person: people[m.userId.toString()] })),
    milestones, tasks, checkins: checkins.map((c) => ({ ...c, person: people[c.userId.toString()] })), decisions: decisions.map((d) => ({ ...d, person: people[d.userId.toString()] })),
    activity: activity.map((a) => ({ ...a, person: people[a.userId.toString()] })), pendingInvites: invites.length,
    hoursThisWeek: (await (await col("checkins")).aggregate([{ $match: { ...q, createdAt: { $gt: new Date(Date.now() - 7 * 86400_000) } } }, { $group: { _id: null, h: { $sum: "$hours" } } }]).toArray())[0]?.h || 0,
  });
});

export const PATCH = route<{ id: string }>({ auth: true, rate: { key: "proj-edit", limit: 200, windowSec: 3600 } }, async ({ req, user, params }) => {
  const p = await ownerProject(params.id, user);
  const d = await body(req, z.object({
    title: z.string().trim().min(3).max(100).optional(), summary: z.string().trim().min(10).max(600).optional(), goal: z.enum(GOALS).optional(),
    status: z.enum(["recruiting", "active", "completed", "archived"]).optional(), compensation: z.array(z.enum(COMPENSATION)).min(1).max(5).optional(),
    objectives: z.array(z.string().trim().min(1).max(160)).max(10).optional(),
    links: z.array(z.object({ title: z.string().trim().min(1).max(60), url: z.string().url().max(300).refine((u) => u.startsWith("https://"), "Use https links") })).max(15).optional(),
  }));
  const set: any = { ...d, updatedAt: new Date() };
  if (d.status === "archived") set["showcase.enabled"] = false;
  await (await col("projects")).updateOne({ _id: p._id }, { $set: set });
  if (d.status && d.status !== p.status) await logActivity(p._id, user._id, "status", `set the project to ${d.status}`);
  return { ok: true };
});
