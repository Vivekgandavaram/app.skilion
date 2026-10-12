import { col, oid, ObjectId } from "./db";
import { HttpError } from "./api";
import type { ConversationDoc } from "./types";

export async function memberConv(id: string, userId: ObjectId): Promise<ConversationDoc> {
  const oidv = oid(id);
  if (!oidv) throw new HttpError(404, "Conversation not found");
  const c = (await (await col("conversations")).findOne({ _id: oidv })) as ConversationDoc | null;
  if (!c || !c.memberIds.some((m) => m.equals(userId))) throw new HttpError(404, "Conversation not found");
  return c;
}
export const URL_RE = /https?:\/\/[^\s<>"')]+/gi;
export const extractLinks = (t: string) => [...new Set(t.match(URL_RE) || [])].slice(0, 5);
