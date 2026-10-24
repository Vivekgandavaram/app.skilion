import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { checkOtp } from "@/lib/otp";
import { signAccessToken, issueRefreshToken } from "@/lib/mobile/tokens";
import { ser } from "@/lib/serialize";
import type { UserDoc } from "@/lib/types";

const Schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().regex(/^\d{6}$/),
  device: z.object({ name: z.string().max(80).optional(), platform: z.enum(["android","ios","web","other"]).default("android"), appVersion: z.string().max(40).optional(), model: z.string().max(80).optional(), osVersion: z.string().max(40).optional(), fcmToken: z.string().optional() }).optional(),
  deviceId: z.string().optional(),
});

export const POST = route({ rate: { key: "mfa", limit: 20, windowSec: 900 } }, async ({ req }) => {
  const d = await body(req, Schema);
  const r = await checkOtp(d.email, "mfa", d.code);
  if (r !== "ok") throw new HttpError(400, r === "invalid" ? "That code is not right." : r === "locked" ? "Too many wrong tries." : "That code expired.", r);
  const users = await col("users");
  const u = await users.findOne({ email: d.email }) as UserDoc | null;
  if (!u || u.status === "suspended") throw new HttpError(403, "Cannot sign in.");
  const { generateDeviceId } = await import("@/lib/mobile/tokens");
  const did = d.deviceId || generateDeviceId();
  const dev = d.device || { platform: "android" as const };
  const rt = issueRefreshToken();
  const devices = await col("devices");
  await devices.updateOne({ deviceId: did }, { $set: { userId: u._id, deviceId: did, name: dev.name, platform: dev.platform, appVersion: dev.appVersion, model: dev.model, osVersion: dev.osVersion, fcmToken: dev.fcmToken || undefined, refreshHash: rt.hash, refreshExpiresAt: rt.expiresAt, lastSeenAt: new Date(), revokedAt: undefined }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
  const accessToken = await signAccessToken(u._id.toString(), 0, did);
  return { accessToken, refreshToken: rt.raw, deviceId: did, user: ser(u), next: u.onboarded ? "/discover" : "/onboarding" };
});
