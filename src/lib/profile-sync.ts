import { col, ObjectId } from "./db";
import { normSkill, dedupeSkills } from "./skills";
import type { Skill, UserDoc } from "./types";

/** Recompute which skills are supported by project evidence (skill slug appears in a work's tech list). */
export async function syncEvidence(userId: ObjectId) {
  const users = await col("users");
  const works = await col("works");
  const u = (await users.findOne({ _id: userId })) as UserDoc | null;
  if (!u) return;
  const ws = await works.find({ userId }).toArray();
  const bySlug = new Map<string, string[]>();
  for (const w of ws) for (const t of w.tech) { const s = normSkill(t).slug; bySlug.set(s, [...(bySlug.get(s) || []), w._id.toString()]); }
  const skills: Skill[] = u.skills.map((s) => ({ ...s, evidenceWorkIds: bySlug.get(s.slug) || [] }));
  await users.updateOne({ _id: userId }, { $set: { skills, updatedAt: new Date() } });
}

export function toSkills(names: string[], prev: Skill[] = []): Skill[] {
  const old = new Map(prev.map((s) => [s.slug, s]));
  return dedupeSkills(names.map((n) => { const k = normSkill(n); return { name: k.name, slug: k.slug, evidenceWorkIds: old.get(k.slug)?.evidenceWorkIds || [] }; })).slice(0, 30);
}
