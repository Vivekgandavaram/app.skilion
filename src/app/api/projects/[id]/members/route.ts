import { z } from "zod";
import { route, body, bad, HttpError } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { memberProject, logActivity } from "@/lib/project-access";
import { removeFromSquadRoom } from "@/lib/relations";
import { notify } from "@/lib/notify";

/** PATCH: my own consent to be listed on the showcase. DELETE: leave (self) or remove someone (owner). */
export const PATCH = route<{ id: string }>({ auth: true }, async ({ req, user, params }) => {
  const p = await memberProject(params.id, user);
  const d = await body(req, z.object({ contributionConsent: z.boolean() }));
  await (await col("projects")).updateOne({ _id: p._id, "members.userId": user._id }, { $set: { "members.$.contributionConsent": d.contributionConsent } });
  return { ok: true };
});
export const DELETE = route<{ id: string }>({ auth: true }, async ({ req, user, params }) => {
  const p = await memberProject(params.id, user);
  const d = await body(req, z.object({ userId: z.string().optional() }));
  const target = d.userId ? oid(d.userId) : user._id; if (!target) throw bad("Unknown member");
  const self = target.equals(user._id);
  if (!self && !p.ownerId.equals(user._id)) throw new HttpError(403, "Only the owner can remove members.");
  if (p.ownerId.equals(target)) throw new HttpError(400, "The owner cannot leave. Archive the project or hand it over first.");
  await (await col("projects")).updateOne({ _id: p._id, "members.userId": target }, { $set: { "members.$.status": "left", "members.$.contributionConsent": false, updatedAt: new Date() } });
  await (await col("tasks")).updateMany({ projectId: p._id, assigneeId: target }, { $unset: { assigneeId: "" } });
  await removeFromSquadRoom(p._id, target);
  await logActivity(p._id, user._id, "member", self ? "left the project" : "removed a member");
  if (!self) await notify(target, "project", `You were removed from “${p.title}”`, undefined, "/projects", { email: false });
  return { ok: true };
});
