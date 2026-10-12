import { z } from "zod";
import { route, body, query, HttpError, bad } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { slugOf, normSkill } from "@/lib/skills";
import { pairKey, isBlocked } from "@/lib/relations";
import { notify } from "@/lib/notify";
import { ser } from "@/lib/serialize";

export const GET = route({}, async ({ req }) => {
  const uid = oid(query(req).userId); if (!uid) throw bad("userId required");
  const rows = await (await col("endorsements")).find({ toId: uid }).sort({ createdAt: -1 }).limit(50).toArray();
  const users = await col("users");
  const from = await users.find({ _id: { $in: rows.map((r) => r.fromId) } }, { projection: { name: 1, handle: 1, image: 1 } }).toArray();
  return { items: rows.map((r) => ({ ...ser(r), from: ser(from.find((u) => u._id.equals(r.fromId)) || null) })) };
});

export const POST = route({ auth: true, verified: true, rate: { key: "endorse", limit: 20, windowSec: 86400 } }, async ({ req, user }) => {
  const d = await body(req, z.object({ toId: z.string(), skill: z.string().trim().min(1).max(40), text: z.string().trim().min(10, "Write at least 10 characters").max(300) }));
  const toId = oid(d.toId); if (!toId) throw bad("Unknown person");
  if (toId.equals(user._id)) throw new HttpError(400, "You cannot endorse yourself.");
  if (await isBlocked(user._id, toId)) throw new HttpError(403, "You cannot endorse this person.");
  const bonded = await (await col("bonds")).findOne({ pair: pairKey(user._id, toId), status: "accepted" });
  const shared = await (await col("projects")).findOne({ $and: [{ members: { $elemMatch: { userId: user._id, status: "active" } } }, { members: { $elemMatch: { userId: toId, status: "active" } } }] });
  if (!bonded && !shared) throw new HttpError(403, "You can endorse people you are bonded with or have worked with.");
  const users = await col("users");
  const target = await users.findOne({ _id: toId });
  if (!target) throw bad("Unknown person");
  const skill = normSkill(d.skill);
  if (!target.skills.some((s) => s.slug === slugOf(d.skill))) throw new HttpError(400, "That skill is not on their profile.");
  try { await (await col("endorsements")).insertOne({ fromId: user._id, toId, skill: skill.name, text: d.text, createdAt: new Date() } as any); } catch { throw new HttpError(409, "You already endorsed this skill for them."); }
  if (!target.verifications.some((v) => v.type === "endorsement")) await users.updateOne({ _id: toId }, { $push: { verifications: { type: "endorsement", at: new Date(), detail: "Endorsed by a member" } } } as any);
  await notify(toId, "system", `${user.name} endorsed your ${skill.name}`, d.text, `/u/${target.handle}`);
  return { ok: true };
});

export const DELETE = route({ auth: true }, async ({ req, user }) => {
  const id = oid((await body(req, z.object({ id: z.string() }))).id); if (!id) throw bad("Unknown endorsement");
  await (await col("endorsements")).deleteOne({ _id: id, fromId: user._id });
  return { ok: true };
});
