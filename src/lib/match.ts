import type { UserDoc } from "./types";
import { slugOf } from "./skills";
import { pairOverlapHours } from "./availability";

export type RoleNeed = { title: string; essentialSkills: string[]; optionalSkills: string[]; hoursPerWeek: number };

export type MatchResult = {
  score: number; // 0..100
  essentialCovered: string[];
  essentialMissing: string[];
  optionalCovered: string[];
  evidenced: string[]; // covered skills backed by project evidence
  overlapHours: number;
  reasons: string[]; // grounded in profile data only
};

const person = (u: UserDoc) => ({ id: u._id.toString(), name: u.name, timezone: u.timezone, slots: u.availability?.slots || [] });

/** Explainable score. Never uses protected attributes (age, gender, ethnicity, religion...). */
export function matchUser(role: RoleNeed, cand: UserDoc, owner?: UserDoc, workTitles: Record<string, string> = {}): MatchResult {
  const have = new Map(cand.skills.map((s) => [s.slug, s]));
  const ess = role.essentialSkills.map(slugOf);
  const opt = role.optionalSkills.map(slugOf);
  const essCov = ess.filter((s) => have.has(s));
  const optCov = opt.filter((s) => have.has(s));
  const evidenced = [...essCov, ...optCov].filter((s) => (have.get(s)?.evidenceWorkIds.length || 0) > 0);
  const overlapHours = owner ? pairOverlapHours(person(owner), person(cand)) : 0;

  const essScore = ess.length ? essCov.length / ess.length : 0.5;
  const optScore = opt.length ? optCov.length / opt.length : 0;
  const evidenceScore = essCov.length + optCov.length ? evidenced.length / (essCov.length + optCov.length) : 0;
  const hoursOk = cand.availability.hoursPerWeek >= role.hoursPerWeek ? 1 : cand.availability.hoursPerWeek / Math.max(1, role.hoursPerWeek);
  const availScore = cand.availability.status === "open" ? 1 : cand.availability.status === "busy" ? 0.5 : 0;
  const overlapScore = owner ? Math.min(1, overlapHours / 6) : 0.5;
  const trust = Math.min(1, cand.verifications.length / 3);

  const score = Math.round(100 * (0.42 * essScore + 0.08 * optScore + 0.18 * evidenceScore + 0.12 * hoursOk * availScore + 0.1 * overlapScore + 0.1 * trust));

  const reasons: string[] = [];
  const nm = (slug: string) => cand.skills.find((s) => s.slug === slug)?.name || slug;
  if (essCov.length) reasons.push(`Lists ${essCov.map(nm).join(", ")}${evidenced.length ? `; ${evidenced.length} backed by project evidence` : " (self-claimed, no project evidence yet)"}.`);
  for (const s of evidenced.slice(0, 2)) {
    const wid = have.get(s)?.evidenceWorkIds[0];
    if (wid && workTitles[wid]) reasons.push(`${nm(s)} is shown in "${workTitles[wid]}".`);
  }
  if (cand.availability.status === "open") reasons.push(`Open to build, about ${cand.availability.hoursPerWeek} h/week${cand.availability.hoursPerWeek >= role.hoursPerWeek ? "" : ` (role needs ${role.hoursPerWeek})`}.`);
  if (owner && overlapHours > 0) reasons.push(`${overlapHours} overlapping hours per week with you.`);
  if (cand.dayJob) reasons.push("Builds around a day job, so expect evenings and weekends.");
  return { score, essentialCovered: essCov, essentialMissing: ess.filter((s) => !have.has(s)), optionalCovered: optCov, evidenced, overlapHours, reasons };
}

/** Skill coverage for a set of members against roles (used by the Squad Cart). */
export function coverage(essential: string[], optional: string[], members: UserDoc[]) {
  const all = new Set(members.flatMap((m) => m.skills.map((s) => s.slug)));
  const ev = new Set(members.flatMap((m) => m.skills.filter((s) => s.evidenceWorkIds.length).map((s) => s.slug)));
  const e = [...new Set(essential.map(slugOf))], o = [...new Set(optional.map(slugOf))];
  return {
    essential: e.map((s) => ({ skill: s, covered: all.has(s), evidenced: ev.has(s) })),
    optional: o.map((s) => ({ skill: s, covered: all.has(s), evidenced: ev.has(s) })),
  };
}
