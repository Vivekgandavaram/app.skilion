import { z } from "zod";
import { ObjectId } from "mongodb";
import { route, body, notFound, HttpError } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { logAudit } from "@/lib/admin-audit";
import { notify } from "@/lib/notify";
import type { ReportDoc } from "@/lib/types";

export const PATCH = route<{ id: string }>({ auth: "mod" }, async ({ req, user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const d = await body(req, z.object({ action: z.enum(["dismiss", "warn", "remove_content", "suspend_user"]), resolution: z.string().trim().min(3, "Write a short reason").max(500) }));
  const reports = await col("reports");
  const r = (await reports.findOne({ _id: id })) as ReportDoc | null; if (!r) throw notFound();
  const tid = new ObjectId(r.target.id);
  let ownerId: ObjectId | null = null;
  if (r.target.type === "user") ownerId = tid;
  if (r.target.type === "post") ownerId = (await (await col("posts")).findOne({ _id: tid }))?.authorId || null;
  if (r.target.type === "comment") ownerId = (await (await col("comments")).findOne({ _id: tid }))?.userId || null;
  if (r.target.type === "message") ownerId = (await (await col("messages")).findOne({ _id: tid }))?.senderId || null;
  if (r.target.type === "project") ownerId = (await (await col("projects")).findOne({ _id: tid }))?.ownerId || null;
  if (d.action === "remove_content") {
    if (r.target.type === "post") await (await col("posts")).updateOne({ _id: tid }, { $set: { deleted: true } });
    else if (r.target.type === "comment") await (await col("comments")).deleteOne({ _id: tid });
    else if (r.target.type === "message") await (await col("messages")).updateOne({ _id: tid }, { $set: { deleted: true, text: "" } });
    else if (r.target.type === "project") await (await col("projects")).updateOne({ _id: tid }, { $set: { "showcase.enabled": false, status: "archived" } });
    else throw new HttpError(400, "Nothing to remove for a profile. Suspend the account instead.");
  }
  if (d.action === "suspend_user") {
    if (user.role !== "admin") throw new HttpError(403, "Only admins can suspend accounts.");
    if (!ownerId) throw new HttpError(400, "No account to suspend.");
    if (ownerId.equals(user._id)) throw new HttpError(400, "You cannot suspend yourself.");
    await (await col("users")).updateOne({ _id: ownerId }, { $set: { status: "suspended" } });
  }
  if (d.action === "warn" && ownerId) await notify(ownerId, "system", "A moderator reviewed a report about your content", d.resolution, "/guidelines");
  await reports.updateOne({ _id: id }, { $set: { status: d.action === "dismiss" ? "dismissed" : "actioned", resolution: `${d.action}: ${d.resolution}`, resolvedBy: user._id, resolvedAt: new Date() } });
  await logAudit(user._id, `report.${d.action}`, params.id, { target: r.target });
  return { ok: true };
});
