import { col, ObjectId } from "./db";
export async function logAudit(actorId: ObjectId, action: string, target?: string, meta?: Record<string, unknown>) {
  try { await (await col("audit")).insertOne({ actorId, action, target, meta, createdAt: new Date() } as any); } catch (e) { console.error("audit", e); }
}
