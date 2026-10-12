import { z } from "zod";
import { route, body, notFound } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { ser } from "@/lib/serialize";
import { BlueprintSchema } from "@/lib/gemini";

export const GET = route<{ id: string }>({ auth: true }, async ({ user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const b = await (await col("blueprints")).findOne({ _id: id, ownerId: user._id });
  if (!b) throw notFound();
  return ser(b);
});
/** Founders edit the plan: roles, skills, hours, shares. The AI only drafted it. */
export const PATCH = route<{ id: string }>({ auth: true, rate: { key: "bp-edit", limit: 300, windowSec: 3600 } }, async ({ req, user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  const d = await body(req, z.object({ output: BlueprintSchema }));
  const r = await (await col("blueprints")).updateOne({ _id: id, ownerId: user._id }, { $set: { output: d.output } });
  if (!r.matchedCount) throw notFound();
  return { ok: true };
});
export const DELETE = route<{ id: string }>({ auth: true }, async ({ user, params }) => {
  const id = oid(params.id); if (!id) throw notFound();
  await (await col("blueprints")).deleteOne({ _id: id, ownerId: user._id });
  return { ok: true };
});
