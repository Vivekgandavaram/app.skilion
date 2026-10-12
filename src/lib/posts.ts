import { col, ObjectId } from "./db";
import type { PostDoc, UserDoc } from "./types";
import { ser } from "./serialize";

/** Attach author + viewer state to posts. Never exposes private profile fields. */
export async function hydratePosts(posts: PostDoc[], viewer?: UserDoc | null, publicOnly = false) {
  if (!posts.length) return [];
  const users = await col("users");
  const authors = (await users.find({ _id: { $in: [...new Set(posts.map((p) => p.authorId.toString()))].map((i) => new ObjectId(i)) } }).toArray()) as UserDoc[];
  const amap = new Map(authors.map((a) => [a._id.toString(), a]));
  let liked = new Set<string>(), saved = new Set<string>();
  if (viewer) {
    const rx = await (await col("reactions")).find({ userId: viewer._id, postId: { $in: posts.map((p) => p._id) } }).toArray();
    liked = new Set(rx.filter((r) => r.kind === "like").map((r) => r.postId.toString()));
    saved = new Set(rx.filter((r) => r.kind === "save").map((r) => r.postId.toString()));
  }
  const workIds = posts.map((p) => p.workId).filter(Boolean) as ObjectId[];
  const works = workIds.length ? await (await col("works")).find({ _id: { $in: workIds }, visibility: "public" }).toArray() : [];
  const wmap = new Map(works.map((w) => [w._id.toString(), w]));
  return posts.map((p) => {
    const a = amap.get(p.authorId.toString());
    const w = p.workId ? wmap.get(p.workId.toString()) : undefined;
    return ser({
      _id: p._id, type: p.type, text: p.text, url: p.url, preview: p.preview, tags: p.tags, opp: p.opp, counts: p.counts, createdAt: p.createdAt,
      projectId: p.projectId,
      work: w ? { id: w._id, title: w.title } : undefined,
      author: a ? { id: a._id, name: a.name, handle: a.handle, image: a.image, headline: a.headline, verifications: publicOnly ? undefined : a.verifications.map((v) => ({ type: v.type })), dayJob: a.dayJob } : { id: "", name: "Former member", handle: "", headline: "" },
      mine: !!viewer && p.authorId.equals(viewer._id),
      liked: liked.has(p._id.toString()), saved: saved.has(p._id.toString()),
    });
  });
}
