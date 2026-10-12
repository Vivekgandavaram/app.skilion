import { col, ObjectId } from "./db";
import type { ConversationDoc } from "./types";

export const pairKey = (a: ObjectId | string, b: ObjectId | string) => [a.toString(), b.toString()].sort().join(":");

/** True when either person has blocked the other (blocks are mutual for every interaction). */
export async function isBlocked(a: ObjectId, b: ObjectId) {
  const blocks = await col("blocks");
  return !!(await blocks.findOne({ $or: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] }, { projection: { _id: 1 } }));
}
/** Ids the viewer must never see or be shown to (blocked either way). */
export async function blockedIds(viewer: ObjectId): Promise<ObjectId[]> {
  const blocks = await col("blocks");
  const rows = await blocks.find({ $or: [{ blockerId: viewer }, { blockedId: viewer }] }).limit(2000).toArray();
  return rows.map((r) => (r.blockerId.equals(viewer) ? r.blockedId : r.blockerId));
}

export type BondState = "none" | "requested_by_me" | "requested_by_them" | "connected" | "declined" | "blocked";
export async function bondStateBetween(me: ObjectId, other: ObjectId): Promise<{ state: BondState; bondId?: string }> {
  if (await isBlocked(me, other)) return { state: "blocked" };
  const bonds = await col("bonds");
  const b = await bonds.findOne({ pair: pairKey(me, other) });
  if (!b) return { state: "none" };
  const id = b._id.toString();
  if (b.status === "accepted") return { state: "connected", bondId: id };
  if (b.status === "requested") {
    if (Date.now() - b.createdAt.getTime() > 30 * 86400_000) return { state: "none", bondId: id }; // expired
    return { state: b.fromId.equals(me) ? "requested_by_me" : "requested_by_them", bondId: id };
  }
  return { state: b.status === "declined" ? "declined" : "none", bondId: id };
}

/** Messaging is allowed after an accepted Bond, or when both people are active members of the same project. */
export async function canMessage(a: ObjectId, b: ObjectId): Promise<boolean> {
  if (a.equals(b)) return false;
  if (await isBlocked(a, b)) return false;
  const bonds = await col("bonds");
  if (await bonds.findOne({ pair: pairKey(a, b), status: "accepted" }, { projection: { _id: 1 } })) return true;
  const projects = await col("projects");
  return !!(await projects.findOne({ $and: [{ members: { $elemMatch: { userId: a, status: "active" } } }, { members: { $elemMatch: { userId: b, status: "active" } } }] }, { projection: { _id: 1 } }));
}

/** Find or create the 1:1 conversation between two people (caller must check canMessage first). */
export async function ensureDm(a: ObjectId, b: ObjectId): Promise<ConversationDoc> {
  const convs = await col("conversations");
  const key = pairKey(a, b);
  const found = (await convs.findOne({ pairKey: key })) as ConversationDoc | null;
  if (found) return found;
  const doc = { kind: "dm", memberIds: [a, b], pairKey: key, reads: {}, createdAt: new Date() } as any;
  try {
    const r = await convs.insertOne(doc);
    return { ...doc, _id: r.insertedId };
  } catch {
    return (await convs.findOne({ pairKey: key })) as ConversationDoc; // lost a race
  }
}

/** Group room for a project. Members are kept in sync by addToSquadRoom / removeFromSquadRoom. */
export async function ensureSquadRoom(projectId: ObjectId, title: string, memberIds: ObjectId[]): Promise<ConversationDoc> {
  const convs = await col("conversations");
  const found = (await convs.findOne({ projectId })) as ConversationDoc | null;
  if (found) return found;
  const doc = { kind: "squad", memberIds, projectId, title, reads: {}, createdAt: new Date() } as any;
  const r = await convs.insertOne(doc);
  const projects = await col("projects");
  await projects.updateOne({ _id: projectId }, { $set: { convId: r.insertedId } });
  return { ...doc, _id: r.insertedId };
}
export async function addToSquadRoom(projectId: ObjectId, userId: ObjectId) {
  const convs = await col("conversations");
  await convs.updateOne({ projectId }, { $addToSet: { memberIds: userId } });
}
export async function removeFromSquadRoom(projectId: ObjectId, userId: ObjectId) {
  const convs = await col("conversations");
  await convs.updateOne({ projectId }, { $pull: { memberIds: userId } } as any);
}
