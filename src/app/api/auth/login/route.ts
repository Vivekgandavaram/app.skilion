import { z } from "zod";
import bcrypt from "bcryptjs";
import { route, body, HttpError } from "@/lib/api";
import { col } from "@/lib/db";
import { checkPassword, setSession } from "@/lib/auth";
import { issueOtp } from "@/lib/otp";
import { otpEmail } from "@/lib/email";
import { checkRate } from "@/lib/security";
import type { UserDoc } from "@/lib/types";

const Schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email"), password: z.string().min(1).max(100) });
const DUMMY = bcrypt.hashSync("not-a-real-password", 11);
const devOn = () => process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY;

export const POST = route({ rate: { key: "login-ip", limit: 30, windowSec: 900 } }, async ({ req }) => {
  const d = await body(req, Schema);
  const per = await checkRate(`login-email:${d.email}`, 10, 900);
  if (!per.ok) throw new HttpError(429, "Too many attempts for this email. Try again in a few minutes.", "rate_limited");
  const u = (await (await col("users")).findOne({ email: d.email })) as UserDoc | null;
  const good = u?.passwordHash ? await checkPassword(d.password, u.passwordHash) : (await bcrypt.compare(d.password, DUMMY), false);
  if (!u || !good) {
    if (u && !u.passwordHash) throw new HttpError(400, "This account signs in with Google or GitHub. Use that button, or choose Forgot password to add a password.", "oauth_only");
    throw new HttpError(401, "Email or password is not right.", "bad_credentials");
  }
  if (u.status === "suspended") throw new HttpError(403, "This account is suspended. You can appeal at /appeal.", "suspended");
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
  await setSession(u._id.toString());
  return { ok: true, next: u.onboarded ? "/discover" : "/onboarding" };
});
