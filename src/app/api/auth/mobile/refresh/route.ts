import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { signAccessToken, hashRefreshToken } from "@/lib/mobile/tokens";
import { ser } from "@/lib/serialize";
import type { UserDoc } from "@/lib/types";

const Schema = z.object({ refreshToken: z.string().min(10), deviceId: z.string().min(10) });

export const POST = route({ rate: { key: "mobile-refresh", limit: 60, windowSec: 3600 } }, async ({ req }) => {
  const d = await body(req, Schema);
  const devices = await col("devices");
  const h = hashRefreshToken(d.refreshToken);
  const dev = await devices.findOne({ deviceId: d.deviceId, refreshHash: h });
  if (!dev || dev.revokedAt) throw new HttpError(401, "Session expired.", "unauthenticated");
  if (dev.refreshExpiresAt < new Date()) { await devices.updateOne({ _id: dev._id }, { $set: { revokedAt: new Date() } }); throw new HttpError(401, "Session expired.", "unauthenticated"); }
  
  const users = await col("users");
  const u = await users.findOne({ _id: dev.userId }) as UserDoc | null;
  if (!u || u.status === "suspended") { await devices.updateOne({ _id: dev._id }, { $set: { revokedAt: new Date() } }); throw new HttpError(403, "Account suspended.", "suspended"); }
  
  // Rotate
  const crypto = await import("node:crypto");
  const raw = crypto.randomBytes(48).toString("base64url");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 60 * 1000);
  await devices.updateOne({ _id: dev._id }, { $set: { refreshHash: hash, refreshExpiresAt: expiresAt, lastSeenAt: new Date() } });
  
  const accessToken = await signAccessToken(u._id.toString(), 0, dev.deviceId);
  return { accessToken, refreshToken: raw, deviceId: dev.deviceId, user: ser(u) };
});
