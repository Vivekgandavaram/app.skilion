import crypto from "node:crypto";
import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { ownerProject } from "@/lib/project-access";
import { slugify } from "@/lib/auth";

/** Publish a finished project to the public showcase. Only members who consented are named; everything else stays private. */
export const POST = route<{ id: string }>({ auth: true, rate: { key: "showcase", limit: 30, windowSec: 3600 } }, async ({ req, user, params }) => {
  const p = await ownerProject(params.id, user);
  const d = await body(req, z.object({ enabled: z.boolean(), outcome: z.string().trim().max(600).optional() }));
  if (d.enabled && p.status === "archived") throw new HttpError(400, "Archived projects cannot be published.");
  if (d.enabled && !d.outcome && !p.showcase.outcome) throw new HttpError(400, "Describe the outcome in a sentence or two before publishing.");
  const projects = await col("projects");
  let slug = p.showcase.slug;
  if (d.enabled && !slug) {
    slug = `${slugify(p.title)}-${crypto.randomBytes(3).toString("hex")}`;
  }
  await projects.updateOne({ _id: p._id }, { $set: { showcase: { enabled: d.enabled, slug, outcome: d.outcome ?? p.showcase.outcome }, updatedAt: new Date() } });
  return { ok: true, slug };
});
