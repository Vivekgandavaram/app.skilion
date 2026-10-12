import { route, notFound } from "@/lib/api";
import { col, oid } from "@/lib/db";

export const DELETE = route<{ id: string; cid: string }>({ auth: true }, async ({ user, params }) => {
  const id = oid(params.id), cid = oid(params.cid); if (!id || !cid) throw notFound();
  const comments = await col("comments");
  const c = await comments.findOne({ _id: cid, postId: id });
  if (!c) throw notFound();
  if (!c.userId.equals(user._id) && user.role === "user") throw notFound();
  await comments.deleteOne({ _id: cid });
  await (await col("posts")).updateOne({ _id: id, "counts.comments": { $gt: 0 } }, { $inc: { "counts.comments": -1 } });
  return { ok: true };
});
