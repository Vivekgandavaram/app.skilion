import { z } from "zod";
import { route, body, notFound, HttpError } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { ensureSquadRoom, addToSquadRoom } from "@/lib/relations";
import { notify } from "@/lib/notify";
import { logActivity, activeMembers } from "@/lib/project-access";
import { effectivePlan } from "@/lib/plans";
import type { InvitationDoc, ProjectDoc, UserDoc } from "@/lib/types";

export const PATCH = route<{ id: string }>({ auth: true, rate: { key: "invite-act", limit: 120, windowSec: 3600 } }, async ({ req, user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const { action } = await body(req, z.object({ action: z.enum(["accept", "decline", "cancel"]) }));
  const invites = await col("invitations");
  const inv = (await invites.findOne({ _id: id })) as InvitationDoc | null;
  if (!inv) throw notFound();
  if (inv.status !== "pending") throw new HttpError(409, `This invitation was already ${inv.status}.`);
  const projects = await col("projects");
  const p = (await projects.findOne({ _id: inv.projectId })) as ProjectDoc | null;
  const now = new Date();
  if (action === "cancel") {
    if (!inv.fromId.equals(user._id)) throw notFound();
    await invites.updateOne({ _id: id }, { $set: { status: "cancelled", respondedAt: now } });
    return { ok: true, status: "cancelled" };
  }
  if (!inv.toId.equals(user._id)) throw notFound();
  if (!p || p.status === "archived") { await invites.updateOne({ _id: id }, { $set: { status: "cancelled", respondedAt: now } }); throw new HttpError(410, "This project is no longer active."); }
  if (action === "decline") {
    await invites.updateOne({ _id: id }, { $set: { status: "declined", respondedAt: now } });
    await notify(inv.fromId, "invite", `${user.name} declined your invitation to “${p.title}”`, undefined, `/projects/${p._id}`, { email: false });
    return { ok: true, status: "declined" };
  }
  const owner = (await (await col("users")).findOne({ _id: p.ownerId })) as UserDoc | null;
  const cap = owner ? effectivePlan(owner).limits.workspaceMembers : 5;
  if (activeMembers(p).length >= cap) throw new HttpError(409, `This team already has ${cap} members, the limit of the owner's plan.`);
  const had = p.members.find((m) => m.userId.equals(user._id));
  if (had) await projects.updateOne({ _id: p._id, "members.userId": user._id }, { $set: { "members.$.status": "active", "members.$.roleTitle": inv.roleTitle, "members.$.hoursPerWeek": inv.hoursPerWeek, updatedAt: now } });
  else await projects.updateOne({ _id: p._id }, { $push: { members: { userId: user._id, roleTitle: inv.roleTitle, hoursPerWeek: inv.hoursPerWeek, status: "active", joinedAt: now, contributionConsent: false } }, $set: { updatedAt: now } } as any);
  await invites.updateOne({ _id: id }, { $set: { status: "accepted", respondedAt: now } });
  const members = [...activeMembers(p).map((m) => m.userId), ...(had ? [] : [user._id])];
  if (p.convId) await addToSquadRoom(p._id, user._id);
  else { const conv = await ensureSquadRoom(p._id, p.title, members); await projects.updateOne({ _id: p._id }, { $set: { convId: conv._id } }); }
  await logActivity(p._id, user._id, "member", `joined as ${inv.roleTitle}`);
  await notify(inv.fromId, "invite", `${user.name} joined “${p.title}”`, `Role: ${inv.roleTitle}`, `/projects/${p._id}`);
  return { ok: true, status: "accepted", projectId: p._id.toString() };
});
