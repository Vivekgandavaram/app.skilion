import { ObjectId } from "mongodb";
import type { UserDoc } from "./types";

/** Convert Mongo docs to plain JSON: _id -> id, ObjectId -> string, Date -> ISO string. */
export function ser<T = any>(v: any): T {
  if (v === null || v === undefined) return v;
  if (v instanceof ObjectId) return v.toString() as any;
  if (v instanceof Date) return v.toISOString() as any;
  if (Array.isArray(v)) return v.map(ser) as any;
  if (typeof v === "object") {
    const o: any = {};
    for (const [k, val] of Object.entries(v)) {
      if (k === "_id") o.id = ser(val);
      else o[k] = ser(val);
    }
    return o;
  }
  return v;
}

/** Fields safe to show to other signed-in members. Respects field-level visibility. */
export function memberView(u: UserDoc) {
  const vis = u.visibility;
  return ser({
    _id: u._id,
    name: u.name,
    handle: u.handle,
    image: u.image,
    headline: u.headline,
    bio: u.bio,
    domain: u.domain,
    subdomain: u.subdomain,
    skills: u.skills,
    dayJob: u.dayJob,
    goals: u.goals,
    compensation: u.compensation,
    timezone: u.timezone,
    location: vis.showLocation ? u.location : undefined,
    rate: vis.showRate ? u.rate : undefined,
    availability: vis.showAvailability ? { status: u.availability.status, hoursPerWeek: u.availability.hoursPerWeek } : { status: u.availability.status },
    links: vis.showLinks ? u.links : undefined,
    verifications: u.verifications.map((v) => ({ type: v.type, at: v.at, detail: v.detail })),
    public: vis.public,
    plan: u.plan.id,
    createdAt: u.createdAt,
  });
}

/** What the signed-in user sees about themself (never includes the hash). */
export function selfView(u: UserDoc) {
  const { passwordHash, ...rest } = u;
  return ser({ ...rest, hasPassword: !!passwordHash });
}

/** Public web profile: only when owner enabled public access. */
export function publicView(u: UserDoc) {
  const v = memberView(u);
  return v;
}
