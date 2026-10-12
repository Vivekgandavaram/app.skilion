import { route, body } from "@/lib/api";
import { col } from "@/lib/db";
import { WorkSchema } from "@/lib/profile-schema";
import { clean } from "@/lib/schemas";
import { normSkill } from "@/lib/skills";
import { syncEvidence } from "@/lib/profile-sync";
import { ser } from "@/lib/serialize";



export const GET = route({ auth: true }, async ({ user }) => ({ items: ser(await (await col("works")).find({ userId: user._id }).sort({ createdAt: -1 }).limit(100).toArray()) }));
export const POST = route({ auth: true, rate: { key: "works", limit: 60, windowSec: 3600 } }, async ({ req, user }) => {
  const d = clean(await body(req, WorkSchema));
  const works = await col("works");
  const now = new Date();
  const r = await works.insertOne({ ...d, userId: user._id, createdAt: now, updatedAt: now } as any);
  await syncEvidence(user._id);
  return { ok: true, id: r.insertedId.toString() };
});
