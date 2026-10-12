import { route, notFound } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { logAudit } from "@/lib/admin-audit";
export const PATCH = route<{ id: string }>({ auth: "mod" }, async ({ user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  await (await col("appeals")).updateOne({ _id: id }, { $set: { status: "closed" } });
  await logAudit(user._id, "appeal.close", params.id);
  return { ok: true };
});
