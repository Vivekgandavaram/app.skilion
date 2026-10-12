import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { checkOtp } from "@/lib/otp";
import { checkRate } from "@/lib/security";
import type { UserDoc } from "@/lib/types";

const Schema = z.object({ email: z.string().trim().toLowerCase().email(), code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") });
const MSG = { invalid: "That code is not right. Check it and try again.", expired: "That code expired. Request a new one.", locked: "Too many wrong tries. Request a new code." } as const;

export const POST = route({ rate: { key: "verify", limit: 20, windowSec: 900 } }, async ({ req }) => {
  const d = await body(req, Schema);
  const r = await checkOtp(d.email, "verify", d.code);
  if (r !== "ok") throw new HttpError(400, MSG[r], r);
  const users = await col("users");
  const u = (await users.findOne({ email: d.email })) as UserDoc | null;
  if (!u) throw new HttpError(404, "Account not found.");
  const vs = u.verifications.some((v) => v.type === "email") ? u.verifications : [...u.verifications, { type: "email" as const, at: new Date() }];
  await users.updateOne({ _id: u._id }, { $set: { emailVerified: true, verifications: vs, updatedAt: new Date() } });
  await setSession(u._id.toString());
  return { ok: true, next: u.onboarded ? "/discover" : "/onboarding" };
});
