import { route, query } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { searchPeople, type ExploreParams } from "@/lib/explore";
import { checkRate } from "@/lib/security";
import { ipOf } from "@/lib/api";
import { HttpError } from "@/lib/api";

export const GET = route({}, async ({ req }) => {
  const viewer = await getSessionUser();
  const q = query(req) as ExploreParams & { public?: string };
  const publicOnly = !viewer || q.public === "1";
  const r = await checkRate(`explore:${viewer?._id || ipOf(req)}`, viewer ? 240 : 60, 3600);
  if (!r.ok) throw new HttpError(429, "Too many searches. Try again shortly.", "rate_limited");
  const res = await searchPeople(q, viewer, publicOnly);
  if (publicOnly) res.items = res.items.map((u: any) => ({ id: u.id, name: u.name, handle: u.handle, image: u.image, headline: u.headline, domain: u.domain, subdomain: u.subdomain, dayJob: u.dayJob, skills: u.skills, availability: { status: u.availability?.status }, verifications: u.verifications }));
  return res;
});
