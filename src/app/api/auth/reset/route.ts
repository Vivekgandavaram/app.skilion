import { z } from "zod";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { hashPassword, setSession } from "@/lib/auth";
import { checkOtp } from "@/lib/otp";
import { passwordRule } from "@/lib/schemas";
import type { UserDoc } from "@/lib/types";

const Schema = z.object({ email: z.string().trim().toLowerCase().email(), code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"), password: passwordRule });
export const POST = route({ rate: { key: "reset", limit: 15, windowSec: 900 } }, async ({ req }) => {
  const d = await body(req, Schema);
  const r = await checkOtp(d.email, "reset", d.code);
  if (r !== "ok") throw new HttpError(400, r === "invalid" ? "That code is not right." : r === "locked" ? "Too many wrong tries. Request a new code." : "That code expired. Request a new one.", r);
  const users = await col("users");
  const u = (await users.findOne({ email: d.email })) as UserDoc | null;
  if (!u || u.status === "suspended") throw new HttpError(403, "Cannot reset this account.");
  const vs = u.verifications.some((v) => v.type === "email") ? u.verifications : [...u.verifications, { type: "email" as const, at: new Date() }];
  await users.updateOne({ _id: u._id }, { $set: { passwordHash: await hashPassword(d.password), emailVerified: true, verifications: vs, updatedAt: new Date() } });
  await setSession(u._id.toString());
  return { ok: true, next: u.onboarded ? "/discover" : "/onboarding" };
});
