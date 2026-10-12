import { col } from "./db";
import type { ObjectId } from "./db";
import { discoverable } from "./people";
import { memberView } from "./serialize";
import { slugOf } from "./skills";
import { blockedIds } from "./relations";
import { subdomainsOf } from "@/data/taxonomy";
import { GOALS, COMPENSATION, DOMAINS, type UserDoc } from "./types";
import { parseSearchQuery } from "./gemini";

export type ExploreParams = {
  q?: string; skills?: string; domain?: string; sub?: string; goal?: string; comp?: string; availability?: string; minHours?: string;
  dayJob?: string; verified?: string; evidence?: string; sort?: string; cursor?: string; limit?: string; nl?: string;
};
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** People search. Members see every onboarded profile (field visibility respected). Public callers only see people who opted in to a public page. */
export async function searchPeople(p: ExploreParams, viewer: UserDoc | null, publicOnly: boolean) {
  const users = await col("users");
  const limit = Math.min(30, Math.max(1, Number(p.limit) || 12));
  const offset = Math.max(0, Number(p.cursor) || 0);
  const f: any = { ...discoverable(viewer?._id) };
  if (publicOnly) f["visibility.public"] = true;
  if (viewer) { const b = await blockedIds(viewer._id); if (b.length) f._id = { ...(f._id || {}), $nin: b }; }

  let skills = (p.skills || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8);
  let domain = p.domain && (DOMAINS as readonly string[]).includes(p.domain) ? p.domain : "";
  let q = (p.q || "").trim().slice(0, 120);
  let interpreted: { skills: string[]; domain?: string } | null = null;
  if (q && p.nl === "1" && viewer) {
    const parsed = await parseSearchQuery(q);
    if (parsed) {
      interpreted = { skills: parsed.skills, domain: parsed.domain };
      skills = [...new Set([...skills, ...parsed.skills])].slice(0, 8);
      if (!domain && parsed.domain && (DOMAINS as readonly string[]).includes(parsed.domain)) domain = parsed.domain;
      q = parsed.keywords.join(" ");
    }
  }
  if (skills.length) f["skills.slug"] = { $all: skills.map(slugOf) };
  if (domain) f.domain = domain;
  if (domain && p.sub && subdomainsOf(domain).includes(p.sub)) f.subdomain = p.sub;
  if (p.goal && (GOALS as readonly string[]).includes(p.goal)) f.goals = p.goal;
  if (p.comp && (COMPENSATION as readonly string[]).includes(p.comp)) f.compensation = p.comp;
  if (p.availability === "open") f["availability.status"] = "open";
  if (p.minHours && Number(p.minHours) > 0) f["availability.hoursPerWeek"] = { $gte: Math.min(60, Number(p.minHours)) };
  if (p.dayJob === "1") f.dayJob = true;
  if (p.verified && ["email", "github", "google", "repo", "endorsement", "identity"].includes(p.verified)) f["verifications.type"] = p.verified;
  if (p.evidence === "1") f["skills.evidenceWorkIds.0"] = { $exists: true };
  if (q) {
    // text index when possible; fall back to a safe prefix regex on name/handle for short queries
    if (q.length >= 3) f.$text = { $search: q };
    else f.$or = [{ name: { $regex: `^${esc(q)}`, $options: "i" } }, { handle: { $regex: `^${esc(q)}`, $options: "i" } }];
  }
  const cur = users.find(f, q && q.length >= 3 ? { projection: { passwordHash: 0, score: { $meta: "textScore" } } as any } : { projection: { passwordHash: 0 } });
  const rows = (await cur.limit(200).toArray()) as (UserDoc & { score?: number })[];
  const evCount = (u: UserDoc) => u.skills.filter((s) => s.evidenceWorkIds.length).length;
  const rank = (u: UserDoc & { score?: number }) => (u.score || 0) * 3 + evCount(u) * 1.2 + u.verifications.length * 0.8 + (u.availability.status === "open" ? 2 : 0);
  const sort = p.sort === "recent" ? "recent" : "relevance";
  rows.sort(sort === "recent" ? (a, b) => +b.createdAt - +a.createdAt : (a, b) => rank(b) - rank(a) || +b.updatedAt - +a.updatedAt);
  const page = rows.slice(offset, offset + limit);
  return {
    items: page.map((u) => memberView(u)),
    total: rows.length >= 200 ? "200+" : String(rows.length),
    nextCursor: offset + limit < rows.length ? String(offset + limit) : null,
    interpreted,
  };
}
