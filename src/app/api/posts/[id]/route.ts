import { z } from "zod";
import { route, body, notFound, forbidden } from "@/lib/api";
import { col, oid } from "@/lib/db";

export const PATCH = route<{ id: string }>({ auth: true }, async ({ req, user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const d = await body(req, z.object({ text: z.string().trim().min(3).max(2000) }));
  const r = await (await col("posts")).updateOne({ _id: id, authorId: user._id, deleted: { $ne: true } }, { $set: { text: d.text } });
  if (!r.matchedCount) throw notFound();
  return { ok: true };
});
export const DELETE = route<{ id: string }>({ auth: true }, async ({ user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const posts = await col("posts");
  const p = await posts.findOne({ _id: id });
  if (!p || p.deleted) throw notFound();
  if (!p.authorId.equals(user._id) && user.role === "user") throw forbidden();
  await posts.updateOne({ _id: id }, { $set: { deleted: true } });
  if (!p.authorId.equals(user._id)) await (await col("audit")).insertOne({ actorId: user._id, action: "post.remove", target: params.id, createdAt: new Date() } as any);
  return { ok: true };
});
