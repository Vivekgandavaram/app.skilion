import { z } from "zod";
import { route, body, notFound, HttpError } from "@/lib/api";
import { col, oid } from "@/lib/db";
import { ensureDm } from "@/lib/relations";
import { notify } from "@/lib/notify";

export const PATCH = route<{ id: string }>({ auth: true, rate: { key: "bond-act", limit: 120, windowSec: 3600 } }, async ({ req, user, params }) => {
  const { action } = await body(req, z.object({ action: z.enum(["accept", "decline", "cancel", "remove"]) }));
  const id = oid(params.id); if (!id) throw notFound();
  const bonds = await col("bonds");
  const b = await bonds.findOne({ _id: id });
  if (!b || !(b.fromId.equals(user._id) || b.toId.equals(user._id))) throw notFound();
  const other = b.fromId.equals(user._id) ? b.toId : b.fromId;
  const now = new Date();
  if (action === "accept" || action === "decline") {
    if (!b.toId.equals(user._id) || b.status !== "requested") throw new HttpError(400, "This request cannot be answered.");
    if (now.getTime() - b.createdAt.getTime() > 30 * 86400_000) throw new HttpError(410, "This request expired.");
    await bonds.updateOne({ _id: id }, { $set: { status: action === "accept" ? "accepted" : "declined", respondedAt: now } });
    if (action === "accept") {
      const conv = await ensureDm(user._id, other);
      await notify(other, "bond", `${user.name} accepted your bond request`, "You can message each other now.", `/messages?c=${conv._id}`);
      return { ok: true, state: "connected", conversationId: conv._id.toString() };
    }
    return { ok: true, state: "declined" };
  }
  if (action === "cancel") {
    if (!b.fromId.equals(user._id) || b.status !== "requested") throw new HttpError(400, "Only your own pending request can be cancelled.");
    await bonds.deleteOne({ _id: id });
    return { ok: true, state: "none" };
  }
  if (b.status !== "accepted") throw new HttpError(400, "You are not bonded.");
  await bonds.deleteOne({ _id: id });
  return { ok: true, state: "none" };
});
