import { z } from "zod";
import { route, body, notFound } from "@/lib/api";
import { col, oid } from "@/lib/db";

/** Toggle like or save. Idempotent through the unique (post,user,kind) index. */
export const POST = route<{ id: string }>({ auth: true, rate: { key: "react", limit: 300, windowSec: 3600 } }, async ({ req, user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const { kind } = await body(req, z.object({ kind: z.enum(["like", "save"]) }));
  const posts = await col("posts");
  const p = await posts.findOne({ _id: id, deleted: { $ne: true } });
  if (!p) throw notFound();
  const rx = await col("reactions");
  const field = kind === "like" ? "counts.likes" : "counts.saves";
  const del = await rx.deleteOne({ postId: id, userId: user._id, kind });
  if (del.deletedCount) { await posts.updateOne({ _id: id }, { $inc: { [field]: -1 } }); return { ok: true, on: false }; }
  try { await rx.insertOne({ postId: id, userId: user._id, kind, createdAt: new Date() } as any); await posts.updateOne({ _id: id }, { $inc: { [field]: 1 } }); }
  catch { /* concurrent duplicate: already on */ }
  return { ok: true, on: true };
});
