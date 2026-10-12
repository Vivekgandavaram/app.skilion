import { z } from "zod";
import { route, body, query, notFound, HttpError } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { blockedIds } from "@/lib/relations";
import { ser } from "@/lib/serialize";
import { notify } from "@/lib/notify";
import { extractLinks } from "@/lib/messaging";

export const GET = route<{ id: string }>({}, async ({ req, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const viewer = await getSessionUser();
  if (!viewer) throw new HttpError(401, "Sign in to read comments.", "unauthenticated");
  const blocked = (await blockedIds(viewer._id)).map(String);
  const rows = await (await col("comments")).find({ postId: id }).sort({ createdAt: 1 }).limit(Number(query(req).limit) || 100).toArray();
  const users = await (await col("users")).find({ _id: { $in: rows.map((r) => r.userId) } }, { projection: { name: 1, handle: 1, image: 1 } }).toArray();
  const um = new Map(users.map((u) => [u._id.toString(), u]));
  return { items: rows.filter((r) => !blocked.includes(r.userId.toString())).map((r) => ({ ...ser(r), user: ser(um.get(r.userId.toString()) || { name: "Former member", handle: "" }), mine: r.userId.equals(viewer._id) })) };
});

export const POST = route<{ id: string }>({ auth: true, verified: true, rate: { key: "comment", limit: 60, windowSec: 3600 } }, async ({ req, user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const { text } = await body(req, z.object({ text: z.string().trim().min(1, "Write something").max(600) }));
  if (extractLinks(text).length > 1) throw new HttpError(400, "Comments can include at most one link.");
  const posts = await col("posts");
  const p = await posts.findOne({ _id: id, deleted: { $ne: true } });
  if (!p) throw notFound();
  const r = await (await col("comments")).insertOne({ postId: id, userId: user._id, text, createdAt: new Date() } as any);
  await posts.updateOne({ _id: id }, { $inc: { "counts.comments": 1 } });
  if (!p.authorId.equals(user._id)) await notify(p.authorId, "system", `${user.name} commented on your post`, text.slice(0, 120), "/discover", { email: false });
  return { ok: true, id: r.insertedId.toString() };
});
