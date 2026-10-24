import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { signAccessToken, issueRefreshToken } from "@/lib/mobile/tokens";
import { ser } from "@/lib/serialize";
import type { UserDoc } from "@/lib/types";
import crypto from "node:crypto";

const Schema = z.object({
  code: z.string().min(10),
  device: z.object({ name: z.string().max(80).optional(), platform: z.enum(["android","ios","web","other"]).default("android"), appVersion: z.string().max(40).optional(), model: z.string().max(80).optional(), osVersion: z.string().max(40).optional(), fcmToken: z.string().optional() }).optional(),
  deviceId: z.string().optional(),
});

const codes = new Map<string, { userId: string; exp: number }>();

export function issueMobileCode(userId: string) {
  const code = crypto.randomBytes(32).toString("base64url");
  codes.set(code, { userId, exp: Date.now() + 60000 });
  // cleanup
  for (const [k, v] of codes) if (v.exp < Date.now()) codes.delete(k);
  return code;
}

export const POST = route({ rate: { key: "oauth-exchange", limit: 10, windowSec: 300 } }, async ({ req }) => {
  const d = await body(req, Schema);
  const entry = codes.get(d.code);
  if (!entry || entry.exp < Date.now()) throw new HttpError(400, "Code expired or invalid.", "invalid");
  codes.delete(d.code);
  const users = await col("users");
  const u = await users.findOne({ _id: new (await import("mongodb")).ObjectId(entry.userId) }) as UserDoc | null;
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
