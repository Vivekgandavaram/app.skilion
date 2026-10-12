import { route, query } from "@/lib/api";
import { col } from "@/lib/db";
import { ser } from "@/lib/serialize";
export const GET = route({ auth: "mod" }, async ({ req }) => {
  const q = (query(req).q || "").trim().slice(0, 60);
  const posts = await (await col("posts")).find({ deleted: { $ne: true }, ...(q ? { text: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } } : {}) }).sort({ createdAt: -1 }).limit(50).toArray();
  const us = await (await col("users")).find({ _id: { $in: posts.map((p) => p.authorId) } }, { projection: { name: 1, handle: 1 } }).toArray();
  return { items: posts.map((p) => ({ ...ser({ _id: p._id, type: p.type, text: p.text.slice(0, 400), url: p.url, createdAt: p.createdAt, isDemo: p.isDemo }), author: us.find((u) => u._id.equals(p.authorId))?.name || "Former member" })) };
});
