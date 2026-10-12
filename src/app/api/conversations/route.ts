import { z } from "zod";
import { route, body, HttpError, bad } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { canMessage, ensureDm, isBlocked } from "@/lib/relations";
import { memberViews } from "@/lib/people";
import type { ConversationDoc } from "@/lib/types";

export const GET = route({ auth: true }, async ({ user }) => {
  const me = user._id.toString();
  const convs = (await (await col("conversations")).find({ memberIds: user._id }).sort({ "lastMessage.at": -1, createdAt: -1 }).limit(100).toArray()) as ConversationDoc[];
  const otherIds = convs.filter((c) => c.kind === "dm").map((c) => c.memberIds.find((m) => m.toString() !== me)!).filter(Boolean);
  const people = await memberViews(otherIds);
  const messages = await col("messages");
  const items = await Promise.all(convs.map(async (c) => {
    const other = c.kind === "dm" ? c.memberIds.find((m) => m.toString() !== me) : undefined;
    const readAt = c.reads?.[me] ? new Date(c.reads[me]) : new Date(0);
    const unread = c.lastMessage && c.lastMessage.senderId.toString() !== me && readAt < c.lastMessage.at
      ? await messages.countDocuments({ convId: c._id, senderId: { $ne: user._id }, createdAt: { $gt: readAt }, deleted: { $ne: true } }, { limit: 99 }) : 0;
    return {
      id: c._id.toString(), kind: c.kind, title: c.kind === "squad" ? c.title : undefined, projectId: c.projectId?.toString(), memberCount: c.memberIds.length,
      person: other ? people[other.toString()] || { id: other.toString(), name: "Deleted member", handle: "", skills: [] } : undefined,
      last: c.lastMessage ? { text: c.lastMessage.text, at: c.lastMessage.at.toISOString(), mine: c.lastMessage.senderId.toString() === me } : null,
      unread, muted: !!(c as any).mutedBy?.some((m: any) => m.toString() === me),
    };
  }));
  return { items };
});

export const POST = route({ auth: true, rate: { key: "conv-open", limit: 60, windowSec: 3600 } }, async ({ req, user }) => {
  const { userId } = await body(req, z.object({ userId: z.string() }));
  const other = oid(userId); if (!other) throw bad("Unknown person");
  if (await isBlocked(user._id, other)) throw new HttpError(403, "You cannot message this person.");
  if (!(await canMessage(user._id, other))) throw new HttpError(403, "Send a bond request first", "needs_bond");
  const c = await ensureDm(user._id, other);
  return { id: c._id.toString() };
});
