import { subdomainsOf } from "@/data/taxonomy";
import { route, body } from "@/lib/api";
import { col } from "@/lib/db";
import { ProfileSchema } from "@/lib/profile-schema";
import { toSkills, syncEvidence } from "@/lib/profile-sync";
import { selfView } from "@/lib/serialize";
import type { UserDoc } from "@/lib/types";

export const PUT = route({ auth: true, rate: { key: "profile", limit: 120, windowSec: 3600 } }, async ({ req, user }) => {
  const d = await body(req, ProfileSchema);
  const set: Record<string, unknown> = { updatedAt: new Date() };
  const simple = ["name", "headline", "bio", "location", "timezone", "dayJob", "goals", "compensation", "intents", "aiOptOut", "image"] as const;
  for (const k of simple) if (d[k] !== undefined) set[k] = d[k];
  if (d.domain !== undefined) set.domain = d.domain || undefined;
  if (d.domain !== undefined || d.subdomain !== undefined) set.subdomain = d.domain && d.subdomain && subdomainsOf(d.domain).includes(d.subdomain) ? d.subdomain : undefined;
  if (d.skills) set.skills = toSkills(d.skills, user.skills);
  if (d.availability) set.availability = { ...d.availability, slots: [...new Set(d.availability.slots)].sort((a, b) => a - b) };
  if (d.rate !== undefined) set.rate = d.rate || undefined;
  if (d.links) set.links = Object.fromEntries(Object.entries(d.links).filter(([, v]) => !!v));
  if (d.visibility) set.visibility = d.visibility;
  if (d.notifyPrefs) {
    const n = d.notifyPrefs; set.notifyPrefs = { email: n.email, bonds: n.bonds, messages: n.messages, squads: n.squads, ...(n.quietStart != null && n.quietEnd != null ? { quietStart: n.quietStart, quietEnd: n.quietEnd } : {}) };
  }
  const users = await col("users");
  await users.updateOne({ _id: user._id }, { $set: set });
  if (d.skills) await syncEvidence(user._id);
  const fresh = (await users.findOne({ _id: user._id })) as UserDoc;
  const onboarded = fresh.intents.length > 0 && fresh.skills.length > 0;
  if (onboarded !== fresh.onboarded) await users.updateOne({ _id: user._id }, { $set: { onboarded } });
  return { ok: true, user: selfView({ ...fresh, onboarded }) };
});
