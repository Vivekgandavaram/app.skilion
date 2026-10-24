import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { signAccessToken, issueRefreshToken } from "@/lib/mobile/tokens";
import { ser } from "@/lib/serialize";
import type { UserDoc } from "@/lib/types";
import { ObjectId } from "mongodb";
import { consumeMobileCode } from "@/lib/mobile/oauth-codes";

const Schema = z.object({
  code: z.string().min(10),
  device: z.object({ name: z.string().max(80).optional(), platform: z.enum(["android","ios","web","other"]).default("android"), appVersion: z.string().max(40).optional(), model: z.string().max(80).optional(), osVersion: z.string().max(40).optional(), fcmToken: z.string().optional() }).optional(),
  deviceId: z.string().optional(),
});

export const POST = route({ rate: { key: "oauth-exchange", limit: 10, windowSec: 300 } }, async ({ req }) => {
  const d = await body(req, Schema);
  const entry = consumeMobileCode(d.code);
  if (!entry) throw new HttpError(400, "Code expired or invalid.", "invalid");
  const users = await col("users");
  const u = await users.findOne({ _id: new ObjectId(entry.userId) }) as UserDoc | null;
  if (!u || u.status === "suspended") throw new HttpError(403, "Account suspended.");
  const { generateDeviceId } = await import("@/lib/mobile/tokens");
  const did = d.deviceId || generateDeviceId();
  const dev = d.device || { platform: "android" as const };
  const rt = issueRefreshToken();
  const devices = await col("devices");
  await devices.updateOne({ deviceId: did }, { $set: { userId: u._id, deviceId: did, name: dev.name, platform: dev.platform, appVersion: dev.appVersion, model: dev.model, osVersion: dev.osVersion, fcmToken: dev.fcmToken || undefined, refreshHash: rt.hash, refreshExpiresAt: rt.expiresAt, lastSeenAt: new Date(), revokedAt: undefined }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
  const accessToken = await signAccessToken(u._id.toString(), 0, did);
  return { accessToken, refreshToken: rt.raw, deviceId: did, user: ser(u), next: u.onboarded ? "/discover" : "/onboarding" };
});
