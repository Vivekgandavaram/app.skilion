import { z } from "zod";
import { route, body } from "@/lib/api";
import { col } from "@/lib/db";

const Schema = z.object({ refreshToken: z.string().optional(), deviceId: z.string().optional(), all: z.boolean().optional() });

export const POST = route({ auth: true }, async ({ req, user }) => {
  const d = await body(req, Schema).catch(() => ({} as any));
  const devices = await col("devices");
  if (d.all) {
    await devices.updateMany({ userId: user._id }, { $set: { revokedAt: new Date() } });
    return { ok: true };
  }
  if (d.deviceId) {
    await devices.updateOne({ userId: user._id, deviceId: d.deviceId }, { $set: { revokedAt: new Date() } });
    return { ok: true };
  }
  if (d.refreshToken) {
    const crypto = await import("node:crypto");
    const h = crypto.createHash("sha256").update(d.refreshToken).digest("hex");
    await devices.updateOne({ userId: user._id, refreshHash: h }, { $set: { revokedAt: new Date() } });
    return { ok: true };
  }
  return { ok: true };
});
