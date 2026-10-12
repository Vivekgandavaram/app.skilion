import { route } from "@/lib/api";
import { col } from "@/lib/db";
export const GET = route({ auth: "mod" }, async () => {
  const rows = await (await col("verificationRequests")).find({ status: "pending" }).sort({ createdAt: 1 }).limit(100).toArray();
  const us = await (await col("users")).find({ _id: { $in: rows.map((r) => r.userId) } }, { projection: { name: 1, handle: 1, email: 1, links: 1 } }).toArray();
  return { items: rows.map((r) => { const u = us.find((x) => x._id.equals(r.userId)); return { id: r._id.toString(), type: r.type, evidence: r.evidence, createdAt: r.createdAt.toISOString(), user: u && { name: u.name, handle: u.handle, email: u.email, links: u.links } }; }) };
});
