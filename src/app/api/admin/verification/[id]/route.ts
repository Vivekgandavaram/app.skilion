import { z } from "zod";
import { route, body, notFound } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { logAudit } from "@/lib/admin-audit";
import { notify } from "@/lib/notify";

export const PATCH = route<{ id: string }>({ auth: "mod" }, async ({ req, user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const d = await body(req, z.object({ decision: z.enum(["approved", "rejected"]), note: z.string().trim().max(300).optional() }));
  const c = await col("verificationRequests");
  const r = await c.findOne({ _id: id, status: "pending" }); if (!r) throw notFound();
  await c.updateOne({ _id: id }, { $set: { status: d.decision, note: d.note, decidedBy: user._id, decidedAt: new Date() } });
  if (d.decision === "approved") await (await col("users")).updateOne({ _id: r.userId }, { $push: { verifications: { type: r.type === "identity" ? "identity" : "repo", at: new Date(), detail: `Reviewed by Skilion` } } } as any);
  await notify(r.userId, "system", d.decision === "approved" ? "Your identity check was approved" : "Your verification request was not approved", d.note, "/settings/proof-of-work");
  await logAudit(user._id, `verification.${d.decision}`, params.id);
  return { ok: true };
});
