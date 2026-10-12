import { route, body, notFound } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { WorkSchema } from "@/lib/profile-schema";
import { syncEvidence } from "@/lib/profile-sync";
import { clean } from "@/lib/schemas";

export const PUT = route<{ id: string }>({ auth: true }, async ({ req, user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const d = clean(await body(req, WorkSchema));
  const r = await (await col("works")).updateOne({ _id: id, userId: user._id }, { $set: { ...d, repoVerified: false, updatedAt: new Date() } });
  if (!r.matchedCount) throw notFound();
  await syncEvidence(user._id);
  return { ok: true };
});
export const DELETE = route<{ id: string }>({ auth: true }, async ({ user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const r = await (await col("works")).deleteOne({ _id: id, userId: user._id });
  if (!r.deletedCount) throw notFound();
  await syncEvidence(user._id);
  return { ok: true };
});
