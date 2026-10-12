import { z } from "zod";
import { NextRequest } from "next/server";
import { route, body, query, HttpError, bad } from "@/lib/api";
import { col, oid, ObjectId } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { blockedIds } from "@/lib/relations";
import { hydratePosts } from "@/lib/posts";
import { extractLinks } from "@/lib/messaging";
import { buildPreview } from "@/lib/url-preview";
import { assertPublicUrl, checkRate } from "@/lib/security";
import { GOALS, COMPENSATION, type PostDoc } from "@/lib/types";
import { normSkill } from "@/lib/skills";

const TYPES = ["update", "project", "demo", "article", "opportunity", "squad"] as const;

/** Feed. Signed-in: everyone's posts (minus blocked). Public (?public=1): opportunity/project posts by people with public profiles, no account needed. */
export const GET = route({}, async ({ req }) => {
  const q = query(req);
  const limit = Math.min(30, Math.max(1, Number(q.limit) || 15));
  const viewer = await getSessionUser();
  const publicOnly = q.public === "1" || !viewer;
  const filter: any = { deleted: { $ne: true } };
  if (q.type && (TYPES as readonly string[]).includes(q.type)) filter.type = q.type;
  if (q.tag) filter.tags = String(q.tag).toLowerCase().slice(0, 40);
  if (q.goal && (GOALS as readonly string[]).includes(q.goal)) filter["opp.goal"] = q.goal;
  if (q.comp && (COMPENSATION as readonly string[]).includes(q.comp)) filter["opp.compensation"] = q.comp;
  if (q.skill) filter["opp.skillsNeeded"] = { $regex: `^${String(q.skill).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };
  const authorId = oid(q.author);
  if (authorId) filter.authorId = authorId;
  if (q.q) filter.$text = { $search: String(q.q).slice(0, 80) };

  const users = await col("users");
  if (publicOnly) {
    filter.type = filter.type && ["opportunity", "project", "demo", "article"].includes(filter.type) ? filter.type : { $in: ["opportunity", "project", "demo", "article"] };
    const pub = await users.find({ "visibility.public": true, status: "active" }, { projection: { _id: 1 } }).limit(2000).toArray();
    filter.authorId = authorId ? (pub.some((u) => u._id.equals(authorId)) ? authorId : new ObjectId()) : { $in: pub.map((u) => u._id) };
  } else if (viewer) {
    const blocked = await blockedIds(viewer._id);
    if (blocked.length) filter.authorId = authorId ? authorId : { $nin: blocked };
    if (q.saved === "1") {
      const rx = await (await col("reactions")).find({ userId: viewer._id, kind: "save" }).sort({ createdAt: -1 }).limit(200).toArray();
      filter._id = { $in: rx.map((r) => r.postId) };
    }
    if (q.mine === "1") filter.authorId = viewer._id;
  }

  const posts = await col("posts");
  const sort = q.sort === "top" ? "top" : "latest";
  let rows: PostDoc[];
  let nextCursor: string | null = null;
  if (sort === "latest") {
    if (q.cursor) { const d = new Date(String(q.cursor)); if (!isNaN(+d)) filter.createdAt = { $lt: d }; }
    rows = (await posts.find(filter).sort({ createdAt: -1 }).limit(limit + 1).toArray()) as PostDoc[];
    if (rows.length > limit) { rows = rows.slice(0, limit); nextCursor = rows[rows.length - 1].createdAt.toISOString(); }
  } else {
    // "top": engagement in the last 30 days, simple and explainable (likes + 2*comments + saves)
    const skip = Math.max(0, Number(q.cursor) || 0);
    filter.createdAt = { $gt: new Date(Date.now() - 30 * 86400_000) };
    const all = (await posts.find(filter).sort({ createdAt: -1 }).limit(300).toArray()) as PostDoc[];
    all.sort((a, b) => (b.counts.likes + 2 * b.counts.comments + b.counts.saves) - (a.counts.likes + 2 * a.counts.comments + a.counts.saves) || +b.createdAt - +a.createdAt);
    rows = all.slice(skip, skip + limit);
    if (skip + limit < all.length) nextCursor = String(skip + limit);
  }
  return { items: await hydratePosts(rows, viewer, publicOnly), nextCursor };
});

const Schema = z.object({
  type: z.enum(TYPES).default("update"),
  text: z.string().trim().min(3, "Write at least a few words").max(2000, "Keep it under 2000 characters"),
  url: z.string().trim().url().max(500).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(30)).max(5).default([]),
  workId: z.string().optional(),
  opp: z.object({
    goal: z.enum(GOALS), compensation: z.array(z.enum(COMPENSATION)).min(1, "Choose how people are rewarded").max(5),
    skillsNeeded: z.array(z.string().trim().min(1).max(40)).min(1, "List at least one skill you need").max(8), hoursPerWeek: z.number().int().min(1).max(40).optional(),
  }).optional(),
});

export const POST = route({ auth: true, verified: true, rate: { key: "post", limit: 20, windowSec: 86400 } }, async ({ req, user }) => {
  const d = await body(req, Schema);
  if (d.type === "opportunity" && !d.opp) throw bad("Say what you need: goal, rewards and skills.");
  if ((d.type === "opportunity" || d.type === "squad") && d.text.length < 30) throw bad("Describe what you are looking for in at least 30 characters.");
  // spam controls: link count, duplicate text, burst limit
  if (extractLinks(d.text).length > 2) throw bad("Posts can include at most two links.");
  const burst = await checkRate(`post-burst:${user._id}`, 3, 300);
  if (!burst.ok) throw new HttpError(429, "You are posting quickly. Take a short break.", "rate_limited");
  const posts = await col("posts");
  const dup = await posts.findOne({ authorId: user._id, text: d.text, createdAt: { $gt: new Date(Date.now() - 86400_000) }, deleted: { $ne: true } });
  if (dup) throw new HttpError(409, "You already posted this.");
  let preview: PostDoc["preview"], url = d.url || undefined;
  if (url) {
    try { await assertPublicUrl(url); } catch { throw bad("That link cannot be used."); }
    if (await posts.findOne({ authorId: user._id, url, deleted: { $ne: true }, createdAt: { $gt: new Date(Date.now() - 7 * 86400_000) } })) throw new HttpError(409, "You already shared this link this week.");
    preview = await buildPreview(url);
  }
  let workId: ObjectId | undefined;
  if (d.workId) {
    const w = await (await col("works")).findOne({ _id: oid(d.workId) || new ObjectId(), userId: user._id, visibility: "public" });
    if (!w) throw bad("Pick one of your public projects.");
    workId = w._id;
  }
  const tags = [...new Set(d.tags.map((t) => t.toLowerCase().replace(/^#/, "").replace(/[^a-z0-9+#.-]/g, "")).filter(Boolean))];
  const doc: any = { authorId: user._id, type: d.type, text: d.text, url, preview, tags, workId, counts: { likes: 0, comments: 0, saves: 0 }, createdAt: new Date() };
  if (d.opp) doc.opp = { ...d.opp, skillsNeeded: [...new Set(d.opp.skillsNeeded.map((s) => normSkill(s).name))] };
  const r = await posts.insertOne(doc);
  return { ok: true, id: r.insertedId.toString() };
});
