import { z } from "zod";
import { route, body } from "@/lib/api";
import { col, oid } from "@/lib/db";

const Schema = z.object({
  target: z.object({ type: z.enum(["user", "post", "message", "project", "comment"]), id: z.string().min(1).max(40) }),
  reason: z.string().min(2).max(120),
  details: z.string().max(1000).optional(),
});
const URGENT = /(threat|stalk|harass|phish|malware|scam|credential)/i;

export const POST = route({ auth: true, rate: { key: "report", limit: 20, windowSec: 3600 } }, async ({ req, user }) => {
  const d = await body(req, Schema);
  const reports = await col("reports");
  const dup = await reports.findOne({ reporterId: user._id, "target.type": d.target.type, "target.id": d.target.id, status: "open" });
  if (dup) return { ok: true, duplicate: true };
  const severity = URGENT.test(d.reason) ? "high" : "medium";
  await reports.insertOne({ reporterId: user._id, target: d.target, reason: d.reason, details: d.details, severity, status: "open", createdAt: new Date() } as any);
  return { ok: true };
});
