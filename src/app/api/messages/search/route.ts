import { route, query, bad } from "@/lib/api";
import { col } from "@/lib/db";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const GET = route({ auth: true, rate: { key: "msg-search", limit: 60, windowSec: 300 } }, async ({ req, user }) => {
  const q = (query(req).q || "").trim();
  if (q.length < 2) throw bad("Type at least 2 characters.");
  const convs = await (await col("conversations")).find({ memberIds: user._id }, { projection: { _id: 1, kind: 1, title: 1, memberIds: 1 } }).limit(300).toArray();
  const rows = await (await col("messages")).find({ convId: { $in: convs.map((c) => c._id) }, deleted: { $ne: true }, text: { $regex: esc(q).slice(0, 80), $options: "i" } }).sort({ _id: -1 }).limit(30).toArray();
  return { items: rows.map((m) => ({ id: m._id.toString(), convId: m.convId.toString(), text: m.text.slice(0, 200), createdAt: m.createdAt.toISOString(), mine: m.senderId.equals(user._id) })) };
});
