import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";

export const GET = route({ auth: true }, async ({ user }) => {
  const rows = await (await col("verificationRequests")).find({ userId: user._id }).sort({ createdAt: -1 }).limit(20).toArray();
  return { items: rows.map((r) => ({ id: r._id.toString(), type: r.type, status: r.status, note: r.note, createdAt: r.createdAt.toISOString() })) };
});
export const POST = route({ auth: true, verified: true, rate: { key: "verif-req", limit: 5, windowSec: 86400 } }, async ({ req, user }) => {
  const d = await body(req, z.object({ type: z.enum(["identity", "repo"]), evidence: z.string().trim().min(10).max(1500) }));
  const c = await col("verificationRequests");
  if (await c.findOne({ userId: user._id, type: d.type, status: "pending" })) throw new HttpError(409, "You already have a pending request of this type.");
  await c.insertOne({ userId: user._id, type: d.type, evidence: d.evidence, status: "pending", createdAt: new Date() } as any);
  return { ok: true };
});
