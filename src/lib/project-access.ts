import { col, oid, ObjectId } from "./db";
import { HttpError, notFound } from "./api";
import type { ProjectDoc, UserDoc } from "./types";

/** Active member (owner included). Throws 404 so project existence is not leaked to outsiders. */
export async function memberProject(id: string, user: UserDoc): Promise<ProjectDoc> {
  const pid = oid(id); if (!pid) throw notFound();
  const p = (await (await col("projects")).findOne({ _id: pid })) as ProjectDoc | null;
  if (!p || !p.members.some((m) => m.userId.equals(user._id) && m.status === "active")) throw notFound();
  return p;
}
export async function ownerProject(id: string, user: UserDoc): Promise<ProjectDoc> {
  const p = await memberProject(id, user);
  if (!p.ownerId.equals(user._id)) throw new HttpError(403, "Only the project owner can do this.");
  return p;
}
export async function logActivity(projectId: ObjectId, userId: ObjectId, kind: string, text: string) {
  try { await (await col("activity")).insertOne({ projectId, userId, kind, text, createdAt: new Date() } as any); } catch {}
}
export const activeMembers = (p: ProjectDoc) => p.members.filter((m) => m.status === "active");
