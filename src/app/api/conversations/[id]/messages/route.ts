import { z } from "zod";
import { route, body, query, HttpError } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { memberConv, extractLinks } from "@/lib/messaging";
import { isBlocked } from "@/lib/relations";
import { notify } from "@/lib/notify";
import type { MessageDoc } from "@/lib/types";

const out = (m: MessageDoc & { clientId?: string }) => ({ id: m._id.toString(), senderId: m.senderId.toString(), text: m.deleted ? "" : m.text, deleted: !!m.deleted, links: m.deleted ? [] : m.links, createdAt: m.createdAt.toISOString(), clientId: m.clientId });

export const GET = route<{ id: string }>({ auth: true }, async ({ req, user, params }) => {
  const c = await memberConv(params.id, user._id);
  const q = query(req);
  const after = oid(q.after), before = oid(q.before);
  const limit = Math.min(Number(q.limit) || 40, 100);
  const messages = await col("messages");
  let rows: (MessageDoc & { clientId?: string })[];
  if (after) rows = (await messages.find({ convId: c._id, _id: { $gt: after } }).sort({ _id: 1 }).limit(200).toArray()) as any;
  else rows = ((await messages.find({ convId: c._id, ...(before ? { _id: { $lt: before } } : {}) }).sort({ _id: -1 }).limit(limit).toArray()) as any).reverse();
  const typing = await (await col("typing")).find({ convId: c._id, userId: { $ne: user._id }, at: { $gt: new Date(Date.now() - 6000) } }).toArray();
  const users = await col("users");
  const names = typing.length ? (await users.find({ _id: { $in: typing.map((t) => t.userId) } }, { projection: { name: 1 } }).toArray()).map((u) => u.name.split(" ")[0]) : [];
  const me = user._id.toString();
  const reads: Record<string, string> = {};
  for (const [k, v] of Object.entries(c.reads || {})) if (k !== me) reads[k] = new Date(v).toISOString();
  return { items: rows.map(out), typing: names, reads, myRead: c.reads?.[me] ? new Date(c.reads[me]).toISOString() : null, hasMore: !after && rows.length === limit };
});

export const POST = route<{ id: string }>({ auth: true, verified: true, rate: { key: "msg", limit: 60, windowSec: 60 } }, async ({ req, user, params }) => {
  const d = await body(req, z.object({ text: z.string().trim().min(1, "Write a message").max(4000), clientId: z.string().max(60).optional() }));
  const c = await memberConv(params.id, user._id);
  const messages = await col("messages");
  if (d.clientId) { const dup = await messages.findOne({ convId: c._id, senderId: user._id, clientId: d.clientId } as any); if (dup) return { message: out(dup as any) }; }
  if (c.kind === "dm") {
    const other = c.memberIds.find((m) => !m.equals(user._id));
    if (!other) throw new HttpError(403, "This person is no longer in the conversation.");
    if (await isBlocked(user._id, other)) throw new HttpError(403, "You cannot message this person.");
  }
  const now = new Date();
  const doc: any = { convId: c._id, senderId: user._id, text: d.text, links: extractLinks(d.text), createdAt: now, ...(d.clientId ? { clientId: d.clientId } : {}) };
  const r = await messages.insertOne(doc);
  const convs = await col("conversations");
  await convs.updateOne({ _id: c._id }, { $set: { lastMessage: { text: d.text.slice(0, 160), at: now, senderId: user._id }, [`reads.${user._id}`]: now } });
  const muted = ((c as any).mutedBy || []).map((m: any) => m.toString());
  for (const m of c.memberIds) if (!m.equals(user._id) && !muted.includes(m.toString())) await notify(m, "message", c.kind === "squad" ? `${user.name} in ${c.title || "your squad"}` : `${user.name} sent you a message`, d.text.slice(0, 120), `/messages?c=${c._id}`, { dedupeKey: `msg-${c._id}`, email: false });
  return { message: out({ ...doc, _id: r.insertedId }) };
});
