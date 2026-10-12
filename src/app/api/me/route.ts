import { z } from "zod";
import { route, body, bad } from "@/lib/api";
import { col } from "@/lib/db";
import { clearSession, checkPassword } from "@/lib/auth";
import { selfView } from "@/lib/serialize";

export const GET = route({ auth: true }, async ({ user }) => ({ user: selfView(user) }));

/** Delete account (TRUST-07). Requires typing the handle. */
export const DELETE = route({ auth: true, rate: { key: "delete-me", limit: 3, windowSec: 3600 } }, async ({ req, user }) => {
  const d = await body(req, z.object({ confirm: z.string() }));
  if (d.confirm !== user.handle) throw bad("Type your handle exactly to confirm.");
  const id = user._id;
  const [works, posts, reactions, comments, endorsements, saved, notes, blocks, bonds, convs, projects, users, payments] = await Promise.all(["works", "posts", "reactions", "comments", "endorsements", "savedSearches", "notifications", "blocks", "bonds", "conversations", "projects", "users", "payments"].map((c) => col(c as any))) as any[];
  await Promise.all([
    works.deleteMany({ userId: id }),
    posts.updateMany({ authorId: id }, { $set: { deleted: true, text: "", preview: undefined } }),
    reactions.deleteMany({ userId: id }),
    comments.deleteMany({ userId: id }),
    endorsements.deleteMany({ $or: [{ fromId: id }, { toId: id }] }),
    saved.deleteMany({ userId: id }),
    notes.deleteMany({ userId: id }),
    blocks.deleteMany({ $or: [{ blockerId: id }, { blockedId: id }] }),
    bonds.deleteMany({ $or: [{ fromId: id }, { toId: id }] }),
    convs.updateMany({ memberIds: id }, { $pull: { memberIds: id } }),
    projects.updateMany({ "members.userId": id }, { $set: { "members.$[m].status": "left" } }, { arrayFilters: [{ "m.userId": id }] }),
    projects.updateMany({ ownerId: id }, { $set: { status: "archived", "showcase.enabled": false } }),
    payments.updateMany({ userId: id }, { $set: { anonymised: true } }),
  ]);
  await users.deleteOne({ _id: id });
  await clearSession();
  return { ok: true };
});
