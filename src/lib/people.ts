import { col, ObjectId } from "./db";
import type { UserDoc } from "./types";
import { memberView } from "./serialize";

/** Base filter for people shown in directories, matches and carts. Callers add their own criteria. */
export const discoverable = (viewerId?: ObjectId) => ({
  onboarded: true,
  status: "active" as const,
  ...(viewerId ? { _id: { $ne: viewerId } } : {}),
});

export async function usersByIds(ids: (ObjectId | string)[]) {
  const users = await col("users");
  const oids = ids.map((i) => (typeof i === "string" ? new ObjectId(i) : i));
  const rows = (await users.find({ _id: { $in: oids } }).toArray()) as UserDoc[];
  return rows;
}
/** id -> member-visible profile (respects field visibility). */
export async function memberViews(ids: (ObjectId | string)[]) {
  const rows = await usersByIds(ids);
  return Object.fromEntries(rows.map((u) => [u._id.toString(), memberView(u)]));
}
export const miniUser = (u: UserDoc) => ({ id: u._id.toString(), name: u.name, handle: u.handle, image: u.image, headline: u.headline });
