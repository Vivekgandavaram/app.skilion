import { z } from "zod";
import { route, body, bad } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { pairKey } from "@/lib/relations";
import { memberViews } from "@/lib/people";

const S = z.object({ userId: z.string() });
export const GET = route({ auth: true }, async ({ user }) => {
  const rows = await (await col("blocks")).find({ blockerId: user._id }).limit(500).toArray();
  const people = await memberViews(rows.map((r) => r.blockedId));
  return { items: rows.map((r) => people[r.blockedId.toString()]).filter(Boolean) };
});
export const POST = route({ auth: true, rate: { key: "block", limit: 60, windowSec: 3600 } }, async ({ req, user }) => {
  const id = oid((await body(req, S)).userId); if (!id || id.equals(user._id)) throw bad("Unknown person");
  await (await col("blocks")).updateOne({ blockerId: user._id, blockedId: id }, { $setOnInsert: { createdAt: new Date() } }, { upsert: true });
  await (await col("bonds")).deleteOne({ pair: pairKey(user._id, id) });
  return { ok: true };
});
export const DELETE = route({ auth: true }, async ({ req, user }) => {
  const id = oid((await body(req, S)).userId); if (!id) throw bad("Unknown person");
  await (await col("blocks")).deleteOne({ blockerId: user._id, blockedId: id });
  return { ok: true };
});
