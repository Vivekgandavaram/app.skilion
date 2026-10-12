import { z } from "zod";
import { route, body, bad, notFound } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { memberProject, logActivity } from "@/lib/project-access";

const Create = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("milestone"), title: z.string().trim().min(2).max(120), due: z.string().optional() }),
  z.object({ kind: z.literal("task"), title: z.string().trim().min(2).max(160), milestoneId: z.string().optional(), assigneeId: z.string().optional(), due: z.string().optional() }),
  z.object({ kind: z.literal("checkin"), text: z.string().trim().min(3).max(600), hours: z.number().min(0).max(80) }),
  z.object({ kind: z.literal("decision"), text: z.string().trim().min(3).max(600) }),
]);
const date = (s?: string) => { if (!s) return undefined; const d = new Date(s); return isNaN(+d) ? undefined : d; };

export const POST = route<{ id: string }>({ auth: true, rate: { key: "proj-item", limit: 400, windowSec: 3600 } }, async ({ req, user, params }) => {
  const p = await memberProject(params.id, user);
  const d = await body(req, Create); const now = new Date();
  if (d.kind === "milestone") { await (await col("milestones")).insertOne({ projectId: p._id, title: d.title, due: date(d.due), done: false, createdAt: now } as any); await logActivity(p._id, user._id, "milestone", `added milestone “${d.title}”`); }
  if (d.kind === "task") {
    const a = d.assigneeId ? oid(d.assigneeId) : undefined;
    if (a && !p.members.some((m) => m.userId.equals(a) && m.status === "active")) throw bad("Assignee is not on this project.");
    await (await col("tasks")).insertOne({ projectId: p._id, title: d.title, milestoneId: d.milestoneId ? oid(d.milestoneId) || undefined : undefined, assigneeId: a || undefined, due: date(d.due), status: "todo", createdAt: now, updatedAt: now } as any);
  }
  if (d.kind === "checkin") { await (await col("checkins")).insertOne({ projectId: p._id, userId: user._id, text: d.text, hours: d.hours, createdAt: now } as any); await logActivity(p._id, user._id, "checkin", `checked in (${d.hours} h)`); }
  if (d.kind === "decision") { await (await col("decisions")).insertOne({ projectId: p._id, userId: user._id, text: d.text, createdAt: now } as any); await logActivity(p._id, user._id, "decision", "logged a decision"); }
  await (await col("projects")).updateOne({ _id: p._id }, { $set: { updatedAt: now } });
  return { ok: true };
});

const Upd = z.object({ kind: z.enum(["milestone", "task"]), id: z.string(), done: z.boolean().optional(), status: z.enum(["todo", "doing", "done"]).optional(), assigneeId: z.string().nullable().optional(), title: z.string().trim().min(2).max(160).optional() });
export const PATCH = route<{ id: string }>({ auth: true, rate: { key: "proj-item", limit: 600, windowSec: 3600 } }, async ({ req, user, params }) => {
  const p = await memberProject(params.id, user);
  const d = await body(req, Upd); const id = oid(d.id); if (!id) throw notFound();
  if (d.kind === "milestone") {
    const r = await (await col("milestones")).updateOne({ _id: id, projectId: p._id }, { $set: { ...(d.done !== undefined ? { done: d.done } : {}), ...(d.title ? { title: d.title } : {}) } });
    if (!r.matchedCount) throw notFound();
    if (d.done) await logActivity(p._id, user._id, "milestone", "completed a milestone");
  } else {
    const set: any = { updatedAt: new Date() };
    if (d.status) set.status = d.status; if (d.title) set.title = d.title;
    const unset: any = {};
    if (d.assigneeId === null) unset.assigneeId = ""; else if (d.assigneeId) { const a = oid(d.assigneeId); if (!a || !p.members.some((m) => m.userId.equals(a) && m.status === "active")) throw bad("Assignee is not on this project."); set.assigneeId = a; }
    const r = await (await col("tasks")).updateOne({ _id: id, projectId: p._id }, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) });
    if (!r.matchedCount) throw notFound();
    if (d.status === "done") await logActivity(p._id, user._id, "task", "finished a task");
  }
  return { ok: true };
});

export const DELETE = route<{ id: string }>({ auth: true }, async ({ req, user, params }) => {
  const p = await memberProject(params.id, user);
  const d = await body(req, z.object({ kind: z.enum(["milestone", "task", "decision"]), id: z.string() })); const id = oid(d.id); if (!id) throw notFound();
  const c = await col(d.kind === "milestone" ? "milestones" : d.kind === "task" ? "tasks" : "decisions");
  await c.deleteOne({ _id: id, projectId: p._id, ...(d.kind === "decision" && !p.ownerId.equals(user._id) ? { userId: user._id } : {}) } as any);
  if (d.kind === "milestone") await (await col("tasks")).updateMany({ milestoneId: id }, { $unset: { milestoneId: "" } });
  return { ok: true };
});
