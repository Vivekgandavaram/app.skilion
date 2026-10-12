import { route, notFound } from "@/lib/api";
import { col, oid } from "@/lib/db";
export const PATCH = route<{ id: string }>({ auth: true }, async ({ user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  await (await col("notifications")).updateOne({ _id: id, userId: user._id }, { $set: { read: true } });
  return { ok: true };
});
