import { route, query } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { ser } from "@/lib/serialize";

export const GET = route({ auth: true }, async ({ req, user }) => {
  const q = query(req);
  const cursor = oid(q.cursor);
  const limit = Math.min(Number(q.limit) || 30, 50);
  const rows = await (await col("notifications")).find({ userId: user._id, ...(cursor ? { _id: { $lt: cursor } } : {}) }).sort({ _id: -1 }).limit(limit + 1).toArray();
  const more = rows.length > limit;
  return { items: ser(rows.slice(0, limit)), nextCursor: more ? rows[limit - 1]._id.toString() : null };
});
