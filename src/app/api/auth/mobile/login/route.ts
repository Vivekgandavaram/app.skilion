import { z } from "zod";
import bcrypt from "bcryptjs";
import { route, body, HttpError, ipOf } from "@/lib/api";
import { col } from "@/lib/db";
import { checkPassword } from "@/lib/auth";
import { issueOtp } from "@/lib/otp";
import { otpEmail } from "@/lib/email";
import { checkRate } from "@/lib/security";
import { signAccessToken, issueRefreshToken, generateDeviceId } from "@/lib/mobile/tokens";
import { ser } from "@/lib/serialize";
import type { UserDoc } from "@/lib/types";
import { ObjectId } from "mongodb";

const Schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(100),
  device: z.object({
    name: z.string().max(80).optional(),
    platform: z.enum(["android", "ios", "web", "other"]).default("android"),
    appVersion: z.string().max(40).optional(),
    model: z.string().max(80).optional(),
    osVersion: z.string().max(40).optional(),
    fcmToken: z.string().optional(),
  }).optional(),
  deviceId: z.string().optional(),
});

const DUMMY = bcrypt.hashSync("not-a-real-password", 11);
const devOn = () => process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY;

export const POST = route({ rate: { key: "login-ip", limit: 30, windowSec: 900 } }, async ({ req }) => {
  const d = await body(req, Schema);
  const per = await checkRate(`login-email:${d.email}`, 10, 900);
  if (!per.ok) throw new HttpError(429, "Too many attempts for this email. Try again in a few minutes.", "rate_limited");
  const users = await col("users");
  const u = (await users.findOne({ email: d.email })) as UserDoc | null;
  const good = u?.passwordHash ? await checkPassword(d.password, u.passwordHash) : (await bcrypt.compare(d.password, DUMMY), false);
  if (!u || !good) {
    if (u && !u.passwordHash) throw new HttpError(400, "This account signs in with Google or GitHub. Use that button.", "oauth_only");
    throw new HttpError(401, "Email or password is not right.", "bad_credentials");
  }
  if (u.status === "suspended") throw new HttpError(403, "This account is suspended.", "suspended");
  if (!u.emailVerified) {
    const code = await issueOtp(u.email, "verify");
    await otpEmail(u.email, code, "verify");
    return { needsVerify: true, email: u.email, ...(devOn() ? { devCode: code } : {}) };
  }
  if (u.mfa?.enabled) {
    const code = await issueOtp(u.email, "mfa");
    await otpEmail(u.email, code, "mfa");
    return { mfa: true, email: u.email, ...(devOn() ? { devCode: code } : {}) };
  }

  const did = d.deviceId || generateDeviceId();
  const dev = d.device || { platform: "android" as const };
  const rt = issueRefreshToken();
  const devices = await col("devices");
  const ip = ipOf(req);
  await devices.updateOne({ deviceId: did }, {
    $set: {
      userId: u._id,
      deviceId: did,
      name: dev.name,
      platform: dev.platform,
      appVersion: dev.appVersion,
      model: dev.model,
      osVersion: dev.osVersion,
      fcmToken: dev.fcmToken || undefined,
      refreshHash: rt.hash,
      refreshExpiresAt: rt.expiresAt,
      lastSeenAt: new Date(),
      revokedAt: undefined,
      ip,
    },
    $setOnInsert: { createdAt: new Date() },
  }, { upsert: true });

  const accessToken = await signAccessToken(u._id.toString(), 0, did);
  return { accessToken, refreshToken: rt.raw, deviceId: did, user: ser(u), next: u.onboarded ? "/discover" : "/onboarding" };
});
