import { z } from "zod";
import { route, body, query, HttpError, bad } from "@/lib/api";
import { col, oid, ObjectId } from "@/lib/db";
import { pairKey, isBlocked, ensureDm } from "@/lib/relations";
import { notify } from "@/lib/notify";
import { memberViews } from "@/lib/people";
import { ser } from "@/lib/serialize";
import type { BondDoc } from "@/lib/types";

const DAY = 86400_000;
const Schema = z.object({ toId: z.string(), note: z.string().trim().min(10, "Write at least 10 characters. Say what you want to build together.").max(280, "Keep it under 280 characters.") });

export const POST = route({ auth: true, verified: true, rate: { key: "bond-day", limit: 20, windowSec: 86400 } }, async ({ req, user }) => {
  const d = await body(req, Schema);
  const toId = oid(d.toId); if (!toId) throw bad("Unknown person");
  if (toId.equals(user._id)) throw new HttpError(400, "You cannot bond with yourself.");
  const target = await (await col("users")).findOne({ _id: toId, status: "active" });
  if (!target) throw new HttpError(404, "That person was not found.");
  if (await isBlocked(user._id, toId)) throw new HttpError(403, "You cannot contact this person.");
  const hour = await (await import("@/lib/security")).checkRate(`bond-hr:${user._id}`, 5, 3600);
  if (!hour.ok) throw new HttpError(429, "You are sending requests quickly. Try again in a bit.", "rate_limited");
  const bonds = await col("bonds");
  const pair = pairKey(user._id, toId);
  const ex = (await bonds.findOne({ pair })) as BondDoc | null;
  const now = new Date();
  if (ex) {
    if (ex.status === "accepted") throw new HttpError(409, "You are already bonded.");
    if (ex.status === "requested") {
      const fresh = now.getTime() - ex.createdAt.getTime() < 30 * DAY;
      if (fresh && ex.fromId.equals(user._id)) throw new HttpError(409, "You already sent a request. Wait for a reply.");
      if (fresh) { // they already asked you: accepting is the natural reply
        await bonds.updateOne({ _id: ex._id }, { $set: { status: "accepted", respondedAt: now } });
        const conv = await ensureDm(user._id, toId);
        await notify(toId, "bond", `${user.name} accepted your bond request`, undefined, `/messages?c=${conv._id}`);
        return { ok: true, state: "connected", accepted: true };
      }
    }
    if (ex.status === "declined" && ex.fromId.equals(user._id) && ex.respondedAt && now.getTime() - ex.respondedAt.getTime() < 30 * DAY) throw new HttpError(403, "This person declined recently. You can try again after 30 days.");
    await bonds.updateOne({ _id: ex._id }, { $set: { fromId: user._id, toId, note: d.note, status: "requested", createdAt: now }, $unset: { respondedAt: "" } });
  } else {
    await bonds.insertOne({ pair, fromId: user._id, toId, note: d.note, status: "requested", createdAt: now } as any);
  }
  await notify(toId, "bond", `${user.name} wants to bond with you`, d.note, "/network", { dedupeKey: `bond-${user._id}` });
  return { ok: true, state: "requested_by_me" };
});

export const GET = route({ auth: true }, async ({ req, user }) => {
  const box = query(req).box || "received";
  const bonds = await col("bonds");
  const since = new Date(Date.now() - 30 * DAY);
  const filter: any = box === "received" ? { toId: user._id, status: "requested", createdAt: { $gt: since } }
    : box === "sent" ? { fromId: user._id, status: { $in: ["requested", "declined"] }, createdAt: { $gt: since } }
    : { $or: [{ fromId: user._id }, { toId: user._id }], status: "accepted" };
  const rows = (await bonds.find(filter).sort({ createdAt: -1 }).limit(100).toArray()) as BondDoc[];
  const people = await memberViews(rows.map((r) => (r.fromId.equals(user._id) ? r.toId : r.fromId)));
  return { items: rows.map((r) => { const other = (r.fromId.equals(user._id) ? r.toId : r.fromId).toString(); return { id: r._id.toString(), note: r.note, status: r.status, createdAt: r.createdAt.toISOString(), person: people[other] || null }; }).filter((x) => x.person) };
});
