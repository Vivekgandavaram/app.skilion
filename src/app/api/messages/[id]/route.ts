import { route, notFound } from "@/lib/api";
import { col, oid } from "@/lib/db";
export const DELETE = route<{ id: string }>({ auth: true }, async ({ user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const r = await (await col("messages")).updateOne({ _id: id, senderId: user._id }, { $set: { deleted: true, text: "", links: [] } });
  if (!r.matchedCount) throw notFound();
  return { ok: true };
});
