import { route, query } from "@/lib/api";
import { col } from "@/lib/db";
import { ser } from "@/lib/serialize";
import type { ReportDoc } from "@/lib/types";
import { ObjectId } from "mongodb";

export const GET = route({ auth: "mod" }, async ({ req }) => {
  const status = query(req).status || "open";
  const rows = (await (await col("reports")).find(status === "all" ? {} : { status: status as any }).sort({ status: 1, createdAt: -1 }).limit(100).toArray()) as ReportDoc[];
  const sev: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  rows.sort((a, b) => (sev[a.severity] ?? 9) - (sev[b.severity] ?? 9) || +b.createdAt - +a.createdAt);
  const users = await col("users");
  const reporters = await users.find({ _id: { $in: rows.map((r) => r.reporterId) } }, { projection: { name: 1, handle: 1 } }).toArray();
  const items = await Promise.all(rows.map(async (r) => {
    let preview = "", subject: any = null;
    try {
      const id = new ObjectId(r.target.id);
      if (r.target.type === "user") { const u = await users.findOne({ _id: id }, { projection: { name: 1, handle: 1, status: 1, headline: 1 } }); subject = u && { name: u.name, handle: u.handle, status: u.status }; preview = u?.headline || ""; }
      if (r.target.type === "post") { const p = await (await col("posts")).findOne({ _id: id }); preview = p?.deleted ? "[deleted]" : p?.text.slice(0, 300) || "[missing]"; subject = p && { authorId: p.authorId.toString() }; }
      if (r.target.type === "comment") { const p = await (await col("comments")).findOne({ _id: id }); preview = p?.text.slice(0, 300) || "[missing]"; }
      if (r.target.type === "message") { const m = await (await col("messages")).findOne({ _id: id }); preview = m?.deleted ? "[deleted]" : m?.text.slice(0, 300) || "[missing]"; }
      if (r.target.type === "project") { const p = await (await col("projects")).findOne({ _id: id }); preview = p ? `${p.title}: ${p.summary}`.slice(0, 300) : "[missing]"; }
    } catch {}
    const rp = reporters.find((u) => u._id.equals(r.reporterId));
    return { ...ser(r), reporter: rp ? { name: rp.name, handle: rp.handle } : null, preview, subject };
  }));
  return { items };
});
