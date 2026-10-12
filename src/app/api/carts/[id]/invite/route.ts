import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col, ObjectId } from "@/lib/db";
import { ownedCart } from "@/lib/carts";
import { notify } from "@/lib/notify";
import { logActivity } from "@/lib/project-access";
import { isBlocked } from "@/lib/relations";
import { COMPENSATION, GOALS, type ProjectDoc } from "@/lib/types";

/**
 * Turn a Squad Cart into a project and send invitations. Invitation (a role in a project) is separate from a Bond (a connection).
 * Invitees are told the rewards in plain words and decide for themselves.
 */
export const POST = route<{ id: string }>({ auth: true, verified: true, rate: { key: "invite", limit: 30, windowSec: 86400 } }, async ({ req, user, params }) => {
  const d = await body(req, z.object({
    title: z.string().trim().min(3).max(100), summary: z.string().trim().min(10).max(600), goal: z.enum(GOALS).optional(),
    compensation: z.array(z.enum(COMPENSATION)).min(1, "Say how people will be rewarded").max(5), message: z.string().trim().max(500).optional(), userIds: z.array(z.string()).max(12).optional(),
  }));
  const cart = await ownedCart(params.id, user._id);
  const targets = cart.items.filter((i) => !d.userIds || d.userIds.includes(i.userId.toString()));
  if (!targets.length) throw new HttpError(400, "Add at least one person to the cart first.");
  const projects = await col("projects"), invites = await col("invitations");
  const now = new Date();
  let project = cart.projectId ? ((await projects.findOne({ _id: cart.projectId })) as ProjectDoc | null) : null;
  if (!project) {
    const doc: any = {
      ownerId: user._id, title: d.title, summary: d.summary, goal: d.goal || cart.goal || "prototype", status: "recruiting", compensation: d.compensation,
      members: [{ userId: user._id, roleTitle: "Project lead", status: "active", joinedAt: now, contributionConsent: false }],
      openRoles: cart.roles.map((r) => ({ key: r.key, title: r.title, skills: r.essentialSkills, hoursPerWeek: r.hoursPerWeek })), objectives: [], links: [], blueprintId: cart.blueprintId,
      showcase: { enabled: false }, createdAt: now, updatedAt: now,
    };
    const r = await projects.insertOne(doc);
    project = { ...doc, _id: r.insertedId } as ProjectDoc;
    await (await col("carts")).updateOne({ _id: cart._id }, { $set: { projectId: project._id, updatedAt: now } });
    await logActivity(project._id, user._id, "project", "created the project from a Squad Cart");
  }
  if (!project.ownerId.equals(user._id)) throw new HttpError(403, "Only the project owner can invite.");
  let sent = 0, skipped: string[] = [];
  for (const it of targets) {
    const uid = it.userId;
    if (project.members.some((m) => m.userId.equals(uid) && m.status === "active")) { skipped.push("already a member"); continue; }
    if (await invites.findOne({ projectId: project._id, toId: uid, status: "pending" })) { skipped.push("already invited"); continue; }
    if (await isBlocked(user._id, uid)) { skipped.push("unavailable"); continue; }
    const role = cart.roles.find((r) => r.key === it.roleKey);
    await invites.insertOne({ projectId: project._id, cartId: cart._id, fromId: user._id, toId: uid, roleTitle: role?.title || "Contributor", hoursPerWeek: role?.hoursPerWeek, message: d.message, status: "pending", createdAt: now } as any);
    sent++;
    await notify(uid, "invite", `${user.name} invited you to “${project.title}”`, `Role: ${role?.title || "Contributor"}. Rewards: ${d.compensation.join(", ")}. You decide.`, "/team?tab=invitations");
  }
  if (!sent && skipped.length) throw new HttpError(409, `Nothing sent: ${skipped[0]}.`);
  return { ok: true, sent, projectId: project._id.toString() };
});
