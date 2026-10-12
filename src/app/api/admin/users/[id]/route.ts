import { z } from "zod";
import { route, body, notFound, HttpError } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { logAudit } from "@/lib/admin-audit";
import { PLANS } from "@/lib/plans";

/** Moderators can suspend/unsuspend. Role changes and plan grants are admin-only. Every action is audited. */
export const PATCH = route<{ id: string }>({ auth: "mod" }, async ({ req, user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const d = await body(req, z.object({ action: z.enum(["suspend", "unsuspend", "set_role", "grant_plan", "verify_email"]), role: z.enum(["user", "moderator", "admin"]).optional(), plan: z.enum(["free", "builder_pro", "founder_pro", "squad_workspace"]).optional(), days: z.number().int().min(1).max(366).optional(), reason: z.string().trim().min(3).max(300) }));
  const users = await col("users");
  const t = await users.findOne({ _id: id }); if (!t) throw notFound();
  if (id.equals(user._id) && d.action !== "grant_plan") throw new HttpError(400, "Use another admin account for changes to your own account.");
  if (["set_role", "grant_plan", "verify_email"].includes(d.action) && user.role !== "admin") throw new HttpError(403, "Admins only.");
  if (d.action === "suspend") { if (t.role === "admin") throw new HttpError(403, "Admins cannot be suspended here."); await users.updateOne({ _id: id }, { $set: { status: "suspended" } }); }
  if (d.action === "unsuspend") await users.updateOne({ _id: id }, { $set: { status: "active" } });
  if (d.action === "set_role") { if (!d.role) throw new HttpError(400, "Choose a role."); await users.updateOne({ _id: id }, { $set: { role: d.role } }); }
  if (d.action === "grant_plan") { if (!d.plan) throw new HttpError(400, "Choose a plan."); await users.updateOne({ _id: id }, { $set: { plan: d.plan === "free" ? { id: "free" } : { id: d.plan, interval: "month", expiresAt: new Date(Date.now() + (d.days || 30) * 86400_000) } } }); }
  if (d.action === "verify_email") await users.updateOne({ _id: id }, { $set: { emailVerified: true } });
  await logAudit(user._id, `user.${d.action}`, params.id, { reason: d.reason, role: d.role, plan: d.plan && PLANS[d.plan].name });
  return { ok: true };
});
